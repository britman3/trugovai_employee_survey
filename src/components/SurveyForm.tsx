'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Survey } from '@/lib/types';

interface SurveyFormProps {
  survey?: Survey;
  isEdit?: boolean;
}

interface FormData {
  name: string;
  description: string;
  isAnonymous: boolean;
  collectDepartment: boolean;
  collectEmail: boolean;
  expiresAt: string;
}

export default function SurveyForm({ survey, isEdit = false }: SurveyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isAnonymous: true,
    collectDepartment: true,
    collectEmail: false,
    expiresAt: '',
  });

  useEffect(() => {
    if (survey) {
      setFormData({
        name: survey.name,
        description: survey.description,
        isAnonymous: survey.isAnonymous,
        collectDepartment: survey.collectDepartment,
        collectEmail: survey.collectEmail,
        expiresAt: survey.expiresAt
          ? new Date(survey.expiresAt).toISOString().split('T')[0]
          : '',
      });
    }
  }, [survey]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.collectEmail && formData.isAnonymous) {
      newErrors.collectEmail = 'Cannot collect email for anonymous surveys';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, activate: boolean = false) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit ? `/api/surveys/${survey?.id}` : '/api/surveys';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          isActive: activate,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (activate) {
          // Copy link to clipboard
          const link = `${window.location.origin}/survey/${data.id}`;
          await navigator.clipboard.writeText(link);
          alert('Survey activated! Link copied to clipboard.');
        }
        router.push('/admin');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save survey');
      }
    } catch (error) {
      console.error('Failed to save survey:', error);
      alert('Failed to save survey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // If setting to anonymous, disable email collection
    if (name === 'isAnonymous' && checked) {
      setFormData((prev) => ({ ...prev, collectEmail: false }));
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
      {/* Survey Name */}
      <div>
        <label htmlFor="name" className="label">
          Survey Name <span className="text-coral">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          className={`input ${errors.name ? 'input-error' : ''}`}
          placeholder="e.g., Q1 2026 AI Usage Survey"
          required
        />
        {errors.name && <p className="error-text">{errors.name}</p>}
        <p className="text-sm text-slate mt-1">3-100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description <span className="text-coral">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={`input min-h-[120px] ${errors.description ? 'input-error' : ''}`}
          placeholder="Intro text shown to respondents..."
          required
        />
        {errors.description && <p className="error-text">{errors.description}</p>}
        <p className="text-sm text-slate mt-1">
          10-1000 characters. This will be shown to respondents on the survey landing page.
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-navy">Survey Settings</h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal"
            />
            <span className="text-slate">Anonymous responses</span>
          </label>
          <p className="text-sm text-slate ml-8">
            If enabled, no identifying information will be collected or stored.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="collectDepartment"
              checked={formData.collectDepartment}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal"
            />
            <span className="text-slate">Collect department</span>
          </label>
          <p className="text-sm text-slate ml-8">
            Ask respondents to select their department.
          </p>
        </div>

        <div className="space-y-3">
          <label
            className={`flex items-center gap-3 ${
              formData.isAnonymous ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              name="collectEmail"
              checked={formData.collectEmail}
              onChange={handleChange}
              disabled={formData.isAnonymous}
              className="w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal disabled:opacity-50"
            />
            <span className="text-slate">Collect email</span>
          </label>
          {errors.collectEmail && <p className="error-text ml-8">{errors.collectEmail}</p>}
          <p className="text-sm text-slate ml-8">
            Only available for non-anonymous surveys.
          </p>
        </div>
      </div>

      {/* Expiry Date */}
      <div>
        <label htmlFor="expiresAt" className="label">
          Expiry Date (optional)
        </label>
        <input
          id="expiresAt"
          name="expiresAt"
          type="date"
          value={formData.expiresAt}
          onChange={handleChange}
          className="input max-w-xs"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-sm text-slate mt-1">
          Leave empty for no expiration.
        </p>
      </div>

      {/* Preview Panel */}
      <div className="border border-gray-200 rounded-lg p-6 bg-ice">
        <h3 className="text-lg font-semibold text-navy mb-4">Preview</h3>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h4 className="text-xl font-bold text-navy mb-2">
            {formData.name || 'Survey Title'}
          </h4>
          <p className="text-slate whitespace-pre-wrap">
            {formData.description || 'Survey description will appear here...'}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-slate">
              {formData.isAnonymous ? 'Anonymous survey' : 'Non-anonymous survey'}
              {formData.collectDepartment && ' • Collects department'}
              {formData.collectEmail && ' • Collects email'}
              {formData.expiresAt && ` • Expires ${new Date(formData.expiresAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-secondary flex-1 sm:flex-none"
        >
          {isLoading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isLoading}
          className="btn btn-primary flex-1 sm:flex-none"
        >
          {isLoading ? 'Activating...' : 'Activate Survey'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="btn btn-secondary flex-1 sm:flex-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
