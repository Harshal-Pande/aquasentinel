import { supabaseServer } from '../supabase';

export async function getCachedData<T>(table: string, key: string): Promise<{ data: T | null; stale: boolean }> {
  try {
    const { data, error } = await supabaseServer
      .from(table)
      .select('data, updated_at')
      .eq('id', key)
      .single();

    if (error || !data) {
      return { data: null, stale: true };
    }

    // Determine staleness based on table TTL rules
    const ageMs = Date.now() - new Date(data.updated_at).getTime();
    let isStale = false;

    if (table === 'locations') {
      isStale = ageMs > 30 * 24 * 60 * 60 * 1000; // 30 days
    } else if (table === 'environmental_cache') {
      isStale = ageMs > 24 * 60 * 60 * 1000; // 24 hours
    } else if (table === 'analysis_cache') {
      isStale = ageMs > 7 * 24 * 60 * 60 * 1000; // 7 days (or until source changes)
    }

    return { data: data.data as T, stale: isStale };
  } catch (e) {
    console.error(`Cache read error [${table}]:`, e);
    return { data: null, stale: true };
  }
}

export async function setCachedData(table: string, key: string, payload: any): Promise<void> {
  try {
    await supabaseServer
      .from(table)
      .upsert({ id: key, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch (e) {
    console.error(`Cache write error [${table}]:`, e);
  }
}

// Utility to normalize coordinates for caching
export function normalizeCoordinates(lat: number, lon: number): string {
  // Round to 3 decimal places (approx 111m precision, good enough for regional climate data)
  const latStr = lat.toFixed(3);
  const lonStr = lon.toFixed(3);
  return `coord:${latStr}:${lonStr}`;
}
