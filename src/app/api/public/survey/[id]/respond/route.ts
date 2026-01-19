import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/public/survey/:id/respond - Submit response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch survey to validate
    const survey = await prisma.survey.findUnique({
      where: { id },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if survey is active
    if (!survey.isActive) {
      return NextResponse.json(
        { error: 'Survey is closed' },
        { status: 403 }
      );
    }

    // Check if survey is expired
    if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Survey has expired' },
        { status: 403 }
      );
    }

    const {
      email,
      department,
      usesAI,
      toolsUsed,
      customTools,
      tasksUsed,
      subscriptionType,
      entersSensitiveData,
      hasApproval,
      hasReceivedGuidance,
      additionalComments,
    } = body;

    // Validation
    if (usesAI === undefined || usesAI === null) {
      return NextResponse.json(
        { error: 'usesAI is required' },
        { status: 400 }
      );
    }

    if (hasReceivedGuidance === undefined || hasReceivedGuidance === null) {
      return NextResponse.json(
        { error: 'hasReceivedGuidance is required' },
        { status: 400 }
      );
    }

    if (survey.collectDepartment && !department) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      );
    }

    if (survey.collectEmail && !survey.isAnonymous && !email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (
      survey.collectEmail &&
      !survey.isAnonymous &&
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Conditional validation for AI users
    if (usesAI === true) {
      if (
        (!toolsUsed || toolsUsed.length === 0) &&
        (!customTools || customTools.length === 0)
      ) {
        return NextResponse.json(
          { error: 'At least one tool must be selected' },
          { status: 400 }
        );
      }

      if (!tasksUsed || tasksUsed.length === 0) {
        return NextResponse.json(
          { error: 'At least one task must be selected' },
          { status: 400 }
        );
      }

      if (!subscriptionType) {
        return NextResponse.json(
          { error: 'Subscription type is required' },
          { status: 400 }
        );
      }

      if (!entersSensitiveData) {
        return NextResponse.json(
          { error: 'Sensitive data question is required' },
          { status: 400 }
        );
      }

      if (!hasApproval) {
        return NextResponse.json(
          { error: 'Approval status is required' },
          { status: 400 }
        );
      }
    }

    // Get IP address (only if not anonymous)
    let ipAddress: string | null = null;
    if (!survey.isAnonymous) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    }

    // Create response
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        email: survey.isAnonymous ? null : email || null,
        department: department || null,
        usesAI,
        toolsUsed: usesAI ? (toolsUsed || []) : [],
        customTools: usesAI ? (customTools || []) : [],
        tasksUsed: usesAI ? (tasksUsed || []) : [],
        subscriptionType: usesAI ? subscriptionType : null,
        entersSensitiveData: usesAI ? entersSensitiveData : null,
        hasApproval: usesAI ? hasApproval : null,
        hasReceivedGuidance,
        additionalComments: additionalComments || null,
        ipAddress,
      },
    });

    // Update survey response count
    await prisma.survey.update({
      where: { id },
      data: {
        responseCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, id: response.id }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}
