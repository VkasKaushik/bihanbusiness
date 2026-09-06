import { NextResponse } from 'next/server';
import { MoneyService } from '@/server/services/money.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overview = await MoneyService.getOverview();
    return NextResponse.json(overview);
  } catch (error: any) {
    console.error('Money overview error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching money overview' },
      { status: 500 }
    );
  }
}
