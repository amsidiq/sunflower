import React, { useState, useEffect, useCallback } from 'react';
import TypingArea from './components/TypingArea';
import Results from './components/Results';
import { TestSettings, TestResult } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'typing' | 'results'>('typing');
  const [result, setResult] = useState<TestResult | null>(null);
  
  // Default Settings
  const [settings, setSettings] = useState<TestSettings>({
    mode: 'time',
    duration: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false
  });

  const handleComplete = (res: TestResult) => {
    setResult(res);
    setView('results');
  };

  const restartTest = useCallback(() => {
    setResult(null);
    setView('typing');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab to restart
      if (e.key === 'Tab') {
        e.preventDefault();
        restartTest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [restartTest]);

  const updateSetting = <K extends keyof TestSettings>(key: K, value: TestSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    restartTest(); // Restart immediately when settings change
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text selection:bg-sunflower-400 selection:text-dark-bg font-sans flex flex-col">
      
      {/* Header / Nav */}
      <header className="w-full max-w-6xl mx-auto p-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Logo Icon */}
          <div className="text-sunflower-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse-slow">
              <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" />
              <circle cx="12" cy="13" r="3" fill="#422006" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-sunflower-100 tracking-tight font-sans">type to sunflower</h1>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-dark-muted font-mono">
           <a href="#" className="hover:text-sunflower-400 transition-colors">v1.0.1</a>
           <div className="w-px h-4 bg-dark-surface"></div>
           <a href="#" className="hover:text-sunflower-400 transition-colors">github</a>
        </div>
      </header>

      {/* Main Config Bar - Only show when typing */}
      {view === 'typing' && (
        <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-dark-surface/50 rounded-lg p-1 flex items-center gap-1 font-mono text-sm">
             {/* Punctuation Toggle */}
             <button 
                onClick={() => updateSetting('includePunctuation', !settings.includePunctuation)}
                className={`px-3 py-1 rounded transition-colors ${settings.includePunctuation ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
             >
                @
             </button>
             <button 
                onClick={() => updateSetting('includeNumbers', !settings.includeNumbers)}
                className={`px-3 py-1 rounded transition-colors ${settings.includeNumbers ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
             >
                #
             </button>
             
             <div className="w-1 h-4 bg-dark-bg mx-2 rounded-full"></div>

             {/* Mode Toggles */}
             <button 
                onClick={() => updateSetting('mode', 'time')}
                className={`px-3 py-1 rounded transition-colors ${settings.mode === 'time' ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
             >
                time
             </button>
             <button 
                onClick={() => updateSetting('mode', 'words')}
                className={`px-3 py-1 rounded transition-colors ${settings.mode === 'words' ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
             >
                words
             </button>

             <div className="w-1 h-4 bg-dark-bg mx-2 rounded-full"></div>

             {/* Duration/Count Toggles */}
             {settings.mode === 'time' ? (
                <>
                  {[15, 30, 60].map((d) => (
                    <button 
                      key={d}
                      onClick={() => updateSetting('duration', d as any)}
                      className={`px-3 py-1 rounded transition-colors ${settings.duration === d ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
                    >
                      {d}
                    </button>
                  ))}
                </>
             ) : (
                <>
                   {[10, 25, 50].map((c) => (
                    <button 
                      key={c}
                      onClick={() => updateSetting('wordCount', c as any)}
                      className={`px-3 py-1 rounded transition-colors ${settings.wordCount === c ? 'text-sunflower-400' : 'text-dark-muted hover:text-dark-text'}`}
                    >
                      {c}
                    </button>
                  ))}
                </>
             )}
          </div>
        </div>
      )}

      {/* Main Content - Shifted up with justify-start and top padding */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-8 flex flex-col justify-start pt-8 pb-64">
        {view === 'typing' ? (
           <TypingArea settings={settings} onComplete={handleComplete} />
        ) : (
           result && <Results result={result} onRestart={restartTest} />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center p-6 pb-24 text-dark-muted text-xs font-mono">
        <p>start typing to begin • tab to restart</p>
      </footer>
    </div>
  );
};

export default App;