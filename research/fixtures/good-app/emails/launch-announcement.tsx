import { Body, Html, Link, Text } from '@react-email/components';

// Marketing email: sent only to people who said yes, with sender details and a one-click unsubscribe.
export default function LaunchAnnouncement({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  return (
    <Html>
      <Body>
        <Text>We've launched, and you're one of the first to know.</Text>
        <Text>You're getting this because you joined our waitlist and asked for news.</Text>
        <Link href={unsubscribeUrl}>Unsubscribe in one click</Link>
        <Text>Fixture Ltd · 1 Example Street, Glasgow G1 1AA · Company no. 00000000</Text>
      </Body>
    </Html>
  );
}
