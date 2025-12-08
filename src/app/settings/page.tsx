'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSettings, FiChevronLeft, FiMoon, FiSun, FiEdit3, FiZap } from 'react-icons/fi';


export default function Settings() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [autoTidyUp, setAutoTidyUp] = useState(false);
  const [autoMoodDetection, setAutoMoodDetection] = useState(true);
  const [autoTagGeneration, setAutoTagGeneration] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize settings from localStorage
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // Load AI settings
    setAutoTidyUp(JSON.parse(localStorage.getItem('autoTidyUp') || 'false'));
    setAutoMoodDetection(JSON.parse(localStorage.getItem('autoMoodDetection') || 'true'));
    setAutoTagGeneration(JSON.parse(localStorage.getItem('autoTagGeneration') || 'true'));
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

  const saveSettings = () => {
    localStorage.setItem('autoTidyUp', autoTidyUp.toString());
    localStorage.setItem('autoMoodDetection', autoMoodDetection.toString());
    localStorage.setItem('autoTagGeneration', autoTagGeneration.toString());
    
    // Show success message
    alert('Settings saved successfully!');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-linear-to-br from-slate-900 via-purple-900 to-slate-900" 
        : "bg-linear-to-br from-purple-50 via-pink-50 to-indigo-50"
    }`}>
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/dashboard')} 
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDarkMode 
                    ? "bg-slate-800 text-gray-300 hover:bg-slate-700" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiChevronLeft className="text-xl" />
              </button>
              <FiSettings className={`text-2xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              <h1 className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`} style={{ fontFamily: "'Fira Sans', 'Inter', sans-serif" }}>
                Settings
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
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={`max-w-2xl mx-auto p-4 sm:p-6 md:p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode 
            ? "bg-slate-800/50 border-slate-700" 
            : "bg-white/70 border-gray-200"
        }`}>
          
          {/* AI Settings Section */}
          <div className="mb-8">
            <h2 className={`text-xl font-bold mb-6 flex items-center space-x-2 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`} style={{ fontFamily: "'Fira Sans', 'Inter', sans-serif" }}>
              <FiZap className={`text-xl ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              <span>AI Settings</span>
            </h2>
            
            <div className="space-y-6">
              {/* Auto Tidy Up */}
              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? "bg-slate-700/50 border-slate-600" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      Auto Tidy Up
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Automatically improve your writing style when saving entries
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoTidyUp;
                      setAutoTidyUp(newValue);
                      localStorage.setItem('autoTidyUp', JSON.stringify(newValue));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      autoTidyUp ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      autoTidyUp ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Auto Mood Detection */}
              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? "bg-slate-700/50 border-slate-600" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      Auto Mood Detection
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Automatically detect mood from your entry content
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoMoodDetection;
                      setAutoMoodDetection(newValue);
                      localStorage.setItem('autoMoodDetection', JSON.stringify(newValue));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      autoMoodDetection ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      autoMoodDetection ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Auto Tag Generation */}
              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isDarkMode 
                  ? "bg-slate-700/50 border-slate-600" 
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold mb-1 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      Auto Tag Generation
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      Automatically generate relevant tags for your entries
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !autoTagGeneration;
                      setAutoTagGeneration(newValue);
                      localStorage.setItem('autoTagGeneration', JSON.stringify(newValue));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      autoTagGeneration ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      autoTagGeneration ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
