/**
 * WhatsApp number (07XXXXXXXX) that receives listing confirmations from posters.
 * Admins compare the sender with the listing's phone before approving. Empty hides the step.
 */
export const ADMIN_WHATSAPP = '0788731107';

/** Short code a poster sends to prove they own the listing's phone number. */
export function verifyCode(listingId: string): string {
  return 'HU-' + listingId.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export function waLink(phone07: string, text: string): string {
  return `https://wa.me/962${phone07.slice(1)}?text=${encodeURIComponent(text)}`;
}
