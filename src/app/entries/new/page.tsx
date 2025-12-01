'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { createEntry } from './actions';
import { FiMic, FiMicOff, FiEdit3, FiSun, FiMoon } from 'react-icons/fi';

export default function NewEntry() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [isMoodAuto, setIsMoodAuto] = useState(false);
  const [isDetectingMood, setIsDetectingMood] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isTidying, setIsTidying] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [showAiResult, setShowAiResult] = useState(false);
  const [isEditingAiResult, setIsEditingAiResult] = useState(false);
  const [editedAiResult, setEditedAiResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('id-ID');
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [aiDetectedMood, setAiDetectedMood] = useState<string>('');
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

  const handleDetectMood = async () => {
    if (!content.trim() || isDetectingMood) return;

    setIsDetectingMood(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to detect mood');

      const data = await response.json();

      if (data?.emoji) {
        setSelectedMood(data.emoji);
        if (typeof data.intensity === 'number' && data.intensity >= 1 && data.intensity <= 10) {
          setMoodIntensity(data.intensity);
        }
        setIsMoodAuto(true);
      }
    } catch (error) {
      console.error('Error detecting mood:', error);
      setError('Failed to detect mood automatically. You can still choose it manually.');
    } finally {
      setIsDetectingMood(false);
    }
  };

  const handleTidyUp = async () => {
    if (!content.trim()) return;
    
    setIsTidying(true);
    setError(null);
    
    try {
      // Run tidy up, mood analysis, and auto-tagging in parallel
      const [tidyResponse, moodResponse, tagsResponse] = await Promise.all([
        fetch('/api/ai/tidy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }),
        fetch('/api/ai/mood', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }),
        fetch('/api/ai/tags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        })
      ]);
      
      if (!tidyResponse.ok) throw new Error('Failed to tidy up text');
      if (!moodResponse.ok) throw new Error('Failed to detect mood');
      if (!tagsResponse.ok) throw new Error('Failed to generate tags');
      
      const { tidiedText } = await tidyResponse.json();
      const moodData = await moodResponse.json();
      const tagsData = await tagsResponse.json();
      
      // Set tidied text
      setAiResult(tidiedText);
      setEditedAiResult(tidiedText);
      
      // Set mood data
      if (moodData?.emoji) {
        console.log('Setting mood - AI detected:', moodData.emoji);
        setSelectedMood(moodData.emoji);
        setAiDetectedMood(moodData.emoji);
        if (typeof moodData.intensity === 'number' && moodData.intensity >= 1 && moodData.intensity <= 10) {
          setMoodIntensity(moodData.intensity);
        }
        setIsMoodAuto(true);
        // Debug: Verify both states are set
        setTimeout(() => {
          console.log('After setting - selectedMood:', selectedMood);
          console.log('After setting - aiDetectedMood:', aiDetectedMood);
        }, 100);
      }
      
      // Set tag suggestions
      if (tagsData?.suggestedTags && Array.isArray(tagsData.suggestedTags)) {
        setAiSuggestedTags(tagsData.suggestedTags);
        setShowTagSuggestions(true);
      }
      
      setShowAiResult(true);
      setIsEditingAiResult(false);
    } catch (error) {
      console.error('Error processing with AI:', error);
      setError('Failed to process with AI. Please try again.');
    } finally {
      setIsTidying(false);
    }
  };

  const handleAcceptAiResult = () => {
    setContent(aiResult);
    setShowAiResult(false);
    setAiResult('');
    setEditedAiResult('');
  };

  const handleEditAiResult = () => {
    setIsEditingAiResult(true);
  };

  const handleSaveEditedAiResult = () => {
    setAiResult(editedAiResult);
    setIsEditingAiResult(false);
  };

  const handleCancelAiResult = () => {
    setShowAiResult(false);
    setAiResult('');
    setEditedAiResult('');
    setIsEditingAiResult(false);
  };
  
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
  
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const moodOptions = [
    { mood: 'very_happy', emoji: '😄', definition: 'Very Happy: Feeling extremely joyful and elated' },
    { mood: 'happy', emoji: '😊', definition: 'Happy: Feeling pleased and content' },
    { mood: 'neutral', emoji: '😐', definition: 'Neutral: Feeling neither happy nor sad' },
    { mood: 'sad', emoji: '☹️', definition: 'Sad: Feeling unhappy or sorrowful' },
    { mood: 'very_sad', emoji: '😭', definition: 'Very Sad: Feeling extremely upset or devastated' },
    { mood: 'excited', emoji: '🤩', definition: 'Excited: Feeling enthusiastic and eager' },
    { mood: 'anxious', emoji: '😰', definition: 'Anxious: Feeling worried or nervous' },
    { mood: 'angry', emoji: '😠', definition: 'Angry: Feeling annoyed or irritated' },
    { mood: 'tired', emoji: '😴', definition: 'Tired: Feeling weary or exhausted' },
    { mood: 'love', emoji: '🥰', definition: 'Love: Feeling deep affection and care' },
    { mood: 'confused', emoji: '😕', definition: 'Confused: Feeling unclear or uncertain' },
    { mood: 'grateful', emoji: '🙏', definition: 'Grateful: Feeling thankful and appreciative' },
    { mood: 'hopeful', emoji: '🌟', definition: 'Hopeful: Feeling optimistic about the future' },
    { mood: 'frustrated', emoji: '😤', definition: 'Frustrated: Feeling annoyed by difficulties' },
    { mood: 'calm', emoji: '😌', definition: 'Calm: Feeling peaceful and relaxed' },
    { mood: 'proud', emoji: '😎', definition: 'Proud: Feeling satisfied about achievements' },
  ];
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) {
      setError('Title and content are required');
      return;
    }
    
    // Validate character limit
    if (content.length > MAX_CHARS) {
      setError(`Content must be ${MAX_CHARS} characters or less. Currently ${content.length} characters.`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use server action which has access to server-side session
      const result = await createEntry(title, content, selectedMood, tags, moodIntensity);
      
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

      {/* AI Result Modal */}
      {showAiResult && (
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
                onClick={handleCancelAiResult}
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
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${
                  isDarkMode ? "text-purple-300" : "text-purple-700"
                }`}>
                  AI improved version:
                </p>
                {!isEditingAiResult && (
                  <button
                    onClick={handleEditAiResult}
                    className={`flex items-center space-x-1 text-sm font-medium hover:underline transition-all duration-200 ${
                      isDarkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"
                    }`}
                  >
                    <FiEdit3 className="text-base" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              
              {isEditingAiResult ? (
                <textarea
                  value={editedAiResult}
                  onChange={(e) => setEditedAiResult(e.target.value)}
                  className={`w-full p-4 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  rows={8}
                  placeholder="Edit AI result..."
                />
              ) : (
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}>
                  {aiResult}
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              {isEditingAiResult ? (
                <>
                  <button
                    onClick={handleSaveEditedAiResult}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingAiResult(false)}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Cancel Edit
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleAcceptAiResult}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
                  >
                    Accept & Use This
                  </button>
                  <button
                    onClick={handleCancelAiResult}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Keep Original
                  </button>
                </>
              )}
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
          {/* Title */}
          <div className="mb-8">
            <label htmlFor="title" className={`block text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                isDarkMode
                  ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 backdrop-blur-sm"
                  : "bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500 backdrop-blur-sm"
              }`}
              placeholder="Give your entry a title..."
            />
          </div>

          {/* Content */}
          <div className="mb-8">
            <label htmlFor="content" className={`block text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              What's on your mind?
            </label>
            <div className="relative">
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
              <div className={`absolute bottom-3 right-3 text-sm ${
                isNearLimit ? (isOverLimit ? "text-red-500" : "text-yellow-500") : 
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                {charCount}/{MAX_CHARS}
              </div>
              {/* Voice Controls */}
              <div className="absolute bottom-3 right-20 flex items-center space-x-2">
                {/* Language Selector */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`text-xs border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700/50 border-slate-600 text-white"
                      : "bg-white/70 border-gray-300 text-gray-900"
                  }`}
                  disabled={isRecording}
                >
                  <option value="id-ID">🇮🇩</option>
                  <option value="en-US">🇺🇸</option>
                </select>
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg animate-pulse'
                      : isDarkMode
                        ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                  title="Voice input"
                >
                  {isRecording ? (
                    <FiMicOff className="text-sm" />
                  ) : (
                    <FiMic className="text-sm" />
                  )}
                </button>
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
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
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

          {/* AI Enhancement Buttons */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleTidyUp}
                disabled={!content.trim() || isTidying}
                className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
              >
                {isTidying ? 'AI Processing...' : '✨ Tidy Up, Analyze Mood & Tags'}
              </button>
            </div>
            <p className={`text-xs text-center mt-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              AI will improve your writing, detect your mood, and suggest relevant tags automatically
            </p>
          </div>

          {/* AI Detected Mood (shown after tidy up) */}
          {(isMoodAuto || selectedMood !== '😊' || moodIntensity !== 5) && (
            <div className={`mb-8 p-4 rounded-xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-purple-900/20 border-purple-700" 
                : "bg-purple-50 border-purple-200"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  🤖 AI Detected Mood
                </h3>
                {isMoodAuto && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isDarkMode ? "bg-purple-800/50 text-purple-300" : "bg-purple-200 text-purple-700"
                  }`}>
                    Auto-detected
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Mood Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    How are you feeling?
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {moodOptions.map((item) => {
                      const isAISelected = aiDetectedMood === item.emoji;
                      const isSelected = selectedMood === item.emoji;
                      
                      // Debug: Check if this is the AI detected mood
                      if (isAISelected) {
                        console.log('Found AI mood in UI:', item.emoji, 'isAISelected:', isAISelected, 'isSelected:', isSelected);
                      }
                      
                      return (
                      <div key={item.mood} className="relative group">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMood(item.emoji);
                            setIsMoodAuto(false);
                          }}
                          className={`p-2 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                            aiDetectedMood === item.emoji
                              ? 'border-purple-500 bg-purple-500 text-white shadow-lg'
                              : selectedMood === item.emoji
                                ? isDarkMode
                                  ? 'border-purple-500 bg-purple-900/50 shadow-lg'
                                  : 'border-purple-500 bg-purple-50 shadow-lg'
                                : isDarkMode
                                  ? 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white/50'
                          }`}
                        >
                          <span className="text-xl">{item.emoji}</span>
                        </button>
                        {/* Tooltip */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 ${
                          isDarkMode 
                            ? 'bg-slate-700 text-white border border-slate-600' 
                            : 'bg-gray-800 text-white border border-gray-600'
                        }`}>
                          <div className="font-medium">{item.emoji} {item.mood.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                          <div className="text-gray-300 text-xs mt-1">{item.definition.split(':')[1]?.trim() || item.definition}</div>
                          {/* Arrow */}
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 ${
                            isDarkMode ? 'bg-slate-700 border-l border-t border-slate-600' : 'bg-gray-800 border-l border-t border-gray-600'
                          }`}></div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Mood Intensity */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Mood Intensity: <span className="font-semibold">{moodIntensity}/10</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Low</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodIntensity}
                      onChange={(e) => {
                        setMoodIntensity(Number(e.target.value));
                        setIsMoodAuto(false);
                      }}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>High</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-8">
            <label htmlFor="tags" className={`block text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Tags <span className={`text-sm font-normal ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>(max 5)</span>
            </label>
            <div className={`p-4 rounded-xl border transition-all duration-200 ${
              isDarkMode
                ? "bg-slate-700/50 border-slate-600"
                : "bg-white/70 border-gray-200"
            }`}>
              {/* Tags Display */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        isDarkMode
                          ? "bg-purple-900/50 text-purple-300"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className={`ml-1 hover:text-red-500 transition-colors duration-200 ${
                          isDarkMode ? "text-purple-300" : "text-purple-700"
                        }`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Tag Input */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="Add tags (press Enter or comma)"
                  disabled={tags.length >= 5}
                  className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-600/50 border-slate-500 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${tags.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 5}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    !tagInput.trim() || tags.length >= 5
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Add
                </button>
              </div>
              {tags.length >= 5 && (
                <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Maximum 5 tags reached
                </p>
              )}
            </div>
          </div>

          {/* AI Tag Suggestions */}
          {showTagSuggestions && aiSuggestedTags.length > 0 && (
            <div className={`mb-8 p-4 rounded-xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-purple-900/20 border-purple-700" 
                : "bg-purple-50 border-purple-200"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  🏷️ AI Suggested Tags
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDarkMode ? "bg-purple-800/50 text-purple-300" : "bg-purple-200 text-purple-700"
                }`}>
                  AI-generated
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {aiSuggestedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (!tags.includes(tag) && tags.length < 5) {
                          setTags([...tags, tag]);
                        }
                      }}
                      disabled={tags.includes(tag)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                        tags.includes(tag)
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50 border border-purple-600'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                      }`}
                    >
                      {tags.includes(tag) ? '✓ ' : ''}{tag}
                    </button>
                  ))}
                </div>
                <p className={`text-xs ${
                  isDarkMode ? "text-purple-300" : "text-purple-700"
                }`}>
                  Click to add tags to your entry (max 5 tags total)
                </p>
              </div>
            </div>
          )}

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
                disabled={!content.trim() || !title.trim() || isSubmitting || isTidying || isOverLimit}
                className={`px-8 py-3 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full sm:w-auto ${
                  isSubmitting || isTidying
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isOverLimit
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : isTidying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>AI Processing...</span>
                  </div>
                ) : (
                  'Create Entry'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
