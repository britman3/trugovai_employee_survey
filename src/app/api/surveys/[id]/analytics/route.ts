import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateAnalytics } from '@/lib/analytics';

// GET /api/surveys/:id/analytics - Get aggregated analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if survey exists and belongs to user's organization
    const survey = await prisma.survey.findFirst({
      where: {
        id,
        organisationId: session.user.organisationId,
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Fetch all responses for analytics
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
    });

    // Calculate analytics
    const analytics = calculateAnalytics(responses);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to calculate analytics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate analytics' },
      { status: 500 }
    );
  }
}
