import { useState, useEffect, useCallback } from 'react';
import { markSessionVerified, hashPin } from '../utils/auth';

// Inline SVGs — keeps lucide-react out of the critical entry bundle
function IconLock() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconShieldCheck({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconShieldAlert({ size = 32 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
function IconAlertCircle({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
function IconDelete({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

const APP_PIN = (import.meta.env.VITE_APP_PIN as string | undefined) ?? '';
const PIN_LENGTH = APP_PIN.length || 4;

interface PinLockScreenProps {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClear = useCallback(() => {
    if (success) return;
    setPin('');
    setError('');
  }, [success]);

  const handleBackspace = useCallback(() => {
    if (success) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [success]);

  const handlePressKey = useCallback((num: string) => {
    if (success) return;
    
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const nextPin = prev + num;
      setError('');

      if (nextPin.length === PIN_LENGTH) {
        if (nextPin === APP_PIN) {
          setSuccess(true);
        } else {
          setShake(true);
          setError('Incorrect PIN. Please try again.');
          setTimeout(() => {
            setShake(false);
            setPin('');
          }, 600);
        }
      }
      return nextPin;
    });
  }, [success]);

  // Hash and unlock after successful PIN entry — kept outside the state updater to stay pure
  useEffect(() => {
    if (success && pin.length === PIN_LENGTH) {
      hashPin(pin).then((hash) => {
        markSessionVerified(hash);
        onUnlock();
      });
    }
  }, [success, pin, onUnlock]);

  // Physical keyboard listeners
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (success) return;
      if (e.key >= '0' && e.key <= '9') {
        handlePressKey(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePressKey, handleBackspace, handleClear, success]);

  const dots = Array.from({ length: PIN_LENGTH });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      {/* Background Atmospheric Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/15 rounded-full blur-[110px]"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-4 md:px-8 py-12 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center max-w-5xl w-full gap-12 lg:gap-24">
          
          {/* Lock Screen Card */}
          <div
            className={`glass-card w-full max-w-[400px] rounded-2xl p-8 md:p-10 flex flex-col items-center transition-all duration-300 ${
              shake ? 'animate-shake' : ''
            } ${success ? 'scale-105 opacity-90 border-emerald-500/30' : ''}`}
            role="form"
            aria-label="PIN verification"
          >
            {/* Branding & Icon */}
            <div className="mb-8 flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-300 ${
                  success
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10'
                    : error
                    ? 'bg-red-500/20 text-red-400 shadow-red-500/10'
                    : 'bg-blue-500/20 text-blue-400 shadow-blue-500/10'
                }`}
                aria-hidden="true"
              >
                {success ? <IconShieldCheck size={32} /> : error ? <IconShieldAlert size={32} /> : <IconLock />}
              </div>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-1.5">Family Wealth Office Secure Access</p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex gap-4 mb-8" id="pin-display">
              {dots.map((_, index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                      success
                        ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_10px_#10B981]'
                        : error
                        ? 'border-red-400 bg-red-400 shadow-[0_0_10px_#EF4444]'
                        : isFilled
                        ? 'border-blue-400 bg-blue-400 shadow-[0_0_10px_#3b82f6]'
                        : 'border-slate-500 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-6 font-semibold" role="alert">
                <IconAlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-6 font-semibold" role="status">
                <IconShieldCheck size={14} />
                <span>Access Granted. Loading Vault...</span>
              </div>
            )}

            {/* Numerical Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="w-full aspect-square flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-100 font-outfit text-2xl font-bold border border-slate-700/40 shadow-sm active:scale-95 transition-all duration-100"
                  onClick={() => handlePressKey(num)}
                  disabled={success}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="w-full aspect-square flex items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 font-semibold text-xs active:scale-95 transition-all duration-100"
                onClick={handleClear}
                disabled={success}
              >
                CLEAR
              </button>
              <button
                type="button"
                className="w-full aspect-square flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-750 text-slate-100 font-outfit text-2xl font-bold border border-slate-700/40 shadow-sm active:scale-95 transition-all duration-100"
                onClick={() => handlePressKey('0')}
                disabled={success}
              >
                0
              </button>
              <button
                type="button"
                className="w-full aspect-square flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-500/10 active:scale-95 transition-all duration-100"
                onClick={handleBackspace}
                disabled={success}
                aria-label="backspace"
              >
                <IconDelete size={22} />
              </button>
            </div>

            {/* Recovery / Encryption Badge */}
            <div className="mt-8 text-center">
              <a className="text-xs font-semibold text-blue-400 hover:underline transition-all" href="#forgot-pin">
                Forgot Access PIN?
              </a>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-400">
                <IconShieldCheck size={16} />
                <span className="text-[11px] font-semibold tracking-wide uppercase">Secure Tier 4 Encryption Active</span>
              </div>
            </div>
          </div>


        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto flex flex-col md:flex-row justify-between items-center px-8 md:px-12 gap-4 bg-slate-950 border-t border-slate-800/80 z-10 text-slate-500 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-blue-400">Family Wealth Office</span>
          <span>•</span>
          <span>© 2026 Family Wealth Office. All Rights Reserved.</span>
        </div>
        <nav className="flex gap-6">
          <a className="hover:text-blue-400 underline transition-all duration-300" href="#privacy">Privacy Policy</a>
          <a className="hover:text-blue-400 underline transition-all duration-300" href="#security">Security Standards</a>
          <a className="hover:text-blue-400 underline transition-all duration-300" href="#terms">Terms of Service</a>
        </nav>
      </footer>

      {/* Shaking & Custom Keypad Animations */}
      <style>{`
        .glass-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
