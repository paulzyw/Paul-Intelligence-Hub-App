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
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 500
): Promise<{ data: T | null; error: any }> {
  let lastResult: { data: T | null; error: any } = { data: null, error: null };
  
  for (let i = 0; i < retries; i++) {
    const result = await queryFn();
    if (!result.error) {
      return result;
    }
    
    lastResult = result;
    console.warn(`Supabase query attempt ${i + 1} failed:`, result.error);
    
    // Don't retry on certain errors (e.g. invalid query)
    if (result.error.code?.startsWith('P') || result.error.code === '42703') {
      return result;
    }

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  return lastResult;
}
