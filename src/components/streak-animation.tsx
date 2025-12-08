'use client';

interface StreakAnimationProps {
  show: boolean;
  isDarkMode: boolean;
}

export function StreakAnimation({ show, isDarkMode }: StreakAnimationProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Full page overlay with fire gradient */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-100/30'} animate-pulse`} />

      {/* Large central fire burst */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <svg
            className={`w-32 h-32 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}
            viewBox="0 0 24 32"
            style={{
              filter: 'drop-shadow(0 0 25px rgba(249, 115, 22, 0.8))',
              animation: 'fireBurst 2s ease-out forwards'
            }}
          >
            <path
              d="M12 2C9 2 7 4 7 6C7 8 5 10 5 12C5 14 7 16 9 16C11 16 13 14 13 12C13 10 15 8 15 6C15 4 13 2 12 2Z"
              fill="currentColor"
            />
          </svg>
          {/* Inner flame */}
          <svg
            className={`absolute top-1 left-1 w-24 h-24 ${isDarkMode ? 'text-red-400' : 'text-red-500'} opacity-70`}
            viewBox="0 0 24 32"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6))',
              animation: 'fireBurst 2s ease-out forwards'
            }}
          >
            <path
              d="M12 4C10 4 9 5 9 7C9 9 8 10 8 11C8 12 9 13 10 13C11 13 12 12 12 11C12 10 13 9 13 7C13 5 12 4 12 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Ember particles across the page */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute ${isDarkMode ? 'text-orange-300' : 'text-orange-400'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        >
          <svg
            className={`w-${2 + Math.floor(Math.random() * 4)} h-${2 + Math.floor(Math.random() * 4)}`}
            viewBox="0 0 10 10"
            style={{
              filter: 'drop-shadow(0 0 8px currentColor)',
              animation: `emberGlow ${2 + Math.random() * 3}s ease-in-out infinite`
            }}
          >
            <circle cx="5" cy="5" r="3" fill="currentColor"/>
          </svg>
        </div>
      ))}

      {/* Falling embers */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`falling-${i}`}
          className={`absolute ${isDarkMode ? 'text-orange-300' : 'text-orange-400'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animation: `emberFall ${2 + Math.random() * 4}s ease-in forwards`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          <svg
            className={`w-${3 + Math.floor(Math.random() * 3)} h-${3 + Math.floor(Math.random() * 3)}`}
            viewBox="0 0 10 10"
            style={{
              filter: 'drop-shadow(0 0 12px currentColor)',
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            <circle cx="5" cy="5" r="4" fill="currentColor"/>
          </svg>
        </div>
      ))}

      {/* Side fire bursts */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`side-${i}`}
          className={`absolute ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}
          style={{
            left: i % 2 === 0 ? '-20px' : 'calc(100% + 20px)',
            top: `${20 + Math.random() * 60}%`,
            animation: `fireSideBurst ${2 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 1}s`,
            '--direction': i % 2 === 0 ? '200px' : '-200px'
          } as React.CSSProperties}
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 32"
            style={{
              filter: 'drop-shadow(0 0 10px currentColor)',
              transform: `rotate(${i % 2 === 0 ? 45 : -45}deg)`
            }}
          >
            <path
              d="M12 4C10 4 9 5 9 7C9 9 8 10 8 11C8 12 9 13 10 13C11 13 12 12 12 11C12 10 13 9 13 7C13 5 12 4 12 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}

      {/* Smoke particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`smoke-${i}`}
          className="absolute"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${Math.random() * 50}%`,
            animation: `smokeRise ${3 + Math.random() * 2}s ease-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          <div className="w-2 h-2 bg-gray-400 rounded-full opacity-40" />
        </div>
      ))}

      <style jsx>{`
        @keyframes emberGlow {
          0%, 100% {
            opacity: 0;
            transform: scale(0.3) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.5) rotate(180deg);
          }
        }

        @keyframes emberFall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
            transform: translateY(120vh) rotate(720deg) scale(0.8);
          }
          100% {
            transform: translateY(120vh) rotate(720deg) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes fireBurst {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.8) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2) rotate(360deg);
            opacity: 0.7;
          }
        }

        @keyframes fireSideBurst {
          0% {
            transform: translateX(0) translateY(-50%) rotate(0deg) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translateX(calc(var(--direction) / 3)) translateY(-50%) rotate(180deg) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateX(var(--direction, 200px)) translateY(-50%) rotate(360deg) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes smokeRise {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 0.4;
            transform: translateY(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
