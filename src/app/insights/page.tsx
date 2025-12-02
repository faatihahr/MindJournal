'use client';

import { InsightsModal } from '@/components/insights-modal';
import { useEffect, useState } from 'react';

export default function Insights() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-purple-50 via-white to-pink-50'}`}>
      <InsightsModal 
        isOpen={true} 
        onClose={() => window.history.back()} 
        isDarkMode={isDarkMode} 
      />
    </div>
  );
}
