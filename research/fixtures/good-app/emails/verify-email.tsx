import { Body, Html, Link, Text } from '@react-email/components';

// A service message: no promotion, so it needs no unsubscribe link.
export default function VerifyEmail({ url }: { url: string }) {
  return (
    <Html>
      <Body>
        <Text>Confirm your email address to finish creating your account.</Text>
        <Link href={url}>Confirm my email</Link>
      </Body>
    </Html>
  );
}
