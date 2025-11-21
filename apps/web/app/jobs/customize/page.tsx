'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobCustomizerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_url: '',
    raw_description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse the job description
      const response = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse job description');
      }

      // Redirect to the match page with the job post ID
      router.push(`/jobs/match/${data.job_post.id}`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to parse job description');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="p-8 rounded-[24px]" style={{ 
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 0 30px rgba(0,0,0,0.4)'
        }}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF', lineHeight: '1.1' }}>
                Customize Your Profile Story
              </h1>
              <button
                type="button"
                onClick={() => router.push('/jobs/saved')}
                className="px-4 py-2 text-sm font-semibold rounded-[14px] transition-all duration-200 hover:transform hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#4ff1e3'
                }}
              >
                View Saved Stories
              </button>
            </div>
            <p className="mt-2" style={{ color: '#9AA4B2' }}>
              Paste a job description below, and we'll analyze it to create a tailored
              version of your profile story that highlights your most relevant skills and
              experience.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium" style={{ color: '#9AA4B2' }}>
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-[12px] px-4 py-3 focus:outline-none transition-all duration-200 text-white placeholder-gray-500"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium"
                  style={{ color: '#9AA4B2' }}
                >
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-[12px] px-4 py-3 focus:outline-none transition-all duration-200 text-white placeholder-gray-500"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="e.g., Google"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium"
                  style={{ color: '#9AA4B2' }}
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-[12px] px-4 py-3 focus:outline-none transition-all duration-200 text-white placeholder-gray-500"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="job_url"
                className="block text-sm font-medium"
                style={{ color: '#9AA4B2' }}
              >
                Job URL (optional)
              </label>
              <input
                type="url"
                id="job_url"
                name="job_url"
                value={formData.job_url}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-[12px] px-4 py-3 focus:outline-none transition-all duration-200 text-white placeholder-gray-500"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                placeholder="https://..."
              />
            </div>

            <div>
              <label
                htmlFor="raw_description"
                className="block text-sm font-medium"
                style={{ color: '#9AA4B2' }}
              >
                Job Description *
              </label>
              <textarea
                id="raw_description"
                name="raw_description"
                required
                rows={12}
                value={formData.raw_description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-[12px] px-4 py-3 focus:outline-none transition-all duration-200 font-mono text-sm text-white placeholder-gray-500"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                placeholder="Paste the full job description here..."
              />
              <p className="mt-1 text-sm" style={{ color: '#9AA4B2' }}>
                Include the full job description with requirements, responsibilities, and
                qualifications.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 font-semibold py-3 px-6 rounded-[14px] focus:outline-none transition-all duration-200 hover:transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                  color: '#FFFFFF',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)'
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing Job...
                  </span>
                ) : (
                  'Analyze Job & Show Match'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 font-medium rounded-[14px] focus:outline-none transition-all duration-200 hover:transform hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255, 60, 60, 0.15)',
                  border: '1px solid rgba(255, 60, 60, 0.4)',
                  color: '#ff6b6b'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-[20px] p-6" style={{
          background: 'rgba(79, 241, 227, 0.1)',
          border: '1px solid rgba(79, 241, 227, 0.2)'
        }}>
          <h3 className="font-semibold mb-3" style={{ color: '#4ff1e3' }}>💡 How it works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: '#9AA4B2' }}>
            <li>We use AI to parse the job description and extract key requirements</li>
            <li>We calculate a relevance score (0-100) based on your profile</li>
            <li>We reorder your experience to highlight the most relevant items</li>
            <li>You can save multiple customized versions for different applications</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
