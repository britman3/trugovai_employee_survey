// Enums as per spec

export enum Department {
  Marketing = "Marketing",
  HR = "HR",
  IT = "IT",
  Finance = "Finance",
  Operations = "Operations",
  Legal = "Legal",
  Sales = "Sales",
  CustomerService = "Customer Service",
  Engineering = "Engineering",
  Other = "Other"
}

export enum TaskType {
  WritingEmails = "Writing emails/documents",
  Coding = "Coding/development",
  DataAnalysis = "Data analysis/research",
  DesignCreative = "Design/creative work",
  CustomerService = "Customer service interactions",
  HRRecruitment = "HR/recruitment tasks",
  MarketingContent = "Marketing content creation",
  MeetingNotes = "Meeting notes/summaries",
  Translation = "Translation",
  Other = "Other"
}

export enum SubscriptionType {
  FreeOnly = "Free only",
  PaidPersonal = "Paid (personal subscription)",
  PaidCompany = "Paid (company subscription)",
  Both = "Both free and paid"
}

export enum DataEntryFrequency {
  Regularly = "Yes, regularly",
  Occasionally = "Occasionally",
  Never = "No, never"
}

export enum ApprovalStatus {
  Yes = "Yes",
  No = "No",
  Unsure = "Unsure"
}

// Survey interfaces

export interface Survey {
  id: string;
  name: string;
  description: string;
  isAnonymous: boolean;
  collectDepartment: boolean;
  collectEmail: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
  responseCount: number;
  createdBy: string;
  organisationId: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  email: string | null;
  department: Department | null;
  usesAI: boolean;
  toolsUsed: string[];
  customTools: string[];
  tasksUsed: TaskType[];
  subscriptionType: SubscriptionType | null;
  entersSensitiveData: DataEntryFrequency | null;
  hasApproval: ApprovalStatus | null;
  hasReceivedGuidance: boolean;
  additionalComments: string | null;
  submittedAt: Date;
  ipAddress: string | null;
}

// Analytics interfaces

export interface SurveyAnalytics {
  totalResponses: number;

  usesAI: {
    yes: number;
    no: number;
    percentYes: number;
  };

  toolUsage: {
    toolId: string;
    toolName: string;
    count: number;
    percentage: number;
  }[];

  taskUsage: {
    task: TaskType;
    count: number;
    percentage: number;
  }[];

  sensitiveDataExposure: {
    regularly: number;
    occasionally: number;
    never: number;
    percentAtRisk: number;
  };

  approvalStatus: {
    approved: number;
    notApproved: number;
    unsure: number;
    percentUnapproved: number;
  };

  guidanceGap: {
    hasGuidance: number;
    noGuidance: number;
    percentNoGuidance: number;
  };

  byDepartment: {
    department: Department;
    responses: number;
    percentUsingAI: number;
    percentSensitiveData: number;
    percentNoApproval: number;
  }[];

  riskFlags: RiskFlag[];
}

export interface RiskFlag {
  severity: 'high' | 'medium' | 'low';
  message: string;
  count: number;
}

// AI Tool interface

export interface AITool {
  id: string;
  name: string;
  vendor: string;
  category: string;
}

// Survey status type
export type SurveyStatus = 'active' | 'closed' | 'expired';

// Helper function to get survey status
export function getSurveyStatus(survey: Survey): SurveyStatus {
  if (!survey.isActive) return 'closed';
  if (survey.expiresAt && new Date(survey.expiresAt) < new Date()) return 'expired';
  return 'active';
}
