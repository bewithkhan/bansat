// Works out the age on the server and stores only the result, never the year of birth.
export async function POST(req: Request) {
  const form = await req.formData();
  const age = new Date().getFullYear() - Number(form.get('birth_year'));
  const ageStatus = age >= 13 ? 'ok' : 'needs_parental_consent';
  return Response.json({ ageStatus });
}
