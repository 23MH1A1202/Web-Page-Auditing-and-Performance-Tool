import React from 'react';
import { AuditItem } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditListProps {
  audits: AuditItem[];
  category: string;
}

export function AuditList({ audits, category }: AuditListProps) {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  const categoryAudits = audits.filter(a => a.category === category);

  if (categoryAudits.length === 0) return null;

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'pass':
        return <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>;
      case 'average':
        return <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>;
      case 'fail':
        return <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>;
      default:
        return null;
    }
  };

  return (
    <div className="divide-y divide-slate-100 flex flex-col">
      {categoryAudits.map((audit, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <div 
            key={index} 
            className="group flex flex-col"
          >
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 pr-4">
                {getStatusDot(audit.status)}
                <span className="text-sm text-slate-700 font-medium">{audit.title}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm font-mono text-slate-400">
                  {audit.displayValue}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-slate-50/50"
                >
                  <div className="px-6 py-4 pl-11 text-sm text-slate-600">
                    {audit.description}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
