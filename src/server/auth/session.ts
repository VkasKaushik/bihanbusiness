import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { CurrentUser } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'bihan_business_super_secure_founder_key_2026_chhattisgarh'
);

const SESSION_COOKIE_NAME = 'bihan_session';

export async function createSessionToken(payload: CurrentUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<CurrentUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      name: payload.name as string,
      username: payload.username as string,
      role: payload.role as 'FOUNDER' | 'STAFF',
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(token: string) {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
