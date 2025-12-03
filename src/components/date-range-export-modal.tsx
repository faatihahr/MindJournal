'use client';

import { useState } from 'react';
import { FiDownload, FiCalendar, FiX, FiFilter, FiCheck } from 'react-icons/fi';
import { ExportModal } from './export-modal';
import { formatDate } from '@/app/dashboard/date-utils';

interface DateRangeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: any[];
  aiInsights?: any;
}

export function DateRangeExportModal({ isOpen, onClose, entries, aiInsights }: DateRangeExportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredEntries, setFilteredEntries] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  if (!isOpen) return null;

  const handleFilter = async () => {
    if (!startDate || !endDate) return;

    setIsFiltering(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date

      console.log('Filtering entries:', {
        startDate,
        endDate,
        start,
        end,
        totalEntries: entries.length
      });

      const filtered = entries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        console.log('Entry:', {
          id: entry.id,
          created_at: entry.created_at,
          entryDate,
          inRange: entryDate >= start && entryDate <= end
        });
        return entryDate >= start && entryDate <= end;
      });

      console.log('Filtered entries:', filtered);
      setFilteredEntries(filtered);
    } catch (error) {
      console.error('Error filtering entries:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleExport = () => {
    if (filteredEntries.length === 0) return;
    setShowExportModal(true);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredEntries([]);
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode
            ? "bg-slate-800/90 border-slate-700" 
            : "bg-white/90 border-gray-200"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Export Date Range
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Select Date Range
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                    isDarkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleFilter}
                disabled={!startDate || !endDate || isFiltering}
                className={`px-6 py-2 font-semibold rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                  isDarkMode
                    ? "bg-purple-600 text-white hover:bg-purple-700" 
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                <span>{isFiltering ? 'Filtering...' : 'Filter Entries'}</span>
              </button>
              
              <button
                onClick={clearFilters}
                className={`px-6 py-2 font-semibold rounded-lg transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-slate-700 text-gray-200 hover:bg-slate-600" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results */}
          {filteredEntries.length > 0 && (
            <div className={`p-4 rounded-xl border mb-6 ${
              isDarkMode
                ? "bg-green-900/20 border-green-700" 
                : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiCheck className={`w-5 h-5 ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? "text-green-300" : "text-green-700"
                    }`}>
                      {filteredEntries.length} entries found
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}>
                      From {formatDate(startDate)} to {formatDate(endDate)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleExport}
                  className={`px-6 py-2 font-semibold rounded-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Export {filteredEntries.length} Entries</span>
                </button>
              </div>
            </div>
          )}

          {/* Entry Preview */}
          {filteredEntries.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Entries to Export
              </h3>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isDarkMode
                        ? "bg-slate-700/50 border-slate-600" 
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {entry.title || `Entry ${index + 1}`}
                        </h4>
                        <p className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          {formatDate(entry.created_at)}
                        </p>
                        {entry.mood && (
                          <span className="text-sm">{entry.mood}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {startDate && endDate && filteredEntries.length === 0 && !isFiltering && (
            <div className={`p-4 rounded-xl border ${
              isDarkMode
                ? "bg-yellow-900/20 border-yellow-700" 
                : "bg-yellow-50 border-yellow-200"
            }`}>
              <p className={`text-center ${
                isDarkMode ? "text-yellow-300" : "text-yellow-700"
              }`}>
                No entries found in the selected date range
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        entries={filteredEntries}
        exportType="date_range"
        startDate={startDate}
        endDate={endDate}
        aiInsights={aiInsights}
      />
    </>
  );
}
