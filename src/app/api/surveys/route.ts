import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/surveys - List all surveys for the authenticated user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const surveys = await prisma.survey.findMany({
      where: {
        organisationId: session.user.organisationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeSurveys = surveys.filter(
      (s) => s.isActive && (!s.expiresAt || new Date(s.expiresAt) > now)
    ).length;

    const totalResponses = surveys.reduce((sum, s) => sum + s.responseCount, 0);

    // Get responses this month
    const responsesThisMonth = await prisma.surveyResponse.count({
      where: {
        survey: {
          organisationId: session.user.organisationId,
        },
        submittedAt: {
          gte: startOfMonth,
        },
      },
    });

    // Pending review: active surveys with responses
    const pendingReview = surveys.filter(
      (s) => s.isActive && s.responseCount > 0
    ).length;

    return NextResponse.json({
      surveys,
      stats: {
        activeSurveys,
        totalResponses,
        responsesThisMonth,
        pendingReview,
      },
    });
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}

// POST /api/surveys - Create a new survey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isAnonymous, collectDepartment, collectEmail, isActive, expiresAt } = body;

    // Validation
    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 3 and 100 characters' },
        { status: 400 }
      );
    }

    if (!description || description.length < 10 || description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 1000 characters' },
        { status: 400 }
      );
    }

    if (collectEmail && isAnonymous) {
      return NextResponse.json(
        { error: 'Cannot collect email for anonymous surveys' },
        { status: 400 }
      );
    }

    const survey = await prisma.survey.create({
      data: {
        name,
        description,
        isAnonymous: isAnonymous ?? true,
        collectDepartment: collectDepartment ?? true,
        collectEmail: collectEmail ?? false,
        isActive: isActive ?? false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
        organisationId: session.user.organisationId,
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Failed to create survey:', error);
    return NextResponse.json(
      { error: 'Failed to create survey' },
      { status: 500 }
    );
  }
}
