import { getUserInsights } from './actions';
import { GenerateButton } from './generate-button';

type MoodCount = {
  mood: string;
  count: number;
};

type WeeklyInsight = {
  id: string;
  summary: string;
  top_themes: string[];
  mood_trend: MoodCount[];
  created_at: string;
};

export default async function Insights() {
  // Fetch data on server-side with valid session
  const result = await getUserInsights();
  
  if (result.error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="py-10">
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Error</h2>
                  <p className="text-muted-foreground">{result.error}</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const insights = result.data as WeeklyInsight[];

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      'Happy': 'bg-green-100 text-green-800',
      'Neutral': 'bg-yellow-100 text-yellow-800',
      'Sad': 'bg-blue-100 text-blue-800',
      'Angry': 'bg-red-100 text-red-800',
      'Anxious': 'bg-purple-100 text-purple-800',
      'Stressed': 'bg-red-100 text-red-800',
      'Tired': 'bg-gray-100 text-gray-800',
      'Excited': 'bg-pink-100 text-pink-800',
      'Grateful': 'bg-indigo-100 text-indigo-800',
    };
    return colors[mood] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Smart Journal</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Journal
                </a>
                <a
                  href="/insights"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Insights
                </a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <form action="/auth/signout" method="POST">
                <button type="submit" className="btn-primary">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Weekly Insights</h2>
                <GenerateButton />
              </div>

              {insights.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No insights yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Generate your first weekly insight to see your journaling patterns.
                  </p>
                  <div className="mt-6">
                    <GenerateButton />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {insights.map((insight) => (
                    <div key={insight.id} className="bg-white shadow overflow-hidden rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              Weekly Insight • {new Date(insight.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">
                              {insight.summary}
                            </p>
                            
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Top Themes</h4>
                              <div className="flex flex-wrap gap-2">
                                {insight.top_themes.map((theme) => (
                                  <span
                                    key={theme}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                  >
                                    {theme}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Mood Trend</h4>
                              <div className="flex flex-wrap gap-2">
                                {insight.mood_trend.map(({ mood, count }) => (
                                  <span
                                    key={mood}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoodColor(mood)}`}
                                  >
                                    {mood}: {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
