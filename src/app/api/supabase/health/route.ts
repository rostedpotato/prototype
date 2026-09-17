import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const [{ data, error: authError }, { count, error: databaseError }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    ]);

    if (authError) {
      return Response.json(
        { ok: false, error: authError.message },
        { status: 502 }
      );
    }

    if (databaseError) {
      return Response.json(
        { ok: false, error: databaseError.message },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      database: true,
      tournamentCount: count ?? 0,
      authenticated: Boolean(data.session),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Supabase connection failed.',
      },
      { status: 500 }
    );
  }
}
