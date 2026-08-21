import { useState, useEffect, useCallback, useRef } from 'react';
import { markSessionVerified, hashPin, getPinLength, verifyPin, clearCustomPin } from '../utils/auth';
import { triggerHaptic } from '../utils/haptics';
import { 
  isBiometricsSupported, 
  isBiometricsEnrolled, 
  isBiometricAutoPromptEnabled,
  authenticateWithBiometrics 
} from '../utils/biometrics';
import { Fingerprint } from './icons/AppIcons';

function IconDelete({ size = 22 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function IconLock({ isUnlocked = false }: { isUnlocked?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-all duration-300 ${isUnlocked ? 'scale-110 text-[#34C759]' : 'text-white/80'}`}
      aria-hidden="true"
    >
      {isUnlocked ? (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </>
      ) : (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      )}
    </svg>
  );
}

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);
  const [isBiometricPrompting, setIsBiometricPrompting] = useState(false);

  // Live iOS clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check hardware biometric capability
  useEffect(() => {
    isBiometricsSupported().then((supported) => {
      setBiometricsAvailable(supported);
      if (supported) {
        setBiometricsEnrolled(isBiometricsEnrolled());
      }
    });
  }, []);

  const pinRef = useRef(pin);
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  const isVerifyingRef = useRef(false);

  const handleBiometricUnlock = useCallback(async () => {
    if (success || isVerifyingRef.current || isBiometricPrompting) return;
    setIsBiometricPrompting(true);
    setError('');

    try {
      if (isBiometricsEnrolled()) {
        const pinHash = await authenticateWithBiometrics();
        if (pinHash) {
          triggerHaptic('success');
          setSuccess(true);
          markSessionVerified(pinHash);
          setTimeout(() => {
            onUnlock();
          }, 300);
        } else {
          // authenticateWithBiometrics() may have auto-cleared stale enrollment
          // (e.g. after device restore or PWA reinstall) — sync the UI state
          setBiometricsEnrolled(isBiometricsEnrolled());
        }
      }
    } catch {
      // User dismissed prompt or verification failed
    } finally {
      setIsBiometricPrompting(false);
    }
  }, [success, isBiometricPrompting, onUnlock]);


  // Direct access to Face ID / Touch ID on mobile app launch if auto-prompt enabled
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isBiometricsEnrolled() && isBiometricAutoPromptEnabled()) {
      timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 150);
    }
    return () => clearTimeout(timer);
  }, [handleBiometricUnlock]);

  const handleClear = useCallback(() => {
    if (success || isVerifyingRef.current) return;
    triggerHaptic('selection');
    pinRef.current = '';
    setPin('');
    setError('');
  }, [success]);

  const handleForgotPin = useCallback(() => {
    if (success) return;
    triggerHaptic('warning');
    clearCustomPin();
    pinRef.current = '';
    setPin('');
    setBiometricsEnrolled(false);
    setError('Custom PIN cleared. Use master PIN.');
  }, [success]);

  const handleBackspace = useCallback(() => {
    if (success || isVerifyingRef.current) return;
    triggerHaptic('selection');
    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
    setError('');
  }, [success]);

  const handlePressKey = useCallback((num: string) => {
    if (success || isVerifyingRef.current) return;
    const pinLength = getPinLength();
    const currentPin = pinRef.current;
    if (currentPin.length >= pinLength) return;

    triggerHaptic('selection');
    const nextPin = currentPin + num;
    pinRef.current = nextPin;
    setPin(nextPin);
    setError('');

    if (nextPin.length === pinLength) {
      isVerifyingRef.current = true;
      verifyPin(nextPin).then((isValid) => {
        if (isValid) {
          triggerHaptic('success');
          setSuccess(true);
          hashPin(nextPin).then((hash) => {
            markSessionVerified(hash);
            setTimeout(() => {
              onUnlock();
            }, 300);
          });
        } else {
          triggerHaptic('error');
          setShake(true);
          setError('Incorrect PIN');
          setTimeout(() => {
            setShake(false);
            pinRef.current = '';
            setPin('');
            isVerifyingRef.current = false;
          }, 600);
        }
      }).catch(() => {
        triggerHaptic('error');
        setShake(true);
        setError('Verification failed');
        setTimeout(() => {
          setShake(false);
          pinRef.current = '';
          setPin('');
          isVerifyingRef.current = false;
        }, 600);
      });
    }
  }, [success, biometricsAvailable, onUnlock]);

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

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const dots = Array.from({ length: getPinLength() });

  return (
    <div className="pin-lock-root min-h-screen text-white flex flex-col items-center justify-between py-10 font-sans select-none overflow-hidden">
      {/* Animated aurora gradient background */}
      <div className="pin-lock-bg" aria-hidden="true" />
      <div className="pin-lock-stars" aria-hidden="true" />

      {/* iOS Top Status Bar / Lock Header */}
      <header className="relative z-10 flex flex-col items-center mt-2 sm:mt-6 text-center">
        <div className="mb-2 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-sm">
          <IconLock isUnlocked={success} />
        </div>
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-white/80 uppercase mb-0.5 drop-shadow">
          {formattedDate}
        </p>
        <h2 className="ios-clock-display text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-md">
          {formattedTime}
        </h2>
      </header>

      {/* iOS Passcode Entry Form */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6 my-auto">
        
        <div className={`flex flex-col items-center w-full transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
          
          <h1 className="text-sm font-medium mb-5 tracking-wide text-white/90 drop-shadow">
            {success ? 'Vault Unlocked' : 'Enter Passcode'}
          </h1>
          
          <div className="flex gap-4 mb-4 h-6 items-center">
            {dots.map((_, index) => {
              const isFilled = success || index < pin.length;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? 'bg-white border-white shadow-[0_0_12px_rgba(255,255,255,0.85)] scale-105'
                      : 'bg-transparent border-white/60'
                  }`}
                />
              );
            })}
          </div>

          <div className="h-6 mb-6 flex items-center justify-center">
            {error && (
              <p className="text-red-300 text-xs font-semibold tracking-wide drop-shadow-sm" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-4">
            {keypadLayout.map(({ num, letters }) => (
              <button
                key={num}
                type="button"
                className="pin-key w-[75px] h-[75px] flex flex-col items-center justify-center rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer"
                onClick={() => handlePressKey(num)}
                disabled={success}
                aria-label={`Digit ${num}`}
              >
                <span className="ios-number text-[30px] leading-none mb-0.5 drop-shadow-sm font-semibold">{num}</span>
                {letters && (
                  <span className="text-[9px] text-white/60 tracking-[2px] uppercase font-bold leading-none">{letters}</span>
                )}
              </button>
            ))}
            
            {/* Biometric Keypad Button (Bottom Left) */}
            {biometricsAvailable && biometricsEnrolled ? (
              <button
                type="button"
                className="pin-key w-[75px] h-[75px] flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer text-white/90 hover:text-white"
                onClick={handleBiometricUnlock}
                disabled={success || isBiometricPrompting}
                aria-label="Unlock with Biometrics (FaceID / Fingerprint)"
                title="Unlock with Biometrics"
              >
                <Fingerprint size={28} className={isBiometricPrompting ? 'animate-pulse text-[#34C759]' : ''} />
              </button>
            ) : (
              <div className="w-[75px] h-[75px]" />
            )}
            
            <button
              type="button"
              className="pin-key w-[75px] h-[75px] flex flex-col items-center justify-center rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer"
              onClick={() => handlePressKey('0')}
              disabled={success}
              aria-label="Digit 0"
            >
              <span className="ios-number text-[30px] leading-none drop-shadow-sm font-semibold">0</span>
            </button>
            
            <button
              type="button"
              className="w-[75px] h-[75px] flex items-center justify-center rounded-full active:bg-white/15 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer"
              onClick={handleBackspace}
              disabled={success || pin.length === 0}
              aria-label="Delete last digit"
            >
              {pin.length > 0 && <IconDelete size={22} />}
            </button>
          </div>
          
        </div>
      </main>

      {/* iOS Lock Screen Footer Badge */}
      <footer className="relative z-10 text-center flex flex-col items-center gap-3">
        <p className="text-[11px] font-medium text-white/50 tracking-wider uppercase">
          Family Wealth Office • Encrypted Storage
        </p>
        {!success && (
          <button
            type="button"
            onClick={handleForgotPin}
            className="text-[10px] text-white/30 hover:text-white/60 tracking-wide transition-colors duration-200 underline underline-offset-2"
            aria-label="Reset custom PIN to master PIN"
          >
            Reset to master PIN
          </button>
        )}
      </footer>

      <style>{`
        .pin-lock-root {
          position: relative;
          background: #090916;
        }

        .ios-clock-display {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "SF Pro Display", sans-serif;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum" 1;
        }

        .pin-lock-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 120% 60% at 20% 100%, rgba(88, 28, 135, 0.85) 0%, transparent 70%),
            radial-gradient(ellipse 100% 50% at 80% 90%, rgba(30, 58, 138, 0.8) 0%, transparent 65%),
            radial-gradient(ellipse 80% 40% at 50% 110%, rgba(139, 92, 246, 0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 35% at 70% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 55%),
            radial-gradient(ellipse 50% 50% at 30% 20%, rgba(88, 28, 135, 0.25) 0%, transparent 70%),
            linear-gradient(180deg, #070712 0%, #0d0928 40%, #160e3b 100%);
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
          background: rgba(255, 255, 255, 0.11);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .pin-key:active {
          background: rgba(255, 255, 255, 0.28);
          transform: scale(0.94);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2);
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

