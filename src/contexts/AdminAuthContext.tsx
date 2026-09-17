import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

type Access = {
  status: 'loading' | 'anonymous' | 'allowed' | 'denied' | 'error';
  signedIn: boolean;
  error: string;
  path: string;
};
type AuthContext = Access & { retry: () => void; signOut: () => Promise<void> };
const Context = createContext<AuthContext | null>(null);

async function bounded<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Verification timed out.')), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [version, setVersion] = useState(0);
  const [access, setAccess] = useState<Access>({
    status: 'loading',
    signedIn: false,
    error: '',
    path: pathname,
  });

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAccess({ status: 'anonymous', signedIn: false, error: '', path: pathname });
      return;
    }
    let disposed = false;
    let generation = 0;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      if (disposed) return;
      const current = ++generation;
      let signedIn = false;
      const update = (next: Omit<Access, 'path'>) => {
        if (!disposed && generation === current) setAccess({ ...next, path: pathname });
      };
      setAccess((previous) => ({ ...previous, status: 'loading', path: pathname }));
      try {
        // Session storage only determines whether to check a token; it never grants access.
        const session = await bounded(client.auth.getSession());
        if (session.error) throw session.error;
        signedIn = !!session.data.session;
        if (!signedIn) {
          update({ status: 'anonymous', signedIn: false, error: '' });
          return;
        }
        const verified = await bounded(client.auth.getUser());
        if (verified.error || !verified.data.user) {
          if (verified.error?.status === 401 || verified.error?.status === 403) {
            update({
              status: 'error',
              signedIn: true,
              error: 'Your session is no longer valid. Sign out and sign in again.',
            });
            return;
          }
          throw verified.error || new Error('User verification failed.');
        }
        const membership = await bounded(client.rpc('is_admin'));
        if (membership.error) throw membership.error;
        update({
          status: membership.data === true ? 'allowed' : 'denied',
          signedIn: true,
          error:
            membership.data === true ? '' : 'This account is not authorized as an administrator.',
        });
      } catch {
        update({
          status: 'error',
          signedIn,
          error:
            'Admin access could not be verified. Please try again or contact the site administrator.',
        });
      }
    };
    void check();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION') return;
      ++generation; // Invalidate earlier requests immediately, including during sign-out.
      if (event === 'SIGNED_OUT') {
        clearTimeout(scheduled);
        setAccess({ status: 'anonymous', signedIn: false, error: '', path: pathname });
        return;
      }
      setAccess((previous) => ({ ...previous, status: 'loading', path: pathname }));
      clearTimeout(scheduled);
      scheduled = setTimeout(() => void check(), 0); // Outside the Auth callback's lock.
    });
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      disposed = true;
      ++generation;
      clearTimeout(scheduled);
      subscription.unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname, version]);

  const signOut = async () => {
    if (!supabase) return;
    // Local sign-out clears this browser without signing out other devices.
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setAccess({ status: 'anonymous', signedIn: false, error: '', path: pathname });
  };
  return (
    <Context.Provider
      value={{
        ...access,
        status: access.path === pathname ? access.status : 'loading',
        retry: () => setVersion((v) => v + 1),
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useAdminAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AdminAuthProvider is required.');
  return value;
}
