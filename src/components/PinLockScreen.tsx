import { useState, useEffect, useCallback } from 'react';
import { markSessionVerified, hashPin } from '../utils/auth';

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

const keypadLayout = [
  { num: '1', letters: '' },
  { num: '2', letters: 'ABC' },
  { num: '3', letters: 'DEF' },
  { num: '4', letters: 'GHI' },
  { num: '5', letters: 'JKL' },
  { num: '6', letters: 'MNO' },
  { num: '7', letters: 'PQRS' },
  { num: '8', letters: 'TUV' },
  { num: '9', letters: 'WXYZ' },
];

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
          setError('Incorrect PIN');
          setTimeout(() => {
            setShake(false);
            setPin('');
          }, 600);
        }
      }
      return nextPin;
    });
  }, [success]);

  useEffect(() => {
    if (success && pin.length === PIN_LENGTH) {
      hashPin(pin).then((hash) => {
        markSessionVerified(hash);
        // Small delay to let user see filled dots before unlocking
        setTimeout(() => {
          onUnlock();
        }, 300);
      });
    }
  }, [success, pin, onUnlock]);

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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans">
      <main className="flex flex-col items-center justify-center w-full max-w-sm px-6">
        
        <div className={`flex flex-col items-center w-full transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          
          <h1 className="text-xl font-medium mb-6">Enter Passcode</h1>
          
          <div className="flex gap-4 mb-4 h-6 items-center">
            {dots.map((_, index) => {
              const isFilled = success || index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-100 ${
                    isFilled
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white'
                  }`}
                />
              );
            })}
          </div>

          <div className="h-6 mb-8 flex items-center justify-center">
            {error && (
              <p className="text-red-500 text-sm font-medium" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-8">
            {keypadLayout.map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                className="w-[77px] h-[77px] flex flex-col items-center justify-center rounded-full bg-white/[0.08] active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                onClick={() => handlePressKey(num)}
                disabled={success}
                aria-label={`Digit ${num}`}
              >
                <span className="text-[32px] leading-none mb-0.5">{num}</span>
                {letters && (
                  <span className="text-[9px] text-white/50 tracking-[2px] uppercase font-bold leading-none">{letters}</span>
                )}
              </button>
            ))}
            
            <div className="w-[77px] h-[77px]"></div>
            
            <button
              type="button"
              className="w-[77px] h-[77px] flex flex-col items-center justify-center rounded-full bg-white/[0.08] active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              onClick={() => handlePressKey('0')}
              disabled={success}
              aria-label="Digit 0"
            >
              <span className="text-[32px] leading-none">0</span>
            </button>
            
            <button
              type="button"
              className="w-[77px] h-[77px] flex items-center justify-center rounded-full active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              onClick={handleBackspace}
              disabled={success || pin.length === 0}
              aria-label="Delete last digit"
            >
              {pin.length > 0 && <IconDelete size={24} />}
            </button>
          </div>
          
        </div>
      </main>

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

