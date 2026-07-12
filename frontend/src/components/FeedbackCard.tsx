import { useState } from "react";
import { ChevronDown, AlertCircle, Copy, Check } from "lucide-react";

interface FeedbackCardProps {
  section: string;
  issue: string;
  suggestion: string;
}

export default function FeedbackCard({ section, issue, suggestion }: FeedbackCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Native Browser Clipboard Processing Logic
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents clicking the copy button from closing the accordion card
    try {
      const textToCopy = `[${section}] ${issue}\nSuggestion: ${suggestion}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Resets the icon state after 2 seconds
    } catch (err) {
      console.error('Failed to copy text parameters:', err);
    }
  };

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left focus:outline-none bg-slate-900/40 transition-colors">
        <div className="flex items-center space-x-3 min-w-0">
          <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">{section} Optimization Target</span>
            {/* Extracted Core Analytical Problem Point (Enlarged to crisp text-sm baseline) */}
            <p className="text-sm font-semibold text-slate-200 truncate mt-0.5 leading-snug">
              {issue}
            </p>
          </div>
        </div>

        {/* Action Tray */}
        <div className="flex items-center space-x-3 shrink-0 ml-3">
          {/* Functional Copy Utility Trigger Icon */}
          <button
            onClick={handleCopy}
            title="Copy suggestion to clipboard"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400 animate-scaleIn" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button> 
                 
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${isOpen ? "transform rotate-180 text-cyan-400" : ""}`} />
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-900/60 bg-slate-950/20 animate-fadeIn">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-500/80 block">
              How to fix:
            </span>
            {/* Actionable Advice Parameter Wording (Enlarged to fluid text-sm + relaxed line spacing) */}
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {suggestion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}