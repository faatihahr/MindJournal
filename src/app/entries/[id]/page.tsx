'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEntry, updateEntry, deleteEntry } from './actions';
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX, FiMoon, FiSun, FiCalendar, FiTag, FiDownload } from 'react-icons/fi';
import { ExportModal } from '@/components/export-modal';
import { PreviewModal } from '@/components/preview-modal';

type JournalEntry = {
  id: string;
  title?: string;
  content: string;
  mood?: string;
  categories?: {
    name: string;
    color: string;
  };
  category_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

const moodOptions = [
  { mood: 'very_happy', emoji: '😄', label: 'Very Happy' },
  { mood: 'happy', emoji: '😊', label: 'Happy' },
  { mood: 'neutral', emoji: '😐', label: 'Neutral' },
  { mood: 'sad', emoji: '☹️', label: 'Sad' },
  { mood: 'very_sad', emoji: '😭', label: 'Very Sad' },
  { mood: 'excited', emoji: '🤩', label: 'Excited' },
  { mood: 'anxious', emoji: '😰', label: 'Anxious' },
  { mood: 'angry', emoji: '😠', label: 'Angry' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
  { mood: 'love', emoji: '🥰', label: 'Love' },
  { mood: 'confused', emoji: '😕', label: 'Confused' },
  { mood: 'grateful', emoji: '🙏', label: 'Grateful' },
  { mood: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { mood: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { mood: 'calm', emoji: '😌', label: 'Calm' },
  { mood: 'proud', emoji: '😎', label: 'Proud' },
];

const getMoodInfo = (moodEmoji: string) => {
  return moodOptions.find(option => option.emoji === moodEmoji);
};

export default function EntryDetail() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editMood, setEditMood] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTidiedResult, setShowTidiedResult] = useState(false);
  const [aiTidiedResult, setAiTidiedResult] = useState('');
  const [previewData, setPreviewData] = useState<{
    moodData: { emoji: string; label: string; intensity: number } | null;
    tags: string[];
    finalContent: string;
    finalTitle: string;
  }>({ moodData: null, tags: [], finalContent: '', finalTitle: '' });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    fetchEntry();
  }, [entryId]);

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const result = await getEntry(entryId);
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEntry(result.data);
        setEditContent(result.data.content);
        setEditTitle(result.data.title || '');
        setEditMood(result.data.mood || '😊');
        setEditTags(result.data.tags || []);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch entry');
    } finally {
      setLoading(false);
    }
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

  const handleEdit = () => {
    setIsEditing(true);
    if (entry) {
      setEditContent(entry.content);
      setEditTitle(entry.title || '');
      setEditMood(entry.mood || '😊');
      setEditTags(entry.tags || []);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (entry) {
      setEditContent(entry.content);
      setEditTitle(entry.title || '');
      setEditMood(entry.mood || '😊');
      setEditTags(entry.tags || []);
    }
  };

  const handleSave = async () => {
    if (!entry) return;

    setIsSaving(true);
    setError(null);

    try {
      let finalContent = editContent;
      let shouldShowTidyResult = false;

      // Get AI settings from localStorage
      const autoTidyUp = JSON.parse(localStorage.getItem('autoTidyUp') || 'false');
      const autoMoodDetection = JSON.parse(localStorage.getItem('autoMoodDetection') || 'true');
      const autoTagGeneration = JSON.parse(localStorage.getItem('autoTagGeneration') || 'true');

      // Tidy up content if enabled
      if (autoTidyUp) {
        try {
          const tidyResponse = await fetch('/api/ai/tidy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
          });

          if (tidyResponse.ok) {
            const { tidiedText } = await tidyResponse.json();
            if (tidiedText && tidiedText !== editContent) {
              finalContent = tidiedText;
              shouldShowTidyResult = true;
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
            console.log('Edit Mood API Response:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          } else {
            console.error('Edit Mood API Error:', moodResponse.status, await moodResponse.text());
          }
        } catch (error) {
          console.error('Edit Mood detection failed:', error);
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
            console.log('Edit Tags API Response:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          } else {
            console.error('Edit Tags API Error:', tagsResponse.status, await tagsResponse.text());
          }
        } catch (error) {
          console.error('Edit Tag generation failed:', error);
        }
      }

      // If tidying is enabled and there's a tidied version different from original, show tidied modal first
      if (shouldShowTidyResult) {
        setAiTidiedResult(finalContent);
        setShowTidiedResult(true);
        setIsSaving(false);
        return;
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
        finalTitle: editTitle,
      });
      setShowPreviewModal(true);
      setIsSaving(false);

    } catch (error: any) {
      console.error('Generate preview error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSaving(false);
    }
  };

  const handleContinueFromPreview = async () => {
    if (!entry) return;

    setShowPreviewModal(false);
    setIsSaving(true);

    try {
      const { moodData, tags, finalContent, finalTitle } = previewData;

      // Use default values if not detected
      const mood = moodData?.emoji || '😊';
      const moodIntensity = moodData?.intensity || 5;

      // Update entry with AI-detected mood and tags
      const result = await updateEntry(entry.id, finalTitle, finalContent, mood, tags, entry.category_id, moodIntensity);

      if (result.error) {
        setError(result.error);
      } else {
        // Refresh entry data
        await fetchEntry();
        setIsEditing(false);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update entry');
      setShowPreviewModal(false); // Close modal on error
    } finally {
      setIsSaving(false);
    }
  };

  // Accept tidied result and continue to preview
  const acceptTidiedResult = async () => {
    setShowTidiedResult(false);
    setIsSaving(true);

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
            console.log('Edit Mood API Response after tidy accept:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          }
        } catch (error) {
          console.error('Mood detection failed after tidy in edit:', error);
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
            console.log('Edit Tags API Response after tidy accept:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          }
        } catch (error) {
          console.error('Tag generation failed after tidy in edit:', error);
        }
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
        finalTitle: editTitle,
      });
      setShowPreviewModal(true);
      setIsSaving(false);

    } catch (error: any) {
      console.error('Preview generation after tidy accept in edit error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSaving(false);
    }
  };

  // Reject tidied result and continue to preview with original
  const rejectTidiedResult = async () => {
    setShowTidiedResult(false);
    setIsSaving(true);

    try {
      // Use the original content
      const finalContent = editContent;

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
            console.log('Edit Mood API Response after tidy reject:', moodApiData);
            if (moodApiData.label && moodApiData.emoji) {
              moodData = {
                emoji: moodApiData.emoji,
                label: moodApiData.label,
                intensity: moodApiData.intensity || 5,
              };
            }
          }
        } catch (error) {
          console.error('Mood detection failed after tidy in edit:', error);
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
            console.log('Edit Tags API Response after tidy reject:', tagsData);
            if (Array.isArray(tagsData.suggestedTags)) {
              tags = tagsData.suggestedTags;
            }
          }
        } catch (error) {
          console.error('Tag generation failed after tidy in edit:', error);
        }
      }

      // Set preview data and show preview modal
      setPreviewData({
        moodData,
        tags,
        finalContent,
        finalTitle: editTitle,
      });
      setShowPreviewModal(true);
      setIsSaving(false);

    } catch (error: any) {
      console.error('Preview generation after tidy reject in edit error:', error);
      setError(error.message || 'Failed to generate preview');
      setIsSaving(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !editTags.includes(trimmedTag) && editTags.length < 5) {
      setEditTags([...editTags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await deleteEntry(entry.id);
      
      if (result.error) {
        setError(result.error);
        setShowDeleteModal(false);
      } else {
        // Redirect to dashboard after successful deletion
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete entry');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
      }`}>
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className={`max-w-md w-full p-8 rounded-2xl text-center ${
            isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-gray-200"
          }`}>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Error
            </h2>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              {error || 'Entry not found'}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className={`mt-6 px-6 py-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? "bg-purple-600 text-white hover:bg-purple-700" 
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const moodInfo = getMoodInfo(entry.mood || '😊');

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
        : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
    }`}>
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/dashboard')} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <span className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>📔</span>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                MindJournal
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
              {isDarkMode ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className={`max-w-4xl mx-auto p-6 md:p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-800/50 border-slate-700" 
            : "bg-white/70 border-gray-200"
        }`}>
          {/* Entry Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{entry.mood || '😊'}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {entry.title || 'Untitled Entry'}
                  </h2>
                  {moodInfo && (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      isDarkMode ? "bg-purple-900/50 text-purple-200" : "bg-purple-100 text-purple-700"
                    }`}>
                      {moodInfo.emoji} {moodInfo.label}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className={`flex items-center space-x-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  <FiCalendar />
                  <span>{formatDate(entry.created_at)}</span>
                </div>
                {entry.updated_at !== entry.created_at && (
                  <div className={`flex items-center space-x-2 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    <span>Updated: {formatDate(entry.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/50" 
                        : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    }`}
                    title="Edit entry"
                  >
                    <FiEdit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? "text-green-400 hover:text-green-300 hover:bg-green-900/50" 
                        : "text-green-600 hover:text-green-800 hover:bg-green-50"
                    }`}
                    title="Export to PDF"
                  >
                    <FiDownload className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? "text-red-400 hover:text-red-300 hover:bg-red-900/50" 
                        : "text-red-600 hover:text-red-800 hover:bg-red-50"
                    }`}
                    title="Delete entry"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      isSaving 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:scale-105'
                    } bg-gradient-to-r from-purple-600 to-pink-600 text-white`}
                  >
                    <FiSave />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDarkMode 
                        ? "text-gray-400 hover:text-gray-300 hover:bg-slate-700" 
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags and Categories */}
          {(entry.tags && entry.tags.length > 0) || entry.categories && (
            <div className="mb-6">
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isDarkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <FiTag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {entry.categories && (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Category:
                  </span>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: entry.categories.color,
                      color: 'white'
                    }}
                  >
                    {entry.categories.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-base ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="Enter title..."
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className={`w-full px-4 py-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    placeholder="What's on your mind?"
                  />
                </div>

                {/* Tags Input */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Tags (max 5)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editTags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isDarkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <FiTag className="w-3 h-3 mr-1" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className={`ml-2 hover:text-red-500 transition-colors duration-200`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 text-base ${
                        isDarkMode
                          ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="Add a tag..."
                      disabled={editTags.length >= 5}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={!tagInput.trim() || editTags.length >= 5}
                      className={`px-6 py-3 rounded-lg transition-all duration-200 text-base font-medium ${
                        editTags.length >= 5 || !tagInput.trim()
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-105'
                      } bg-gradient-to-r from-purple-600 to-pink-600 text-white`}
                    >
                      Add
                    </button>
                  </div>
                  {editTags.length >= 5 && (
                    <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Maximum 5 tags reached
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`prose prose-lg max-w-none ${
                isDarkMode ? "prose-invert" : ""
              }`}>
                <p className={`whitespace-pre-wrap leading-relaxed ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}>
                  {entry.content}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? "bg-red-900/20 border-red-700 text-red-300" 
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {error}
            </div>
          )}
        </div>
      </main>

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
                AI Tidied Result (Edit)
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
                {editContent}
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
                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
            isDarkMode
              ? "bg-slate-800/90 border-slate-700"
              : "bg-white/90 border-gray-200"
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Delete Entry
            </h3>
            <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 bg-red-600 text-white hover:bg-red-700 ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entry={entry}
        exportType="single"
      />

      {/* AI Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onContinue={handleContinueFromPreview}
        isDarkMode={isDarkMode}
        moodData={previewData.moodData}
        tags={previewData.tags}
        isSubmitting={isSaving}
      />
    </div>
  );
}
