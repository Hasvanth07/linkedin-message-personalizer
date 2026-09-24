import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

// Fetches beyond Supabase's default 1,000-row response limit.
export async function readAll(table, ascending = true) {
  const rows = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const page = unwrap(
      await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending })
        .order("id", { ascending })
        .range(offset, offset + pageSize - 1)
    );

    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

