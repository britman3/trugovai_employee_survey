import {
  SurveyAnalytics,
  RiskFlag,
  Department,
  TaskType,
  DataEntryFrequency,
  ApprovalStatus,
} from './types';
import { TOOL_BY_ID } from './constants';

interface ResponseData {
  usesAI: boolean;
  toolsUsed: string[];
  customTools: string[];
  tasksUsed: string[];
  subscriptionType: string | null;
  entersSensitiveData: string | null;
  hasApproval: string | null;
  hasReceivedGuidance: boolean;
  department: string | null;
}

export function calculateAnalytics(responses: ResponseData[]): SurveyAnalytics {
  const totalResponses = responses.length;

  if (totalResponses === 0) {
    return getEmptyAnalytics();
  }

  // AI Usage
  const aiUsers = responses.filter((r) => r.usesAI);
  const usesAI = {
    yes: aiUsers.length,
    no: totalResponses - aiUsers.length,
    percentYes: Math.round((aiUsers.length / totalResponses) * 100),
  };

  // Tool Usage (only from AI users)
  const toolCounts: Record<string, number> = {};
  aiUsers.forEach((r) => {
    r.toolsUsed.forEach((toolId) => {
      toolCounts[toolId] = (toolCounts[toolId] || 0) + 1;
    });
    // Also count custom tools
    r.customTools.forEach((tool) => {
      const customKey = `custom:${tool}`;
      toolCounts[customKey] = (toolCounts[customKey] || 0) + 1;
    });
  });

  const toolUsage = Object.entries(toolCounts)
    .map(([toolId, count]) => {
      const isCustom = toolId.startsWith('custom:');
      const tool = isCustom ? null : TOOL_BY_ID[toolId];
      return {
        toolId,
        toolName: isCustom ? toolId.replace('custom:', '') : (tool?.name || toolId),
        count,
        percentage: Math.round((count / aiUsers.length) * 100),
      };
    })
    .sort((a, b) => b.count - a.count);

  // Task Usage (only from AI users)
  const taskCounts: Record<string, number> = {};
  aiUsers.forEach((r) => {
    r.tasksUsed.forEach((task) => {
      taskCounts[task] = (taskCounts[task] || 0) + 1;
    });
  });

  const taskUsage = Object.entries(taskCounts)
    .map(([task, count]) => ({
      task: task as TaskType,
      count,
      percentage: Math.round((count / aiUsers.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Sensitive Data Exposure (only from AI users)
  const sensitiveData = {
    regularly: aiUsers.filter((r) => r.entersSensitiveData === DataEntryFrequency.Regularly).length,
    occasionally: aiUsers.filter((r) => r.entersSensitiveData === DataEntryFrequency.Occasionally).length,
    never: aiUsers.filter((r) => r.entersSensitiveData === DataEntryFrequency.Never).length,
    percentAtRisk: 0,
  };
  const atRisk = sensitiveData.regularly + sensitiveData.occasionally;
  sensitiveData.percentAtRisk = aiUsers.length > 0 ? Math.round((atRisk / aiUsers.length) * 100) : 0;

  // Approval Status (only from AI users)
  const approval = {
    approved: aiUsers.filter((r) => r.hasApproval === ApprovalStatus.Yes).length,
    notApproved: aiUsers.filter((r) => r.hasApproval === ApprovalStatus.No).length,
    unsure: aiUsers.filter((r) => r.hasApproval === ApprovalStatus.Unsure).length,
    percentUnapproved: 0,
  };
  const unapproved = approval.notApproved + approval.unsure;
  approval.percentUnapproved = aiUsers.length > 0 ? Math.round((unapproved / aiUsers.length) * 100) : 0;

  // Guidance Gap (all respondents)
  const guidance = {
    hasGuidance: responses.filter((r) => r.hasReceivedGuidance).length,
    noGuidance: responses.filter((r) => !r.hasReceivedGuidance).length,
    percentNoGuidance: 0,
  };
  guidance.percentNoGuidance = Math.round((guidance.noGuidance / totalResponses) * 100);

  // Department Breakdown
  const deptData: Record<string, {
    responses: number;
    aiUsers: number;
    sensitiveData: number;
    noApproval: number;
  }> = {};

  responses.forEach((r) => {
    const dept = r.department || 'Unknown';
    if (!deptData[dept]) {
      deptData[dept] = { responses: 0, aiUsers: 0, sensitiveData: 0, noApproval: 0 };
    }
    deptData[dept].responses++;
    if (r.usesAI) {
      deptData[dept].aiUsers++;
      if (r.entersSensitiveData !== DataEntryFrequency.Never) {
        deptData[dept].sensitiveData++;
      }
      if (r.hasApproval !== ApprovalStatus.Yes) {
        deptData[dept].noApproval++;
      }
    }
  });

  const byDepartment = Object.entries(deptData)
    .filter(([dept]) => dept !== 'Unknown')
    .map(([department, data]) => ({
      department: department as Department,
      responses: data.responses,
      percentUsingAI: data.responses > 0 ? Math.round((data.aiUsers / data.responses) * 100) : 0,
      percentSensitiveData: data.aiUsers > 0 ? Math.round((data.sensitiveData / data.aiUsers) * 100) : 0,
      percentNoApproval: data.aiUsers > 0 ? Math.round((data.noApproval / data.aiUsers) * 100) : 0,
    }))
    .sort((a, b) => b.responses - a.responses);

  // Generate Risk Flags
  const riskFlags = generateRiskFlags(
    responses,
    aiUsers,
    sensitiveData,
    approval,
    guidance,
    byDepartment
  );

  return {
    totalResponses,
    usesAI,
    toolUsage,
    taskUsage,
    sensitiveDataExposure: sensitiveData,
    approvalStatus: approval,
    guidanceGap: guidance,
    byDepartment,
    riskFlags,
  };
}

function generateRiskFlags(
  responses: ResponseData[],
  aiUsers: ResponseData[],
  sensitiveData: { regularly: number; occasionally: number; never: number; percentAtRisk: number },
  approval: { approved: number; notApproved: number; unsure: number; percentUnapproved: number },
  guidance: { hasGuidance: number; noGuidance: number; percentNoGuidance: number },
  byDepartment: { department: Department; responses: number; percentUsingAI: number; percentSensitiveData: number; percentNoApproval: number }[]
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  // High: Sensitive data in unapproved tools
  const sensitiveUnapproved = aiUsers.filter(
    (r) =>
      r.entersSensitiveData !== DataEntryFrequency.Never &&
      r.hasApproval !== ApprovalStatus.Yes
  ).length;

  if (sensitiveUnapproved > 0) {
    flags.push({
      severity: 'high',
      message: `${sensitiveUnapproved} employee${sensitiveUnapproved > 1 ? 's' : ''} enter${sensitiveUnapproved === 1 ? 's' : ''} sensitive data into unapproved tools`,
      count: sensitiveUnapproved,
    });
  }

  // High: Majority without guidance
  if (guidance.percentNoGuidance > 50) {
    flags.push({
      severity: 'high',
      message: `${guidance.percentNoGuidance}% of employees have not received AI guidance`,
      count: guidance.noGuidance,
    });
  }

  // Medium: High AI usage without approval
  if (approval.percentUnapproved > 30) {
    flags.push({
      severity: 'medium',
      message: `${approval.percentUnapproved}% of AI users lack manager/IT approval`,
      count: approval.notApproved + approval.unsure,
    });
  }

  // Department-specific flags
  byDepartment.forEach((dept) => {
    if (dept.percentSensitiveData > 50 && dept.percentNoApproval > 50) {
      flags.push({
        severity: 'high',
        message: `${dept.department} has high shadow AI exposure (${dept.percentSensitiveData}% sensitive data, ${dept.percentNoApproval}% unapproved)`,
        count: dept.responses,
      });
    }
  });

  return flags.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function getEmptyAnalytics(): SurveyAnalytics {
  return {
    totalResponses: 0,
    usesAI: { yes: 0, no: 0, percentYes: 0 },
    toolUsage: [],
    taskUsage: [],
    sensitiveDataExposure: { regularly: 0, occasionally: 0, never: 0, percentAtRisk: 0 },
    approvalStatus: { approved: 0, notApproved: 0, unsure: 0, percentUnapproved: 0 },
    guidanceGap: { hasGuidance: 0, noGuidance: 0, percentNoGuidance: 0 },
    byDepartment: [],
    riskFlags: [],
  };
}
