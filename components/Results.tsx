import React from 'react';
import { TestResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResultsProps {
  result: TestResult;
  onRestart: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-surface border border-sunflower-900 p-2 rounded shadow-lg text-xs font-mono">
        <p className="text-sunflower-400">Time: {label}s</p>
        <p className="text-white">WPM: {payload[0].value}</p>
        {payload[1] && <p className="text-dark-text">Raw: {payload[1].value}</p>}
      </div>
    );
  }
  return null;
};

const Results: React.FC<ResultsProps> = ({ result, onRestart }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Big Stats */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="group">
            <h2 className="text-dark-muted text-xl font-medium mb-1">wpm</h2>
            <p className="text-6xl font-mono text-sunflower-400 font-bold">{result.wpm}</p>
          </div>
          <div className="group">
            <h2 className="text-dark-muted text-xl font-medium mb-1">acc</h2>
            <p className="text-6xl font-mono text-sunflower-400 font-bold">{result.accuracy}%</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 bg-dark-bg/50 rounded-xl p-4 border border-dark-surface">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#52525B" 
                tick={{fontSize: 12, fill: '#52525B'}} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#52525B" 
                tick={{fontSize: 12, fill: '#52525B'}} 
                tickLine={false}
                axisLine={false}
                domain={['dataMin - 10', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{stroke: '#52525B', strokeWidth: 1}} />
              <Line 
                type="monotone" 
                dataKey="wpm" 
                stroke="#FACC15" 
                strokeWidth={3} 
                dot={false} 
                activeDot={{r: 4, fill: '#FACC15'}} 
              />
              <Line 
                type="monotone" 
                dataKey="raw" 
                stroke="#52525B" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        <div className="bg-dark-surface/50 p-4 rounded-lg">
           <p className="text-dark-muted text-sm">test type</p>
           <p className="text-sunflower-100 font-mono">time 30</p>
        </div>
        <div className="bg-dark-surface/50 p-4 rounded-lg">
           <p className="text-dark-muted text-sm">raw wpm</p>
           <p className="text-sunflower-100 font-mono text-xl">{result.rawWpm}</p>
        </div>
         <div className="bg-dark-surface/50 p-4 rounded-lg">
           <p className="text-dark-muted text-sm">characters</p>
           <p className="text-sunflower-100 font-mono text-xl" title="correct/incorrect/missed/extra">
             {result.correctChars}/{result.incorrectChars}/{result.missedChars}/{result.extraChars}
           </p>
        </div>
         <div className="bg-dark-surface/50 p-4 rounded-lg">
           <p className="text-dark-muted text-sm">consistency</p>
           <p className="text-sunflower-100 font-mono text-xl">--%</p>
        </div>
        <div className="bg-dark-surface/50 p-4 rounded-lg">
           <p className="text-dark-muted text-sm">time</p>
           <p className="text-sunflower-100 font-mono text-xl">30s</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
            onClick={onRestart}
            className="group relative px-8 py-3 bg-transparent overflow-hidden rounded-md text-sunflower-400 transition-all duration-300 hover:text-dark-bg"
        >
            <div className="absolute inset-0 w-0 bg-sunflower-400 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
            <span className="relative font-mono font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                Next Test
            </span>
        </button>
      </div>
    </div>
  );
};

export default Results;
