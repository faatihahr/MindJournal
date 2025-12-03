'use client';

import { useState } from 'react';
import { FiDownload, FiEye, FiX, FiSettings, FiCalendar, FiFile, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { pdfExporter, ExportOptions } from '@/lib/pdf-export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: any;
  entries?: any[];
  exportType: 'single' | 'multiple' | 'date_range';
  startDate?: string;
  endDate?: string;
  aiInsights?: any;
}

export function ExportModal({ 
  isOpen, 
  onClose, 
  entry, 
  entries = [], 
  exportType,
  startDate,
  endDate,
  aiInsights
}: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includeWatermark: true,
    includeDisclaimer: true,
    removeSensitiveData: false,
    includeMood: true,
    includeTags: true,
    includeDate: true,
    includeAIInsights: true
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      console.log('Export Modal Debug:', {
        exportType,
        aiInsights,
        options: options.includeAIInsights
      });
      
      let result;
      if (exportType === 'single' && entry) {
        result = await pdfExporter.exportSingleEntry(entry, options, true);
      } else if (exportType === 'multiple' || exportType === 'date_range') {
        result = exportType === 'date_range' 
          ? await pdfExporter.exportDateRange(entries, startDate || '', endDate || '', options, true, aiInsights)
          : await pdfExporter.exportMultipleEntries(entries, options, true, aiInsights);
      }
      
      if (result) {
        const url = await pdfExporter.previewPDF(result.blob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let result;
      if (exportType === 'single' && entry) {
        result = await pdfExporter.exportSingleEntry(entry, options);
      } else if (exportType === 'multiple' || exportType === 'date_range') {
        result = exportType === 'date_range' 
          ? await pdfExporter.exportDateRange(entries, startDate || '', endDate || '', options, false, aiInsights)
          : await pdfExporter.exportMultipleEntries(entries, options, false, aiInsights);
      }
      
      if (result) {
        await pdfExporter.downloadPDF(result.blob, result.fileName);
        onClose();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const entryCount = exportType === 'single' ? 1 : entries.length;
  const exportTitle = exportType === 'single' ? 'Export Entry' : 
                      exportType === 'date_range' ? 'Export Date Range' : 'Export Selected Entries';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
        document.documentElement.classList.contains('dark')
          ? "bg-slate-800/90 border-slate-700" 
          : "bg-white/90 border-gray-200"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${
            document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
          }`}>
            {exportTitle}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              document.documentElement.classList.contains('dark')
                ? "bg-slate-700 text-gray-300 hover:bg-slate-600" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Export Info */}
        <div className={`p-4 rounded-xl border mb-6 ${
          document.documentElement.classList.contains('dark')
            ? "bg-blue-900/20 border-blue-700" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center space-x-3">
            <FiFile className={`w-5 h-5 ${
              document.documentElement.classList.contains('dark') ? "text-blue-400" : "text-blue-600"
            }`} />
            <div>
              <p className={`font-medium ${
                document.documentElement.classList.contains('dark') ? "text-blue-300" : "text-blue-700"
              }`}>
                {exportType === 'single' ? '1 entry' : `${entryCount} entries`} to be exported
              </p>
              {exportType === 'date_range' && startDate && endDate && (
                <p className={`text-sm ${
                  document.documentElement.classList.contains('dark') ? "text-blue-400" : "text-blue-600"
                }`}>
                  Date range: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Options */}
        <div className="space-y-4 mb-6">
          <h3 className={`text-lg font-semibold ${
            document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
          }`}>
            Export Options
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeWatermark}
                onChange={(e) => setOptions({...options, includeWatermark: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Add watermark
                </span>
                <p className={`text-sm ${
                  document.documentElement.classList.contains('dark') ? "text-gray-400" : "text-gray-600"
                }`}>
                  "Personal Journal - Confidential" watermark on each page
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeDisclaimer}
                onChange={(e) => setOptions({...options, includeDisclaimer: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Include disclaimer
                </span>
                <p className={`text-sm ${
                  document.documentElement.classList.contains('dark') ? "text-gray-400" : "text-gray-600"
                }`}>
                  Add confidentiality notice at the bottom of PDF
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options.removeSensitiveData}
                onChange={(e) => setOptions({...options, removeSensitiveData: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Remove sensitive data
                </span>
                <p className={`text-sm ${
                  document.documentElement.classList.contains('dark') ? "text-gray-400" : "text-gray-600"
                }`}>
                  Auto-detect and redact emails, phone numbers, names, etc.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${
              document.documentElement.classList.contains('dark')
                ? "text-purple-400 hover:text-purple-300" 
                : "text-purple-600 hover:text-purple-800"
            }`}
          >
            <FiSettings className="w-4 h-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-3 pl-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeMood}
                  onChange={(e) => setOptions({...options, includeMood: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Include mood information
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTags}
                  onChange={(e) => setOptions({...options, includeTags: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Include tags
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDate}
                  onChange={(e) => setOptions({...options, includeDate: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                }`}>
                  Include date information
                </span>
              </label>

              {(exportType === 'multiple' || exportType === 'date_range') && aiInsights && (
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeAIInsights}
                    onChange={(e) => setOptions({...options, includeAIInsights: e.target.checked})}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className={`font-medium ${
                    document.documentElement.classList.contains('dark') ? "text-white" : "text-gray-900"
                  }`}>
                    Include AI Weekly Insights
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Security Notice */}
        {options.removeSensitiveData && (
          <div className={`p-4 rounded-xl border mb-6 ${
            document.documentElement.classList.contains('dark')
              ? "bg-yellow-900/20 border-yellow-700" 
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <div className="flex items-start space-x-3">
              <FiAlertCircle className={`w-5 h-5 mt-0.5 ${
                document.documentElement.classList.contains('dark') ? "text-yellow-400" : "text-yellow-600"
              }`} />
              <div>
                <p className={`font-medium ${
                  document.documentElement.classList.contains('dark') ? "text-yellow-300" : "text-yellow-700"
                }`}>
                  Privacy Protection
                </p>
                <p className={`text-sm mt-1 ${
                  document.documentElement.classList.contains('dark') ? "text-yellow-400" : "text-yellow-600"
                }`}>
                  Sensitive data removal uses pattern matching. Please review the preview to ensure all sensitive information is properly redacted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePreview}
            disabled={isPreviewing || isExporting}
            className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
              document.documentElement.classList.contains('dark')
                ? "bg-slate-700 text-gray-200 hover:bg-slate-600" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FiEye className="w-4 h-4" />
            <span>{isPreviewing ? 'Generating Preview...' : 'Preview PDF'}</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || isPreviewing}
            className={`flex-1 px-6 py-3 font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg`}
          >
            <FiDownload className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-60 p-4">
            <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">PDF Preview</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      window.open(previewUrl, '_blank');
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Open in New Tab
                  </button>
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-[calc(100vh-80px)] overflow-auto">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
