'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Survey, getSurveyStatus, SurveyStatus } from '@/lib/types';

interface DashboardStats {
  activeSurveys: number;
  totalResponses: number;
  responsesThisMonth: number;
  pendingReview: number;
}

export default function AdminDashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeSurveys: 0,
    totalResponses: 0,
    responsesThisMonth: 0,
    pendingReview: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/surveys');
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (surveyId: string, hasResponses: boolean) => {
    if (hasResponses) {
      alert('Cannot delete survey with responses. You can close it instead.');
      return;
    }

    if (!confirm('Are you sure you want to delete this survey?')) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to delete survey');
      }
    } catch (error) {
      console.error('Failed to delete survey:', error);
      alert('Failed to delete survey');
    }
  };

  const handleClose = async (surveyId: string) => {
    if (!confirm('Are you sure you want to close this survey? It will no longer accept responses.')) {
      return;
    }

    try {
      const response = await fetch(`/api/surveys/${surveyId}/close`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        alert('Failed to close survey');
      }
    } catch (error) {
      console.error('Failed to close survey:', error);
      alert('Failed to close survey');
    }
  };

  const copyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link);
    alert('Survey link copied to clipboard!');
  };

  const getStatusBadge = (survey: Survey) => {
    const status = getSurveyStatus(survey);
    const badgeClass = {
      active: 'badge-active',
      closed: 'badge-closed',
      expired: 'badge-expired',
    }[status];

    return (
      <span className={`badge ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ice">
        <AdminNav />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-navy">Survey Dashboard</h1>
              <p className="text-slate mt-1">Manage your AI usage surveys</p>
            </div>
            <Link
              href="/admin/surveys/new"
              className="btn btn-primary mt-4 sm:mt-0 inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create New Survey
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Surveys"
              value={stats.activeSurveys}
              icon={<ChartIcon className="w-6 h-6 text-teal" />}
            />
            <StatCard
              title="Total Responses"
              value={stats.totalResponses}
              icon={<UsersIcon className="w-6 h-6 text-teal" />}
            />
            <StatCard
              title="Responses This Month"
              value={stats.responsesThisMonth}
              icon={<CalendarIcon className="w-6 h-6 text-teal" />}
            />
            <StatCard
              title="Pending Review"
              value={stats.pendingReview}
              icon={<AlertIcon className="w-6 h-6 text-amber" />}
            />
          </div>

          {/* Surveys Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-navy">All Surveys</h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate">Loading surveys...</p>
              </div>
            ) : surveys.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate mb-4">No surveys yet. Create your first survey to get started.</p>
                <Link href="/admin/surveys/new" className="btn btn-primary inline-flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  Create New Survey
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Survey Name</th>
                      <th>Status</th>
                      <th>Responses</th>
                      <th>Created</th>
                      <th>Expires</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey) => (
                      <tr key={survey.id}>
                        <td>
                          <Link
                            href={`/admin/surveys/${survey.id}/results`}
                            className="text-navy font-medium hover:text-teal transition-colors"
                          >
                            {survey.name}
                          </Link>
                        </td>
                        <td>{getStatusBadge(survey)}</td>
                        <td>{survey.responseCount}</td>
                        <td>{new Date(survey.createdAt).toLocaleDateString()}</td>
                        <td>
                          {survey.expiresAt
                            ? new Date(survey.expiresAt).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/surveys/${survey.id}/results`}
                              className="text-teal hover:text-teal/80 text-sm"
                              title="View Results"
                            >
                              Results
                            </Link>
                            <Link
                              href={`/admin/surveys/${survey.id}/edit`}
                              className="text-slate hover:text-navy text-sm"
                              title="Edit"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => copyLink(survey.id)}
                              className="text-slate hover:text-navy text-sm"
                              title="Copy Link"
                            >
                              Link
                            </button>
                            {getSurveyStatus(survey) === 'active' && (
                              <button
                                onClick={() => handleClose(survey.id)}
                                className="text-amber hover:text-amber/80 text-sm"
                                title="Close Survey"
                              >
                                Close
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(survey.id, survey.responseCount > 0)}
                              className="text-coral hover:text-coral/80 text-sm"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className="p-3 bg-ice rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-slate">{title}</p>
        <p className="text-2xl font-bold text-navy">{value}</p>
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
