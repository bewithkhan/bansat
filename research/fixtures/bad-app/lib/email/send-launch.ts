import { Resend } from 'resend';
import LaunchAnnouncement from '@/emails/launch-announcement';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLaunchEmail(to: string[]) {
  await resend.emails.send({ from: 'hello@example.com', to, subject: "We've launched!", react: LaunchAnnouncement() });
}
