'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import SurveyForm from '@/components/SurveyForm';
import Link from 'next/link';
import { Survey } from '@/lib/types';

export default function EditSurveyPage() {
  const params = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const response = await fetch(`/api/surveys/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setSurvey(data);
        } else {
          setError('Survey not found');
        }
      } catch (err) {
        console.error('Failed to fetch survey:', err);
        setError('Failed to load survey');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSurvey();
    }
  }, [params.id]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-ice">
        <AdminNav />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
              <li>
                <Link href="/admin" className="text-teal hover:underline">
                  Dashboard
                </Link>
              </li>
              <li className="text-slate">/</li>
              <li className="text-slate">Edit Survey</li>
            </ol>
          </nav>

          <div className="card">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate">Loading survey...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-coral mb-4">{error}</p>
                <Link href="/admin" className="btn btn-primary">
                  Back to Dashboard
                </Link>
              </div>
            ) : survey ? (
              <>
                <h1 className="text-2xl font-bold text-navy mb-6">Edit Survey</h1>
                <SurveyForm survey={survey} isEdit />
              </>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
