
import React, { useEffect, useState } from 'react';

interface RadarProps {
  onScanComplete: () => void;
  scanning: boolean;
}

const Radar: React.FC<RadarProps> = ({ onScanComplete, scanning }) => {
  const [dots, setDots] = useState<{x: number, y: number, id: number}[]>([]);

  useEffect(() => {
    if (scanning) {
      const timer = setTimeout(() => {
        onScanComplete();
      }, 4000);
      
      const interval = setInterval(() => {
        setDots(prev => [
          ...prev.slice(-10),
          { 
            x: Math.random() * 80 + 10, 
            y: Math.random() * 80 + 10, 
            id: Date.now() 
          }
        ]);
      }, 800);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [scanning, onScanComplete]);

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto bg-zinc-900/50 rounded-full border border-emerald-500/30 overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
      {/* Scanning Sweep */}
      <div className={`absolute inset-0 border-l-2 border-emerald-500/40 origin-center transition-opacity duration-500 ${scanning ? 'opacity-100' : 'opacity-0'}`}
           style={{
             background: 'linear-gradient(to right, rgba(16, 185, 129, 0.2) 0%, transparent 10%)',
             animation: scanning ? 'spin 3s linear infinite' : 'none',
             transformOrigin: '50% 50%'
           }} />

      {/* Grid Lines */}
      <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-75" />
      <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-50" />
      <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-25" />
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-500/10" />
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/10" />

      {/* Animated Dots */}
      {dots.map(dot => (
        <div 
          key={dot.id}
          className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_#10b981]"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        />
      ))}

      {/* Center Point */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#fff] z-10" />
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Radar;
