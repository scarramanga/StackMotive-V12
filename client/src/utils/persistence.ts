import { getSupabaseClient } from '../lib/initSupabase';

const LOCAL_KEY = (userId: string) => `stackmotive_followed_signals_${userId}`;

export async function getFollowedSignals(userId: string): Promise<string[]> {
  // SSR-safe: only use localStorage in browser
  if (typeof window === 'undefined') return [];
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_follows')
      .select('signals')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    if (data?.signals) {
      localStorage.setItem(LOCAL_KEY(userId), JSON.stringify(data.signals));
      return data.signals;
    }
    return [];
  } catch (err) {
    // Fallback to localStorage
    const local = localStorage.getItem(LOCAL_KEY(userId));
    return local ? JSON.parse(local) : [];
  }
}

export async function saveFollowedSignals(userId: string, signals: string[]): Promise<void> {
  // SSR-safe: only use localStorage in browser
  if (typeof window === 'undefined') return;
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('user_follows')
      .upsert({ user_id: userId, signals }, { onConflict: 'user_id' });
    if (error) throw error;
    localStorage.setItem(LOCAL_KEY(userId), JSON.stringify(signals));
  } catch (err) {
    // Fallback to localStorage
    localStorage.setItem(LOCAL_KEY(userId), JSON.stringify(signals));
  }
} 