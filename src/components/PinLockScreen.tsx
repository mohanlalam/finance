import { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, AlertCircle, Delete, ShieldAlert } from 'lucide-react';
import { markSessionVerified, hashPin } from '../utils/auth';

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
          hashPin(nextPin).then((hash) => {
            markSessionVerified(hash);
            setTimeout(() => onUnlock(), 500);
          });
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
  }, [success, onUnlock]);

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
                {success ? <ShieldCheck size={32} /> : error ? <ShieldAlert size={32} /> : <Lock size={32} />}
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
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-6 font-semibold" role="status">
                <ShieldCheck size={14} />
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
                <Delete size={22} />
              </button>
            </div>

            {/* Recovery / Encryption Badge */}
            <div className="mt-8 text-center">
              <a className="text-xs font-semibold text-blue-400 hover:underline transition-all" href="#forgot-pin">
                Forgot Access PIN?
              </a>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-400">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[11px] font-semibold tracking-wide uppercase">Secure Tier 4 Encryption Active</span>
              </div>
            </div>
          </div>

          {/* Desktop Right Side Security Illustration (Side Decor) */}
          <div className="hidden lg:block max-w-[420px]">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950/40 backdrop-blur-sm p-4 relative group">
                <img
                  alt="High-tech cybersecurity"
                  className="rounded-xl opacity-75 mix-blend-screen w-full object-cover h-[300px]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjjJ-916kqd5ywgCeXcCu8VNNQL2ghXwPLTFXPWEMmwooK0dPVvxdHuSTCtWVJcXvQxSrQ22qBJ2F6NUKlOxwdDzg2CZ_Umw9FuKMxZYy68k9WQxzwPqmLiYARjVGel9oN4hZ9jP4o54o4uTgQU6Y9JbGREva00oFF_fsM88Q0mZ3YLA2KJ-BzikuJ0z1x0bjdST7zUSDvKQor6rslKgoGwE8z2NJ6vKTsvRlvFtbMW9uGKLTGrlyahJGXaukjvJ9C0Uq6VgXJv1_C"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none rounded-xl" />
              </div>
              <div className="absolute -bottom-4 -right-4 p-4 glass-card rounded-xl border border-blue-500/20 shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[11px] font-bold text-slate-200 tracking-wider uppercase">Secure Node: US-EAST-1 ACTIVE</p>
                </div>
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
