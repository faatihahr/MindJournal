'use client';

import { useState } from 'react';

interface Template {
  id: string;
  title: string;
  description: string;
  emoji: string;
  template: string;
  category: string;
}

interface TemplatePickerProps {
  onSelectTemplate: (template: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const templates: Template[] = [
  {
    id: 'reflection',
    title: 'Daily Reflection',
    description: 'Reflect on your day and thoughts',
    emoji: '🤔',
    category: 'Reflection',
    template: `What was the highlight of my day today?

How did I feel throughout the day?

What challenged me today?

What am I grateful for today?

How can I improve tomorrow?`
  },
  {
    id: 'todo-list',
    title: 'To-Do List',
    description: 'Plan and track your tasks',
    emoji: '📝',
    category: 'Planning',
    template: `📋 Today's Priority Tasks:

✅ Completed:
- Task 1
- Task 2

🔄 In Progress:
- Current task

⏳ Upcoming:
- Future task 1
- Future task 2

🎯 Main Goal for Today:
What do I want to accomplish?

📊 Progress Rating: /10`
  },
  {
    id: 'gratitude',
    title: 'Gratitude Journal',
    description: 'Focus on what you\'re thankful for',
    emoji: '🙏',
    category: 'Gratitude',
    template: `🙏 I'm grateful for...

🌟 Three good things that happened today:

🙌 People who made my day better:

✨ Small moments of joy:

💝 Something beautiful I noticed:

🌱 How I grew today:`
  },
  {
    id: 'evening-wind-down',
    title: 'Evening Wind-Down',
    description: 'Gentle self-care and reflection',
    emoji: '🌙',
    category: 'Wellness',
    template: `🌙 Evening Reflection

🌟 Today I accomplished:
-

🌱 Today I learned:
-

💆 Things that helped me relax:
- Gentle stretching
- Deep breathing
- Reading a favorite book

💭 Tomorrow's intention:
To approach my day with...

🛏️ Preparing for rest:
What can I do tonight to ensure good sleep?
What worries am I letting go of?

💕 Self-compassion note:
I am worthy of rest and tomorrow is a new beginning.`,
  },
  {
    id: 'navigating-challenge',
    title: 'Navigating a Challenge',
    description: 'Process difficulties and find solutions',
    emoji: '🧭',
    category: 'Problem Solving',
    template: `🧭 Current Challenge:
What am I dealing with?

🤔 How I'm feeling about it:
Emotional reactions:

🔍 What's stressing me most:
Specific concerns:

💡 Potential solutions I've thought of:
1.
2.
3.

🤝 Resources or support I have:
People I can talk to:
Skills or strengths I have:

✨ Small next step:
What can I do today to move forward?

🌟 Learning opportunity:
What might I learn from this situation?`,
  },
  {
    id: 'morning-ritual',
    title: 'Morning Intention',
    description: 'Start your day with positive focus',
    emoji: '🌅',
    category: 'Planning',
    template: `🌅 Morning Intention

🌟 Today I intend to...
[Focus energy towards what matters most]

💭 Current mindset:
Excited about:
Looking forward to:
Feeling concerned about:

🎯 Top 3 priorities:
1.
2.
3.

❤️ Selfcare focus:
What nurturing activity will help me start well?

✨ Affirmation:
I choose to...`,
  },
  {
    id: 'relationship-reflection',
    title: 'Relationship Reflection',
    description: 'Think about connections with others',
    emoji: '💕',
    category: 'Relationships',
    template: `💕 Relationship Reflection

👥 Key relationships I interacted with today:

❤️ Connection highlights:
Times I felt truly connected:
- Person with...
- Person with...
- Person with...

👂 Listening and communication:
Did I listen well?
What went unsaid?
How can I communicate better?

💝 Acts of kindness:
What I gave:
What I received:

🌱 Growth opportunities:
What relationship could I nurture?
How can I be a better friend/family member?`,
  },
  {
    id: 'creative-brainstorm',
    title: 'Creative Brainstorming',
    description: 'Capture ideas and creative sparks',
    emoji: '✨',
    category: 'Creativity',
    template: `✨ Creative Brainstorming

💡 Idea Spark:
What sparked creativity today?

🎨 Ideas generated:
1.
2.
3.

📝 Notes and details:
Colors, images, words that inspire:

🔗 Connections to other ideas:
How does this relate to my current projects?

⏰ Next action:
What small step can I take to develop this idea?

⚡ Creative energy level: /10`,
  },
  {
    id: 'stress-release',
    title: 'Stress Release',
    description: 'Acknowledge and release stress',
    emoji: '🌱',
    category: 'Wellness',
    template: `🌱 Stress Release

😰 Current stress level: /10

🎯 Stressors identified:
What factors contributed to my stress today?

👃 Body signals:
How did my body respond to the stress?

💨 Release strategies:
What helped me manage stress?
Deep breathing, walk in nature, talking to friends...

✨ What I learned about managing stress:
-

🕊️ Letting go:
What can I release? What needs my attention? What can wait?

💚 Self-compassion:
Normalizing that stress happens and I'm doing my best.`,
  },
  {
    id: 'learning-journal',
    title: 'Learning Journal',
    description: 'Track what you\'re learning',
    emoji: '📚',
    category: 'Growth',
    template: `📚 Learning Journal

🎯 What I learned today:
Key information/knowledge gained:
Skills practiced:

🤔 How I applied it:
Where did this learning show up in daily life?

💡 Aha moment:
What surprised me or shifted my perspective?

📋 Action steps:
How can I build on this knowledge tomorrow?

✨ Value created:
How does this help me move closer to my goals?

🧠 Learning mindset:
What questions do I still have?`,
  },
];

export function TemplatePicker({ onSelectTemplate, onClose, isDarkMode }: TemplatePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(templates.map(t => t.category))];

  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 p-4 overflow-y-auto">
      {/* Enhanced backdrop with gradient and blur - covers entire scrollable area */}
      <div className="fixed inset-0 bg-linear-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 backdrop-blur-md" />
      
      {/* Animated background patterns - fixed position */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000" />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mt-8 min-h-screen">
        {/* Modal container with enhanced background */}
        <div className={`rounded-3xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/40 border-purple-500/30 shadow-purple-500/20' 
            : 'bg-white/60 border-purple-300/50 shadow-purple-300/30'
        }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Journal Templates
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Start your entry with a guided template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 px-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-6">
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                onSelectTemplate(template.template);
                onClose();
              }}
              className={`p-6 text-left rounded-2xl border transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                isDarkMode
                  ? 'bg-slate-800/60 border-purple-500/20 hover:bg-slate-800/80 hover:border-purple-500/40'
                  : 'bg-white/80 border-purple-300/30 hover:bg-white/90 hover:border-purple-400/50'
              }`}
            >
              <div className="flex items-start space-x-3 mb-3">
                <span className="text-2xl">{template.emoji}</span>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {template.title}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.category}
                  </span>
                </div>
              </div>

              <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {template.description}
              </p>

              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-700/60 border border-purple-500/10' : 'bg-purple-50/50 border border-purple-200/30'
              }`}>
                <div className="font-mono text-xs line-clamp-4">
                  {template.template.split('\n').slice(0, 4).map((line, i) => (
                    <div key={i}>{line || '\u00A0'}</div>
                  ))}
                  {template.template.split('\n').length > 4 && (
                    <div className="text-ellipsis">...</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-6 px-6">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Templates help you get started - you can always edit or customize them!
          </p>
        </div>
        </div> {/* Close modal container */}
        
        {/* Extra padding for scroll space */}
        <div className="h-32"></div>
      </div>
    </div>
  );
}
