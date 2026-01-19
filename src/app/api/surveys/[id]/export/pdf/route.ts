import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateAnalytics } from '@/lib/analytics';
import { TOOL_BY_ID } from '@/lib/constants';

// GET /api/surveys/:id/export/pdf - Generate PDF report (returns HTML for printing)
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

    // Fetch all responses and calculate analytics
    const responses = await prisma.surveyResponse.findMany({
      where: { surveyId: id },
    });

    const analytics = calculateAnalytics(responses);

    // Generate HTML report
    const html = generateHTMLReport(survey, analytics);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="survey-${id}-report.html"`,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateHTMLReport(survey: any, analytics: any): string {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${survey.name} - Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #4C5D6B;
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    @media print {
      body {
        padding: 20px;
      }

      .no-print {
        display: none;
      }

      .page-break {
        page-break-before: always;
      }
    }

    h1 {
      color: #0F2A3A;
      font-size: 28px;
      margin-bottom: 8px;
    }

    h2 {
      color: #0F2A3A;
      font-size: 20px;
      margin-top: 32px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1AA7A1;
    }

    h3 {
      color: #0F2A3A;
      font-size: 16px;
      margin-top: 24px;
      margin-bottom: 8px;
    }

    .header {
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo {
      color: #1AA7A1;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .meta {
      color: #4C5D6B;
      font-size: 14px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .summary-card {
      background: #F4F7F9;
      padding: 16px;
      border-radius: 8px;
    }

    .summary-card .label {
      font-size: 12px;
      color: #4C5D6B;
      margin-bottom: 4px;
    }

    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
      color: #0F2A3A;
    }

    .summary-card.risk .value {
      color: #FF6B6B;
    }

    .summary-card.warning .value {
      color: #F59E0B;
    }

    .risk-flag {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .risk-flag.high {
      background: rgba(255, 107, 107, 0.1);
      border-left: 4px solid #FF6B6B;
      color: #dc2626;
    }

    .risk-flag.medium {
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid #F59E0B;
      color: #b45309;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 14px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background: #F4F7F9;
      font-weight: 600;
      color: #0F2A3A;
    }

    .bar-chart {
      margin-top: 16px;
    }

    .bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .bar-label {
      width: 180px;
      font-size: 13px;
      color: #4C5D6B;
    }

    .bar-track {
      flex: 1;
      height: 20px;
      background: #F4F7F9;
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: #1AA7A1;
      border-radius: 4px;
    }

    .bar-value {
      width: 60px;
      text-align: right;
      font-size: 13px;
      color: #0F2A3A;
      font-weight: 500;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1AA7A1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .print-button:hover {
      background: #158d88;
    }

    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #4C5D6B;
      text-align: center;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div class="logo">TruGovAI™ Employee AI Survey</div>
    <h1>${escapeHtml(survey.name)}</h1>
    <div class="meta">
      Generated on ${reportDate} • ${analytics.totalResponses} responses
    </div>
  </div>

  <h2>Executive Summary</h2>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Total Responses</div>
      <div class="value">${analytics.totalResponses}</div>
    </div>
    <div class="summary-card">
      <div class="label">Using AI Tools</div>
      <div class="value">${analytics.usesAI.percentYes}%</div>
    </div>
    <div class="summary-card risk">
      <div class="label">Sensitive Data Exposure</div>
      <div class="value">${analytics.sensitiveDataExposure.percentAtRisk}%</div>
    </div>
    <div class="summary-card warning">
      <div class="label">Without Guidance</div>
      <div class="value">${analytics.guidanceGap.percentNoGuidance}%</div>
    </div>
  </div>

  ${analytics.riskFlags.length > 0 ? `
  <h2>Risk Flags</h2>
  ${analytics.riskFlags.map((flag: any) => `
    <div class="risk-flag ${flag.severity}">
      ${flag.severity === 'high' ? '🚨' : '⚠️'} ${escapeHtml(flag.message)}
    </div>
  `).join('')}
  ` : ''}

  <h2>AI Tool Usage</h2>

  <h3>AI Usage Rate</h3>
  <p>${analytics.usesAI.yes} out of ${analytics.totalResponses} respondents (${analytics.usesAI.percentYes}%) use AI tools for work.</p>

  ${analytics.toolUsage.length > 0 ? `
  <h3>Most Popular Tools</h3>
  <div class="bar-chart">
    ${analytics.toolUsage.slice(0, 10).map((tool: any) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(tool.toolName)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${tool.percentage}%"></div>
        </div>
        <div class="bar-value">${tool.count} (${tool.percentage}%)</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${analytics.taskUsage.length > 0 ? `
  <h3>Tasks Performed with AI</h3>
  <div class="bar-chart">
    ${analytics.taskUsage.slice(0, 10).map((task: any) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(task.task.split('/')[0])}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${task.percentage}%"></div>
        </div>
        <div class="bar-value">${task.count} (${task.percentage}%)</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="page-break"></div>

  <h2>Risk Analysis</h2>

  <h3>Sensitive Data Exposure</h3>
  <table>
    <tr>
      <th>Frequency</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Yes, regularly</td>
      <td>${analytics.sensitiveDataExposure.regularly}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.sensitiveDataExposure.regularly / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Occasionally</td>
      <td>${analytics.sensitiveDataExposure.occasionally}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.sensitiveDataExposure.occasionally / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Never</td>
      <td>${analytics.sensitiveDataExposure.never}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.sensitiveDataExposure.never / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
  </table>

  <h3>Approval Status</h3>
  <table>
    <tr>
      <th>Status</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Approved</td>
      <td>${analytics.approvalStatus.approved}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.approvalStatus.approved / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Not Approved</td>
      <td>${analytics.approvalStatus.notApproved}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.approvalStatus.notApproved / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
    <tr>
      <td>Unsure</td>
      <td>${analytics.approvalStatus.unsure}</td>
      <td>${analytics.usesAI.yes > 0 ? Math.round((analytics.approvalStatus.unsure / analytics.usesAI.yes) * 100) : 0}%</td>
    </tr>
  </table>

  <h3>AI Guidance Gap</h3>
  <p><strong>${analytics.guidanceGap.percentNoGuidance}%</strong> of respondents (${analytics.guidanceGap.noGuidance} out of ${analytics.totalResponses}) have not received any company guidance on AI use.</p>

  ${analytics.byDepartment.length > 0 ? `
  <h2>Department Breakdown</h2>
  <table>
    <tr>
      <th>Department</th>
      <th>Responses</th>
      <th>% Using AI</th>
      <th>% Sensitive Data</th>
      <th>% No Approval</th>
    </tr>
    ${analytics.byDepartment.map((dept: any) => `
      <tr>
        <td>${escapeHtml(dept.department)}</td>
        <td>${dept.responses}</td>
        <td>${dept.percentUsingAI}%</td>
        <td>${dept.percentSensitiveData}%</td>
        <td>${dept.percentNoApproval}%</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}

  <h2>Recommendations</h2>
  <ol>
    ${analytics.guidanceGap.percentNoGuidance > 50 ? '<li>Develop and distribute company-wide AI usage guidelines to address the guidance gap.</li>' : ''}
    ${analytics.sensitiveDataExposure.percentAtRisk > 30 ? '<li>Implement training on data sensitivity and appropriate AI tool usage.</li>' : ''}
    ${analytics.approvalStatus.percentUnapproved > 30 ? '<li>Establish a clear approval process for AI tool adoption.</li>' : ''}
    <li>Review discovered tools and add approved ones to the company AI Tool Inventory.</li>
    <li>Schedule follow-up surveys to track progress on AI governance initiatives.</li>
  </ol>

  <div class="footer">
    <p>Generated by TruGovAI™ Employee AI Survey • Part of the TruGovAI™ Toolkit</p>
    <p>"Board-ready AI governance in 30 days"</p>
  </div>
</body>
</html>
`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
