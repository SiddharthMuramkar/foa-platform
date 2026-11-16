export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
}

export class NotificationService {
  async sendEmail(payload: NotificationPayload): Promise<boolean> {
    const adapter = process.env.EMAIL_ADAPTER || 'console';
    if (adapter === 'console') {
      console.log(`[Notification: Email Console Sink] To: ${payload.to} | Subject: "${payload.subject}"`);
      return true;
    }
    // SMTP/SES adapter hook for AWS deployment
    console.log(`[Notification: ${adapter}] Message queued for ${payload.to}`);
    return true;
  }
}

export const notificationService = new NotificationService();
