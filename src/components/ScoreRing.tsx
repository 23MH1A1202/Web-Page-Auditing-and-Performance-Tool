import React from 'react';
import { motion } from 'motion/react';

interface ScoreRingProps {
  score: number;
  label?: string; // Optional since we render it outside now
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  // Using 48 for cx/cy based on w-24/h-24 (96px)
  const cx = 48;
  const cy = 48;
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Determine color based on Lighthouse thresholds
  let colorClass = "text-red-500";
  if (score >= 90) {
    colorClass = "text-emerald-500";
  } else if (score >= 50) {
    colorClass = "text-amber-500";
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg
          viewBox="0 0 96 96"
          className="w-full h-full transform -rotate-90"
        >
          {/* Background Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 transition-colors duration-300"
          />
          {/* Progress Ring */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            className={colorClass}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute text-2xl font-bold text-slate-800">
          {score}
        </span>
      </div>
      {label && <h3 className="text-sm font-bold tracking-tight text-slate-500">{label}</h3>}
    </div>
  );
}
