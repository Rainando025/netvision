import { createClient } from "@supabase/supabase-js";

export interface UserAccount {
  email: string;
  role: "admin" | "user";
  status: "approved" | "pending" | "rejected";
  passwordHash: string;
}

const supabaseUrl =
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL : "") ||
  import.meta.env?.VITE_SUPABASE_URL ||
  "";

const supabaseAnonKey =
  (typeof process !== "undefined"
    ? process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
    : "") ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = () => !!supabase;
