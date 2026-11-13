// Captures real evidence screenshots for FR-02 bugs from the live SUT -> docs/evidence/bugs/BUG-FR02-0n.png
// Data screenshots render real API responses collected now; UI screenshots are real pages with a DOM annotation overlay.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const API = process.env.API_URL ?? 'http://localhost:3000';
const WEB = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = 'docs/evidence/bugs';
mkdirSync(OUT, { recursive: true });

const post = async (path, body, token) => {
  const r = await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const admin = async () => ({ Authorization: `Bearer ${(await post('/api/login', { email: process.env.ADMIN_EMAIL ?? 'admin@eshop.com', password: process.env.ADMIN_PASS ?? 'Admin123!' })).body.token}` });
const state = async (email) => (await (await fetch(API + '/api/admin/users', { headers: await admin() })).json()).find((u) => u.email === email);
const newAccount = async (tag) => {
  const email = `23120264_evidence_${tag}_${Date.now()}@hcmus.edu.vn`;
  const reg = await post('/api/register', { name: 'evidence', email, password: 'Pw@23120264' });
  return { id: reg.body.id, email, password: 'Pw@23120264' };
};
const del = async (id) => fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: await admin() });
const stamp = () => new Date().toISOString();

const browser = await chromium.launch();
const render = async (file, title, lines) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await page.setContent(`<body style="margin:0;background:#0f172a;color:#e2e8f0;font:14px Menlo,monospace;padding:24px">
    <div style="color:#38bdf8;font-size:16px;margin-bottom:12px">${esc(title)}</div>
    <pre style="white-space:pre-wrap;line-height:1.5">${esc(lines.join('\n'))}</pre>
    <div style="color:#94a3b8;margin-top:12px">Captured ${stamp()} · SUT ${API} · real responses</div></body>`);
  await page.screenshot({ path: `${OUT}/${file}` });
  await page.close();
};
const uiShot = async (file, fill, overlayFor) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  await page.goto(WEB + '/login');
  const inputs = page.locator('form input');
  await inputs.nth(0).fill(fill.email);
  await inputs.nth(1).fill(fill.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.locator('div.bg-red-100').waitFor();
  const html = await inputs.nth(overlayFor).evaluate((el) => el.outerHTML);
  await page.evaluate((h) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fef08a;color:#111;padding:10px;font:13px Menlo,monospace;z-index:99';
    d.textContent = 'Live DOM (annotation): ' + h;
    document.body.appendChild(d);
  }, html);
  await page.screenshot({ path: `${OUT}/${file}` });
  await page.close();
};

// BUG-FR02-01 counter +2 (and early lock)
let a = await newAccount('b01'); const s01 = [];
for (let i = 1; i <= 3; i++) { const r = await post('/api/login', { email: a.email, password: 'Wrong@1234' }); const u = await state(a.email); s01.push(`wrong attempt #${i}: HTTP ${r.status} -> login_attempts=${u.login_attempts}, locked_until=${u.locked_until}`); }
await render('BUG-FR02-01.png', 'BUG-FR02-01 — login_attempts increases by 2 per wrong attempt (spec: exactly 1; lock from the 3rd)', ['POST /api/login with a wrong password, then GET /api/admin/users:', ...s01, '', 'Expected: 1, 2, then lock at the 3rd attempt.  Actual: 2, then locked at the 2nd attempt.']);
await del(a.id);

// BUG-FR02-02 lock 180s
a = await newAccount('b02');
for (let i = 0; i < 3; i++) await post('/api/login', { email: a.email, password: 'Wrong@1234' });
const u02 = await state(a.email); const remain = Math.round((new Date(u02.locked_until) - Date.now()) / 1000);
const right = await post('/api/login', { email: a.email, password: a.password });
await render('BUG-FR02-02.png', 'BUG-FR02-02 — lock lasts 180 s (spec: 30 s)', [`locked_until = ${u02.locked_until}`, `seconds remaining right after locking: ~${remain}`, `correct password while locked: HTTP ${right.status} ${JSON.stringify(right.body)}`, '', 'Expected: lock expires after 30 s.  Actual: ~180 s (UI test waited 31 s and was still rejected).']);
await del(a.id);

// BUG-FR02-03 / 04 UI
a = await newAccount('b03');
await uiShot('BUG-FR02-03.png', { email: 'abc.hcmus.edu.vn', password: 'Wrong@1234' }, 0);
await uiShot('BUG-FR02-04.png', { email: a.email, password: 'Wrong@1234' }, 1);
await del(a.id);

// BUG-FR02-05 locked vs wrong message
a = await newAccount('b05a'); const l = await newAccount('b05b');
const wrong = await post('/api/login', { email: a.email, password: 'Wrong@1234' });
for (let i = 0; i < 3; i++) await post('/api/login', { email: l.email, password: 'Wrong@1234' });
const locked = await post('/api/login', { email: l.email, password: l.password });
await render('BUG-FR02-05.png', 'BUG-FR02-05 — locked-account response differs from wrong-password response', [`wrong password     : HTTP ${wrong.status} ${JSON.stringify(wrong.body)}`, `account is locked  : HTTP ${locked.status} ${JSON.stringify(locked.body)}`, '', 'Spec: error must not reveal the cause. Actual: the locked response states the account is locked (and uses 403 instead of 401).']);
await del(a.id); await del(l.id);

// BUG-FR02-06 password in response
a = await newAccount('b06');
const ok = await post('/api/login', { email: a.email, password: a.password });
await render('BUG-FR02-06.png', 'BUG-FR02-06 — login response contains the password in plain text (SEC-01)', ['POST /api/login (valid credentials) response:', JSON.stringify({ message: ok.body.message, token: ok.body.token.slice(0, 24) + '…', user: ok.body.user }, null, 2), '', 'Spec SEC-01: password must not be stored/exposed as plaintext.']);
await del(a.id);
await browser.close();
console.log('done');
