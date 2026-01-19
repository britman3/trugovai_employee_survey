import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@trugovai.com' },
    update: {},
    create: {
      email: 'admin@trugovai.com',
      name: 'Admin User',
      password: hashedPassword,
      organisationId: 'org-1',
    },
  });
  console.log('Created admin user:', adminUser.email);

  // Create sample survey
  const survey = await prisma.survey.upsert({
    where: { id: 'sample-survey-1' },
    update: {},
    create: {
      id: 'sample-survey-1',
      name: 'Q1 2026 Shadow AI Discovery',
      description:
        "We're conducting a short survey to understand how employees are using AI tools. This isn't about punishment — it's about making sure we can support you safely.",
      isAnonymous: true,
      collectDepartment: true,
      collectEmail: false,
      isActive: true,
      createdBy: adminUser.id,
      organisationId: 'org-1',
      responseCount: 0,
    },
  });
  console.log('Created sample survey:', survey.name);

  // Sample responses based on spec
  const sampleResponses = [
    {
      department: 'Marketing',
      usesAI: true,
      toolsUsed: ['chatgpt', 'jasper', 'midjourney'],
      customTools: [],
      tasksUsed: ['Writing emails/documents', 'Marketing content creation', 'Design/creative work'],
      subscriptionType: 'Paid (personal subscription)',
      entersSensitiveData: 'Occasionally',
      hasApproval: 'No',
      hasReceivedGuidance: false,
    },
    {
      department: 'Engineering',
      usesAI: true,
      toolsUsed: ['github-copilot', 'chatgpt'],
      customTools: [],
      tasksUsed: ['Coding/development', 'Data analysis/research'],
      subscriptionType: 'Paid (company subscription)',
      entersSensitiveData: 'No, never',
      hasApproval: 'Yes',
      hasReceivedGuidance: true,
    },
    {
      department: 'HR',
      usesAI: true,
      toolsUsed: ['chatgpt'],
      customTools: ['Resume Parser Pro'],
      tasksUsed: ['HR/recruitment tasks', 'Writing emails/documents'],
      subscriptionType: 'Free only',
      entersSensitiveData: 'Yes, regularly',
      hasApproval: 'Unsure',
      hasReceivedGuidance: false,
    },
    {
      department: 'Finance',
      usesAI: false,
      toolsUsed: [],
      customTools: [],
      tasksUsed: [],
      subscriptionType: null,
      entersSensitiveData: null,
      hasApproval: null,
      hasReceivedGuidance: false,
    },
    {
      department: 'IT',
      usesAI: true,
      toolsUsed: ['github-copilot', 'claude', 'cursor'],
      customTools: [],
      tasksUsed: ['Coding/development', 'Data analysis/research', 'Writing emails/documents'],
      subscriptionType: 'Paid (company subscription)',
      entersSensitiveData: 'Occasionally',
      hasApproval: 'Yes',
      hasReceivedGuidance: true,
    },
    // Additional diverse responses
    {
      department: 'Sales',
      usesAI: true,
      toolsUsed: ['chatgpt', 'copy-ai'],
      customTools: [],
      tasksUsed: ['Writing emails/documents', 'Customer service interactions'],
      subscriptionType: 'Free only',
      entersSensitiveData: 'Occasionally',
      hasApproval: 'No',
      hasReceivedGuidance: false,
    },
    {
      department: 'Legal',
      usesAI: false,
      toolsUsed: [],
      customTools: [],
      tasksUsed: [],
      subscriptionType: null,
      entersSensitiveData: null,
      hasApproval: null,
      hasReceivedGuidance: true,
    },
    {
      department: 'Customer Service',
      usesAI: true,
      toolsUsed: ['chatgpt', 'grammarly'],
      customTools: [],
      tasksUsed: ['Customer service interactions', 'Writing emails/documents'],
      subscriptionType: 'Free only',
      entersSensitiveData: 'Yes, regularly',
      hasApproval: 'No',
      hasReceivedGuidance: false,
    },
    {
      department: 'Operations',
      usesAI: true,
      toolsUsed: ['chatgpt', 'otter', 'zapier-ai'],
      customTools: [],
      tasksUsed: ['Meeting notes/summaries', 'Data analysis/research'],
      subscriptionType: 'Both free and paid',
      entersSensitiveData: 'Occasionally',
      hasApproval: 'Unsure',
      hasReceivedGuidance: false,
    },
    {
      department: 'Engineering',
      usesAI: true,
      toolsUsed: ['claude', 'cursor', 'copilot'],
      customTools: [],
      tasksUsed: ['Coding/development'],
      subscriptionType: 'Paid (company subscription)',
      entersSensitiveData: 'No, never',
      hasApproval: 'Yes',
      hasReceivedGuidance: true,
    },
  ];

  // Delete existing responses for this survey
  await prisma.surveyResponse.deleteMany({
    where: { surveyId: survey.id },
  });

  // Create responses
  for (const response of sampleResponses) {
    await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        department: response.department,
        usesAI: response.usesAI,
        toolsUsed: response.toolsUsed,
        customTools: response.customTools,
        tasksUsed: response.tasksUsed,
        subscriptionType: response.subscriptionType,
        entersSensitiveData: response.entersSensitiveData,
        hasApproval: response.hasApproval,
        hasReceivedGuidance: response.hasReceivedGuidance,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      },
    });
  }

  // Update survey response count
  await prisma.survey.update({
    where: { id: survey.id },
    data: { responseCount: sampleResponses.length },
  });

  console.log(`Created ${sampleResponses.length} sample responses`);
  console.log('\nSeed completed!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@trugovai.com');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
