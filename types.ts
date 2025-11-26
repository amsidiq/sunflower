export type TestMode = 'time' | 'words';
export type TestDuration = 15 | 30 | 60;
export type WordCount = 10 | 25 | 50;

export interface TestSettings {
  mode: TestMode;
  duration: TestDuration;
  wordCount: WordCount;
  includePunctuation: boolean;
  includeNumbers: boolean;
}

export interface CharacterState {
  char: string;
  status: 'correct' | 'incorrect' | 'pending' | 'extra';
}

export interface TestResult {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
  history: { time: number; wpm: number; raw: number }[];
  timestamp: number;
}
