import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TOOL_BY_ID } from '@/lib/constants';

// GET /api/surveys/:id/export/csv - Export responses as CSV
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

    // Fetch all responses
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
      orderBy: { submittedAt: 'desc' },
    });

    // Build CSV headers
    const headers = [
      'Response ID',
      'Submitted At',
      ...(survey.collectEmail && !survey.isAnonymous ? ['Email'] : []),
      ...(survey.collectDepartment ? ['Department'] : []),
      'Uses AI',
      'Tools Used',
      'Custom Tools',
      'Tasks Used',
      'Subscription Type',
      'Enters Sensitive Data',
      'Has Approval',
      'Has Received Guidance',
      'Additional Comments',
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV rows
    const rows = responses.map((response) => {
      const toolNames = response.toolsUsed
        .map((toolId) => TOOL_BY_ID[toolId]?.name || toolId)
        .join('; ');

      return [
        response.id,
        new Date(response.submittedAt).toISOString(),
        ...(survey.collectEmail && !survey.isAnonymous ? [response.email || ''] : []),
        ...(survey.collectDepartment ? [response.department || ''] : []),
        response.usesAI ? 'Yes' : 'No',
        toolNames,
        response.customTools.join('; '),
        response.tasksUsed.join('; '),
        response.subscriptionType || '',
        response.entersSensitiveData || '',
        response.hasApproval || '',
        response.hasReceivedGuidance ? 'Yes' : 'No',
        response.additionalComments || '',
      ].map(escapeCSV);
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Return CSV response
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="survey-${id}-responses.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
