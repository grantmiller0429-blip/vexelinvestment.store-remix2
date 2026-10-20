import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export const supabase = getSupabaseClient();

export const getSession = async () => {
  if (!supabase) {
    return { session: null, user: null };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return { session: data.session, user: data.session?.user ?? null };
};

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  return { user: data.user as User | null };
};

export const signInWithSupabase = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
  }

  return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithSupabase = async ({
  email,
  password,
  fullName,
}: {
  email: string;
  password: string;
  fullName: string;
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
  }

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
};

export const signOutFromSupabase = async () => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};
