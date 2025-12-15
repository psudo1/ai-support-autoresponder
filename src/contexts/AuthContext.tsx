'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getCurrentUser, signIn, signUp, signOut, updateProfile, type User, type SignInData, type SignUpData } from '@/lib/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; role?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    // IMPORTANT: Don't use async in the callback to avoid deadlocks
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Dispatch async operation after callback completes to avoid deadlock
      setTimeout(async () => {
        if (session?.user) {
          try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Error getting current user:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (data: SignInData) => {
    const result = await signIn(data);
    
    // Verify session was created
    if (!result.session) {
      throw new Error('Failed to create session. Please try again.');
    }
    
    // Get user info
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    
    // Use window.location for a hard redirect to ensure cookies are synced
    window.location.href = '/dashboard';
  };

  const handleSignUp = async (data: SignUpData) => {
    await signUp(data);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    router.push('/dashboard');
    router.refresh();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push('/auth/login');
    router.refresh();
  };

  const handleUpdateProfile = async (updates: { name?: string; role?: string }) => {
    await updateProfile(updates);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

