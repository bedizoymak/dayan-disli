// Whitelist of allowed emails for protected pages
export const ALLOWED_EMAILS = [
  "bedizoymak@gmail.com",
  "info@dayandisli.com",
  "bedizoymak1@gmail.com",
  "hayridayan58@gmail.com",
  "ebruozmus@gmail.com",
  "info@cehadisli.com"
];

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
