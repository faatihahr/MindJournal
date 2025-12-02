'use client';

interface StreakAnimationProps {
  show: boolean;
  isDarkMode: boolean;
}

export function StreakAnimation({ show, isDarkMode }: StreakAnimationProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Full page overlay with gradient */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100/30'} animate-pulse`} />
      
      {/* Large central star burst */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg 
          className={`w-32 h-32 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-500'}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
          style={{
            filter: 'drop-shadow(0 0 20px currentColor)',
            animation: 'starBurst 2s ease-out forwards'
          }}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      
      {/* Sparkling stars across the page */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={`absolute ${isDarkMode ? 'text-yellow-300' : 'text-yellow-500'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        >
          <svg 
            className={`w-${2 + Math.floor(Math.random() * 4)} h-${2 + Math.floor(Math.random() * 4)}`}
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 0 8px currentColor)',
              animation: `sparkle ${2 + Math.random() * 3}s ease-in-out infinite`
            }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
      
      {/* Falling stars from top */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`falling-${i}`}
          className={`absolute ${isDarkMode ? 'text-yellow-200' : 'text-yellow-400'}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            animation: `fall ${2 + Math.random() * 4}s ease-in forwards`,
            animationDelay: `${Math.random() * 2}s`
          }}
        >
          <svg 
            className={`w-${3 + Math.floor(Math.random() * 3)} h-${3 + Math.floor(Math.random() * 3)}`}
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 0 12px currentColor)',
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
      
      {/* Side burst stars */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`side-${i}`}
          className={`absolute ${isDarkMode ? 'text-yellow-300' : 'text-yellow-500'}`}
          style={{
            left: i % 2 === 0 ? '-20px' : 'calc(100% + 20px)',
            top: `${20 + Math.random() * 60}%`,
            animation: `sideBurst ${2 + Math.random() * 2}s ease-out forwards`,
            animationDelay: `${Math.random() * 1}s`,
            '--direction': i % 2 === 0 ? '200px' : '-200px'
          } as React.CSSProperties}
        >
          <svg 
            className="w-6 h-6"
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 0 10px currentColor)',
              transform: `rotate(${i % 2 === 0 ? 45 : -45}deg)`
            }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0.5) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: scale(2) rotate(180deg); 
          }
        }
        
        @keyframes fall {
          0% { 
            transform: translateY(-20px) rotate(0deg); 
            opacity: 0; 
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% { 
            transform: translateY(120vh) rotate(720deg); 
            opacity: 0; 
          }
        }
        
        @keyframes starBurst {
          0% { 
            transform: translate(-50%, -50%) scale(0) rotate(0deg); 
            opacity: 0; 
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5) rotate(180deg); 
            opacity: 1;
          }
          100% { 
            transform: translate(-50%, -50%) scale(1) rotate(360deg); 
            opacity: 0.8; 
          }
        }
        
        @keyframes sideBurst {
          0% { 
            transform: translateX(0) translateY(-50%) rotate(0deg); 
            opacity: 0; 
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translateX(var(--direction, 200px)) translateY(-50%) rotate(360deg); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
}
