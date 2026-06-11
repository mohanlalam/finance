import { useState, useRef, useEffect, useMemo } from 'react';
import { Portfolio } from '../types/portfolio';
import { askAssistant, AssistantResponse } from '../utils/assistant';
import { MessageSquare, Send, Sparkles, Trash2 } from 'lucide-react';

interface PortfolioAssistantProps {
  portfolios: Portfolio[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

// Simple custom markdown parser to convert basic elements into JSX
const parseBoldAndCode = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-slate-100">{part}</strong>;
    }
    const codeParts = part.split('`');
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (j % 2 === 1) {
          return <code key={`${i}-${j}`} className="bg-slate-800/80 px-1.5 py-0.5 rounded text-blue-400 font-mono text-[9.5px]">{cp}</code>;
        }
        return cp;
      });
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    if (line.startsWith('### ')) {
      return (
        <h4 key={lineIdx} className="text-[10px] font-bold text-slate-200 mt-2.5 mb-1 tracking-wider uppercase">
          {parseBoldAndCode(line.slice(4))}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={lineIdx} className="text-[11px] font-bold text-slate-100 mt-3 mb-1.5 tracking-wider uppercase">
          {parseBoldAndCode(line.slice(3))}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={lineIdx} className="text-xs font-bold text-slate-100 mt-3.5 mb-2 tracking-widest uppercase">
          {parseBoldAndCode(line.slice(2))}
        </h2>
      );
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <ul key={lineIdx} className="list-disc pl-4 my-0.5 text-[10.5px] text-slate-300">
          <li className="py-0.5">{parseBoldAndCode(line.slice(2))}</li>
        </ul>
      );
    }
    const olMatch = line.match(/^(\d+)\.\s(.*)/);
    if (olMatch) {
      return (
        <ol key={lineIdx} className="list-decimal pl-4 my-0.5 text-[10.5px] text-slate-300">
          <li className="py-0.5" value={parseInt(olMatch[1])}>{parseBoldAndCode(olMatch[2])}</li>
        </ol>
      );
    }
    if (line.trim() === '') {
      return <div key={lineIdx} className="h-1.5" />;
    }
    return (
      <p key={lineIdx} className="text-[10.5px] text-slate-300 leading-relaxed my-0.5">
        {parseBoldAndCode(line)}
      </p>
    );
  });
};

function getDynamicSuggestions(portfolios: Portfolio[]): string[] {
  const suggestions: string[] = [];
  const today = new Date();

  // 1. Check for FDs maturing in next 60 days
  const hasUpcomingFD = portfolios.some(p =>
    p.fixedDeposits.some(fd => {
      if (!fd.maturity_date) return false;
      const mDate = new Date(fd.maturity_date);
      const days = (mDate.getTime() - today.getTime()) / 86400000;
      return days > 0 && days < 60 && fd.status === 'active';
    })
  );
  if (hasUpcomingFD) {
    suggestions.push('Show FDs maturing soon');
  }

  // 2. Check for upcoming insurance renewals in next 30 days
  const hasUpcomingInsurance = portfolios.some(p =>
    p.insurances.some(ins => {
      if (!ins.renewal_date) return false;
      const rDate = new Date(ins.renewal_date);
      const days = (rDate.getTime() - today.getTime()) / 86400000;
      return days > 0 && days < 30;
    })
  );
  if (hasUpcomingInsurance) {
    suggestions.push('Show upcoming insurance renewals');
  }

  // 3. Defaults
  if (suggestions.length < 3) {
    suggestions.push('Which asset gave the highest return?');
  }
  if (suggestions.length < 3) {
    suggestions.push('What is my total asset allocation split?');
  }
  if (suggestions.length < 3) {
    suggestions.push('When is my next SIP?');
  }
  if (suggestions.length < 3) {
    suggestions.push('Show family member breakdown');
  }

  return suggestions.slice(0, 3);
}

export default function PortfolioAssistant({ portfolios }: PortfolioAssistantProps) {
  const welcomeMessage = useMemo<ChatMessage>(() => ({
    id: 'welcome',
    role: 'assistant',
    text: "Hello! I am your **AI Portfolio Assistant**. You can ask me questions about your family portfolio's performance, upcoming maturities, insurance renewals, and asset allocation split.\n\nTry clicking one of the suggested queries below or type your question!"
  }), []);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize messages list
  useEffect(() => {
    setMessages([welcomeMessage]);
  }, [welcomeMessage]);

  // Generate dynamic suggestions
  const suggestions = useMemo(() => getDynamicSuggestions(portfolios), [portfolios]);

  // Scroll to bottom when history or typing status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // '/' keyboard focus hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerAssistant = async (userQuery: string) => {
    if (!userQuery.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: userQuery
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    // Artificial brief latency for standard typing bubble feedback
    await new Promise(r => setTimeout(r, 450));

    try {
      const res = askAssistant(userQuery, portfolios);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: res.answer,
        response: res
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: "I ran into a problem fetching portfolio details. Please check your data values and try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAssistant(query);
  };

  const handleSuggestion = (suggestedQuery: string) => {
    triggerAssistant(suggestedQuery);
  };

  const handleClear = () => {
    setMessages([welcomeMessage]);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-2xl p-4 sm:p-5 text-slate-100 shadow-xl relative overflow-hidden flex flex-col h-[400px]">
      {/* Decorative background accent */}
      <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-3.5 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            AI Portfolio Assistant
          </h3>
        </div>
        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-red-400 transition-colors bg-slate-800/40 hover:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/25 active:scale-95"
            title="Reset conversation"
          >
            <Trash2 size={11} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Chat History View */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className="w-full">
            {msg.role === 'user' ? (
              <div className="flex justify-end w-full animate-stitch-fade">
                <div className="bg-blue-600 border border-blue-500/30 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-[10.5px] max-w-[85%] font-medium shadow-md shadow-blue-600/10">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 items-start w-full animate-stitch-fade">
                <div className="flex gap-2 items-start w-full">
                  <MessageSquare size={13} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    {renderMarkdown(msg.text)}
                  </div>
                </div>
                
                {msg.response && msg.response.matchedAssets && msg.response.matchedAssets.length > 0 && (
                  <div className="pl-5 w-full space-y-1.5">
                    <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Matching Asset Classes:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {msg.response.matchedAssets.map((asset, idx) => (
                        <div key={idx} className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-2 flex flex-col gap-0.5 text-left">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-200 truncate pr-2">{asset.name}</span>
                            <span className="text-slate-500 bg-slate-750 px-1 py-0.5 rounded text-[7.5px] uppercase shrink-0">{asset.type}</span>
                          </div>
                          <span className="text-[8.5px] text-slate-400 font-semibold truncate">{asset.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 items-start w-full animate-pulse">
            <MessageSquare size={13} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="flex items-center gap-1.5 bg-slate-800/40 px-3.5 py-2 rounded-xl border border-slate-700/10">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3 shrink-0">
          <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">Suggested Queries:</p>
          <div className="flex flex-wrap gap-1.5 max-h-[56px] overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="text-left text-[9.5px] text-blue-400 hover:text-blue-300 font-semibold hover:underline bg-slate-800/40 border border-slate-700/35 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
              >
                &ldquo;{s}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={handleSearch} className="flex gap-2 shrink-0 z-10">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question... (Press '/' to focus)"
          className="flex-1 bg-slate-800 border border-slate-750 focus:border-blue-500 rounded-xl px-3.5 py-2 text-[11px] text-slate-200 focus:outline-none placeholder-slate-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-blue-500/15 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:active:scale-100"
          aria-label="Send query"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

