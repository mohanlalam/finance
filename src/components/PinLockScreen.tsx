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
    <div className="pin-lock-root min-h-screen text-white flex flex-col items-center justify-center font-sans select-none overflow-hidden">
      {/* Animated aurora gradient background */}
      <div className="pin-lock-bg" aria-hidden="true" />
      <div className="pin-lock-stars" aria-hidden="true" />

      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6">
        
        <div className={`flex flex-col items-center w-full transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          
          <h1 className="text-xl font-medium mb-6 tracking-wide drop-shadow-lg">Enter Passcode</h1>
          
          <div className="flex gap-4 mb-4 h-6 items-center">
            {dots.map((_, index) => {
              const isFilled = success || index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                      : 'bg-transparent border-white/70'
                  }`}
                />
              );
            })}
          </div>

          <div className="h-6 mb-8 flex items-center justify-center">
            {error && (
              <p className="text-red-300 text-sm font-medium drop-shadow-sm" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-8">
            {keypadLayout.map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                className="pin-key w-[77px] h-[77px] flex flex-col items-center justify-center rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                onClick={() => handlePressKey(num)}
                disabled={success}
                aria-label={`Digit ${num}`}
              >
                <span className="text-[32px] leading-none mb-0.5 drop-shadow-sm">{num}</span>
                {letters && (
                  <span className="text-[9px] text-white/60 tracking-[2px] uppercase font-bold leading-none">{letters}</span>
                )}
              </button>
            ))}
            
            <div className="w-[77px] h-[77px]"></div>
            
            <button
              type="button"
              className="pin-key w-[77px] h-[77px] flex flex-col items-center justify-center rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              onClick={() => handlePressKey('0')}
              disabled={success}
              aria-label="Digit 0"
            >
              <span className="text-[32px] leading-none drop-shadow-sm">0</span>
            </button>
            
            <button
              type="button"
              className="w-[77px] h-[77px] flex items-center justify-center rounded-full active:bg-white/15 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
        .pin-lock-root {
          position: relative;
          background: #0a0a1a;
        }

        .pin-lock-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 120% 60% at 20% 100%, rgba(88, 28, 135, 0.8) 0%, transparent 70%),
            radial-gradient(ellipse 100% 50% at 80% 90%, rgba(30, 58, 138, 0.75) 0%, transparent 65%),
            radial-gradient(ellipse 80% 40% at 50% 110%, rgba(139, 92, 246, 0.5) 0%, transparent 60%),
            radial-gradient(ellipse 60% 35% at 70% 80%, rgba(59, 130, 246, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse 50% 50% at 30% 20%, rgba(88, 28, 135, 0.2) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a1a 0%, #0f0b2e 40%, #1a1145 100%);
          animation: auroraShift 12s ease-in-out infinite alternate;
        }

        .pin-lock-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 25% 8%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 40% 22%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 55% 5%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 85% 12%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 15% 35%, rgba(255,255,255,0.15), transparent),
            radial-gradient(1.5px 1.5px at 90% 30%, rgba(255,255,255,0.45), transparent),
            radial-gradient(1px 1px at 5% 25%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 60% 28%, rgba(255,255,255,0.18), transparent),
            radial-gradient(1.5px 1.5px at 35% 3%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 78% 38%, rgba(255,255,255,0.22), transparent);
          opacity: 0.7;
          animation: starsTwinkle 6s ease-in-out infinite alternate;
        }

        @keyframes auroraShift {
          0% {
            filter: brightness(1) hue-rotate(0deg);
          }
          50% {
            filter: brightness(1.08) hue-rotate(8deg);
          }
          100% {
            filter: brightness(0.95) hue-rotate(-5deg);
          }
        }

        @keyframes starsTwinkle {
          0% { opacity: 0.5; }
          100% { opacity: 0.8; }
        }

        .pin-key {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .pin-key:active {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(0.95);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
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

