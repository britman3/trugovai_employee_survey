'use client';

import AdminNav from '@/components/AdminNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import SurveyForm from '@/components/SurveyForm';
import Link from 'next/link';

export default function NewSurveyPage() {
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
              <li className="text-slate">Create New Survey</li>
            </ol>
          </nav>

          <div className="card">
            <h1 className="text-2xl font-bold text-navy mb-6">Create New Survey</h1>
            <SurveyForm />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
