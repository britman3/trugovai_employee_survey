# TruGovAI™ Employee AI Survey

# # TruGovAI™ Employee AI Survey — Authoritative Specification

This document is the single source of truth for this application.

## Mandatory Implementation Rules

The implementing agent MUST follow these rules:

1. Implement the application exactly as specified in this document.
2. Do NOT invent features, screens, fields, workflows, or data models.
3. Do NOT remove, simplify, or reinterpret any requirement.
4. Do NOT change the tech stack, libraries, or architecture unless explicitly required to make the app run.
5. If any requirement is ambiguous or technically conflicting, STOP and ask a clarification question before proceeding.
6. Build incrementally and confirm completion of each major section before moving on.
7. If assumptions conflict with this document, THIS DOCUMENT WINS.

## Scope Control

- This specification defines **v1 only**.
- Features listed under *Future Considerations* must NOT be implemented.
- Assume a **single-organisation context** (no multi-tenancy UI or logic in v1).

## Authority & Compliance

- File name: `SPEC.md`
- Status: **Authoritative / Contractual**
- Any deviation from this document is considered an error.

Proceed only after confirming full understanding of this specification.

## Project Overview

Build a web application for conducting AI usage surveys across an organisation. The app discovers "Shadow AI" — tools employees use without IT approval — and feeds results into the AI Tool Inventory system.

**Target users:** 
- **Admins:** HR, Compliance, IT managers who create and manage surveys
- **Respondents:** All employees who complete the survey

**Core value:** Replace manual Google Forms + spreadsheet analysis with a purpose-built survey tool that auto-generates risk analytics and feeds directly into governance workflows.

**Integration:** This app should share a database with the AI Tool Inventory app (or expose an API for data transfer).

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express (or Next.js API routes)
- **Database:** PostgreSQL (with Prisma ORM)
- **Auth:** NextAuth.js or Clerk (for admin users only)
- **Charts:** Recharts or Chart.js
- **Export:** CSV export + PDF report generation

---

## Brand Guidelines

### Colours (use these exact hex values)

```css
:root {
  /* Primary */
  --navy: #0F2A3A;        /* Primary background, headers */
  --teal: #1AA7A1;        /* Primary accent, buttons, links */
  --ice: #F4F7F9;         /* Light background */
  
  /* Secondary */
  --slate700: #4C5D6B;    /* Body text on light backgrounds */
  --mint300: #71D1C8;     /* Charts, secondary accent */
  
  /* Traffic Light System */
  --lime500: #7BC96F;     /* Low risk / positive */
  --coral500: #FF6B6B;    /* High risk / negative */
  --amber: #F59E0B;       /* Medium risk / warning */
  
  /* UI */
  --radius: 14px;
  --shadow: 0 8px 24px rgba(0,0,0,0.08);
}
```

### Typography
- **Primary font:** Inter (fallback: system-ui, sans-serif)
- **Scale:** H1 44px | H2 32px | H3 24px | Body 16px | Small 14px

### Component Style
- Buttons: 12px/16px padding, 8px radius, bold 16px text
- Cards: 14px radius, subtle shadow, white background on ice
- Form inputs: Clean, accessible, with clear labels and validation states

---

## Data Model

### Survey

```typescript
interface Survey {
  id: string;                    // UUID
  name: string;                  // e.g., "Q1 2026 AI Usage Survey"
  description: string;           // Intro text shown to respondents
  
  // Configuration
  isAnonymous: boolean;          // If true, don't collect identifying info
  collectDepartment: boolean;    // Ask for department
  collectEmail: boolean;         // Only if not anonymous
  isActive: boolean;             // Can accept responses
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;        // Optional deadline
  
  // Stats (denormalized for quick access)
  responseCount: number;
  
  // Ownership
  createdBy: string;             // Admin user ID
  organisationId: string;
}
```

### Survey Response

```typescript
interface SurveyResponse {
  id: string;                    // UUID
  surveyId: string;              // FK to Survey
  
  // Respondent info (if not anonymous)
  email: string | null;
  department: Department | null;
  
  // Core answers
  usesAI: boolean;               // Q1: Do you use AI tools?
  
  // Conditional fields (only if usesAI = true)
  toolsUsed: string[];           // Q2: Which tools (from predefined + custom)
  customTools: string[];         // "Other" tools entered by user
  tasksUsed: TaskType[];         // Q3: What tasks
  subscriptionType: SubscriptionType; // Q4: Free/Paid
  entersSensitiveData: DataEntryFrequency; // Q5: Data exposure
  hasApproval: ApprovalStatus;   // Q6: Manager/IT approved?
  
  // Always asked
  hasReceivedGuidance: boolean;  // Q7: Company guidance received?
  
  // Optional
  additionalComments: string | null;
  
  // Metadata
  submittedAt: Date;
  ipAddress: string | null;      // Only stored if not anonymous
}

enum Department {
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

enum TaskType {
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

enum SubscriptionType {
  FreeOnly = "Free only",
  PaidPersonal = "Paid (personal subscription)",
  PaidCompany = "Paid (company subscription)",
  Both = "Both free and paid"
}

enum DataEntryFrequency {
  Regularly = "Yes, regularly",
  Occasionally = "Occasionally",
  Never = "No, never"
}

enum ApprovalStatus {
  Yes = "Yes",
  No = "No",
  Unsure = "Unsure"
}
```

### Predefined AI Tools List

```typescript
const PREDEFINED_AI_TOOLS = [
  // Chatbots & Assistants
  { id: "chatgpt", name: "ChatGPT", vendor: "OpenAI", category: "Chatbot" },
  { id: "claude", name: "Claude", vendor: "Anthropic", category: "Chatbot" },
  { id: "gemini", name: "Gemini", vendor: "Google", category: "Chatbot" },
  { id: "copilot", name: "Microsoft Copilot", vendor: "Microsoft", category: "Chatbot" },
  { id: "perplexity", name: "Perplexity AI", vendor: "Perplexity", category: "Search" },
  
  // Coding
  { id: "github-copilot", name: "GitHub Copilot", vendor: "Microsoft", category: "Coding" },
  { id: "cursor", name: "Cursor", vendor: "Cursor", category: "Coding" },
  { id: "tabnine", name: "TabNine", vendor: "TabNine", category: "Coding" },
  { id: "codewhisperer", name: "Amazon CodeWhisperer", vendor: "Amazon", category: "Coding" },
  
  // Writing & Content
  { id: "jasper", name: "Jasper", vendor: "Jasper AI", category: "Writing" },
  { id: "copy-ai", name: "Copy.ai", vendor: "Copy.ai", category: "Writing" },
  { id: "grammarly", name: "GrammarlyGO", vendor: "Grammarly", category: "Writing" },
  { id: "notion-ai", name: "Notion AI", vendor: "Notion", category: "Writing" },
  { id: "otter", name: "Otter.ai", vendor: "Otter", category: "Transcription" },
  
  // Design & Creative
  { id: "midjourney", name: "MidJourney", vendor: "MidJourney", category: "Image" },
  { id: "dalle", name: "DALL·E", vendor: "OpenAI", category: "Image" },
  { id: "stable-diffusion", name: "Stable Diffusion", vendor: "Stability AI", category: "Image" },
  { id: "canva-ai", name: "Canva AI", vendor: "Canva", category: "Design" },
  { id: "adobe-firefly", name: "Adobe Firefly", vendor: "Adobe", category: "Image" },
  { id: "runway", name: "RunwayML", vendor: "Runway", category: "Video" },
  { id: "synthesia", name: "Synthesia", vendor: "Synthesia", category: "Video" },
  
  // Other
  { id: "zapier-ai", name: "Zapier AI", vendor: "Zapier", category: "Automation" },
  { id: "make-ai", name: "Make AI", vendor: "Make", category: "Automation" },
];
```

---

## Features & Screens

### Admin Side

#### 1. Survey Dashboard (Admin Home)

**Purpose:** Overview of all surveys and quick stats

**Components:**
- **Summary Cards (top row):**
  - Active Surveys (count)
  - Total Responses (all-time)
  - Responses This Month
  - Pending Review (surveys with new responses)

- **Surveys Table:**
  | Survey Name | Status | Responses | Created | Expires | Actions |
  
  - Status: Active (green), Closed (grey), Expired (amber)
  - Actions: View Results, Edit, Copy Link, Close, Delete

- **Quick Actions:**
  - "Create New Survey" button (prominent)

---

#### 2. Create/Edit Survey

**Purpose:** Configure survey settings

**Form Fields:**
- **Survey Name** (required, text)
- **Description** (required, textarea) — shown to respondents as intro
- **Settings:**
  - [ ] Anonymous responses (checkbox, default: true)
  - [ ] Collect department (checkbox, default: true)
  - [ ] Collect email (checkbox, only if not anonymous)
- **Expiry Date** (optional, date picker)

**Preview Panel:**
- Live preview of how survey will look to respondents

**Actions:**
- Save as Draft
- Activate Survey → generates shareable link

---

#### 3. Survey Results Dashboard

**Purpose:** Analytics for a single survey

**Header:**
- Survey name, status, response count, date range
- Actions: Export CSV, Generate Report PDF, Share Link

**Summary Cards:**
- Total Responses
- % Using AI Tools
- % Entering Sensitive Data
- % Without Guidance

**Charts Section:**

**A. AI Usage Overview**
- Pie chart: Uses AI vs Doesn't Use AI

**B. Most Popular Tools** (bar chart)
- X-axis: Tool names
- Y-axis: Number of users
- Colour-coded by category (Chatbot, Coding, Writing, Design)

**C. Tasks Performed** (horizontal bar chart)
- Ranked by frequency

**D. Data Sensitivity Exposure** (stacked bar or pie)
- Regularly / Occasionally / Never entering sensitive data
- Highlight "Regularly" in coral red

**E. Approval Status** (pie chart)
- Approved / Not Approved / Unsure
- Highlight "Not Approved" + "Unsure" as risk

**F. Guidance Gap** (simple stat + pie)
- "X% of employees have NOT received AI guidance"

**G. Department Breakdown** (if collected)
- Table or bar chart showing:
  - Department | Responses | % Using AI | % Sensitive Data | % No Approval

**Risk Flags Panel:**
- Auto-generated alerts:
  - "⚠️ 12 employees regularly enter sensitive data into unapproved tools"
  - "⚠️ 65% of respondents have not received AI guidance"
  - "⚠️ Marketing department has highest shadow AI exposure"

**Response List:**
- Paginated table of individual responses
- Columns depend on anonymous setting
- Click to view full response

---

#### 4. Individual Response View

**Purpose:** See one complete response

**Display:**
- All answers in readable format
- Timestamp
- If not anonymous: email, department
- Highlight risk factors (sensitive data + no approval = red flag)

---

#### 5. Export & Integration

**Features:**
- **Export CSV:** All responses with all fields
- **Export PDF Report:** 
  - Executive summary (1 page)
  - Key charts
  - Risk flags
  - Recommendations template
- **Push to Inventory:** 
  - Button to create new AI Tool entries from discovered tools
  - Shows which tools are new vs already in inventory
  - Bulk add with department/usage data pre-filled

---

### Respondent Side

#### 6. Survey Landing Page

**URL:** `/survey/[surveyId]` or `/s/[shortCode]`

**Components:**
- Organisation logo (if configured)
- Survey title
- Description/intro text
- "Start Survey" button

**States:**
- Active: Show survey
- Closed: "This survey is no longer accepting responses"
- Expired: "This survey has expired"

---

#### 7. Survey Form (Respondent)

**Layout:** Single page with sections, or multi-step wizard

**Section 1: About You** (if not fully anonymous)
- Department (dropdown) — if enabled
- Email (text) — if enabled

**Section 2: AI Usage**

**Q1. Do you currently use any AI tools for work?**
- Radio: Yes / No
- If "No" → skip to Q7

**Q2. Which AI tools do you use most often?** (if Q1 = Yes)
- Checkboxes with predefined tools
- Grouped by category (Chatbots, Coding, Writing, Design, Other)
- "Other" text field for unlisted tools

**Q3. What tasks do you use these tools for?** (if Q1 = Yes)
- Checkboxes with predefined tasks
- "Other" text field

**Q4. Are you using free or paid versions?** (if Q1 = Yes)
- Radio: Free only / Paid (personal) / Paid (company) / Both

**Q5. Do you ever enter customer, financial, or internal company data into these tools?** (if Q1 = Yes)
- Radio: Yes, regularly / Occasionally / No, never
- Helper text: "Examples: customer names, financial figures, internal documents, employee data"

**Q6. Did your manager or IT approve this usage?** (if Q1 = Yes)
- Radio: Yes / No / Unsure

**Section 3: Awareness** (always shown)

**Q7. Have you received any company guidance on AI use?**
- Radio: Yes / No

**Q8. Any additional comments?** (optional)
- Textarea

**Submit Button**

---

#### 8. Confirmation Page

**After submission:**
- Thank you message
- "Your responses have been recorded"
- Optional: Link to company AI policy (if configured)

---

## User Flows

### Admin: Creating a Survey
1. Admin logs in → lands on Survey Dashboard
2. Clicks "Create New Survey"
3. Fills in name, description, configures settings
4. Clicks "Activate Survey"
5. Gets shareable link + option to copy embed code
6. Distributes link via email/Slack/intranet

### Admin: Reviewing Results
1. Admin sees survey in dashboard with new response count
2. Clicks "View Results"
3. Reviews analytics dashboard
4. Identifies risk flags
5. Exports PDF report for leadership
6. Clicks "Push to Inventory" to add discovered tools

### Employee: Completing Survey
1. Receives survey link via email
2. Opens link → sees intro page
3. Clicks "Start Survey"
4. Answers Q1 (uses AI?)
   - If No → skips to Q7
   - If Yes → answers Q2-Q6
5. Answers Q7 (guidance)
6. Optionally adds comments
7. Submits → sees confirmation

---

## API Endpoints

```
# Surveys (Admin, authenticated)
GET    /api/surveys                    # List all surveys for org
GET    /api/surveys/:id                # Get survey details
POST   /api/surveys                    # Create survey
PUT    /api/surveys/:id                # Update survey
DELETE /api/surveys/:id                # Delete survey
POST   /api/surveys/:id/close          # Close survey to responses

# Survey Results (Admin, authenticated)
GET    /api/surveys/:id/responses      # List responses (paginated)
GET    /api/surveys/:id/responses/:rid # Single response
GET    /api/surveys/:id/analytics      # Aggregated analytics
GET    /api/surveys/:id/export/csv     # Export as CSV
GET    /api/surveys/:id/export/pdf     # Export as PDF report

# Integration
POST   /api/surveys/:id/push-to-inventory  # Create inventory entries

# Public (no auth required)
GET    /api/public/survey/:id          # Get survey for respondent (limited fields)
POST   /api/public/survey/:id/respond  # Submit response
```

---

## Analytics Calculations

### Key Metrics

```typescript
interface SurveyAnalytics {
  totalResponses: number;
  
  // Usage
  usesAI: {
    yes: number;
    no: number;
    percentYes: number;
  };
  
  // Tools (only from AI users)
  toolUsage: {
    toolId: string;
    toolName: string;
    count: number;
    percentage: number;
  }[];
  
  // Tasks
  taskUsage: {
    task: TaskType;
    count: number;
    percentage: number;
  }[];
  
  // Risk indicators
  sensitiveDataExposure: {
    regularly: number;
    occasionally: number;
    never: number;
    percentAtRisk: number;  // regularly + occasionally
  };
  
  approvalStatus: {
    approved: number;
    notApproved: number;
    unsure: number;
    percentUnapproved: number;  // notApproved + unsure
  };
  
  guidanceGap: {
    hasGuidance: number;
    noGuidance: number;
    percentNoGuidance: number;
  };
  
  // Department breakdown (if collected)
  byDepartment: {
    department: Department;
    responses: number;
    percentUsingAI: number;
    percentSensitiveData: number;
    percentNoApproval: number;
  }[];
  
  // Risk flags (auto-generated)
  riskFlags: {
    severity: 'high' | 'medium' | 'low';
    message: string;
    count: number;
  }[];
}
```

### Risk Flag Logic

```typescript
function generateRiskFlags(analytics: SurveyAnalytics): RiskFlag[] {
  const flags: RiskFlag[] = [];
  
  // High: Sensitive data in unapproved tools
  const sensitiveUnapproved = /* count of responses where 
    entersSensitiveData != 'Never' AND hasApproval != 'Yes' */;
  if (sensitiveUnapproved > 0) {
    flags.push({
      severity: 'high',
      message: `${sensitiveUnapproved} employees enter sensitive data into unapproved tools`,
      count: sensitiveUnapproved
    });
  }
  
  // High: Majority without guidance
  if (analytics.guidanceGap.percentNoGuidance > 50) {
    flags.push({
      severity: 'high',
      message: `${analytics.guidanceGap.percentNoGuidance}% of employees have not received AI guidance`,
      count: analytics.guidanceGap.noGuidance
    });
  }
  
  // Medium: High AI usage without approval
  if (analytics.approvalStatus.percentUnapproved > 30) {
    flags.push({
      severity: 'medium',
      message: `${analytics.approvalStatus.percentUnapproved}% of AI users lack manager/IT approval`,
      count: analytics.approvalStatus.notApproved + analytics.approvalStatus.unsure
    });
  }
  
  // Department-specific flags
  analytics.byDepartment.forEach(dept => {
    if (dept.percentSensitiveData > 50 && dept.percentNoApproval > 50) {
      flags.push({
        severity: 'high',
        message: `${dept.department} has high shadow AI exposure (${dept.percentSensitiveData}% sensitive data, ${dept.percentNoApproval}% unapproved)`,
        count: dept.responses
      });
    }
  });
  
  return flags;
}
```

---

## Validation Rules

### Survey Creation
- Name: Required, 3-100 characters
- Description: Required, 10-1000 characters
- Cannot delete survey with responses (must archive instead)

### Survey Response
- Q1 (usesAI): Required
- Q2-Q6: Required if usesAI = true
- Q7: Required always
- At least one tool must be selected in Q2 (or Other specified)
- Department: Required if survey.collectDepartment = true
- Email: Required if survey.collectEmail = true, must be valid format

---

## Sample Survey Data (for testing)

```json
{
  "survey": {
    "name": "Q1 2026 Shadow AI Discovery",
    "description": "We're conducting a short survey to understand how employees are using AI tools. This isn't about punishment — it's about making sure we can support you safely.",
    "isAnonymous": true,
    "collectDepartment": true,
    "collectEmail": false
  },
  "responses": [
    {
      "department": "Marketing",
      "usesAI": true,
      "toolsUsed": ["chatgpt", "jasper", "midjourney"],
      "tasksUsed": ["WritingEmails", "MarketingContent", "DesignCreative"],
      "subscriptionType": "PaidPersonal",
      "entersSensitiveData": "Occasionally",
      "hasApproval": "No",
      "hasReceivedGuidance": false
    },
    {
      "department": "Engineering",
      "usesAI": true,
      "toolsUsed": ["github-copilot", "chatgpt"],
      "tasksUsed": ["Coding", "DataAnalysis"],
      "subscriptionType": "PaidCompany",
      "entersSensitiveData": "Never",
      "hasApproval": "Yes",
      "hasReceivedGuidance": true
    },
    {
      "department": "HR",
      "usesAI": true,
      "toolsUsed": ["chatgpt"],
      "customTools": ["Resume Parser Pro"],
      "tasksUsed": ["HRRecruitment", "WritingEmails"],
      "subscriptionType": "FreeOnly",
      "entersSensitiveData": "Regularly",
      "hasApproval": "Unsure",
      "hasReceivedGuidance": false
    },
    {
      "department": "Finance",
      "usesAI": false,
      "hasReceivedGuidance": false
    },
    {
      "department": "IT",
      "usesAI": true,
      "toolsUsed": ["github-copilot", "claude", "cursor"],
      "tasksUsed": ["Coding", "DataAnalysis", "WritingEmails"],
      "subscriptionType": "PaidCompany",
      "entersSensitiveData": "Occasionally",
      "hasApproval": "Yes",
      "hasReceivedGuidance": true
    }
  ]
}
```

---

## Non-Functional Requirements

- **Performance:** Survey loads in <1s, results dashboard in <2s
- **Responsiveness:** Survey form must work on mobile (employees may complete on phone)
- **Accessibility:** WCAG 2.1 AA compliance, especially for form
- **Privacy:** Anonymous responses must not be traceable (no IP logging if anonymous)
- **Scalability:** Support 1000+ responses per survey

---

## Security Considerations

- Survey responses should be stored securely
- Admin authentication required for all dashboard/results access
- Public survey endpoint should be rate-limited
- Consider CAPTCHA for public surveys to prevent spam
- Export functions should require admin auth

---

## Integration with AI Tool Inventory

The "Push to Inventory" feature should:

1. Extract unique tools from survey responses
2. Show admin which tools are:
   - Already in Inventory (skip or update usage count)
   - New to Inventory (create new entry)
3. For new tools, pre-fill:
   - Tool name
   - Status: "Under Review" (discovered via survey)
   - Department: Most common from responses
   - Notes: "Discovered via Employee AI Survey [date]"
4. Admin reviews and confirms before creating entries
5. Link back to survey as evidence source

---

## Future Considerations (don't build now)

- Scheduled/recurring surveys
- Email distribution from within app
- Comparison between survey periods (trend analysis)
- Custom questions
- Branching logic beyond Q1
- Integration with SSO for pre-filling department/email

---

## Success Criteria

1. Admin can create, configure, and activate surveys
2. Employees can complete surveys on any device
3. Skip logic works (No AI → skip to Q7)
4. Analytics dashboard shows accurate aggregations
5. Risk flags auto-generate based on thresholds
6. CSV and PDF exports work correctly
7. Push to Inventory creates valid tool entries

---

## Getting Started

1. Set up Next.js project (share with Inventory app if possible)
2. Extend Prisma schema for Survey and Response models
3. Build survey configuration form
4. Build public survey form with branching
5. Build analytics dashboard with charts
6. Add export functionality
7. Build integration with Inventory
8. Add sample data seeder
9. Test mobile responsiveness
10. Polish and deploy

---

*Part of the TruGovAI™ Toolkit — "Board-ready AI governance in 30 days"*
