'use client';

import { format } from 'date-fns';
import { FiX, FiBook, FiCalendar, FiTag } from 'react-icons/fi';

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

interface DateEntriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  entries: JournalEntry[];
  isDarkMode: boolean;
}

export function DateEntriesModal({ isOpen, onClose, date, entries, isDarkMode }: DateEntriesModalProps) {
  if (!isOpen) return null;

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[80vh] rounded-2xl backdrop-blur-sm border overflow-hidden ${
        isDarkMode 
          ? "bg-slate-800 border-slate-700" 
          : "bg-white border-gray-200"
      }`}>
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDarkMode ? "border-slate-700" : "border-gray-200"
        }`}>
          <div>
            <h3 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode 
                ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Entries List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <FiCalendar className={`text-4xl mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
              <p className={`text-lg font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                No entries found
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                There are no journal entries for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                    isDarkMode 
                      ? "bg-slate-700/50 border-slate-600" 
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {entry.mood && (
                        <span className="text-2xl">{entry.mood}</span>
                      )}
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {entry.title || 'Untitled Entry'}
                        </h4>
                        <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {format(new Date(entry.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    {entry.categories && (
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: entry.categories.color + '20',
                          color: entry.categories.color
                        }}
                      >
                        {entry.categories.name}
                      </div>
                    )}
                  </div>

                  <p className={`text-sm mb-3 leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {truncateContent(entry.content)}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <FiTag className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded-full text-xs ${
                              isDarkMode 
                                ? "bg-slate-600 text-gray-300" 
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                    <a
                      href={`/entries/${entry.id}`}
                      className={`inline-flex items-center space-x-1 text-sm font-medium transition-colors duration-200 ${
                        isDarkMode 
                          ? "text-purple-400 hover:text-purple-300" 
                          : "text-purple-600 hover:text-purple-700"
                      }`}
                    >
                      <FiBook />
                      <span>Read More</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
