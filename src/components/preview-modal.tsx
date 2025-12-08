'use client';

import { FiX } from 'react-icons/fi';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  isDarkMode: boolean;
  moodData: { emoji: string; label: string; intensity: number } | null;
  tags: string[];
  isSubmitting: boolean;
}

export function PreviewModal({
  isOpen,
  onClose,
  onContinue,
  isDarkMode,
  moodData,
  tags,
  isSubmitting
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-800/90 border-slate-700"
          : "bg-white/90 border-gray-200"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
             AI Preview
          </h3>
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

        <div className="space-y-6">
          {/* Mood Detection */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode
              ? "bg-purple-900/20 border-purple-700"
              : "bg-purple-50 border-purple-200"
          }`}>
            <h4 className={`text-lg font-semibold mb-3 ${
              isDarkMode ? "text-purple-300" : "text-purple-700"
            }`}>
              Detected Mood
            </h4>
            {moodData ? (
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{moodData.emoji}</div>
                <div>
                  <p className={`text-sm font-medium capitalize ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}>
                    {moodData.label.replace('_', ' ')}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      Intensity:
                    </span>
                    <div className="flex space-x-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < moodData.intensity
                              ? "bg-purple-500"
                              : isDarkMode
                                ? "bg-gray-600"
                                : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {moodData.intensity}/10
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                No mood detected
              </p>
            )}
          </div>

          {/* Generated Tags */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode
              ? "bg-green-900/20 border-green-700"
              : "bg-green-50 border-green-200"
          }`}>
            <h4 className={`text-lg font-semibold mb-3 ${
              isDarkMode ? "text-green-300" : "text-green-700"
            }`}>
              Generated Tags
            </h4>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isDarkMode
                        ? "bg-green-900/30 text-green-300 border-green-600"
                        : "bg-green-100 text-green-800 border-green-300"
                    } border`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                No tags generated
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className={`p-3 rounded-lg border-2 ${
            isDarkMode ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200"
          }`}>
            <p className={`text-xs leading-relaxed ${
              isDarkMode ? "text-yellow-200" : "text-yellow-700"
            }`}>
              <span className="font-semibold">⚠️ AI Analysis:</span> This preview shows AI-generated insights. You can edit your entry later if needed. AI analysis for mood and tags happens on-the-fly for journaling insights.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex space-x-3 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? "bg-slate-700 text-gray-200 hover:bg-slate-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Go Back & Edit
          </button>
          <button
            onClick={onContinue}
            disabled={isSubmitting}
            className={`flex-1 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Continue & Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
