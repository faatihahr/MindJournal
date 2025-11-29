'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateButton() {
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Force refresh to show new insight
        window.location.href = '/insights?' + Date.now();
      } else {
        console.error('Failed to generate insight');
      }
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {generating ? 'Generating...' : 'Generate Weekly Insight'}
    </button>
  );
}
