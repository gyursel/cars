import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
const SESSION_MAX_AGE = 60 * 60 * 8;
const COOKIE_NAME = 'admin_session';

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const expiresStr = String(expires);
  return `${expiresStr}.${sign(expiresStr)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;
  const expected = sign(expiresStr);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  return Date.now() < Number(expiresStr);
}

export function buildSessionCookie(token) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [`${COOKIE_NAME}=${token}`, 'HttpOnly', 'Path=/', `Max-Age=${SESSION_MAX_AGE}`, 'SameSite=Lax'];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isRequestAuthenticated(req) {
  return verifySessionToken(req.cookies?.[COOKIE_NAME]);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
