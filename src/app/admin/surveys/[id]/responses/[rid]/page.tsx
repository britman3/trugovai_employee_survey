'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Survey, SurveyResponse, DataEntryFrequency, ApprovalStatus } from '@/lib/types';
import { TOOL_BY_ID } from '@/lib/constants';

export default function ResponseViewPage() {
  const params = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [response, setResponse] = useState<SurveyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch survey details
        const surveyRes = await fetch(`/api/surveys/${params.id}`);
        if (!surveyRes.ok) {
          setError('Survey not found');
          return;
        }
        const surveyData = await surveyRes.json();
        setSurvey(surveyData);

        // Fetch response
        const responseRes = await fetch(
          `/api/surveys/${params.id}/responses/${params.rid}`
        );
        if (!responseRes.ok) {
          setError('Response not found');
          return;
        }
        const responseData = await responseRes.json();
        setResponse(responseData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id && params.rid) {
      fetchData();
    }
  }, [params.id, params.rid]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-ice">
          <AdminNav />
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal border-t-transparent"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !survey || !response) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-ice">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-coral mb-4">{error || 'Data not found'}</p>
            <Link href="/admin" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const hasRiskFactors =
    response.entersSensitiveData !== DataEntryFrequency.Never &&
    response.hasApproval !== ApprovalStatus.Yes;

  const getToolName = (toolId: string) => {
    const tool = TOOL_BY_ID[toolId];
    return tool ? tool.name : toolId;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ice">
        <AdminNav />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
              <li>
                <Link href="/admin" className="text-teal hover:underline">
                  Dashboard
                </Link>
              </li>
              <li className="text-slate">/</li>
              <li>
                <Link
                  href={`/admin/surveys/${params.id}/results`}
                  className="text-teal hover:underline"
                >
                  {survey.name}
                </Link>
              </li>
              <li className="text-slate">/</li>
              <li>
                <Link
                  href={`/admin/surveys/${params.id}/responses`}
                  className="text-teal hover:underline"
                >
                  Responses
                </Link>
              </li>
              <li className="text-slate">/</li>
              <li className="text-slate">View Response</li>
            </ol>
          </nav>

          <div className="card">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-navy">Survey Response</h1>
                <p className="text-slate">
                  Submitted {new Date(response.submittedAt).toLocaleString()}
                </p>
              </div>
              {hasRiskFactors && (
                <div className="badge badge-risk-high flex items-center gap-2">
                  <span>🚨</span>
                  <span>Risk Factors Detected</span>
                </div>
              )}
            </div>

            {/* Risk Alert */}
            {hasRiskFactors && (
              <div className="bg-coral/10 border border-coral/20 rounded-lg p-4 mb-6">
                <p className="text-coral font-medium">
                  This respondent enters sensitive data into tools that may not be approved.
                </p>
              </div>
            )}

            {/* Respondent Info */}
            {(!survey.isAnonymous || survey.collectDepartment) && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-navy mb-4">Respondent Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!survey.isAnonymous && survey.collectEmail && (
                    <div>
                      <p className="text-sm text-slate">Email</p>
                      <p className="font-medium">{response.email || 'Not provided'}</p>
                    </div>
                  )}
                  {survey.collectDepartment && (
                    <div>
                      <p className="text-sm text-slate">Department</p>
                      <p className="font-medium">{response.department || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Usage */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-navy mb-4">AI Usage</h2>

              <div className="space-y-6">
                {/* Q1: Uses AI */}
                <div className="border-b pb-4">
                  <p className="text-sm text-slate mb-1">
                    Q1. Do you currently use any AI tools for work?
                  </p>
                  <p className="font-medium">
                    <span
                      className={`badge ${response.usesAI ? 'badge-active' : 'badge-closed'}`}
                    >
                      {response.usesAI ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>

                {response.usesAI && (
                  <>
                    {/* Q2: Tools Used */}
                    <div className="border-b pb-4">
                      <p className="text-sm text-slate mb-2">
                        Q2. Which AI tools do you use most often?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {response.toolsUsed.map((toolId) => (
                          <span key={toolId} className="badge bg-teal/10 text-teal">
                            {getToolName(toolId)}
                          </span>
                        ))}
                        {response.customTools?.map((tool) => (
                          <span key={tool} className="badge bg-slate/10 text-slate">
                            {tool} (custom)
                          </span>
                        ))}
                        {response.toolsUsed.length === 0 &&
                          (!response.customTools || response.customTools.length === 0) && (
                            <span className="text-slate">No tools selected</span>
                          )}
                      </div>
                    </div>

                    {/* Q3: Tasks */}
                    <div className="border-b pb-4">
                      <p className="text-sm text-slate mb-2">
                        Q3. What tasks do you use these tools for?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {response.tasksUsed.map((task) => (
                          <span key={task} className="badge bg-mint/20 text-navy">
                            {task}
                          </span>
                        ))}
                        {response.tasksUsed.length === 0 && (
                          <span className="text-slate">No tasks selected</span>
                        )}
                      </div>
                    </div>

                    {/* Q4: Subscription */}
                    <div className="border-b pb-4">
                      <p className="text-sm text-slate mb-1">
                        Q4. Are you using free or paid versions?
                      </p>
                      <p className="font-medium">{response.subscriptionType || 'Not specified'}</p>
                    </div>

                    {/* Q5: Sensitive Data */}
                    <div className="border-b pb-4">
                      <p className="text-sm text-slate mb-1">
                        Q5. Do you ever enter customer, financial, or internal company data into these tools?
                      </p>
                      <p
                        className={`font-medium ${
                          response.entersSensitiveData === DataEntryFrequency.Never
                            ? 'text-lime'
                            : response.entersSensitiveData === DataEntryFrequency.Regularly
                            ? 'text-coral'
                            : 'text-amber'
                        }`}
                      >
                        {response.entersSensitiveData || 'Not specified'}
                      </p>
                    </div>

                    {/* Q6: Approval */}
                    <div className="border-b pb-4">
                      <p className="text-sm text-slate mb-1">
                        Q6. Did your manager or IT approve this usage?
                      </p>
                      <p
                        className={`font-medium ${
                          response.hasApproval === ApprovalStatus.Yes
                            ? 'text-lime'
                            : response.hasApproval === ApprovalStatus.No
                            ? 'text-coral'
                            : 'text-amber'
                        }`}
                      >
                        {response.hasApproval || 'Not specified'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Awareness */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-navy mb-4">Awareness</h2>

              <div className="space-y-6">
                {/* Q7: Guidance */}
                <div className="border-b pb-4">
                  <p className="text-sm text-slate mb-1">
                    Q7. Have you received any company guidance on AI use?
                  </p>
                  <p
                    className={`font-medium ${
                      response.hasReceivedGuidance ? 'text-lime' : 'text-amber'
                    }`}
                  >
                    {response.hasReceivedGuidance ? 'Yes' : 'No'}
                  </p>
                </div>

                {/* Q8: Additional Comments */}
                {response.additionalComments && (
                  <div>
                    <p className="text-sm text-slate mb-1">Q8. Additional comments</p>
                    <p className="bg-ice p-4 rounded-lg whitespace-pre-wrap">
                      {response.additionalComments}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <Link
                href={`/admin/surveys/${params.id}/responses`}
                className="btn btn-secondary"
              >
                ← Back to Responses
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
