export const PASSWORD_RULES_MESSAGE =
  "Password must be at least 8 characters and include both letters and numbers.";

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: PASSWORD_RULES_MESSAGE };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: PASSWORD_RULES_MESSAGE };
  }

  return { valid: true };
}

export function passwordsMatch(stored: string, entered: string): boolean {
  return stored.toLowerCase() === entered.toLowerCase();
}
