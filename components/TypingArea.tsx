import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestSettings, CharacterState, TestResult } from '../types';
import { generateText } from '../services/geminiService';

interface TypingAreaProps {
  settings: TestSettings;
  onComplete: (result: TestResult) => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({ settings, onComplete }) => {
  const [targetText, setTargetText] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [status, setStatus] = useState<'loading' | 'waiting' | 'running' | 'finished'>('loading');
  const [timeLeft, setTimeLeft] = useState<number>(settings.duration);
  const [stats, setStats] = useState({ wpm: 0, raw: 0, accuracy: 100 });
  const [history, setHistory] = useState<{ time: number; wpm: number; raw: number }[]>([]);
  const [isError, setIsError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use ReturnType<typeof setInterval> to handle both browser (number) and Node (Timeout) environments
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Logic
  const playSound = useCallback((type: 'correct' | 'error' | 'finish') => {
    if (isMuted) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    if (type === 'finish') {
        // Play a major triad arpeggio (C E G)
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
             const osc = ctx.createOscillator();
             const gain = ctx.createGain();
             osc.connect(gain);
             gain.connect(ctx.destination);
             
             osc.type = 'sine';
             osc.frequency.value = freq;
             
             gain.gain.setValueAtTime(0.05, now + i * 0.1);
             gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
             
             osc.start(now + i * 0.1);
             osc.stop(now + i * 0.1 + 0.6);
        });
        return;
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'correct') {
      // Soft mechanical click: high freq sine with very fast decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      
      gainNode.gain.setValueAtTime(0.08, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'error') {
      // Dull thud: low triangle wave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.16);
    }
  }, [isMuted]);

  // Load Text
  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      setStatus('loading');
      setUserInput("");
      const text = await generateText(settings);
      if (isMounted) {
        setTargetText(text);
        setStatus('waiting');
        setTimeLeft(settings.duration);
        
        // Auto-focus logic
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    loadContent();
    return () => { isMounted = false; };
  }, [settings]);

  // Handle Focus
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Timer Logic
  useEffect(() => {
    if (status === 'running' && settings.mode === 'time') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        const remaining = Math.max(0, settings.duration - Math.floor(elapsed));
        
        setTimeLeft(remaining);
        calculateStats(elapsed);

        if (remaining === 0) {
          finishTest();
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, settings.mode, settings.duration]);

  const calculateStats = (elapsedSeconds: number) => {
    if (elapsedSeconds <= 0) return;
    
    // Standard WPM calculation: (all chars / 5) / minutes
    const wordsTyped = userInput.length / 5;
    const minutes = elapsedSeconds / 60;
    const currentRawWpm = Math.round(wordsTyped / minutes);
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (i < targetText.length && userInput[i] === targetText[i]) {
        correctChars++;
      }
    }
    const currentAccuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;
    const currentNetWpm = Math.round((correctChars / 5) / minutes);

    setStats({
      wpm: currentNetWpm,
      raw: currentRawWpm,
      accuracy: currentAccuracy
    });

    setHistory(prev => [...prev, { time: Math.floor(elapsedSeconds), wpm: currentNetWpm, raw: currentRawWpm }]);
  };

  const finishTest = () => {
    if (status === 'finished') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('finished');
    playSound('finish');
    
    // Final stats calculation
    let correctChars = 0;
    let incorrectChars = 0;
    const extraChars = 0; // Simplified for now
    
    for (let i = 0; i < userInput.length; i++) {
        if (i < targetText.length) {
            if (userInput[i] === targetText[i]) correctChars++;
            else incorrectChars++;
        }
    }

    const missedChars = targetText.length - userInput.length;
    
    onComplete({
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      rawWpm: stats.raw,
      correctChars,
      incorrectChars,
      missedChars: Math.max(0, missedChars),
      extraChars,
      history,
      timestamp: Date.now()
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === 'finished' || status === 'loading') return;

    const val = e.target.value;
    
    // Check for character addition (typing) vs deletion
    if (val.length > userInput.length) {
        const lastCharIndex = val.length - 1;
        // Check if the newly typed character is incorrect
        // Either it doesn't match target, OR we are past the end of target text (extra chars)
        const isIncorrect = (lastCharIndex >= targetText.length) || (val[lastCharIndex] !== targetText[lastCharIndex]);
        
        if (isIncorrect) {
            setIsError(true);
            playSound('error');
        } else {
            playSound('correct');
        }
    }

    if (status === 'waiting') {
      setStatus('running');
      startTimeRef.current = Date.now();
    }

    setUserInput(val);

    // Check for word mode completion
    if (settings.mode === 'words' && val.length >= targetText.length) {
       const elapsed = (Date.now() - startTimeRef.current) / 1000;
       calculateStats(elapsed);
       finishTest();
    }
  };

  // Keep focus
  useEffect(() => {
    const handleBlur = () => {
        // Optional: Show "Click to focus" overlay
    };
    const ref = inputRef.current;
    if(ref) ref.addEventListener('blur', handleBlur);
    return () => {
        if(ref) ref.removeEventListener('blur', handleBlur);
    }
  }, []);


  // Render the text characters
  const renderChars = () => {
    return targetText.split('').map((char, index) => {
      // Added tracking-wide (letter-spacing) and leading-loose (line-height)
      let className = "font-mono text-2xl tracking-wide leading-loose transition-colors duration-75 ";
      let isCursor = false;
      
      if (index === userInput.length) {
        isCursor = true;
      }

      if (index < userInput.length) {
        if (userInput[index] === char) {
          className += "text-sunflower-400"; // Correct
        } else {
          className += "text-red-500 underline decoration-red-500"; // Incorrect
        }
      } else {
        className += "text-dark-muted"; // Pending
      }

      return (
        <span key={index} className="relative inline-block">
            {isCursor && status === 'running' && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-sunflower-400 animate-pulse"></span>
            )}
            {/* Blinking cursor when waiting */}
             {isCursor && status === 'waiting' && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-sunflower-400 animate-blink"></span>
            )}
            {char}
        </span>
      );
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-sunflower-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sunflower-100 font-mono animate-pulse">Growing sunflowers...</p>
      </div>
    );
  }

  return (
    <div 
        className="w-full max-w-4xl mx-auto flex flex-col items-center outline-none"
        onClick={handleContainerClick}
        ref={containerRef}
    >
        {/* Stats Header */}
        <div className="flex w-full justify-between mb-8 text-sunflower-400 font-mono text-xl opacity-80">
            <div className="flex items-center gap-6">
                <span>{settings.mode === 'time' ? timeLeft : `${userInput.split(' ').length}/${settings.wordCount}`}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); inputRef.current?.focus(); }}
                  className="hover:text-sunflower-100 transition-colors p-1"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  )}
                </button>
            </div>
            <div>{stats.wpm} WPM</div>
        </div>

        {/* Typing Area */}
        <div 
            className={`relative w-full min-h-[150px] leading-relaxed break-all select-none cursor-text p-4 rounded-lg transition-all duration-100 ${
                isError ? 'animate-shake border border-red-500/50 bg-red-500/5' : 'border border-transparent'
            }`}
            onAnimationEnd={() => setIsError(false)}
        >
            <input
                ref={inputRef}
                type="text"
                className="absolute opacity-0 w-0 h-0 cursor-default"
                value={userInput}
                onChange={handleInput}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
            />
            
            <div className="pointer-events-none">
                {renderChars()}
            </div>
        </div>

        <div className="mt-12 text-dark-muted text-sm font-sans flex items-center gap-2 opacity-50">
            <kbd className="px-2 py-1 bg-dark-surface rounded">tab</kbd> to restart
            <kbd className="px-2 py-1 bg-dark-surface rounded">esc</kbd> to menu
        </div>
    </div>
  );
};

export default TypingArea;