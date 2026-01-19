'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Survey, SurveyAnalytics, getSurveyStatus } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS, CATEGORY_COLORS, TOOL_BY_ID } from '@/lib/constants';

interface ResponsePreview {
  id: string;
  department: string | null;
  usesAI: boolean;
  submittedAt: string;
  email?: string | null;
}

export default function SurveyResultsPage() {
  const params = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [responses, setResponses] = useState<ResponsePreview[]>([]);
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

        // Fetch analytics
        const analyticsRes = await fetch(`/api/surveys/${params.id}/analytics`);
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }

        // Fetch responses preview
        const responsesRes = await fetch(`/api/surveys/${params.id}/responses?limit=10`);
        if (responsesRes.ok) {
          const responsesData = await responsesRes.json();
          setResponses(responsesData.responses || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load survey data');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/surveys/${params.id}/export/csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${params.id}-responses.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/surveys/${params.id}/export/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${params.id}-report.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/survey/${params.id}`;
    navigator.clipboard.writeText(link);
    alert('Survey link copied to clipboard!');
  };

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

  const status = getSurveyStatus(survey);
  const statusBadgeClass = {
    active: 'badge-active',
    closed: 'badge-closed',
    expired: 'badge-expired',
  }[status];

  // Prepare chart data
  const aiUsageData = analytics
    ? [
        { name: 'Uses AI', value: analytics.usesAI.yes, color: CHART_COLORS.primary },
        { name: "Doesn't Use AI", value: analytics.usesAI.no, color: CHART_COLORS.slate },
      ]
    : [];

  const toolsData = analytics?.toolUsage.slice(0, 10).map((tool) => {
    const predefinedTool = TOOL_BY_ID[tool.toolId];
    return {
      name: tool.toolName,
      count: tool.count,
      color: predefinedTool ? CATEGORY_COLORS[predefinedTool.category] || CHART_COLORS.primary : CHART_COLORS.secondary,
    };
  }) || [];

  const tasksData = analytics?.taskUsage.slice(0, 10).map((task) => ({
    name: task.task.split('/')[0],
    count: task.count,
  })) || [];

  const sensitiveData = analytics
    ? [
        { name: 'Regularly', value: analytics.sensitiveDataExposure.regularly, color: CHART_COLORS.negative },
        { name: 'Occasionally', value: analytics.sensitiveDataExposure.occasionally, color: CHART_COLORS.warning },
        { name: 'Never', value: analytics.sensitiveDataExposure.never, color: CHART_COLORS.positive },
      ]
    : [];

  const approvalData = analytics
    ? [
        { name: 'Approved', value: analytics.approvalStatus.approved, color: CHART_COLORS.positive },
        { name: 'Not Approved', value: analytics.approvalStatus.notApproved, color: CHART_COLORS.negative },
        { name: 'Unsure', value: analytics.approvalStatus.unsure, color: CHART_COLORS.warning },
      ]
    : [];

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
              <li className="text-slate">{survey.name}</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="card mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-navy">{survey.name}</h1>
                  <span className={`badge ${statusBadgeClass}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <p className="text-slate">
                  {analytics?.totalResponses || 0} responses
                  {survey.createdAt && ` • Created ${new Date(survey.createdAt).toLocaleDateString()}`}
                  {survey.expiresAt && ` • Expires ${new Date(survey.expiresAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleExportCSV} className="btn btn-secondary text-sm">
                  Export CSV
                </button>
                <button onClick={handleExportPDF} className="btn btn-secondary text-sm">
                  Generate PDF
                </button>
                <button onClick={copyLink} className="btn btn-primary text-sm">
                  Share Link
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Total Responses"
                value={analytics.totalResponses}
                color="teal"
              />
              <SummaryCard
                title="Using AI Tools"
                value={`${analytics.usesAI.percentYes}%`}
                subtitle={`${analytics.usesAI.yes} employees`}
                color="teal"
              />
              <SummaryCard
                title="Entering Sensitive Data"
                value={`${analytics.sensitiveDataExposure.percentAtRisk}%`}
                subtitle="at risk"
                color="coral"
              />
              <SummaryCard
                title="Without Guidance"
                value={`${analytics.guidanceGap.percentNoGuidance}%`}
                subtitle={`${analytics.guidanceGap.noGuidance} employees`}
                color="amber"
              />
            </div>
          )}

          {/* Risk Flags */}
          {analytics && analytics.riskFlags.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-navy mb-4">Risk Flags</h2>
              <div className="space-y-3">
                {analytics.riskFlags.map((flag, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-4 rounded-lg ${
                      flag.severity === 'high'
                        ? 'bg-coral/10 border border-coral/20'
                        : flag.severity === 'medium'
                        ? 'bg-amber/10 border border-amber/20'
                        : 'bg-lime/10 border border-lime/20'
                    }`}
                  >
                    <span className="text-xl">
                      {flag.severity === 'high' ? '🚨' : flag.severity === 'medium' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div>
                      <p className={`font-medium ${
                        flag.severity === 'high' ? 'text-coral' : flag.severity === 'medium' ? 'text-amber' : 'text-lime'
                      }`}>
                        {flag.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Grid */}
          {analytics && analytics.totalResponses > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* AI Usage Pie Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">AI Usage Overview</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aiUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {aiUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Most Popular Tools Bar Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">Most Popular Tools</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolsData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.primary}>
                        {toolsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tasks Performed Bar Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">Tasks Performed</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={CHART_COLORS.secondary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Sensitivity Exposure Pie Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">Sensitive Data Exposure</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sensitiveData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sensitiveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Approval Status Pie Chart */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">Approval Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={approvalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {approvalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Guidance Gap */}
              <div className="card">
                <h3 className="text-lg font-semibold text-navy mb-4">Guidance Gap</h3>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-amber">
                      {analytics.guidanceGap.percentNoGuidance}%
                    </p>
                    <p className="text-lg text-slate mt-2">
                      of employees have NOT received AI guidance
                    </p>
                    <p className="text-sm text-slate mt-1">
                      ({analytics.guidanceGap.noGuidance} out of {analytics.totalResponses})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Department Breakdown */}
          {analytics && analytics.byDepartment.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-navy mb-4">Department Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Responses</th>
                      <th>% Using AI</th>
                      <th>% Sensitive Data</th>
                      <th>% No Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.byDepartment.map((dept) => (
                      <tr key={dept.department}>
                        <td className="font-medium">{dept.department}</td>
                        <td>{dept.responses}</td>
                        <td>{dept.percentUsingAI}%</td>
                        <td className={dept.percentSensitiveData > 50 ? 'text-coral font-medium' : ''}>
                          {dept.percentSensitiveData}%
                        </td>
                        <td className={dept.percentNoApproval > 50 ? 'text-coral font-medium' : ''}>
                          {dept.percentNoApproval}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Response List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-navy">Recent Responses</h2>
              <Link
                href={`/admin/surveys/${params.id}/responses`}
                className="text-teal hover:underline text-sm"
              >
                View All Responses →
              </Link>
            </div>
            {responses.length === 0 ? (
              <p className="text-slate text-center py-8">No responses yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      {!survey.isAnonymous && survey.collectEmail && <th>Email</th>}
                      {survey.collectDepartment && <th>Department</th>}
                      <th>Uses AI</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id}>
                        {!survey.isAnonymous && survey.collectEmail && (
                          <td>{response.email || '-'}</td>
                        )}
                        {survey.collectDepartment && (
                          <td>{response.department || '-'}</td>
                        )}
                        <td>
                          <span className={`badge ${response.usesAI ? 'badge-active' : 'badge-closed'}`}>
                            {response.usesAI ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>{new Date(response.submittedAt).toLocaleString()}</td>
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
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'teal' | 'coral' | 'amber' | 'lime';
}) {
  const colorClass = {
    teal: 'text-teal',
    coral: 'text-coral',
    amber: 'text-amber',
    lime: 'text-lime',
  }[color];

  return (
    <div className="card">
      <p className="text-sm text-slate mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-sm text-slate mt-1">{subtitle}</p>}
    </div>
  );
}
