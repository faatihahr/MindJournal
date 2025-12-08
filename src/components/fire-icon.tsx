'use client';

interface FireIconProps {
  streak: number;
  isExcited: boolean;
  className?: string;
}

export function FireIcon({ streak, isExcited, className = "" }: FireIconProps) {
  if (streak === 0) {
    // Extinguished state - smoke/ash
    return (
      <div className={`relative inline-block ${className}`}>
        <div className="relative w-8 h-8">
          {/* Smoke particles */}
          <div className="absolute inset-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-gray-400 rounded-full opacity-60"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${10 + i * 5}%`,
                  animationName: 'smoke',
                  animationDuration: `${2 + i * 0.5}s`,
                  animationTimingFunction: 'ease-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          {/* Burnt wood */}
          <div className="w-6 h-3 bg-gray-600 rounded-full mx-auto mt-4" />
          <div className="w-4 h-1 bg-gray-700 rounded-full mx-auto mt-1" />
        </div>
        <style jsx>{`
          @keyframes smoke {
            0%, 100% {
              opacity: 0;
              transform: translateY(0) scale(0.8);
            }
            50% {
              opacity: 0.6;
              transform: translateY(-8px) scale(1.2);
            }
          }
        `}</style>
      </div>
    );
  }

  // Burning states - flame with different intensities
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="relative w-8 h-8">
        {/* Flame base */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <svg
            className={`w-6 h-8 ${isExcited ? 'text-orange-400' : 'text-orange-500'}`}
            viewBox="0 0 24 32"
            style={{
              filter: isExcited ? 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.8))' : 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))',
              animationName: isExcited ? 'excitedFlame' : 'gentleFlame',
              animationDuration: isExcited ? '0.3s' : '3s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: isExcited ? 'infinite alternate' : 'infinite'
            }}
          >
            <path
              d="M12 2C10 2 8 4 8 6C8 8 6 10 6 12C6 14 8 16 10 16C12 16 14 14 14 12C14 10 16 8 16 6C16 4 14 2 12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Spark particles */}
        {[...Array(isExcited ? 8 : 5)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 ${isExcited ? 'bg-orange-300' : 'bg-yellow-300'} rounded-full`}
            style={{
              left: `${30 + (i % 3) * 15}%`,
              top: `${20 + (i % 3) * 15}%`,
              animationName: 'sparkle',
              animationDuration: `${isExcited ? 0.5 : 1 + i * 0.2}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}

        {/* Intense flame effects when excited */}
        {isExcited && (
          <>
            {/* Larger flame outline */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <svg
                className="w-8 h-10 text-red-500 opacity-70"
                viewBox="0 0 24 32"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.5))',
                  animationName: 'excitedFlame',
                  animationDuration: '0.2s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite alternate'
                }}
              >
                <path
                  d="M12 1C9 1 7 3 7 5C7 7 5 9 5 11C5 13 7 15 9 15C11 15 13 13 13 11C13 9 15 7 15 5C15 3 13 1 12 1Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            {/* Extra sparks */}
            {[...Array(4)].map((_, i) => (
              <div
                key={`extra-${i}`}
                className="absolute w-0.5 h-0.5 bg-red-400 rounded-full"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${10 + i * 10}%`,
                  animationName: 'extraSpark',
                  animationDuration: '0.3s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes gentleFlame {
          0%, 100% {
            transform: scale(0.95) rotate(-2deg);
          }
          50% {
            transform: scale(1.05) rotate(2deg);
          }
        }

        @keyframes excitedFlame {
          0% {
            transform: scale(1) rotate(0deg);
          }
          100% {
            transform: scale(1.2) rotate(5deg);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        @keyframes extraSpark {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
