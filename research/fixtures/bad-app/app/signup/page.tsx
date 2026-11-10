export default function SignUp() {
  return (
    <form action="/api/signup" method="post">
      <input name="email" type="email" placeholder="Email" />
      <input name="password" type="password" placeholder="Password" />
      <label>
        <input type="checkbox" name="marketing" defaultChecked /> Send me offers and news
      </label>
      <button type="submit">Sign up</button>
    </form>
  );
}
