'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { createEntry } from './actions';

export default function NewEntry() {
  const [content, setContent] = useState('');
  const [isTidying, setIsTidying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const MAX_CHARS = 1000;
  const charCount = content.length;
  const isNearLimit = charCount > 800;
  const isOverLimit = charCount > MAX_CHARS;

  // Check authentication status on component mount
  useEffect(() => {
    // Remove auth check - let middleware handle authentication
    console.log('New Entry: Loading form (auth handled by middleware)');
  }, [])
  const handleTidyUp = async () => {
    if (!content.trim()) return;
    
    setIsTidying(true);
    setError(null);
    
    try {
      // In a real app, you would call your AI API here
      // For now, we'll just capitalize the first letter of each sentence
      const response = await fetch('/api/ai/tidy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error('Failed to tidy up text');
      
      const { tidiedText } = await response.json();
      setContent(tidiedText);
    } catch (error) {
      console.error('Error tidying up text:', error);
      setError('Failed to tidy up text. Please try again.');
    } finally {
      setIsTidying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    // Validate character limit
    if (content.length > MAX_CHARS) {
      setError(`Content must be ${MAX_CHARS} characters or less. Currently ${content.length} characters.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use server action which has access to server-side session
      const result = await createEntry(content);
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      // Success - redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Smart Journal</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">New Journal Entry</h2>
                  
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                          What's on your mind?
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="content"
                            rows={10}
                            maxLength={MAX_CHARS}
                            className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md p-3 resize-none ${
                              isOverLimit 
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                                : isNearLimit 
                                  ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                            placeholder="Write your thoughts here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                          />
                          <div className="mt-2 flex justify-between items-center">
                            <div className={`text-sm ${
                              isOverLimit 
                                ? 'text-red-600 font-medium' 
                                : isNearLimit 
                                  ? 'text-yellow-600'
                                  : 'text-gray-500'
                            }`}>
                              {charCount}/{MAX_CHARS} characters
                            </div>
                            {isOverLimit && (
                              <div className="text-sm text-red-600">
                                Content exceeds character limit
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={handleTidyUp}
                          disabled={!content.trim() || isTidying || isSubmitting}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isTidying ? 'Tidying...' : 'Tidy Up with AI'}
                        </button>
                        
                        <div className="space-x-3">
                          <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!content.trim() || isSubmitting || isTidying || isOverLimit}
                            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isOverLimit
                                ? 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed'
                                : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                            }`}
                          >
                            {isSubmitting ? 'Saving...' : isOverLimit ? 'Too Long' : 'Save Entry'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
