'use client';

import { useEffect, useState } from 'react';
import { getUserEntries } from '../dashboard/actions';
import Link from 'next/link';
import { FiArrowLeft, FiMoon, FiSun, FiCalendar, FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiEdit3, FiTrash2, FiBook, FiMessageCircle } from 'react-icons/fi';
import { DeleteButton } from '../dashboard/delete-button';
import { formatDate } from '../dashboard/date-utils';

type JournalEntry = {
  id: string;
  title?: string;
  content: string;
  mood?: string;
  category_id?: string;
  categories?: {
    name: string;
    color: string;
  };
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export default function AllEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<{name: string, color: string}[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const entriesPerPage = 6;

  const moodOptions = [
    { mood: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-800' },
    { mood: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-800' },
    { mood: '😡', label: 'Angry', color: 'bg-red-100 text-red-800' },
    { mood: '😰', label: 'Anxious', color: 'bg-purple-100 text-purple-800' },
    { mood: '😌', label: 'Calm', color: 'bg-green-100 text-green-800' },
    { mood: '🤔', label: 'Thoughtful', color: 'bg-indigo-100 text-indigo-800' },
    { mood: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-800' },
    { mood: '🤗', label: 'Excited', color: 'bg-pink-100 text-pink-800' }
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    fetchEntries();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedMood, selectedCategory, selectedTags]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const result = await getUserEntries();
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEntries(result.data as JournalEntry[]);
        
        // Extract unique categories and tags
        const uniqueCategories = [...new Set(
          result.data
            .filter(entry => entry.categories)
            .map(entry => entry.categories!)
        )];
        setCategories(uniqueCategories);
        
        const uniqueTags = [...new Set(
          result.data
            .flatMap(entry => entry.tags || [])
        )];
        setAllTags(uniqueTags);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mood filter
    if (selectedMood !== 'all') {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => 
        entry.categories?.name === selectedCategory
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.every(tag => entry.tags?.includes(tag))
      );
    }

    setFilteredEntries(filtered);
    setCurrentPage(1); // Reset to first page when filters change
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMood('all');
    setSelectedCategory('all');
    setSelectedTags([]);
    setShowAdvancedFilters(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
      }`}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" 
          : "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50"
      }`}>
        <div className="flex items-center justify-center h-screen">
          <div className={`p-6 rounded-xl backdrop-blur-sm border ${
            isDarkMode 
              ? "bg-slate-800/50 border-slate-700 text-white" 
              : "bg-white/70 border-gray-200 text-gray-900"
          }`}>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
              <Link 
                href="/dashboard" 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <span className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>📔</span>
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                All Journal Entries
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
        {/* Search and Filters */}
        <div className={`max-w-4xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-800/50 border-slate-700" 
            : "bg-white/70 border-gray-200"
        }`}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`} />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                  isDarkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-3 rounded-lg border transition-all duration-200 flex items-center space-x-2 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 text-gray-200 hover:bg-slate-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiFilter />
              <span>Filters</span>
              {(selectedMood !== 'all' || selectedCategory !== 'all' || selectedTags.length > 0) && (
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mood Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Mood
                  </label>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="all">All Moods</option>
                    {moodOptions.map(option => (
                      <option key={option.mood} value={option.mood}>
                        {option.mood} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700 border-slate-600 text-gray-200 hover:bg-slate-600"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tags Filter */}
              {allTags.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : isDarkMode
                              ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className={`max-w-4xl mx-auto mb-6 text-center ${
          isDarkMode ? "text-gray-300" : "text-gray-600"
        }`}>
          {filteredEntries.length === 0 ? (
            <p>No entries found</p>
          ) : (
            <p>Showing {startIndex + 1}-{Math.min(endIndex, filteredEntries.length)} of {filteredEntries.length} entries</p>
          )}
        </div>

        {/* Entries Grid */}
        <div className="max-w-4xl mx-auto grid gap-4 md:gap-6">
          {currentEntries.map((entry) => (
            <div key={entry.id} className={`p-4 md:p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
              isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-gray-200"
            }`}>
              <Link href={`/entries/${entry.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2 md:mb-3">
                      <span className="text-lg md:text-2xl">{entry.mood || '😊'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <h3 className={`text-lg md:text-xl font-bold mb-2 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    <p className={`text-sm md:text-base mb-3 leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {truncateContent(entry.content)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags?.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isDarkMode ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <FiMessageCircle className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {entry.tags && entry.tags.length > 3 && (
                        <span className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          +{entry.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => window.location.href = `/entries/${entry.id}`}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isDarkMode 
                          ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <DeleteButton
                      entryId={entry.id}
                      onDelete={() => {
                        setEntries(prev => prev.filter(e => e.id !== entry.id));
                        setFilteredEntries(prev => prev.filter(e => e.id !== entry.id));
                      }}
                    />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="max-w-4xl mx-auto mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
