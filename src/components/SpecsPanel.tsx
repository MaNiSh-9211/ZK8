import React from 'react';
import { X } from 'lucide-react';

interface SpecsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  specs: Record<string, string | undefined>;
}

export function SpecsPanel({ onClose, title, description, specs }: SpecsPanelProps) {
  return (
    <div className="h-full w-full bg-card/95 backdrop-blur-md border-l border-border overflow-y-auto flex flex-col">
      <div className="p-8 flex flex-col h-full">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="font-mono text-xs text-accent uppercase tracking-widest mb-2">
              Component Analysis
            </div>
            <h3 className="font-sans text-2xl font-bold uppercase tracking-tight leading-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-border hover:bg-white/5 transition-colors shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="font-mono text-sm text-muted-foreground leading-relaxed mb-10 border-l-2 border-accent pl-4">
          {description}
        </div>

        {/* Specs table */}
        <div className="space-y-1 flex-1">
          <div className="font-mono text-xs text-foreground uppercase tracking-widest border-b border-border/50 pb-2 mb-4">
            Technical Specifications
          </div>
          {Object.entries(specs)
            .filter(([, v]) => v !== undefined)
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b border-border/20 hover:bg-white/5 px-2 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground uppercase">{key}</span>
                <span className="font-mono text-xs font-bold text-foreground">{value}</span>
              </div>
            ))}
        </div>

        {/* Close */}
        <div className="mt-10">
          <button
            onClick={onClose}
            className="w-full py-4 border border-border/50 bg-background/50 font-mono text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
          >
            [ Resume Overview ]
          </button>
        </div>

      </div>
    </div>
  );
}
