/**
 * Generate a random 8-character alphanumeric invite code
 * Format: XXXXXXXX (uppercase letters and numbers)
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
