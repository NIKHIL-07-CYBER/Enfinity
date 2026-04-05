import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { syncToSupabase, loadFromSupabase } from '@/utils/syncService';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

let listenerReady = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = (session?.user as User | null) ?? null;
      set({
        user: u,
        isLoggedIn: !!u,
        isLoading: false,
      });
      if (u?.id) {
        await loadFromSupabase(u.id);
      }
    } catch {
      set({ user: null, isLoggedIn: false, isLoading: false });
    }

    if (!listenerReady) {
      listenerReady = true;
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user as User;
          set({ user, isLoggedIn: true });
          await syncToSupabase(user.id);
          await loadFromSupabase(user.id);
        }
        if (event === 'SIGNED_OUT') {
          set({ user: null, isLoggedIn: false });
          try {
            localStorage.removeItem('selection_entries');
          } catch {
            /* empty */
          }
        }
      });
    }
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      set({ user: data.user as User, isLoggedIn: true });
    }
    return { error: error?.message ?? null };
  },

  signUpWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    // Note: User is not logged in until email is confirmed
    return { error: error?.message ?? null };
  },

  resendConfirmationEmail: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isLoggedIn: false });
  },
}));
