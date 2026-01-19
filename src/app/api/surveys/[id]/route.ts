import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/surveys/:id - Get survey details
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

    const survey = await prisma.survey.findFirst({
      where: {
        id,
        organisationId: session.user.organisationId,
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Failed to fetch survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey' },
      { status: 500 }
    );
  }
}

// PUT /api/surveys/:id - Update survey
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, isAnonymous, collectDepartment, collectEmail, isActive, expiresAt } = body;

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

    // Validation
    if (name !== undefined && (name.length < 3 || name.length > 100)) {
      return NextResponse.json(
        { error: 'Name must be between 3 and 100 characters' },
        { status: 400 }
      );
    }

    if (description !== undefined && (description.length < 10 || description.length > 1000)) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 1000 characters' },
        { status: 400 }
      );
    }

    const effectiveAnonymous = isAnonymous ?? existingSurvey.isAnonymous;
    const effectiveCollectEmail = collectEmail ?? existingSurvey.collectEmail;

    if (effectiveCollectEmail && effectiveAnonymous) {
      return NextResponse.json(
        { error: 'Cannot collect email for anonymous surveys' },
        { status: 400 }
      );
    }

    const survey = await prisma.survey.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isAnonymous !== undefined && { isAnonymous }),
        ...(collectDepartment !== undefined && { collectDepartment }),
        ...(collectEmail !== undefined && { collectEmail }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Failed to update survey:', error);
    return NextResponse.json(
      { error: 'Failed to update survey' },
      { status: 500 }
    );
  }
}

// DELETE /api/surveys/:id - Delete survey (only if no responses)
export async function DELETE(
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

    // Cannot delete survey with responses
    if (survey.responseCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete survey with responses. Close it instead.' },
        { status: 400 }
      );
    }

    await prisma.survey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete survey:', error);
    return NextResponse.json(
      { error: 'Failed to delete survey' },
      { status: 500 }
    );
  }
}
