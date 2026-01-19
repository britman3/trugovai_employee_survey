import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/surveys/:id/responses/:rid - Get single response
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, rid } = await params;

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

    const response = await prisma.surveyResponse.findFirst({
      where: {
        id: rid,
        surveyId: id,
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch response:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    );
  }
}
