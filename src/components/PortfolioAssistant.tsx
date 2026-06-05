import { useState } from 'react';
import { Portfolio } from '../types/portfolio';
import { askAssistant, AssistantResponse } from '../utils/assistant';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

interface PortfolioAssistantProps {
  portfolios: Portfolio[];
}

export default function PortfolioAssistant({ portfolios }: PortfolioAssistantProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AssistantResponse | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const res = askAssistant(query, portfolios);
    setResponse(res);
  };

  const handleSuggestion = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    const res = askAssistant(suggestedQuery, portfolios);
    setResponse(res);
  };

  const suggestions = [
    'How much have I invested in mutual funds this year?',
    'Which asset gave the highest return?',
    'Show all investments maturing in 2027',
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-5 text-slate-100 shadow-xl relative overflow-hidden">
      {/* Decorative background accent */}
      <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-blue-400" />
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
          AI Portfolio Assistant
        </h3>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
        Ask natural language questions about your family portfolio assets, returns, and timelines.
      </p>

      {/* Suggested Questions */}
      <div className="flex flex-col gap-2 mb-5">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Suggested Queries:</p>
        <div className="flex flex-col gap-1.5">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestion(s)}
              className="text-left text-[10.5px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-slate-800/40 border border-slate-700/30 px-3 py-2 rounded-xl transition-all"
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-slate-800 border border-slate-750 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-500 transition-colors"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-blue-500/15"
          aria-label="Send query"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Answer Area */}
      {response && (
        <div className="bg-slate-850/60 border border-slate-750/40 rounded-xl p-4 space-y-3 animate-stitch-fade">
          <div className="flex gap-2 items-start">
            <MessageSquare size={14} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </p>
          </div>

          {response.matchedAssets.length > 0 && (
            <div className="pt-2 border-t border-slate-750/40 space-y-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Matching Asset Classes:</p>
              <div className="space-y-1.5">
                {response.matchedAssets.map((asset, idx) => (
                  <div key={idx} className="bg-slate-800/80 rounded-lg p-2.5 flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-200">{asset.name}</span>
                      <span className="text-slate-500 bg-slate-750 px-1.5 py-0.5 rounded text-[8px] uppercase">{asset.type}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold">{asset.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
