import { AITool, Department, TaskType, SubscriptionType, DataEntryFrequency, ApprovalStatus } from './types';

// Predefined AI Tools List as per spec
export const PREDEFINED_AI_TOOLS: AITool[] = [
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

// Group tools by category for the survey form
export const TOOLS_BY_CATEGORY = PREDEFINED_AI_TOOLS.reduce((acc, tool) => {
  if (!acc[tool.category]) {
    acc[tool.category] = [];
  }
  acc[tool.category].push(tool);
  return acc;
}, {} as Record<string, AITool[]>);

// Tool lookup by ID
export const TOOL_BY_ID = PREDEFINED_AI_TOOLS.reduce((acc, tool) => {
  acc[tool.id] = tool;
  return acc;
}, {} as Record<string, AITool>);

// Department options for dropdown
export const DEPARTMENT_OPTIONS = Object.values(Department);

// Task type options for checkboxes
export const TASK_OPTIONS = Object.entries(TaskType).map(([key, value]) => ({
  key,
  value,
}));

// Subscription type options for radio
export const SUBSCRIPTION_OPTIONS = Object.entries(SubscriptionType).map(([key, value]) => ({
  key,
  value,
}));

// Data entry frequency options for radio
export const DATA_ENTRY_OPTIONS = Object.entries(DataEntryFrequency).map(([key, value]) => ({
  key,
  value,
}));

// Approval status options for radio
export const APPROVAL_OPTIONS = Object.entries(ApprovalStatus).map(([key, value]) => ({
  key,
  value,
}));

// Chart colors based on brand guidelines
export const CHART_COLORS = {
  primary: '#1AA7A1', // teal
  secondary: '#71D1C8', // mint
  positive: '#7BC96F', // lime
  negative: '#FF6B6B', // coral
  warning: '#F59E0B', // amber
  navy: '#0F2A3A',
  slate: '#4C5D6B',
};

// Category colors for charts
export const CATEGORY_COLORS: Record<string, string> = {
  Chatbot: '#1AA7A1',
  Coding: '#71D1C8',
  Writing: '#7BC96F',
  Search: '#F59E0B',
  Image: '#FF6B6B',
  Design: '#0F2A3A',
  Video: '#4C5D6B',
  Transcription: '#9333EA',
  Automation: '#EC4899',
};
