'use client';

import { useEffect, useState } from 'react';
import { getUserEntries } from './actions';
import { getMoodStats } from './stats-actions';
import { DeleteButton } from './delete-button';
import { FiBook, FiMoon, FiSun, FiSettings, FiUser, FiCalendar, FiTrendingUp, FiHeart, FiSearch, FiFilter, FiStar, FiChevronRight, FiMessageCircle, FiPlus, FiLogOut, FiChevronDown } from 'react-icons/fi';

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

const getMoodInfo = (moodEmoji: string) => {
  return moodOptions.find(option => option.emoji === moodEmoji);
};

export default function Dashboard() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [moodStats, setMoodStats] = useState<{ averageIntensity: number; totalMoods: number } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

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

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const result = await getUserEntries();
      
      if (result.error) {
        setError(result.error);
      } else {
        setEntries(result.data as JournalEntry[]);
      }
      
      // Fetch mood stats
      const moodResult = await getMoodStats();
      if (!moodResult.error && moodResult.averageIntensity !== undefined) {
        setMoodStats({
          averageIntensity: moodResult.averageIntensity,
          totalMoods: moodResult.totalMoods || 0
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = () => {
    fetchEntries();
  };

  const handleLogout = async () => {
    try {
      // Clear any stored user data
      localStorage.removeItem('theme');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      // Call the signout endpoint to properly logout from Supabase
      await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (error) {
      // Even if there's an error, still redirect to login
      console.error('Logout error:', error);
      window.location.href = '/auth/login';
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen && !(event.target as Element).closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileDropdownOpen]);

  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Calculate statistics from actual data
  const calculateStats = () => {
    const now = new Date();
    
    // Fix week calculation - start from Monday, end on Sunday
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);
    
    console.log('Current date:', now);
    console.log('Week start:', weekStart);
    console.log('Week end:', weekEnd);
    
    // Entries this week
    const entriesThisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      console.log(`Entry ${entry.id}: ${entryDate} - in week: ${entryDate >= weekStart && entryDate <= weekEnd}`);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    
    console.log('Entries this week count:', entriesThisWeek.length);
    
    // Calculate mood average from moods data
    const moodEmojis = entries.map(entry => entry.mood).filter((mood): mood is string => mood !== undefined);
    const moodCounts = moodEmojis.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get mood intensity from database
    const averageIntensity = moodStats?.averageIntensity || 0;
    
    return {
      entriesThisWeek: entriesThisWeek.length,
      moodAverage: averageIntensity,
      currentStreak: calculateCurrentStreak()
    };
  };
  
  const calculateCurrentStreak = () => {
    if (entries.length === 0) return 0;
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= streak) {
        streak++;
        currentDate = new Date(entryDate);
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  const stats = calculateStats();

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
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <FiBook className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                MindJournal
              </span>
            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
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

              {/* Settings */}
              <button className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? "bg-slate-800 text-gray-300 hover:bg-slate-700" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}>
                <FiSettings className="text-xl" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center space-x-1 ${
                    isDarkMode 
                      ? "bg-slate-800 text-gray-300 hover:bg-slate-700" 
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FiUser className="text-xl" />
                  <FiChevronDown className={`text-sm transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border transition-all duration-200 z-50 ${
                    isDarkMode 
                      ? "bg-slate-800 border-slate-700" 
                      : "bg-white border-gray-200"
                  }`}>
                    <div className="py-2">
                      {/* User Info */}
                      <div className={`px-4 py-3 border-b ${
                        isDarkMode ? "border-slate-700" : "border-gray-200"
                      }`}>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          User Profile
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          user@example.com
                        </p>
                      </div>

                      {/* Settings Option */}
                      <button className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors duration-200 ${
                        isDarkMode 
                          ? "text-gray-300 hover:bg-slate-700 hover:text-white" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}>
                        <FiSettings className="text-lg" />
                        <span>Settings</span>
                      </button>

                      {/* Logout Option */}
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors duration-200 ${
                          isDarkMode 
                            ? "text-red-400 hover:bg-slate-700 hover:text-red-300" 
                            : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        <FiLogOut className="text-lg" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Welcome back! 👋
          </h1>
          <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            How are you feeling today? Let's capture your thoughts.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Total Entries Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700" 
              : "bg-white/70 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? "bg-purple-900/50" : "bg-purple-100"
              }`}>
                <FiBook className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <FiTrendingUp className={`text-xl ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {entries.length}
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Total Entries
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
              +{stats.entriesThisWeek} this week
            </p>
          </div>

          {/* Current Streak Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700" 
              : "bg-white/70 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? "bg-orange-900/50" : "bg-orange-100"
              }`}>
                <span className="text-2xl">🔥</span>
              </div>
              <FiStar className={`text-xl ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {stats.currentStreak} days
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Current Streak
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? "text-yellow-400" : "text-yellow-600"}`}>
              Keep it up!
            </p>
          </div>
        </div>

        {/* Mood and AI Insights Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Mood Average Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700" 
              : "bg-white/70 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Mood Average
              </h3>
              <FiHeart className={`text-xl ${isDarkMode ? "text-pink-400" : "text-pink-600"}`} />
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {stats.moodAverage > 0 ? `${stats.moodAverage}/10` : 'No data'}
            </div>
            <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              {stats.moodAverage >= 8 ? 'Feeling great ❤️' : 
               stats.moodAverage >= 6 ? 'Doing good 👍' :
               stats.moodAverage >= 4 ? 'Feeling okay 😐' :
               stats.moodAverage > 0 ? 'Need support 🤗' : 'No mood data'}
            </p>
          </div>

          {/* AI Insights Card */}
          <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700" 
              : "bg-white/70 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                AI Insights
              </h3>
              <span className="text-xl">✨</span>
            </div>
            <div className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              23
            </div>
            <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              New patterns found
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <FiSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`} />
            <input
              type="text"
              placeholder="Search your entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-12 py-4 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                isDarkMode 
                  ? "bg-slate-800/50 border-slate-600 text-white placeholder-gray-400" 
                  : "bg-white/70 border-gray-200 text-gray-900 placeholder-gray-500"
              }`}
            />
            <button className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? "text-gray-400 hover:text-gray-300" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <FiFilter className="text-xl" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50" 
              : "bg-white/70 border-gray-200 text-gray-900 hover:bg-gray-50"
          }`}>
            <FiCalendar className={`text-2xl mb-2 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
            <p className="font-medium">View Calendar</p>
          </button>
          <button className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50" 
              : "bg-white/70 border-gray-200 text-gray-900 hover:bg-gray-50"
          }`}>
            <FiTrendingUp className={`text-2xl mb-2 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            <p className="font-medium">View Analytics</p>
          </button>
          <button className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700/50" 
              : "bg-white/70 border-gray-200 text-gray-900 hover:bg-gray-50"
          }`}>
            <FiHeart className={`text-2xl mb-2 ${isDarkMode ? "text-pink-400" : "text-pink-600"}`} />
            <p className="font-medium">Mood Tracker</p>
          </button>
        </div>

        {/* Journal Entries */}
        <div className="mb-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className={`p-8 rounded-2xl text-center ${
              isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-gray-200"
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Error</h2>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{error}</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className={`p-8 rounded-2xl text-center ${
              isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-gray-200"
            }`}>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                No entries yet
              </h3>
              <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Start your journaling journey by creating your first entry.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.slice(0, 3).map((entry) => (
                <div key={entry.id} className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? "bg-slate-800/50 border-slate-700" 
                    : "bg-white/70 border-gray-200"
                }`}>
                  <a href={`/entries/${entry.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="relative group">
                            <span className="text-2xl">{entry.mood || '😊'}</span>
                            {/* Tooltip */}
                            {entry.mood && (() => {
                              const moodInfo = getMoodInfo(entry.mood);
                              if (!moodInfo) return null;
                              return (
                                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 ${
                                  isDarkMode 
                                    ? 'bg-slate-700 text-white border border-slate-600' 
                                    : 'bg-gray-800 text-white border border-gray-600'
                                }`}>
                                  <div className="font-medium">{moodInfo.emoji} {moodInfo.mood.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                  <div className="text-gray-300 text-xs mt-1">{moodInfo.definition.split(':')[0]}</div>
                                  {/* Arrow */}
                                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 ${
                                    isDarkMode ? 'bg-slate-700 border-l border-t border-slate-600' : 'bg-gray-800 border-l border-t border-gray-600'
                                  }`}></div>
                                </div>
                              );
                            })()}
                          </div>
                          <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {entry.title || 'Untitled Entry'}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <FiCalendar className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                          <time className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(entry.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                        </div>
                        <p className={`mb-3 line-clamp-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {entry.content}
                        </p>
                        <div className="flex items-center space-x-2 mb-3">
                          {/* Only show user tags if they exist */}
                          {entry.tags && entry.tags.length > 0 && entry.tags.slice(0, 2).map((tag, index) => {
                            const categoryColor = entry.categories?.color || '#6366f1';
                            const categoryName = entry.categories?.name || 'Personal';
                            
                            // Debug logging
                            console.log('Entry ID:', entry.id);
                            console.log('Entry categories:', entry.categories);
                            console.log('Category color:', categoryColor);
                            console.log('Category name:', categoryName);
                            console.log('Tag being rendered:', tag);
                            
                            // Create a unique style element for each tag
                            const tagStyle = {
                              backgroundColor: categoryColor,
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              display: 'inline-block',
                              border: 'none',
                              outline: 'none'
                            };
                            
                            return (
                              <span 
                                key={index}
                                style={tagStyle}
                                title={`Category: ${categoryName}`}
                              >
                                #{tag}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">✨</span>
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {entry.categories?.name || 'Personal'}
                          </p>
                        </div>
                      </div>
                      <FiChevronRight className={`text-xl ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant Card */}
        <div className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode 
            ? "bg-purple-900/30 border-purple-700" 
            : "bg-purple-100/50 border-purple-200"
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">✨</span>
            <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              AI Assistant
            </h3>
          </div>
          <p className={`mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            "I noticed you've been writing about gratitude often this week. Would you like me to generate a gratitude summary?"
          </p>
          <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
            Generate Summary
          </button>
        </div>

        {/* Write New Entry Button */}
        <div className="fixed bottom-8 right-8">
          <a
            href="/entries/new"
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <FiPlus className="text-xl" />
            <span>Write New Entry</span>
          </a>
        </div>

        {/* Quote Section */}
        <div className={`mt-16 p-8 rounded-2xl text-center ${
          isDarkMode 
            ? "bg-slate-800/50 border-slate-700" 
            : "bg-white/70 border-gray-200"
        }`}>
          <span className="text-4xl mb-4 block">💭</span>
          <blockquote className={`text-lg italic mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            "Writing is the painting of the voice."
          </blockquote>
          <cite className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            - Voltaire
          </cite>
        </div>
      </main>
    </div>
  );
}
