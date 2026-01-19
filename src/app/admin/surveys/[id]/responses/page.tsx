'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Survey } from '@/lib/types';

interface ResponseItem {
  id: string;
  email: string | null;
  department: string | null;
  usesAI: boolean;
  toolsUsed: string[];
  hasReceivedGuidance: boolean;
  entersSensitiveData: string | null;
  hasApproval: string | null;
  submittedAt: string;
}

export default function ResponsesListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

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

        // Fetch responses
        const responsesRes = await fetch(
          `/api/surveys/${params.id}/responses?page=${page}&limit=${limit}`
        );
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json();
          setResponses(responsesData.responses || []);
          setTotalCount(responsesData.total || 0);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, page]);

  const totalPages = Math.ceil(totalCount / limit);

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

  if (error || !survey) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-ice">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <p className="text-coral mb-4">{error || 'Survey not found'}</p>
            <Link href="/admin" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const hasRiskFactors = (response: ResponseItem) => {
    return (
      response.entersSensitiveData !== 'No, never' &&
      response.hasApproval !== 'Yes'
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ice">
        <AdminNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
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
              <li className="text-slate">All Responses</li>
            </ol>
          </nav>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-navy">All Responses</h1>
                <p className="text-slate">{totalCount} total responses</p>
              </div>
              <Link
                href={`/admin/surveys/${params.id}/results`}
                className="btn btn-secondary text-sm"
              >
                ← Back to Results
              </Link>
            </div>

            {responses.length === 0 ? (
              <p className="text-slate text-center py-8">No responses yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        {!survey.isAnonymous && survey.collectEmail && <th>Email</th>}
                        {survey.collectDepartment && <th>Department</th>}
                        <th>Uses AI</th>
                        <th>Tools</th>
                        <th>Sensitive Data</th>
                        <th>Approved</th>
                        <th>Guidance</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((response) => (
                        <tr
                          key={response.id}
                          className={hasRiskFactors(response) ? 'bg-coral/5' : ''}
                        >
                          {!survey.isAnonymous && survey.collectEmail && (
                            <td>{response.email || '-'}</td>
                          )}
                          {survey.collectDepartment && (
                            <td>{response.department || '-'}</td>
                          )}
                          <td>
                            <span
                              className={`badge ${
                                response.usesAI ? 'badge-active' : 'badge-closed'
                              }`}
                            >
                              {response.usesAI ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            {response.toolsUsed.length > 0
                              ? response.toolsUsed.length
                              : '-'}
                          </td>
                          <td>
                            {response.entersSensitiveData ? (
                              <span
                                className={
                                  response.entersSensitiveData === 'No, never'
                                    ? 'text-lime'
                                    : response.entersSensitiveData === 'Yes, regularly'
                                    ? 'text-coral font-medium'
                                    : 'text-amber'
                                }
                              >
                                {response.entersSensitiveData.replace('Yes, ', '').replace('No, ', '')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            {response.hasApproval ? (
                              <span
                                className={
                                  response.hasApproval === 'Yes'
                                    ? 'text-lime'
                                    : response.hasApproval === 'No'
                                    ? 'text-coral font-medium'
                                    : 'text-amber'
                                }
                              >
                                {response.hasApproval}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                response.hasReceivedGuidance ? 'text-lime' : 'text-amber'
                              }
                            >
                              {response.hasReceivedGuidance ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="text-sm">
                            {new Date(response.submittedAt).toLocaleString()}
                          </td>
                          <td>
                            <Link
                              href={`/admin/surveys/${params.id}/responses/${response.id}`}
                              className="text-teal hover:underline text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Link
                      href={`/admin/surveys/${params.id}/responses?page=${Math.max(1, page - 1)}`}
                      className={`btn btn-secondary text-sm ${
                        page <= 1 ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      Previous
                    </Link>
                    <span className="text-slate px-4">
                      Page {page} of {totalPages}
                    </span>
                    <Link
                      href={`/admin/surveys/${params.id}/responses?page=${Math.min(totalPages, page + 1)}`}
                      className={`btn btn-secondary text-sm ${
                        page >= totalPages ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      Next
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
