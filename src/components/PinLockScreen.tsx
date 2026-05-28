import { useState, useRef, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { markSessionVerified } from '../utils/auth';

const APP_PIN = (import.meta.env.VITE_APP_PIN as string | undefined) ?? '';
const PIN_LENGTH = APP_PIN.length || 4;

interface PinLockScreenProps {
  onUnlock: () => void;
}

export default function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are filled
    const pin = newDigits.join('');
    if (pin.length === PIN_LENGTH && newDigits.every((d) => d !== '')) {
      if (pin === APP_PIN) {
        setSuccess(true);
        markSessionVerified();
        setTimeout(() => onUnlock(), 400);
      } else {
        setShake(true);
        setError('Incorrect PIN. Try again.');
        setTimeout(() => {
          setShake(false);
          setDigits(Array(PIN_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (pasted.length === PIN_LENGTH) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[PIN_LENGTH - 1]?.focus();

      if (pasted === APP_PIN) {
        setSuccess(true);
        markSessionVerified();
        setTimeout(() => onUnlock(), 400);
      } else {
        setShake(true);
        setError('Incorrect PIN. Try again.');
        setTimeout(() => {
          setShake(false);
          setDigits(Array(PIN_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        }, 500);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div
        className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 w-full max-w-sm text-center transition-all duration-300 ${
          shake ? 'animate-shake' : ''
        } ${success ? 'scale-105 opacity-90' : ''}`}
      >
        {/* Lock Icon */}
        <div
          className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            success
              ? 'bg-emerald-500/20 text-emerald-400'
              : error
              ? 'bg-red-500/20 text-red-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}
        >
          {success ? <ShieldCheck size={28} /> : <Lock size={28} />}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white mb-1">Family Wealth Tracker</h1>
        <p className="text-sm text-slate-400 mb-8">Enter your {PIN_LENGTH}-digit PIN to continue</p>

        {/* PIN Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                ${digit ? 'border-blue-400 bg-blue-500/10 text-white' : 'border-white/20 bg-white/5 text-white'}
                ${error ? 'border-red-400 bg-red-500/10' : ''}
                ${success ? 'border-emerald-400 bg-emerald-500/10' : ''}
                focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30`}
              disabled={success}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm mb-4">
            <ShieldCheck size={14} />
            <span>Access granted</span>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-slate-500 mt-6">
          Protected access · Session-based
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
