'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Department,
  TaskType,
  SubscriptionType,
  DataEntryFrequency,
  ApprovalStatus,
} from '@/lib/types';
import {
  DEPARTMENT_OPTIONS,
  TOOLS_BY_CATEGORY,
  TASK_OPTIONS,
  SUBSCRIPTION_OPTIONS,
  DATA_ENTRY_OPTIONS,
  APPROVAL_OPTIONS,
} from '@/lib/constants';

interface PublicSurvey {
  id: string;
  name: string;
  description: string;
  isAnonymous: boolean;
  collectDepartment: boolean;
  collectEmail: boolean;
  isActive: boolean;
  expiresAt: string | null;
}

interface FormData {
  email: string;
  department: string;
  usesAI: boolean | null;
  toolsUsed: string[];
  customTools: string;
  tasksUsed: string[];
  subscriptionType: string;
  entersSensitiveData: string;
  hasApproval: string;
  hasReceivedGuidance: boolean | null;
  additionalComments: string;
}

type SurveyState = 'loading' | 'landing' | 'form' | 'submitted' | 'closed' | 'expired' | 'error';

export default function PublicSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const [state, setState] = useState<SurveyState>('loading');
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    department: '',
    usesAI: null,
    toolsUsed: [],
    customTools: '',
    tasksUsed: [],
    subscriptionType: '',
    entersSensitiveData: '',
    hasApproval: '',
    hasReceivedGuidance: null,
    additionalComments: '',
  });

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetch(`/api/public/survey/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setState('error');
            return;
          }
          const data = await response.json();
          if (data.status === 'closed') {
            setState('closed');
            return;
          }
          if (data.status === 'expired') {
            setState('expired');
            return;
          }
          setState('error');
          return;
        }
        const data = await response.json();
        setSurvey(data);
        setState('landing');
      } catch (err) {
        console.error('Failed to fetch survey:', err);
        setState('error');
      }
    };

    if (params.id) {
      fetchSurvey();
    }
  }, [params.id]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      // About You section
      if (survey?.collectEmail && !survey?.isAnonymous && !formData.email) {
        newErrors.email = 'Email is required';
      }
      if (
        survey?.collectEmail &&
        !survey?.isAnonymous &&
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (survey?.collectDepartment && !formData.department) {
        newErrors.department = 'Please select your department';
      }
    }

    if (stepNumber === 2) {
      // AI Usage section
      if (formData.usesAI === null) {
        newErrors.usesAI = 'Please answer this question';
      }

      if (formData.usesAI === true) {
        if (formData.toolsUsed.length === 0 && !formData.customTools.trim()) {
          newErrors.toolsUsed = 'Please select at least one tool or enter a custom tool';
        }
        if (formData.tasksUsed.length === 0) {
          newErrors.tasksUsed = 'Please select at least one task';
        }
        if (!formData.subscriptionType) {
          newErrors.subscriptionType = 'Please select your subscription type';
        }
        if (!formData.entersSensitiveData) {
          newErrors.entersSensitiveData = 'Please answer this question';
        }
        if (!formData.hasApproval) {
          newErrors.hasApproval = 'Please answer this question';
        }
      }
    }

    if (stepNumber === 3) {
      // Awareness section
      if (formData.hasReceivedGuidance === null) {
        newErrors.hasReceivedGuidance = 'Please answer this question';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      // If usesAI is false and we're on step 2, skip to step 3
      if (step === 2 && formData.usesAI === false) {
        setStep(3);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse custom tools into array
      const customToolsArray = formData.customTools
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch(`/api/public/survey/${params.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email || null,
          department: formData.department || null,
          usesAI: formData.usesAI,
          toolsUsed: formData.toolsUsed,
          customTools: customToolsArray,
          tasksUsed: formData.tasksUsed,
          subscriptionType: formData.subscriptionType || null,
          entersSensitiveData: formData.entersSensitiveData || null,
          hasApproval: formData.hasApproval || null,
          hasReceivedGuidance: formData.hasReceivedGuidance,
          additionalComments: formData.additionalComments || null,
        }),
      });

      if (response.ok) {
        setState('submitted');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit response');
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      toolsUsed: prev.toolsUsed.includes(toolId)
        ? prev.toolsUsed.filter((t) => t !== toolId)
        : [...prev.toolsUsed, toolId],
    }));
  };

  const toggleTask = (task: string) => {
    setFormData((prev) => ({
      ...prev,
      tasksUsed: prev.tasksUsed.includes(task)
        ? prev.tasksUsed.filter((t) => t !== task)
        : [...prev.tasksUsed, task],
    }));
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate">Loading survey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="card max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Survey Not Found</h1>
          <p className="text-slate">This survey does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Closed state
  if (state === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="card max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Survey Closed</h1>
          <p className="text-slate">This survey is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  // Expired state
  if (state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="card max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-navy mb-4">Survey Expired</h1>
          <p className="text-slate">This survey has expired and is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  // Submitted state
  if (state === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice">
        <div className="card max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-lime/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-4">Thank You!</h1>
          <p className="text-slate mb-6">Your responses have been recorded.</p>
          <p className="text-sm text-slate">
            If you have any questions about AI usage at your company, please contact your IT or HR department.
          </p>
        </div>
      </div>
    );
  }

  // Landing state
  if (state === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ice py-8 px-4">
        <div className="card max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-teal mb-2">TruGovAI</h1>
            <h2 className="text-2xl font-bold text-navy mb-4">{survey?.name}</h2>
            <p className="text-slate whitespace-pre-wrap">{survey?.description}</p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setState('form')}
              className="btn btn-primary text-lg px-8"
            >
              Start Survey
            </button>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-slate">
            {survey?.isAnonymous ? (
              <p>This is an anonymous survey. Your identity will not be recorded.</p>
            ) : (
              <p>Your responses may be linked to your identity.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-ice py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-teal font-medium mb-1">TruGovAI Survey</p>
          <h1 className="text-xl font-bold text-navy">{survey?.name}</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate">Step {step} of 3</span>
            <span className="text-sm text-slate">
              {step === 1 ? 'About You' : step === 2 ? 'AI Usage' : 'Awareness'}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          {/* Step 1: About You */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-navy mb-6">About You</h2>

              {survey?.collectDepartment && (
                <div className="mb-6">
                  <label htmlFor="department" className="label">
                    Department <span className="text-coral">*</span>
                  </label>
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`input ${errors.department ? 'input-error' : ''}`}
                  >
                    <option value="">Select your department</option>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="error-text">{errors.department}</p>}
                </div>
              )}

              {survey?.collectEmail && !survey?.isAnonymous && (
                <div className="mb-6">
                  <label htmlFor="email" className="label">
                    Email <span className="text-coral">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="your.email@company.com"
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
              )}

              {!survey?.collectDepartment && (!survey?.collectEmail || survey?.isAnonymous) && (
                <p className="text-slate mb-6">Click Next to continue to the survey questions.</p>
              )}
            </div>
          )}

          {/* Step 2: AI Usage */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-navy mb-6">AI Usage</h2>

              {/* Q1: Uses AI */}
              <div className="mb-8">
                <p className="label">
                  Q1. Do you currently use any AI tools for work? <span className="text-coral">*</span>
                </p>
                <div className="radio-group">
                  <label
                    className={`radio-option ${formData.usesAI === true ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, usesAI: true })}
                  >
                    <input
                      type="radio"
                      name="usesAI"
                      checked={formData.usesAI === true}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.usesAI === true ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                      {formData.usesAI === true && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span>Yes</span>
                  </label>
                  <label
                    className={`radio-option ${formData.usesAI === false ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, usesAI: false })}
                  >
                    <input
                      type="radio"
                      name="usesAI"
                      checked={formData.usesAI === false}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.usesAI === false ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                      {formData.usesAI === false && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span>No</span>
                  </label>
                </div>
                {errors.usesAI && <p className="error-text">{errors.usesAI}</p>}
              </div>

              {/* Conditional questions if usesAI = true */}
              {formData.usesAI === true && (
                <>
                  {/* Q2: Tools Used */}
                  <div className="mb-8">
                    <p className="label">
                      Q2. Which AI tools do you use most often? <span className="text-coral">*</span>
                    </p>
                    <p className="text-sm text-slate mb-4">Select all that apply</p>

                    {Object.entries(TOOLS_BY_CATEGORY).map(([category, tools]) => (
                      <div key={category} className="mb-4">
                        <p className="text-sm font-medium text-navy mb-2">{category}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {tools.map((tool) => (
                            <label
                              key={tool.id}
                              className={`checkbox-option ${formData.toolsUsed.includes(tool.id) ? 'selected' : ''}`}
                              onClick={() => toggleTool(tool.id)}
                            >
                              <input
                                type="checkbox"
                                checked={formData.toolsUsed.includes(tool.id)}
                                onChange={() => {}}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.toolsUsed.includes(tool.id) ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                                {formData.toolsUsed.includes(tool.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span>{tool.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="mt-4">
                      <label htmlFor="customTools" className="text-sm font-medium text-navy mb-2 block">
                        Other tools (comma-separated)
                      </label>
                      <input
                        id="customTools"
                        type="text"
                        value={formData.customTools}
                        onChange={(e) => setFormData({ ...formData, customTools: e.target.value })}
                        className="input"
                        placeholder="e.g., Tool1, Tool2"
                      />
                    </div>
                    {errors.toolsUsed && <p className="error-text">{errors.toolsUsed}</p>}
                  </div>

                  {/* Q3: Tasks */}
                  <div className="mb-8">
                    <p className="label">
                      Q3. What tasks do you use these tools for? <span className="text-coral">*</span>
                    </p>
                    <p className="text-sm text-slate mb-4">Select all that apply</p>
                    <div className="checkbox-group">
                      {TASK_OPTIONS.map((task) => (
                        <label
                          key={task.key}
                          className={`checkbox-option ${formData.tasksUsed.includes(task.value) ? 'selected' : ''}`}
                          onClick={() => toggleTask(task.value)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.tasksUsed.includes(task.value)}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.tasksUsed.includes(task.value) ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                            {formData.tasksUsed.includes(task.value) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span>{task.value}</span>
                        </label>
                      ))}
                    </div>
                    {errors.tasksUsed && <p className="error-text">{errors.tasksUsed}</p>}
                  </div>

                  {/* Q4: Subscription */}
                  <div className="mb-8">
                    <p className="label">
                      Q4. Are you using free or paid versions? <span className="text-coral">*</span>
                    </p>
                    <div className="radio-group">
                      {SUBSCRIPTION_OPTIONS.map((option) => (
                        <label
                          key={option.key}
                          className={`radio-option ${formData.subscriptionType === option.value ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, subscriptionType: option.value })}
                        >
                          <input
                            type="radio"
                            name="subscriptionType"
                            checked={formData.subscriptionType === option.value}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.subscriptionType === option.value ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                            {formData.subscriptionType === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{option.value}</span>
                        </label>
                      ))}
                    </div>
                    {errors.subscriptionType && <p className="error-text">{errors.subscriptionType}</p>}
                  </div>

                  {/* Q5: Sensitive Data */}
                  <div className="mb-8">
                    <p className="label">
                      Q5. Do you ever enter customer, financial, or internal company data into these tools? <span className="text-coral">*</span>
                    </p>
                    <p className="text-sm text-slate mb-4">
                      Examples: customer names, financial figures, internal documents, employee data
                    </p>
                    <div className="radio-group">
                      {DATA_ENTRY_OPTIONS.map((option) => (
                        <label
                          key={option.key}
                          className={`radio-option ${formData.entersSensitiveData === option.value ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, entersSensitiveData: option.value })}
                        >
                          <input
                            type="radio"
                            name="entersSensitiveData"
                            checked={formData.entersSensitiveData === option.value}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.entersSensitiveData === option.value ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                            {formData.entersSensitiveData === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{option.value}</span>
                        </label>
                      ))}
                    </div>
                    {errors.entersSensitiveData && <p className="error-text">{errors.entersSensitiveData}</p>}
                  </div>

                  {/* Q6: Approval */}
                  <div className="mb-8">
                    <p className="label">
                      Q6. Did your manager or IT approve this usage? <span className="text-coral">*</span>
                    </p>
                    <div className="radio-group">
                      {APPROVAL_OPTIONS.map((option) => (
                        <label
                          key={option.key}
                          className={`radio-option ${formData.hasApproval === option.value ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, hasApproval: option.value })}
                        >
                          <input
                            type="radio"
                            name="hasApproval"
                            checked={formData.hasApproval === option.value}
                            onChange={() => {}}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasApproval === option.value ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                            {formData.hasApproval === option.value && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{option.value}</span>
                        </label>
                      ))}
                    </div>
                    {errors.hasApproval && <p className="error-text">{errors.hasApproval}</p>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Awareness */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-navy mb-6">Awareness</h2>

              {/* Q7: Guidance */}
              <div className="mb-8">
                <p className="label">
                  Q7. Have you received any company guidance on AI use? <span className="text-coral">*</span>
                </p>
                <div className="radio-group">
                  <label
                    className={`radio-option ${formData.hasReceivedGuidance === true ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, hasReceivedGuidance: true })}
                  >
                    <input
                      type="radio"
                      name="hasReceivedGuidance"
                      checked={formData.hasReceivedGuidance === true}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasReceivedGuidance === true ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                      {formData.hasReceivedGuidance === true && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span>Yes</span>
                  </label>
                  <label
                    className={`radio-option ${formData.hasReceivedGuidance === false ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, hasReceivedGuidance: false })}
                  >
                    <input
                      type="radio"
                      name="hasReceivedGuidance"
                      checked={formData.hasReceivedGuidance === false}
                      onChange={() => {}}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.hasReceivedGuidance === false ? 'border-teal bg-teal' : 'border-gray-300'}`}>
                      {formData.hasReceivedGuidance === false && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span>No</span>
                  </label>
                </div>
                {errors.hasReceivedGuidance && <p className="error-text">{errors.hasReceivedGuidance}</p>}
              </div>

              {/* Q8: Additional Comments */}
              <div className="mb-8">
                <label htmlFor="additionalComments" className="label">
                  Q8. Any additional comments? (optional)
                </label>
                <textarea
                  id="additionalComments"
                  value={formData.additionalComments}
                  onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Share any thoughts, suggestions, or concerns..."
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="btn btn-secondary">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn btn-primary">
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Survey'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
