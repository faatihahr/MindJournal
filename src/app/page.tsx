"use client";

import { useState, useEffect } from "react";
import { FiBook, FiMoon, FiSun, FiTrendingUp, FiHeart, FiCpu } from "react-icons/fi";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

              {/* Get Started Button */}
              <a
                href="/auth/login"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Feature Tag */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 mb-8">
            <span className="text-purple-600 dark:text-purple-400">✨</span>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
              AI-Powered Journaling
            </span>
          </div>

          {/* Headline */}
          <h1 className={`text-5xl md:text-6xl font-bold mb-6 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            Your Personal{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smart Journaling Assistant
            </span>
          </h1>

          {/* Description */}
          <p className={`text-xl mb-12 max-w-2xl mx-auto leading-relaxed ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            Transform your thoughts into insights with AI-powered journaling. Track your mood, discover patterns, and grow with personalized reflections.
          </p>

          {/* Main CTA Button */}
          <a
            href="/auth/login"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Journaling Free
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          {/* AI Insights Card */}
          <div className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700" 
              : "bg-white/70 backdrop-blur-sm border border-gray-200"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
            }`}>
              <FiCpu className={`text-2xl ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              AI Insights
            </h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Get personalized insights and patterns from your journal entries powered by advanced AI
            </p>
          </div>

          {/* Mood Tracking Card */}
          <div className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700" 
              : "bg-white/70 backdrop-blur-sm border border-gray-200"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              isDarkMode ? "bg-pink-900/50" : "bg-pink-100"
            }`}>
              <FiHeart className={`text-2xl ${isDarkMode ? "text-pink-400" : "text-pink-600"}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Mood Tracking
            </h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Track your emotional well-being and discover what influences your mood over time
            </p>
          </div>

          {/* Growth Analytics Card */}
          <div className={`p-8 rounded-2xl transition-all duration-300 hover:scale-105 ${
            isDarkMode 
              ? "bg-slate-800/50 backdrop-blur-sm border border-slate-700" 
              : "bg-white/70 backdrop-blur-sm border border-gray-200"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              isDarkMode ? "bg-green-900/50" : "bg-green-100"
            }`}>
              <FiTrendingUp className={`text-2xl ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Growth Analytics
            </h3>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Visualize your personal growth journey with beautiful charts and statistics
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
