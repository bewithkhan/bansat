export default function Account() {
  return (
    <main>
      <h1>Your account</h1>
      <form action="/api/account/export" method="post">
        <button type="submit">Download my data</button>
      </form>
      <form action="/api/account/delete" method="post">
        <button type="submit">Delete my account</button>
      </form>
    </main>
  );
}
