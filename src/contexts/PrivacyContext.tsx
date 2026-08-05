import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PrivacyContextType {
  isBalancesHidden: boolean;
  toggleHideBalances: () => void;
  formatPrivacyValue: (valueStr: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isBalancesHidden, setIsBalancesHidden] = useState(() => {
    return localStorage.getItem('privacy_hide_balances') === 'true';
  });

  const toggleHideBalances = useCallback(() => {
    setIsBalancesHidden((prev) => {
      const newVal = !prev;
      localStorage.setItem('privacy_hide_balances', newVal.toString());
      return newVal;
    });
  }, []);

  const formatPrivacyValue = useCallback((valueStr: string) => {
    return isBalancesHidden ? '••••••' : valueStr;
  }, [isBalancesHidden]);

  return (
    <PrivacyContext.Provider value={{ isBalancesHidden, toggleHideBalances, formatPrivacyValue }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
