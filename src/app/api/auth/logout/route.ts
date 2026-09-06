import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/auth/session';

export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ success: true });
}
