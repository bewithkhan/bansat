import { Resend } from 'resend';
import LaunchAnnouncement from '@/emails/launch-announcement';

const resend = new Resend(process.env.RESEND_API_KEY);

// The launch email is marketing (Bansat 9.11): one-click unsubscribe per RFC 8058.
export async function sendLaunchEmail(to: string, unsubscribeUrl: string) {
  await resend.emails.send({
    from: 'Fixture <hello@example.com>',
    to,
    subject: "We've launched",
    react: LaunchAnnouncement({ unsubscribeUrl }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}
