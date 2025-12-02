'use client';

import { useEffect, useState } from 'react';
import { getUserInsights, generateWeeklyInsight } from '../app/insights/actions';
import { FiX, FiTrendingUp, FiCalendar, FiMessageCircle, FiRefreshCw } from 'react-icons/fi';

type MoodCount = {
  mood: string;
  count: number;
};

type WeeklyInsight = {
  id: string;
  summary: string;
  top_themes: string[];
  mood_trend: MoodCount[];
  created_at: string;
  emotional_state?: string;
  patterns?: string[];
  recommendations?: string[];
};

interface InsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function InsightsModal({ isOpen, onClose, isDarkMode }: InsightsModalProps) {
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const result = await getUserInsights();
      
      if (result.error) {
        setError(result.error);
      } else {
        setInsights(result.data as WeeklyInsight[]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setGenerating(true);
      const result = await generateWeeklyInsight();
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh insights after generating
        await fetchInsights();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate insight');
    } finally {
      setGenerating(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      'Happy': { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/30 text-green-300' },
      'Neutral': { light: 'bg-yellow-100 text-yellow-800', dark: 'bg-yellow-900/30 text-yellow-300' },
      'Sad': { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900/30 text-blue-300' },
      'Angry': { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/30 text-red-300' },
      'Anxious': { light: 'bg-purple-100 text-purple-800', dark: 'bg-purple-900/30 text-purple-300' },
      'Stressed': { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/30 text-red-300' },
      'Tired': { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700/30 text-gray-300' },
      'Excited': { light: 'bg-pink-100 text-pink-800', dark: 'bg-pink-900/30 text-pink-300' },
      'Grateful': { light: 'bg-indigo-100 text-indigo-800', dark: 'bg-indigo-900/30 text-indigo-300' },
    };
    return colors[mood] || { light: 'bg-gray-100 text-gray-800', dark: 'bg-gray-700/30 text-gray-300' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-4xl rounded-2xl shadow-2xl transition-all ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        } border`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <FiTrendingUp className={`text-xl ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Weekly Insights
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-slate-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Loading insights...</p>
              </div>
            ) : error ? (
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
              } border`}>
                <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-12">
                <FiMessageCircle className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`} />
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  No insights yet
                </h3>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Generate your first weekly insight to see your journaling patterns.
                </p>
                <button
                  onClick={handleGenerateInsight}
                  disabled={generating}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    generating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {generating ? (
                    <span className="flex items-center space-x-2">
                      <FiRefreshCw className="animate-spin" />
                      <span>Generating...</span>
                    </span>
                  ) : (
                    'Generate Weekly Insight'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generate Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleGenerateInsight}
                    disabled={generating}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      generating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDarkMode
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {generating ? (
                      <span className="flex items-center space-x-2">
                        <FiRefreshCw className="animate-spin" />
                        <span>Generating...</span>
                      </span>
                    ) : (
                      'Generate New Insight'
                    )}
                  </button>
                </div>

                {/* Insights List */}
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(insight.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Emotional State */}
                    {insight.emotional_state && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'
                      } border`}>
                        <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                          Emotional State
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {insight.emotional_state}
                        </p>
                      </div>
                    )}
                    
                    <p className={`mb-4 text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {insight.summary}
                    </p>
                    
                    {/* Psychological Patterns */}
                    {insight.patterns && insight.patterns.length > 0 && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Psychological Patterns
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.patterns.map((pattern, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {pattern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Top Themes
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.top_themes.map((theme) => (
                            <span
                              key={theme}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Mood Trend
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.mood_trend.map(({ mood, count }) => {
                            const color = getMoodColor(mood);
                            return (
                              <span
                                key={mood}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  isDarkMode ? color.dark : color.light
                                }`}
                              >
                                {mood}: {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                      } border`}>
                        <h4 className={`text-sm font-semibold mb-2 flex items-center ${
                          isDarkMode ? 'text-green-300' : 'text-green-700'
                        }`}>
                          <span className="mr-2">💡</span>
                          Personalized Recommendations
                        </h4>
                        <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {insight.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2 text-green-500">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
