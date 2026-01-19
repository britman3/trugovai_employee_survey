import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/surveys/:id/responses - List responses (paginated)
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

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

    const [responses, total] = await Promise.all([
      prisma.surveyResponse.findMany({
        where: { surveyId: id },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.surveyResponse.count({
        where: { surveyId: id },
      }),
    ]);

    return NextResponse.json({
      responses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
