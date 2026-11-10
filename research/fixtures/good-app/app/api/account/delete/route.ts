import { createClient } from '@supabase/supabase-js';

// Server only: the service-role key never leaves the server.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')!; // set by the auth middleware after it checks the session
  await admin.auth.admin.deleteUser(userId);
  return new Response(null, { status: 204 });
}
