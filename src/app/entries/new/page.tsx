'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { createEntry } from './actions';
import { addCategory } from './category-actions';
import { FiMic, FiMicOff, FiEdit3, FiSun, FiMoon } from 'react-icons/fi';

export default function NewEntry() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    color: string;
  }>>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    
    // Load categories
    loadCategories();
    
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
  const handleTidyUp = async () => {
    if (!content.trim()) return;
    
    setIsTidying(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/tidy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error('Failed to tidy up text');
      
      const { tidiedText } = await response.json();
      setAiResult(tidiedText);
      setEditedAiResult(tidiedText);
      setShowAiResult(true);
      setIsEditingAiResult(false);
    } catch (error) {
      console.error('Error tidying up text:', error);
      setError('Failed to tidy up text. Please try again.');
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
  
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setCategories(data || []);
      // Set default category to 'Personal' if available
      const personalCategory = data?.find((cat: {
        id: string;
        name: string;
        color: string;
      }) => cat.name === 'Personal');
      if (personalCategory) {
        setSelectedCategory(personalCategory.id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
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
  
  const addNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const result = await addCategory(newCategoryName.trim(), newCategoryColor);
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      if (result.data) {
        setCategories([...categories, result.data]);
        setSelectedCategory(result.data.id);
        setNewCategoryName('');
        setNewCategoryColor('#6366f1');
        setShowAddCategory(false);
      }
    } catch (error: any) {
      console.error('Error adding category:', error);
      setError(error.message || 'Failed to add category');
    }
  };
  
  const predefinedColors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'
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
      const result = await createEntry(title, content, selectedMood, selectedCategory, tags, moodIntensity);
      
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
                onClick={() => router.back()} 
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
          {/* How are you feeling? */}
          <div className="mb-8">
            <label className={`block text-lg font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              How are you feeling?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {[
                { emoji: '😊', mood: 'happy', label: 'Happy' },
                { emoji: '😢', mood: 'sad', label: 'Sad' },
                { emoji: '😡', mood: 'angry', label: 'Angry' },
                { emoji: '😴', mood: 'tired', label: 'Tired' },
                { emoji: '🤗', mood: 'excited', label: 'Excited' },
                { emoji: '😎', mood: 'confident', label: 'Confident' },
                { emoji: '🤔', mood: 'thoughtful', label: 'Thoughtful' },
                { emoji: '😰', mood: 'anxious', label: 'Anxious' }
              ].map((item, index) => (
                <button
                  key={item.mood}
                  onClick={() => setSelectedMood(item.emoji)}
                  className={`p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedMood === item.emoji 
                      ? isDarkMode
                        ? 'border-purple-500 bg-purple-900/50 shadow-lg'
                        : 'border-purple-500 bg-purple-50 shadow-lg'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white/50'
                  }`}
                  title={item.label}
                >
                  <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                </button>
              ))}
            </div>
            <p className={`mt-3 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Current mood: <span className="font-semibold">{selectedMood}</span>
            </p>
            
            {/* Mood Intensity */}
            <div className="mt-4">
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
                  onChange={(e) => setMoodIntensity(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>High</span>
              </div>
            </div>
          </div>

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

          {/* Category Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="category" className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/50"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                + Add Category
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {categories.map((category: {
                id: string;
                name: string;
                color: string;
              }) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    selectedCategory === category.id
                      ? 'border-purple-500 shadow-lg'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white/50'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id 
                      ? `${category.color}20` 
                      : undefined
                  }}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {category.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`w-full max-w-md p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                isDarkMode 
                  ? "bg-slate-800/90 border-slate-700" 
                  : "bg-white/90 border-gray-200"
              }`}>
                <h3 className={`text-xl font-bold mb-4 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  Add New Category
                </h3>
                
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name..."
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    maxLength={50}
                  />
                </div>
                
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Category Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-full h-10 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                          newCategoryColor === color
                            ? 'border-purple-500 shadow-lg'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className={`w-full h-10 rounded-lg cursor-pointer ${
                        isDarkMode ? "bg-slate-700" : "bg-gray-100"
                      }`}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                      setNewCategoryColor('#6366f1');
                    }}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 ${
                      isDarkMode
                        ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addNewCategory}
                    disabled={!newCategoryName.trim()}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      !newCategoryName.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                  >
                    Add Category
                  </button>
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

          {/* Your Thoughts */}
          <div className="mb-8">
            <label htmlFor="content" className={`block text-lg font-semibold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Your Thoughts
            </label>
            <div className="relative">
              <textarea
                id="content"
                rows={10}
                maxLength={MAX_CHARS}
                className={`w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                  isOverLimit 
                    ? 'border-red-500 focus:ring-red-500' 
                    : isDarkMode
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 backdrop-blur-sm'
                      : 'bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500 backdrop-blur-sm'
                }`}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className={`absolute bottom-4 right-4 text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {charCount}/{MAX_CHARS}
              </div>
            </div>
          </div>

          {/* Voice Input Section - Dashboard styling */}
          <div className={`mb-8 p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode 
              ? "bg-purple-900/30 border-purple-700" 
              : "bg-purple-100/50 border-purple-200"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? "text-purple-300" : "text-purple-900"
              }`}>
                Voice Input
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Language Selector - Dashboard styling */}
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={`text-sm border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 w-full sm:w-auto ${
                    isDarkMode
                      ? "bg-slate-700/50 border-slate-600 text-white backdrop-blur-sm"
                      : "bg-white/70 border-purple-300 text-gray-900 backdrop-blur-sm"
                  }`}
                  disabled={isRecording}
                >
                  <option value="id-ID">🇮🇩 Bahasa Indonesia</option>
                  <option value="en-US">🇺🇸 English</option>
                </select>
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 w-full sm:w-auto ${
                    isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <FiMicOff className="text-lg" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <FiMic className="text-lg" />
                      <span>Start Recording</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {isRecording && (
              <div className={`flex items-center space-x-3 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                isDarkMode
                  ? "bg-slate-700/50 border-purple-600"
                  : "bg-white/70 border-purple-200"
              }`}>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${
                  isDarkMode ? "text-purple-300" : "text-purple-700"
                }`}>
                  Recording in {selectedLanguage === 'id-ID' ? 'Bahasa Indonesia' : 'English'}... Speak now
                </span>
              </div>
            )}
            
            {transcript && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${
                    isDarkMode ? "text-purple-300" : "text-purple-900"
                  }`}>
                    Transcript:
                  </span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleEditTranscript}
                      className={`flex items-center space-x-2 text-sm font-medium hover:underline transition-all duration-200 hover:scale-105 ${
                        isDarkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"
                      }`}
                    >
                      <FiEdit3 className="text-base" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className={`w-full p-4 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                        isDarkMode
                          ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 backdrop-blur-sm"
                          : "bg-white/70 border-purple-300 text-gray-900 placeholder-gray-500 backdrop-blur-sm"
                      }`}
                      rows={4}
                      placeholder="Edit your transcript..."
                    />
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={saveEditedTranscript}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditTranscript}
                        className={`px-6 py-2 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
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
                  <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
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
            <button
              type="button"
              onClick={handleTidyUp}
              disabled={!content.trim() || isTidying || isSubmitting}
              className={`flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl w-full sm:w-auto ${
                isDarkMode
                  ? "text-gray-300 hover:text-white hover:bg-slate-700/50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              {isTidying ? (
                <>
                  <div className={`w-4 h-4 border-2 ${
                    isDarkMode 
                      ? 'border-purple-400 border-t-transparent' 
                      : 'border-purple-600 border-t-transparent'
                  } rounded-full animate-spin`}></div>
                  <span>AI is tidying up your notes...</span>
                </>
              ) : (
                <>
                  <span>Tidy Up with AI</span>
                </>
              )}
            </button>
            
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
