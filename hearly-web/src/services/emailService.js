import { supabase } from './supabaseWaitlist';

export async function sendWaitlistConfirmationEmail(userEmail, useCase = 'Student', interestedPlan = 'Basic') {
  if (!userEmail) return { success: false, error: 'email is required' };

  try {
    const { data, error } = await supabase.functions.invoke('waitlist', {
      body: {
        email: userEmail.trim().toLowerCase(),
        use_case: useCase,
        interested_plan: interestedPlan,
      },
    });

    if (error) {
      console.warn('[EmailService] Waitlist function error:', error);
      return { success: false, error: error.message || 'waitlist function failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.warn('[EmailService] Waitlist function exception:', error);
    return { success: false, error: String(error) };
  }
}
