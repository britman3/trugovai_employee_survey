import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/public/survey/:id - Get survey for respondent (limited fields)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isAnonymous: true,
        collectDepartment: true,
        collectEmail: true,
        isActive: true,
        expiresAt: true,
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if survey is active
    if (!survey.isActive) {
      return NextResponse.json(
        { error: 'Survey is closed', status: 'closed' },
        { status: 403 }
      );
    }

    // Check if survey is expired
    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Survey has expired', status: 'expired' },
        { status: 403 }
      );
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
