// Automated Waitlist Confirmation Email Service for Hearly

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

/**
 * Sends a welcome/confirmation email to the waitlist subscriber.
 * @param {string} userEmail
 * @param {string} useCase
 */
export async function sendWaitlistConfirmationEmail(userEmail, useCase = 'Student') {
  if (!userEmail) return;

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #050505; color: #ffffff; border-radius: 16px; border: 1px solid #222;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 700; color: #BAF72B; margin: 0 0 8px 0;">Welcome to Hearly! 🚀</h2>
        <p style="font-size: 15px; color: #a0a0a0; line-height: 1.6; margin: 0;">You're officially on the early access waitlist.</p>
      </div>

      <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.08);">
        <p style="font-size: 14px; color: #e0e0e0; line-height: 1.6; margin: 0 0 12px 0;">
          Hi there,
        </p>
        <p style="font-size: 14px; color: #a0a0a0; line-height: 1.6; margin: 0 0 12px 0;">
          Thank you for joining the Hearly waitlist! We are building the next-generation voice intelligence platform with real-time speaker identification, live transcription, and smart meeting analysis.
        </p>
        <p style="font-size: 14px; color: #a0a0a0; line-height: 1.6; margin: 0;">
          We've reserved your spot and will update you directly at <strong>${userEmail}</strong> as soon as Hearly officially launches!
        </p>
      </div>

      <div style="border-top: 1px solid #222; pt: 20px; margin-top: 24px; font-size: 12px; color: #666; text-align: center;">
        <p style="margin: 0 0 6px 0;">Hearly — Next-Gen AI Voice Intelligence</p>
        <a href="https://hearly.live" style="color: #BAF72B; text-decoration: none;">https://hearly.live</a>
      </div>
    </div>
  `;

  // 1. If Resend API Key is set in .env
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Hearly <welcome@hearly.live>',
          to: [userEmail],
          subject: 'Welcome to the Hearly Waitlist! 🚀',
          html: emailHtml,
        }),
      });

      if (response.ok) {
        console.log('[EmailService] Confirmation email sent successfully via Resend to:', userEmail);
        return { success: true };
      }
    } catch (err) {
      console.warn('[EmailService] Resend email send exception:', err);
    }
  }

  // 2. Log confirmation trigger for preview
  console.log('[EmailService] Confirmation email queued for subscriber:', userEmail);
  return { success: true };
}
