'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { createEntry } from './actions';
import { FiMic, FiMicOff, FiEdit3, FiSun, FiMoon, FiFileText } from 'react-icons/fi';
import { PreviewModal } from '@/components/preview-modal';
import { TemplatePicker } from '@/components/template-picker';

export default function NewEntry() {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiTidiedResult, setAiTidiedResult] = useState('');
  const [showTidiedResult, setShowTidiedResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<{
    moodData: { emoji: string; label: string; intensity: number } | null;
    tags: string[];
    finalContent: string;
  }>({ moodData: null, tags: [], finalContent: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('id-ID');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  const MAX_CHARS = 1000;
  const charCount = content.length;
  const isNearLimit = charCount > 800;
  const isOverLimit = charCount > MAX_CHARS;

  // Check authentication status on component mount
  useEffect(() => {
    // Remove auth check - let middleware handle authentication
    console.log('New Entry: Loading form (auth handled by middleware)');

    // Initialize dark mode
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(prev => prev + finalTranscript);
        setContent(prev => prev + finalTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported');
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    // Update language before starting
    recognitionRef.current.lang = selectedLanguage;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      setTranscript('');
      setError(null);
    }
  };

  const handleEditTranscript = () => {
    setIsEditing(!isEditing);
  };

  const saveEditedTranscript = () => {
    setContent(transcript);
    setIsEditing(false);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSelectTemplate = (template: string) => {
    setContent(template);
    setShowTemplatePicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (content.length > MAX_CHARS) {
      setError(`Content must be ${MAX_CHARS} characters or less. Currently ${content.length} characters.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalContent = content;
      let shouldShowTidyResult = false;

      // Get AI settings
      const autoTidyUp = JSON.parse(localStorage.getItem('autoTidyUp') || 'false');
      const autoMoodDetection = JSON.parse(localStorage.getItem('autoMoodDetection') || 'false');
      const autoTagGeneration = JSON.parse(localStorage.getItem('autoTagGeneration') || 'false');

      // Tidy up content if enabled
      if (autoTidyUp) {
        try {
          const tidyResponse = await fetch('/api/ai/tidy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });

          if (tidyResponse.ok) {
            const { tidiedText } = await tidyResponse.json();
            if (tidiedText && tidiedText !== content) {
              finalContent = tidiedText;
              shouldShowTidyResult = true;
              setAiTidiedResult(tidiedText);
            }
          }
        } catch (error) {
          console.error('Tidy up failed:', error);
        }
      }

      // Default values
      let moodData: { emoji: string; label: string; intensity: number } | null = null;
      let tags: string[] = [];

      // Detect mood if enabled
      if (autoMoodDetection) {
        try {
          const moodResponse = await fetch('/api/ai/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (moodResponse.ok) {
            const moodApiData = await moodResponse.json();
            console.log('Mood API Response:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          } else {
            console.error('Mood API Error:', moodResponse.status, await moodResponse.text());
          }
        } catch (error) {
          console.error('Mood detection failed:', error);
        }
      }

      // Detect tags if enabled
      if (autoTagGeneration) {
        try {
          const tagsResponse = await fetch('/api/ai/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            console.log('Tags API Response:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          } else {
            console.error('Tags API Error:', tagsResponse.status, await tagsResponse.text());
          }
        } catch (error) {
          console.error('Tag generation failed:', error);
        }
      }

      // If tidying is enabled and there's a tidied version different from original, show tidied modal first
      if (shouldShowTidyResult) {
        setShowTidiedResult(true);
        setIsSubmitting(false);
        return;
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
      });
      setShowPreviewModal(true);
      setIsSubmitting(false);

    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSubmitting(false);
    }
  };

  const handleContinueFromPreview = async () => {
    setShowPreviewModal(false);
    setIsSubmitting(true);

    try {
      const { moodData, tags, finalContent } = previewData;

      // Use default values if not detected
      const mood = moodData?.emoji || '😊';
      const moodIntensity = moodData?.intensity || 5;

      // Generate title from content
      const finalTitle = generateTitleFromContent(finalContent);

      // Debug logs
      console.log('Creating Entry with:', {
        title: finalTitle,
        content: finalContent,
        mood,
        tags,
        intensity: moodIntensity,
      });

      // Create entry with detected mood and tags
      const result = await createEntry(finalTitle, finalContent, mood, tags, moodIntensity);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success - set flag and redirect to dashboard
      sessionStorage.setItem('justCreatedEntry', 'true');
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to create entry');
      setIsSubmitting(false);
      setShowPreviewModal(false); // Close modal on error
    }
  };

  // Accept tidied result and continue to preview
  const acceptTidiedResult = async () => {
    setShowTidiedResult(false);
    setIsSubmitting(true);

    try {
      // Use the tidied content
      const finalContent = aiTidiedResult;

      // Generate AI insights with tidied content
      let moodData: { emoji: string; label: string; intensity: number } | null = null;
      let tags: string[] = [];

      const autoMoodDetection = JSON.parse(localStorage.getItem('autoMoodDetection') || 'false');
      const autoTagGeneration = JSON.parse(localStorage.getItem('autoTagGeneration') || 'false');

      // Detect mood if enabled
      if (autoMoodDetection) {
        try {
          const moodResponse = await fetch('/api/ai/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (moodResponse.ok) {
            const moodApiData = await moodResponse.json();
            console.log('Mood API Response after tidy accept:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          }
        } catch (error) {
          console.error('Mood detection failed after tidy:', error);
        }
      }

      // Detect tags if enabled
      if (autoTagGeneration) {
        try {
          const tagsResponse = await fetch('/api/ai/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            console.log('Tags API Response after tidy accept:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          }
        } catch (error) {
          console.error('Tag generation failed after tidy:', error);
        }
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
      });
      setShowPreviewModal(true);
      setIsSubmitting(false);

    } catch (error: any) {
      console.error('Preview generation after tidy error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSubmitting(false);
    }
  };

  // Reject tidied result and continue to preview with original
  const rejectTidiedResult = async () => {
    setShowTidiedResult(false);
    setIsSubmitting(true);

    try {
      // Use the original content
      const finalContent = content;

      // Generate AI insights with original content
      let moodData: { emoji: string; label: string; intensity: number } | null = null;
      let tags: string[] = [];

      const autoMoodDetection = JSON.parse(localStorage.getItem('autoMoodDetection') || 'false');
      const autoTagGeneration = JSON.parse(localStorage.getItem('autoTagGeneration') || 'false');

      // Detect mood if enabled
      if (autoMoodDetection) {
        try {
          const moodResponse = await fetch('/api/ai/mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (moodResponse.ok) {
            const moodApiData = await moodResponse.json();
            console.log('Mood API Response after tidy reject:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          }
        } catch (error) {
          console.error('Mood detection failed after tidy:', error);
        }
      }

      // Detect tags if enabled
      if (autoTagGeneration) {
        try {
          const tagsResponse = await fetch('/api/ai/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: finalContent }),
          });

          if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            console.log('Tags API Response after tidy reject:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          }
        } catch (error) {
          console.error('Tag generation failed after tidy:', error);
        }
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
      });
      setShowPreviewModal(true);
      setIsSubmitting(false);

    } catch (error: any) {
      console.error('Preview generation after tidy error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSubmitting(false);
    }
  };

  const generateTitleFromContent = (content: string) => {
    const words = content.trim().split(' ');
    if (words.length <= 5) return content;

    // Take first 5 words and add "..."
    return words.slice(0, 5).join(' ') + '...';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? "bg-linear-to-br from-slate-900 via-purple-900 to-slate-900"
        : "bg-linear-to-br from-purple-50 via-pink-50 to-indigo-50"
    }`}>
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <span className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>📔</span>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                New Entry
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-slate-800 text-yellow-400 hover:bg-slate-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <FiSun className="text-xl" />
              ) : (
                <FiMoon className="text-xl" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* AI Tidied Result Modal */}
      {showTidiedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            isDarkMode
              ? "bg-slate-800/90 border-slate-700"
              : "bg-white/90 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                AI Tidied Result
              </h3>
              <button
                onClick={rejectTidiedResult}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`mb-4 p-4 rounded-xl border ${
              isDarkMode
                ? "bg-slate-700/50 border-slate-600"
                : "bg-gray-50 border-gray-200"
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}>
                Original text:
              </p>
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                {content}
              </p>
            </div>

            <div className={`mb-6 p-4 rounded-xl border ${
              isDarkMode
                ? "bg-purple-900/20 border-purple-700"
                : "bg-purple-50 border-purple-200"
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                isDarkMode ? "text-purple-300" : "text-purple-700"
              }`}>
                AI improved version:
              </p>
              <p className={`text-sm leading-relaxed ${
                isDarkMode ? "text-gray-200" : "text-gray-700"
              }`}>
                {aiTidiedResult}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={acceptTidiedResult}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
              >
                Use This Version
              </button>
              <button
                onClick={rejectTidiedResult}
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Keep Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={`max-w-4xl mx-auto p-4 sm:p-6 md:p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white/70 border-gray-200"
        }`}>
          {/* Content */}
          <div className="mb-8">
            <label htmlFor="content" className={`block text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              What's on your mind?
            </label>
            <div className="relative">
              <div className="flex flex-col space-y-3">
                {/* Template Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTemplatePicker(true)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode
                        ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                        : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                    }`}
                    title="Use journal template"
                  >
                    <FiFileText className="text-base" />
                    <span>Use Template</span>
                  </button>
                </div>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 backdrop-blur-sm"
                      : "bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500 backdrop-blur-sm"
                  }`}
                  placeholder="Share your thoughts, feelings, or experiences..."
                  rows={8}
                />
                <div className={`text-sm ${
                  isNearLimit ? (isOverLimit ? "text-red-500" : "text-yellow-500") :
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Character Count: {charCount}/{MAX_CHARS}
                </div>
              </div>
            </div>
            {isOverLimit && (
              <p className="mt-2 text-sm text-red-500">
                Content exceeds maximum character limit
              </p>
            )}

            {/* Recording Status & Transcript (only show when recording) */}
            {isRecording && (
              <div className={`mt-4 p-4 rounded-xl border transition-all duration-300 ${
                isDarkMode
                  ? "bg-slate-700/50 border-purple-600"
                  : "bg-white/70 border-purple-200"
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${
                    isDarkMode ? "text-purple-300" : "text-purple-700"
                  }`}>
                    🎤 Recording in {selectedLanguage === 'id-ID' ? 'Bahasa Indonesia' : 'English'}... Speak now
                  </span>
                </div>
              </div>
            )}

            {transcript && !isRecording && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${
                    isDarkMode ? "text-purple-300" : "text-purple-900"
                  }`}>
                    📝 Voice transcript:
                  </span>
                  <div className="flex space-x-2">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={handleEditTranscript}
                        className={`flex items-center space-x-1 text-sm font-medium hover:underline transition-all duration-200 ${
                          isDarkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"
                        }`}
                      >
                        <FiEdit3 className="text-base" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={saveEditedTranscript}
                      className={`text-sm font-medium px-3 py-1 rounded-lg transition-all duration-200 ${
                        isDarkMode
                          ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      Add to Content
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className={`w-full p-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                          : "bg-white/70 border-purple-300 text-gray-900 placeholder-gray-500"
                      }`}
                      rows={3}
                      placeholder="Edit transcript..."
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={saveEditedTranscript}
                        className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditTranscript}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                          isDarkMode
                            ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl border transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700/50 border-purple-600 text-gray-200"
                      : "bg-white/70 border-purple-200 text-gray-700"
                  }`}>
                    <p className="text-sm leading-relaxed">{transcript}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t transition-all duration-200 ${
            isDarkMode
              ? "border-slate-700"
              : "border-gray-200"
          }`}>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 rounded-xl w-full sm:w-auto ${
                  isDarkMode
                    ? "text-gray-300 hover:text-white hover:bg-slate-700/50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting || isOverLimit}
                className={`px-8 py-3 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full sm:w-auto ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isOverLimit
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Create Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* AI Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onContinue={handleContinueFromPreview}
        isDarkMode={isDarkMode}
        moodData={previewData.moodData}
        tags={previewData.tags}
        isSubmitting={isSubmitting}
      />

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelectTemplate={handleSelectTemplate}
          onClose={() => setShowTemplatePicker(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
