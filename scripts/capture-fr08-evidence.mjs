// Captures real evidence screenshots for FR-08 bugs from the live SUT -> docs/evidence/bugs/BUG-FR08-0n.png
// API screenshot renders real responses collected now; UI screenshots are real pages with a DOM annotation overlay.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const API = process.env.API_URL ?? 'http://localhost:3000';
const WEB = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = 'docs/evidence/bugs';
mkdirSync(OUT, { recursive: true });

const call = async (method, path, body, token) => {
  const r = await fetch(API + path, { method, headers: { 'content-type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => null) };
};
const adminToken = async () => (await call('POST', '/api/login', { email: process.env.ADMIN_EMAIL ?? 'admin@eshop.com', password: process.env.ADMIN_PASS ?? 'Admin123!' })).body.token;
const newAccount = async (tag) => {
  const email = `23120264_evidence_${tag}_${Date.now()}@hcmus.edu.vn`;
  const reg = await call('POST', '/api/register', { name: 'evidence', email, password: 'Pw@23120264' });
  const token = (await call('POST', '/api/login', { email, password: 'Pw@23120264' })).body.token;
  return { id: reg.body.id, email, token };
};
const del = async (id) => call('DELETE', `/api/admin/users/${id}`, undefined, await adminToken());
const money = (n) => (n === null ? 'null' : Number(n).toLocaleString('en-US'));

const browser = await chromium.launch();
const annotate = (page, text) => page.evaluate((t) => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fef08a;color:#111;padding:10px;font:13px Menlo,monospace;z-index:99';
  d.textContent = t;
  document.body.appendChild(d);
}, text);

// BUG-FR08-01 backend trusts the client total_amount
{
  const a = await newAccount('b01');
  const products = (await call('GET', '/api/products')).body;
  const items = [{ ...products[0], quantity: 1 }];
  const tampered = await call('POST', '/api/checkout', { items, total_amount: 1 }, a.token);
  const empty = await call('POST', '/api/checkout', {}, a.token);
  const orders = (await call('GET', '/api/orders/my-orders', undefined, a.token)).body;
  const page = await browser.newPage({ viewport: { width: 1000, height: 560 } });
  const lines = [
    `cart: ${products[0].name} x1 = ${money(products[0].price)} VND`,
    `POST /api/checkout {items:[...], total_amount: 1} -> HTTP ${tampered.status}`,
    `POST /api/checkout {} -> HTTP ${empty.status}`,
    'GET /api/orders/my-orders:',
    ...orders.map((o) => `  order #${o.id}: total_amount = ${money(o.total_amount)}`),
    '', `Expected: stored total = ${money(products[0].price)} (backend recomputes).  Actual: stored total = client value.`,
  ];
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await page.setContent(`<body style="margin:0;background:#0f172a;color:#e2e8f0;font:14px Menlo,monospace;padding:24px"><div style="color:#38bdf8;font-size:16px;margin-bottom:12px">BUG-FR08-01 — backend stores the client total_amount (spec: backend recomputes and ignores it)</div><pre style="white-space:pre-wrap;line-height:1.5">${esc(lines.join('\n'))}</pre><div style="color:#94a3b8;margin-top:12px">Captured ${new Date().toISOString()} · SUT ${API} · real responses</div></body>`);
  await page.screenshot({ path: `${OUT}/BUG-FR08-01.png` });
  await page.close();
  await del(a.id);
}

// UI helpers
const openCheckout = async (page, token) => {
  await page.addInitScript((t) => localStorage.setItem('token', t), token);
  await page.goto(WEB + '/');
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).first().click();
  await page.getByRole('link', { name: 'Giỏ hàng' }).click();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await page.getByRole('heading', { name: 'Xác Nhận Đơn Hàng' }).waitFor();
};

// BUG-FR08-02 total input is editable
{
  const a = await newAccount('b02');
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, locale: 'en-US' });
  await openCheckout(page, a.token);
  const input = page.locator('input[type="number"]');
  await input.fill('1');
  const html = await input.evaluate((el) => el.outerHTML);
  await annotate(page, `Typed 1 into the total field; editable=${await input.isEditable()}; DOM: ${html}`);
  await page.screenshot({ path: `${OUT}/BUG-FR08-02.png` });
  await page.close();
  await del(a.id);
}

// BUG-FR08-03 cart not cleared after a successful checkout
{
  const a = await newAccount('b03');
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 }, locale: 'en-US' });
  page.on('dialog', (d) => d.accept());
  await openCheckout(page, a.token);
  await page.getByRole('button', { name: 'Xác Nhận Thanh Toán' }).click();
  await page.getByText('Thanh toán thành công!').waitFor();
  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await page.getByRole('link', { name: 'Giỏ hàng' }).click();
  await page.waitForTimeout(500); // screenshot only, not a test
  const rows = await page.locator('tbody tr').count();
  await annotate(page, `After a successful checkout the cart still lists ${rows} line(s); expected "Giỏ hàng của bạn đang trống"`);
  await page.screenshot({ path: `${OUT}/BUG-FR08-03.png` });
  await page.close();
  await del(a.id);
}
await browser.close();
console.log('done');
