import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSessionToken, setSessionCookie } from '@/server/auth/session';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role as 'FOUNDER' | 'STAFF',
    });

    setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Server error during login' },
      { status: 500 }
    );
  }
}
