'use client';
import { useState } from 'react';

const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

// Year of birth is asked neutrally, with no default. The server works out the age and keeps only the result.
export default function SignUp() {
  const [newsletter, setNewsletter] = useState(false);
  return (
    <form action="/api/signup" method="post">
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="birth_year">Year of birth</label>
      <select id="birth_year" name="birth_year" required defaultValue="">
        <option value="" disabled>Select</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <label htmlFor="parent_email">A parent or guardian's email, if you're under 13</label>
      <input id="parent_email" name="parent_email" type="email" />
      <label>
        <input type="checkbox" name="newsletter" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
        Send me product news (optional; unsubscribe any time)
      </label>
      <button type="submit">Create account</button>
      <p>By creating an account you agree to our Terms. Our <a href="/privacy">privacy notice</a> explains how we use your data.</p>
    </form>
  );
}
