'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

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
  relevanceScore?: number;
};

const moodOptions = [
  { mood: 'very_happy', emoji: '😄', color: '#10b981', label: 'Very Happy' },
  { mood: 'happy', emoji: '😊', color: '#22c55e', label: 'Happy' },
  { mood: 'neutral', emoji: '😐', color: '#6b7280', label: 'Neutral' },
  { mood: 'sad', emoji: '☹️', color: '#f59e0b', label: 'Sad' },
  { mood: 'very_sad', emoji: '😭', color: '#ef4444', label: 'Very Sad' },
  { mood: 'excited', emoji: '🤩', color: '#8b5cf6', label: 'Excited' },
  { mood: 'anxious', emoji: '😰', color: '#f97316', label: 'Anxious' },
  { mood: 'angry', emoji: '😠', color: '#dc2626', label: 'Angry' },
  { mood: 'tired', emoji: '😴', color: '#6366f1', label: 'Tired' },
  { mood: 'love', emoji: '🥰', color: '#ec4899', label: 'Love' },
  { mood: 'confused', emoji: '😕', color: '#84cc16', label: 'Confused' },
  { mood: 'grateful', emoji: '🙏', color: '#14b8a6', label: 'Grateful' },
  { mood: 'hopeful', emoji: '🌟', color: '#3b82f6', label: 'Hopeful' },
  { mood: 'frustrated', emoji: '😤', color: '#a855f7', label: 'Frustrated' },
  { mood: 'calm', emoji: '😌', color: '#06b6d4', label: 'Calm' },
  { mood: 'proud', emoji: '😎', color: '#fbbf24', label: 'Proud' },
];

const getMoodColor = (moodEmoji: string) => {
  const mood = moodOptions.find(option => option.emoji === moodEmoji);
  return mood?.color || '#e5e7eb';
};

interface MoodCalendarProps {
  entries: JournalEntry[];
  isDarkMode: boolean;
  onDateClick?: (date: Date, entriesForDate: JournalEntry[]) => void;
}

export function MoodCalendar({ entries, isDarkMode, onDateClick }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, JournalEntry[]> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    
    return grouped;
  }, [entries]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const entriesForDate = entriesByDate[dateKey] || [];
    
    if (onDateClick) {
      onDateClick(date, entriesForDate);
    }
  };

  const getMoodForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEntries = entriesByDate[dateKey] || [];
    
    if (dayEntries.length === 0) return null;
    
    // Return the mood from the latest entry that day
    const latestEntry = dayEntries.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    return latestEntry.mood;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`p-6 rounded-2xl backdrop-blur-sm border ${
      isDarkMode 
        ? "bg-slate-800/50 border-slate-700" 
        : "bg-white/70 border-gray-200"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Mood Calendar
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <span className={`text-sm font-medium min-w-[120px] text-center ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={handleNextMonth}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className={`text-center text-xs font-medium p-2 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const mood = getMoodForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDate[dateKey] || [];
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                relative aspect-square p-1 rounded-lg transition-all duration-200
                ${isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                ${isToday ? 'ring-2 ring-purple-500' : ''}
                ${dayEntries.length > 0 ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                ${mood ? 'shadow-sm' : ''}
              `}
              style={{
                backgroundColor: mood ? getMoodColor(mood) : 'transparent',
              }}
              disabled={dayEntries.length === 0}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={`text-xs font-medium ${
                  isCurrentMonth 
                    ? (isDarkMode ? "text-white" : "text-gray-900")
                    : (isDarkMode ? "text-gray-500" : "text-gray-400")
                } ${mood ? 'text-white' : ''}`}>
                  {format(day, 'd')}
                </span>
                {mood && (
                  <span className="text-xs mt-1">
                    {mood}
                  </span>
                )}
                {dayEntries.length > 1 && (
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isDarkMode ? "bg-purple-400" : "bg-purple-600"
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mood Legend */}
      <div className={`mt-6 pt-4 border-t ${
        isDarkMode ? "border-slate-700" : "border-gray-200"
      }`}>
        <p className={`text-sm font-medium mb-3 ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}>
          Mood Legend
        </p>
        <div className="grid grid-cols-4 gap-2">
          {moodOptions.slice(0, 8).map(mood => (
            <div key={mood.mood} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
              <span className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {mood.emoji} {mood.label}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {moodOptions.slice(8).map(mood => (
            <div key={mood.mood} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
              <span className={`text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                {mood.emoji} {mood.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
