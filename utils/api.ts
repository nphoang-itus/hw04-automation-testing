import { APIRequestContext } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:3000';
const STUDENT_ID = process.env.STUDENT_ID ?? 'UNSET';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@eshop.com';
const ADMIN_PASS = process.env.ADMIN_PASS ?? 'Admin123!';

export interface TestAccount {
  id: number;
  email: string;
  password: string;
  name: string;
}

export interface AccountState {
  login_attempts: number;
  locked_until: string | null;
}

export interface LoginResult {
  status: number;
  body: any;
}

// Unique per test and browser so parallel runs never share lockout state
function uniqueEmail(tag: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${STUDENT_ID}_pw_${tag}_${Date.now()}_${rand}@hcmus.edu.vn`.toLowerCase();
}

export async function loginApi(request: APIRequestContext, email: string, password: string): Promise<LoginResult> {
  const res = await request.post(`${API}/api/login`, { data: { email, password } });
  return { status: res.status(), body: await res.json().catch(() => null) };
}

async function adminHeaders(request: APIRequestContext) {
  const { status, body } = await loginApi(request, ADMIN_EMAIL, ADMIN_PASS);
  if (status !== 200) throw new Error(`Admin login failed (${status}); check ADMIN_EMAIL/ADMIN_PASS in .env`);
  return { Authorization: `Bearer ${body.token}` };
}

export async function createTestAccount(request: APIRequestContext, tag: string): Promise<TestAccount> {
  const account = { name: `Test ${tag}`, email: uniqueEmail(tag), password: 'Pw@23120264' };
  const res = await request.post(`${API}/api/register`, { data: account });
  if (!res.ok()) throw new Error(`Register failed (${res.status()}): ${await res.text()}`);
  const { id } = await res.json();
  return { id, ...account };
}

export async function deleteTestAccount(request: APIRequestContext, id: number): Promise<void> {
  await request.delete(`${API}/api/admin/users/${id}`, { headers: await adminHeaders(request) });
}

// Oracle for the hidden state: GET /api/admin/users exposes login_attempts and locked_until
export async function getAccountState(request: APIRequestContext, email: string): Promise<AccountState> {
  const res = await request.get(`${API}/api/admin/users`, { headers: await adminHeaders(request) });
  const user = (await res.json()).find((u: any) => u.email === email);
  if (!user) throw new Error(`User ${email} not found`);
  return { login_attempts: user.login_attempts, locked_until: user.locked_until };
}

export async function getMe(request: APIRequestContext, token: string): Promise<LoginResult> {
  const res = await request.get(`${API}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status(), body: await res.json().catch(() => null) };
}
