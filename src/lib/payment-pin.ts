export function validatePaymentPin(pin: string): { valid: boolean; error?: string } {
  const value = String(pin);

  if (!value) {
    return { valid: false, error: "Payment PIN is required" };
  }

  if (value.length < 4 || value.length > 20) {
    return { valid: false, error: "PIN must be 4-20 characters" };
  }

  if (/\s/.test(value)) {
    return { valid: false, error: "PIN cannot contain spaces" };
  }

  if (!/^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(value)) {
    return { valid: false, error: "Letters, numbers, and symbols only" };
  }

  return { valid: true };
}
