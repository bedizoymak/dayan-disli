// Whitelist of allowed emails for protected pages
export const ALLOWED_EMAILS = [
  "bedizoymak@gmail.com",
  "info@dayandisli.com"
];

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
