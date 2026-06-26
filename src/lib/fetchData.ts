import { isSupabaseConfigured } from './supabase';

/**
 * Robust fetch utility with retry logic to handle transient network errors
 */
export async function safeFetch(url: string, retries = 3, delay = 500) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        cache: 'no-cache', // Prevent stale caches if errors were cached
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      lastError = err;
      console.warn(`Fetch attempt ${i + 1} failed for ${url}:`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Robust Supabase query wrapper with retry logic
 * Handles Supabase query builders (Thenables) and explicit Promises
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => PromiseLike<any> | any,
  retries = 3,
  delay = 500
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  let lastResult: { data: T | null; error: any } = { data: null, error: null };
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn();
      if (!result.error) {
        return result as { data: T; error: null };
      }
      
      lastResult = result;
      console.warn(`Supabase query attempt ${i + 1} failed:`, result.error);
      
      // Don't retry on certain errors (e.g. invalid query)
      if (result.error.code?.startsWith('P') || result.error.code === '42703') {
        return lastResult;
      }
    } catch (err: any) {
      console.error(`Supabase fetch attempt ${i + 1} fatal error:`, err);
      lastResult = { data: null, error: err };
      
      if (err.message !== 'Failed to fetch') {
        return lastResult;
      }
    }

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  return lastResult;
}
