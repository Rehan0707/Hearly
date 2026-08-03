// Automated Waitlist Confirmation Email Service for Hearly
// Official Contact Email: hearly.in@gmail.com

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const OFFICIAL_EMAIL = 'hearly.in@gmail.com';

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

      <div style="border-top: 1px solid #222; padding-top: 20px; margin-top: 24px; font-size: 12px; color: #666; text-align: center;">
        <p style="margin: 0 0 6px 0;">Hearly — Next-Gen AI Voice Intelligence</p>
        <p style="margin: 0 0 6px 0; color: #888;">Contact: <a href="mailto:${OFFICIAL_EMAIL}" style="color: #BAF72B; text-decoration: none;">${OFFICIAL_EMAIL}</a></p>
        <a href="https://hearly.live" style="color: #BAF72B; text-decoration: none;">https://hearly.live</a>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Hearly <welcome@hearly.live>',
        reply_to: OFFICIAL_EMAIL,
        to: [userEmail],
        subject: 'Welcome to the Hearly Waitlist! 🚀',
        html: emailHtml,
      }),
    });

    const resData = await response.json();
    if (response.ok) {
      console.log('[EmailService] Confirmation email sent successfully to:', userEmail, resData);
      return { success: true, data: resData };
    } else {
      console.warn('[EmailService] Resend API response error:', resData);
      return { success: false, error: resData };
    }
  } catch (err) {
    console.warn('[EmailService] Resend email send exception:', err);
    return { success: false, error: String(err) };
  }
}
