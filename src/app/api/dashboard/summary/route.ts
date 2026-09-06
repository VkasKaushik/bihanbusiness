import { NextResponse } from 'next/server';
import { DashboardService } from '@/server/services/dashboard.service';
import { getCurrentUser } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await DashboardService.getSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error fetching dashboard metrics' },
      { status: 500 }
    );
  }
}
