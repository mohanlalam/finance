import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Portfolio } from '../types/portfolio';
import { askAssistant, AssistantResponse } from '../utils/assistant';
import { Send, Sparkles, Trash2, Copy, Check, Bot, User, Search } from './icons/AppIcons';
import ConfirmModal from './ConfirmModal';

interface PortfolioAssistantProps {
  portfolios: Portfolio[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AssistantResponse;
}

// Clipboard copy component for assistant messages
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-[6px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:opacity-100 transition-all duration-150 z-20"
      title="Copy answer to clipboard"
      aria-label="Copy answer"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </button>
  );
}

// Simple custom markdown parser to convert basic elements into JSX
const parseBoldAndCode = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong>;
    }
    const codeParts = part.split('`');
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (j % 2 === 1) {
          return (
            <code key={`${i}-${j}`} className="bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-[10px]">
              {cp}
            </code>
          );
        }
        return cp;
      });
    }
    return part;
  });
};

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentTableLines: string[] = [];

  const flushTable = (key: string | number) => {
    if (currentTableLines.length === 0) return;

    const rows = currentTableLines.map(line => {
      const cells = line.split('|').map(c => c.trim());
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      return cells;
    });

    const headers = rows[0] || [];
    const bodyRows = rows.slice(2) || []; // skip divider

    blocks.push(
      <div key={`table-${key}`} className="overflow-x-auto my-2 rounded-[10px] border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 shadow-xs max-w-full">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/60 text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  {parseBoldAndCode(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-1.5 whitespace-nowrap font-medium text-[11px] text-financial">
                    {parseBoldAndCode(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    currentTableLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      currentTableLines.push(line);
      continue;
    } else if (currentTableLines.length > 0) {
      flushTable(i);
    }

    if (line.startsWith('### ')) {
      blocks.push(
        <h4 key={i} className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2.5 mb-1 tracking-tight">
          {parseBoldAndCode(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={i} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 tracking-tight">
          {parseBoldAndCode(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={i} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3.5 mb-2 tracking-tight">
          {parseBoldAndCode(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push(
        <ul key={i} className="list-disc pl-4 my-0.5 text-xs text-slate-650 dark:text-slate-350">
          <li className="py-0.5 leading-relaxed">{parseBoldAndCode(line.slice(2))}</li>
        </ul>
      );
    } else {
      const olMatch = line.match(/^(\d+)\.\s(.*)/);
      if (olMatch) {
        blocks.push(
          <ol key={i} className="list-decimal pl-4 my-0.5 text-xs text-slate-650 dark:text-slate-350">
            <li className="py-0.5 leading-relaxed" value={parseInt(olMatch[1])}>{parseBoldAndCode(olMatch[2])}</li>
          </ol>
        );
      } else if (line.trim() === '') {
        blocks.push(<div key={i} className="h-1.5" />);
      } else {
        blocks.push(
          <p key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
            {parseBoldAndCode(line)}
          </p>
        );
      }
    }
  }

  if (currentTableLines.length > 0) {
    flushTable('end');
  }

  return blocks;
};

interface SuggestionItem {
  icon: string;
  label: string;
}

function getDynamicSuggestions(portfolios: Portfolio[]): SuggestionItem[] {
  const suggestions: SuggestionItem[] = [];
  const today = new Date();

  const hasUpcomingFD = portfolios.some(p =>
    p.fixedDeposits && p.fixedDeposits.some(fd => {
      if (!fd.maturity_date) return false;
      const mDate = new Date(fd.maturity_date);
      const days = (mDate.getTime() - today.getTime()) / 86400000;
      return days > 0 && days < 60 && fd.status === 'active';
    })
  );
  if (hasUpcomingFD) {
    suggestions.push({ icon: '⏳', label: 'Show FDs maturing soon' });
  }

  const hasUpcomingInsurance = portfolios.some(p =>
    p.insurances && p.insurances.some(ins => {
      if (!ins.renewal_date) return false;
      const rDate = new Date(ins.renewal_date);
      const days = (rDate.getTime() - today.getTime()) / 86400000;
      return days > 0 && days < 30;
    })
  );
  if (hasUpcomingInsurance) {
    suggestions.push({ icon: '🛡️', label: 'Upcoming insurance renewals' });
  }

  suggestions.push({ icon: '📊', label: 'What is my total asset allocation split?' });
  suggestions.push({ icon: '🏆', label: 'Which asset gave the highest return?' });
  suggestions.push({ icon: '💼', label: 'Show me my emergency fund coverage' });

  return suggestions.slice(0, 3);
}

const ChatMessageItem = React.memo(function ChatMessageItem({ msg }: { msg: ChatMessage }) {
  const renderedContent = useMemo(() => renderMarkdown(msg.text), [msg.text]);

  return (
    <div className="w-full">
      {msg.role === 'user' ? (
        <div className="flex justify-end items-end gap-2 w-full">
          <div className="bg-blue-600 text-white rounded-[14px] rounded-br-[4px] px-4 py-2.5 text-xs max-w-[85%] sm:max-w-[75%] font-medium shadow-xs leading-relaxed">
            {msg.text}
          </div>
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
            <User size={12} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start w-full">
          <div className="flex gap-2.5 items-start w-full">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 shadow-xs">
              <Bot size={13} />
            </div>
            <div className="flex-1 space-y-1 bg-slate-100/90 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-750 text-slate-800 dark:text-slate-100 rounded-[14px] rounded-tl-[4px] px-4 py-3 shadow-xs relative group">
              {renderedContent}
              {msg.id !== 'welcome' && <CopyButton text={msg.text} />}
            </div>
          </div>
          {msg.response && msg.response.matchedAssets && msg.response.matchedAssets.length > 0 && (
            <div className="pl-8 w-full space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Matching Asset Details:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {msg.response.matchedAssets.map((asset, idx) => (
                  <div key={idx} className="bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-[8px] p-2 flex flex-col gap-0.5 text-left shadow-xs">
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate pr-2">{asset.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider shrink-0 font-bold">{asset.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate text-financial">{asset.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function PortfolioAssistant({ portfolios }: PortfolioAssistantProps) {
  const welcomeMessage = useMemo<ChatMessage>(() => ({
    id: 'welcome',
    role: 'assistant',
    text: "Hello! I am your **AI Portfolio Assistant**. You can ask me questions about your family portfolio's performance, upcoming deposit maturities, insurance premium renewals, and asset allocation split.\n\nTry clicking one of the suggested queries below or type your question!"
  }), []);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([welcomeMessage]);
  }, [welcomeMessage]);

  const suggestions = useMemo(() => getDynamicSuggestions(portfolios), [portfolios]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const triggerAssistant = useCallback(async (userQuery: string) => {
    if (!userQuery.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      text: userQuery
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 350));

    try {
      const res = askAssistant(userQuery, portfolios);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: res.answer,
        response: res
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: "I ran into a problem fetching portfolio details. Please check your data values and try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, portfolios]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAssistant(query);
  };

  const confirmClearChat = () => {
    setMessages([welcomeMessage]);
    setShowConfirmClear(false);
  };

  return (
    <div className="apple-card p-4 sm:p-5 text-slate-800 dark:text-slate-100 relative overflow-hidden flex flex-col h-[370px] justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-[-40px] right-[-40px] w-[140px] h-[140px] bg-blue-500/8 dark:bg-blue-500/15 rounded-full blur-[35px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-card-title font-semibold text-slate-900 dark:text-slate-100">
              AI Portfolio Assistant
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>

          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 px-2 py-1 rounded-[6px] border border-slate-200/80 dark:border-slate-700 transition-colors ios-press"
              title="Reset conversation"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 mb-2.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent min-h-0">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} msg={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5 items-start w-full animate-pulse">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 shadow-xs">
              <Bot size={13} />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-[12px] border border-slate-200/60 dark:border-slate-700/60">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries Chips */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <div className="flex flex-col gap-1.5 mb-2.5 shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggested Queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerAssistant(s.label)}
                className="inline-flex items-center gap-1 text-left text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium bg-blue-50/50 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-blue-100 hover:border-blue-300 dark:border-slate-700/80 dark:hover:border-slate-600 px-2.5 py-1.5 rounded-[8px] transition-all ios-press"
              >
                <span className="text-[11px] select-none">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Input Dock */}
      <form onSubmit={handleSearch} className="relative flex items-center gap-2 shrink-0 z-10">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-slate-400 pointer-events-none">
            <Search size={14} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your portfolio..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/20 rounded-[10px] pl-9 pr-12 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all shadow-xs"
          />
          {!query && (
            <kbd className="hidden sm:inline-block absolute right-3 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded-[4px] select-none pointer-events-none">
              /
            </kbd>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="h-[36px] px-3.5 rounded-[10px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center text-white transition-all ios-press shadow-xs disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
          aria-label="Send query"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClear}
        onClose={() => setShowConfirmClear(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat History"
        message="Are you sure you want to clear your conversation history with the AI Assistant?"
        confirmLabel="Clear"
        variant="danger"
      />
    </div>
  );
}
