import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

interface LoadingIntroProps {
  onComplete: () => void;
}

export default function LoadingIntro({ onComplete }: LoadingIntroProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 200),   // Logo fade in
      setTimeout(() => setStage(2), 600),   // Text fade in
      setTimeout(() => setStage(3), 1000),  // Progress bar
      setTimeout(() => setStage(4), 1800),  // Fade out
      setTimeout(() => onComplete(), 2400), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-background flex flex-col items-center justify-center z-50 transition-all duration-700 ease-out ${
        stage >= 4 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Logo */}
      <div 
        className={`transform transition-all duration-1000 ease-out ${
          stage >= 1 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-6'
        }`}
      >
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
          <MessageSquare className="h-10 w-10 text-primary-foreground" />
        </div>
      </div>

      {/* App Name */}
      <div 
        className={`transform transition-all duration-900 ease-out delay-200 ${
          stage >= 2 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-6'
        }`}
      >
        <h1 className="text-sm font-bold text-foreground mb-2 tracking-tight">
          SMS Messaging
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Professional SMS Management
        </p>
      </div>

      {/* Loading Progress */}
      <div 
        className={`w-48 h-1 bg-muted rounded-full overflow-hidden transition-all duration-500 delay-500 ${
          stage >= 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div 
          className={`h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out ${
            stage >= 3 ? 'w-full' : 'w-0'
          }`}
        />
      </div>

      {/* Loading dots */}
      <div 
        className={`flex space-x-1 mt-6 transition-all duration-500 delay-700 ${
          stage >= 3 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
}