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
      className="absolute top-2.5 right-2.5 p-1.5 rounded-[6px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border-subtle)] shadow-xs opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:opacity-100 transition-all duration-150 z-20"
      title="Copy answer to clipboard"
      aria-label="Copy answer"
    >
      {copied ? <Check size={12} className="text-[var(--positive)]" /> : <Copy size={12} />}
    </button>
  );
}

// Simple custom markdown parser to convert basic elements into JSX
const parseBoldAndCode = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-[var(--text-primary)]">{part}</strong>;
    }
    const codeParts = part.split('`');
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (j % 2 === 1) {
          return (
            <code key={`${i}-${j}`} className="bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--accent-blue)] font-mono text-[10px]">
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
      <div key={`table-${key}`} className="overflow-x-auto my-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs max-w-full">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-xs">
          <thead className="bg-[var(--surface-secondary)]">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">
                  {parseBoldAndCode(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
            {bodyRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-[var(--surface-secondary)] transition-colors">
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
        <h4 key={i} className="text-xs font-bold text-[var(--text-primary)] mt-2.5 mb-1 tracking-tight">
          {parseBoldAndCode(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={i} className="text-xs sm:text-sm font-bold text-[var(--text-primary)] mt-3 mb-1.5 tracking-tight">
          {parseBoldAndCode(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={i} className="text-sm font-bold text-[var(--text-primary)] mt-3.5 mb-2 tracking-tight">
          {parseBoldAndCode(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push(
        <ul key={i} className="list-disc pl-4 my-0.5 text-xs text-[var(--text-secondary)]">
          <li className="py-0.5 leading-relaxed">{parseBoldAndCode(line.slice(2))}</li>
        </ul>
      );
    } else {
      const olMatch = line.match(/^(\d+)\.\s(.*)/);
      if (olMatch) {
        blocks.push(
          <ol key={i} className="list-decimal pl-4 my-0.5 text-xs text-[var(--text-secondary)]">
            <li className="py-0.5 leading-relaxed" value={parseInt(olMatch[1])}>{parseBoldAndCode(olMatch[2])}</li>
          </ol>
        );
      } else if (line.trim() === '') {
        blocks.push(<div key={i} className="h-1.5" />);
      } else {
        blocks.push(
          <p key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed my-0.5">
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
          <div className="bg-[var(--accent-blue)] text-white rounded-[14px] rounded-br-[4px] px-4 py-2.5 text-xs max-w-[85%] sm:max-w-[75%] font-medium shadow-xs leading-relaxed">
            {msg.text}
          </div>
          <div className="w-6 h-6 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 flex items-center justify-center shrink-0">
            <User size={12} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start w-full">
          <div className="flex gap-2.5 items-start w-full">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/20 flex items-center justify-center text-[var(--accent-blue)] shrink-0 mt-0.5 shadow-xs">
              <Bot size={13} />
            </div>
            <div className="flex-1 space-y-1 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-[14px] rounded-tl-[4px] px-4 py-3 shadow-xs relative group">
              {renderedContent}
              {msg.id !== 'welcome' && <CopyButton text={msg.text} />}
            </div>
          </div>
          {msg.response && msg.response.matchedAssets && msg.response.matchedAssets.length > 0 && (
            <div className="pl-8 w-full space-y-1.5">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Matching Asset Details:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {msg.response.matchedAssets.map((asset, idx) => (
                  <div key={idx} className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[8px] p-2 flex flex-col gap-0.5 text-left shadow-xs">
                    <div className="flex justify-between items-center text-[10px] font-semibold">
                      <span className="text-[var(--text-primary)] truncate pr-2">{asset.name}</span>
                      <span className="text-[var(--text-secondary)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider shrink-0 font-bold">{asset.type}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-medium truncate text-financial">{asset.details}</span>
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
    <div className="apple-card p-4 sm:p-5 text-[var(--text-primary)] relative overflow-hidden flex flex-col min-h-[320px] sm:min-h-[370px] justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-[-40px] right-[-40px] w-[140px] h-[140px] bg-[var(--accent-blue)]/10 rounded-full blur-[35px] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-3 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/20 flex items-center justify-center text-[var(--accent-blue)]">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-card-title font-semibold text-[var(--text-primary)]">
              AI Portfolio Assistant
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/20 text-[10px] font-semibold select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
            Active
          </span>

          {messages.length > 1 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--negative)] bg-[var(--surface-secondary)] hover:bg-[var(--surface)] px-2 py-1 rounded-[6px] border border-[var(--border-subtle)] transition-colors ios-press"
              title="Reset conversation"
            >
              <Trash2 size={11} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 mb-2.5 scrollbar-thin scrollbar-thumb-[var(--border-subtle)] scrollbar-track-transparent min-h-0">
        {messages.map((msg) => (
          <ChatMessageItem key={msg.id} msg={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5 items-start w-full animate-pulse">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/20 flex items-center justify-center text-[var(--accent-blue)] shrink-0 mt-0.5 shadow-xs">
              <Bot size={13} />
            </div>
            <div className="flex items-center gap-1.5 bg-[var(--surface-secondary)] px-3.5 py-2.5 rounded-[12px] border border-[var(--border-subtle)]">
              <span className="w-1.5 h-1.5 bg-[var(--accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[var(--accent-blue)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries Chips */}
      {suggestions.length > 0 && messages.length <= 2 && (
        <div className="flex flex-col gap-1.5 mb-2.5 shrink-0">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Suggested Queries:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => triggerAssistant(s.label)}
                className="inline-flex items-center gap-1 text-left text-xs text-[var(--accent-blue)] hover:text-[var(--accent-blue)] font-medium bg-[var(--accent-blue-soft)] hover:bg-[var(--accent-blue)]/15 border border-[var(--accent-blue)]/20 px-2.5 py-1.5 rounded-[8px] transition-all ios-press"
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
          <span className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none">
            <Search size={14} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your portfolio..."
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20 rounded-[10px] pl-9 pr-12 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all shadow-xs"
          />
          {!query && (
            <kbd className="hidden sm:inline-block absolute right-3 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--text-tertiary)] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[4px] select-none pointer-events-none">
              /
            </kbd>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="h-[36px] px-3.5 rounded-[10px] bg-[var(--accent-blue)] hover:brightness-110 active:scale-95 flex items-center justify-center text-white transition-all ios-press shadow-xs disabled:opacity-40 disabled:hover:brightness-100 disabled:cursor-not-allowed cursor-pointer"
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
