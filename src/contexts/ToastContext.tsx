import { createContext, useContext, useState, type ReactNode } from 'react';
const Context = createContext<(s: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  return (
    <Context.Provider value={setMessage}>
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
          <button aria-label="Dismiss notification" onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
