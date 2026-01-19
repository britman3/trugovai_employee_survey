import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/surveys/:id/close - Close survey to responses
export async function POST(
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
    const existingSurvey = await prisma.survey.findFirst({
      where: {
        id,
        organisationId: session.user.organisationId,
      },
    });

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const survey = await prisma.survey.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Failed to close survey:', error);
    return NextResponse.json(
      { error: 'Failed to close survey' },
      { status: 500 }
    );
  }
}
