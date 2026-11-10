export default function Privacy() {
  return (
    <main>
      <h1>Privacy notice</h1>
      <p>Version 1, effective 1 November 2026. Fixture Ltd is the controller for the personal data described here.</p>
      <h2>What we collect and why</h2>
      <p>
        We use your email address to run your account and, only if you ask for it, to send product news. We ask for
        your year of birth to work out whether you need a parent's consent, then keep only the result. Under-13s need
        a parent or guardian to agree before the account opens.
      </p>
      <h2>Who processes your data for us</h2>
      <ul>
        <li>Supabase hosts our database and sign-in, in the EU.</li>
        <li>Anthropic runs the AI feature. It receives the text you ask it to work on and doesn't train on it.</li>
        <li>Resend sends our emails.</li>
        <li>Stripe takes payments. Card details go straight to Stripe and never reach us.</li>
        <li>Google Analytics measures visits, but only if you accept analytics cookies.</li>
      </ul>
      <h2>Your rights</h2>
      <p>
        You can download your data or delete your account at any time from your account page, withdraw consent in
        Cookie settings, and complain to us or to the ICO.
      </p>
    </main>
  );
}
