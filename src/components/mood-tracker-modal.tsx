'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiTrendingUp, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';

interface MoodData {
  date: string;
  mood: string;
  emoji: string;
  intensity: number;
}

interface MoodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  userId?: string;
}

const moodOptions = [
  { mood: 'very_happy', emoji: '😄', color: 'bg-green-500', intensity: 10 },
  { mood: 'happy', emoji: '😊', color: 'bg-green-400', intensity: 8 },
  { mood: 'neutral', emoji: '😐', color: 'bg-yellow-500', intensity: 5 },
  { mood: 'sad', emoji: '☹️', color: 'bg-orange-500', intensity: 3 },
  { mood: 'very_sad', emoji: '😭', color: 'bg-red-500', intensity: 1 },
];

const timeRanges = ['All', 'Days', 'Weeks', 'Months', 'Years'];
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MoodTrackerModal({ isOpen, onClose, isDarkMode, userId }: MoodTrackerModalProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('All');
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [predictionIntensities, setPredictionIntensities] = useState<number[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [confidence, setConfidence] = useState<number>(0);
  const [basedOnEntries, setBasedOnEntries] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      fetchMoodData();
      if (userId) {
        fetchAIPredictions();
      }
    }
  }, [isOpen, userId]);

  const fetchMoodData = async () => {
    try {
      // In a real implementation, you would fetch this from your API
      // For now, generate sample data
      const data: MoodData[] = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const randomMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
        
        data.push({
          date: date.toISOString().split('T')[0],
          mood: randomMood.mood,
          emoji: randomMood.emoji,
          intensity: randomMood.intensity
        });
      }
      
      setMoodData(data);
    } catch (error) {
      console.error('Error fetching mood data:', error);
    }
  };

  const fetchAIPredictions = async () => {
    if (!userId) return;
    
    setLoadingPredictions(true);
    try {
      const response = await fetch('/api/ai/mood-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      
      if (data.predictions && data.emojis) {
        setPredictionIntensities(data.predictions);
        setPredictions(data.emojis);
        setConfidence(data.confidence || 0);
        setBasedOnEntries(data.basedOnEntries || 0);
      } else {
        // Fallback to simple predictions
        const fallbackPredictions = Array(7).fill(0).map(() => 
          moodOptions[Math.floor(Math.random() * moodOptions.length)].emoji
        );
        setPredictions(fallbackPredictions);
        setConfidence(0.3);
        setBasedOnEntries(0);
      }
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
      // Fallback to simple predictions
      const fallbackPredictions = Array(7).fill(0).map(() => 
        moodOptions[Math.floor(Math.random() * moodOptions.length)].emoji
      );
      setPredictions(fallbackPredictions);
      setConfidence(0.3);
      setBasedOnEntries(0);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentWeekStart);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const getMoodForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const mood = moodData.find(m => m.date === dateStr);
    return mood || moodOptions[2]; // Default to neutral
  };

  const getMoodColor = (intensity: number) => {
    if (intensity >= 8) return isDarkMode ? 'text-green-400' : 'text-green-600';
    if (intensity >= 6) return isDarkMode ? 'text-lime-400' : 'text-lime-600';
    if (intensity >= 4) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    if (intensity >= 2) return isDarkMode ? 'text-orange-400' : 'text-orange-600';
    return isDarkMode ? 'text-red-400' : 'text-red-600';
  };

  const renderChart = () => {
    const chartData = moodData.slice(-14); // Last 14 days for chart
    
    return (
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Mood Trend
          </h4>
          <div className="flex items-center space-x-4 text-xs">
            <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>😄 Happy</span>
            <span className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}>😐 Neutral</span>
            <span className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>☹️ Sad</span>
          </div>
        </div>
        
        <div className="h-32 flex items-end justify-between space-x-1">
          {chartData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                  data.intensity >= 8 ? 'bg-green-500' :
                  data.intensity >= 6 ? 'bg-lime-500' :
                  data.intensity >= 4 ? 'bg-yellow-500' :
                  data.intensity >= 2 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ height: `${(data.intensity / 10) * 100}%` }}
              />
              <span className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(data.date).getDate()}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2 text-xs">
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>2 weeks ago</span>
          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Today</span>
        </div>
      </div>
    );
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
                Mood Tracker
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
          <div className="max-h-[80vh] overflow-y-auto p-6">
            {/* Time Range Selector */}
            <div className="flex space-x-2 mb-6">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTimeRange === range
                      ? isDarkMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600 text-white'
                      : isDarkMode
                      ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Chart */}
            {renderChart()}

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {weekDays.map((day) => (
                <div key={day} className={`text-center text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* AI Mood Predictions */}
            <div className={`p-4 rounded-xl mb-6 ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Mood Predictions
                  </h3>
                  {loadingPredictions && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Next 7 days
                  </span>
                  <button
                    onClick={fetchAIPredictions}
                    disabled={loadingPredictions}
                    className={`p-1 rounded transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-600 text-gray-400' 
                        : 'hover:bg-gray-200 text-gray-600'
                    } ${loadingPredictions ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FiRefreshCw className={`text-sm ${loadingPredictions ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Confidence and Data Info */}
              {confidence > 0 && (
                <div className={`mb-3 p-2 rounded-lg text-xs ${
                  isDarkMode ? 'bg-slate-600/50' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Based on {basedOnEntries} journal entries
                    </span>
                    <span className={`font-medium ${
                      confidence >= 0.7 ? 'text-green-500' :
                      confidence >= 0.5 ? 'text-yellow-500' : 'text-orange-500'
                    }`}>
                      {Math.round(confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              )}

              {/* Prediction Grid */}
              <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day, index) => (
                  <div key={day} className="text-center">
                    <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day}
                    </div>
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                      isDarkMode ? 'bg-slate-600' : 'bg-white border border-gray-200'
                    } ${loadingPredictions ? 'animate-pulse' : ''}`}>
                      {loadingPredictions ? '⏳' : (predictions[index] || '😐')}
                    </div>
                    {predictionIntensities[index] && !loadingPredictions && (
                      <div className={`text-xs mt-1 ${getMoodColor(predictionIntensities[index])}`}>
                        {predictionIntensities[index]}/10
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Week Overview */}
            <div className={`p-4 rounded-xl ${
              isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  This Week
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className={`p-1 rounded ${
                      isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <FiChevronLeft className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getWeekDates()[0]?.toLocaleDateString()} - {getWeekDates()[6]?.toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => navigateWeek('next')}
                    className={`p-1 rounded ${
                      isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <FiChevronRight className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getWeekDates().map((date, index) => {
                  const mood = getMoodForDate(date);
                  return (
                    <div key={index} className="text-center">
                      <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {weekDays[index]}
                      </div>
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-lg ${
                        isDarkMode ? 'bg-slate-600' : 'bg-white border border-gray-200'
                      }`}>
                        {mood.emoji}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
