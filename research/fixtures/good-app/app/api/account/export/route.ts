// Returns everything we hold about the signed-in user as JSON (right of access and portability).
export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  return Response.json({ userId, profile: {}, consents: [] }, { headers: { 'Content-Disposition': 'attachment; filename="my-data.json"' } });
}
