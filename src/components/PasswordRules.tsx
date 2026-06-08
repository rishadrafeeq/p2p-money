import { validatePassword, PASSWORD_RULES_MESSAGE } from "@/lib/password";

export default function PasswordRules({ password }: { password: string }) {
  if (!password) {
    return (
      <p className="text-xs text-slate-400 mb-4 -mt-2">{PASSWORD_RULES_MESSAGE}</p>
    );
  }

  const minLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const { valid } = validatePassword(password);

  return (
    <ul className="text-xs mb-4 -mt-2 space-y-1">
      <Rule ok={minLength} text="At least 8 characters" />
      <Rule ok={hasLetter} text="Contains a letter" />
      <Rule ok={hasNumber} text="Contains a number" />
      {valid && <li className="text-green-600">Password meets requirements</li>}
    </ul>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={ok ? "text-green-600" : "text-slate-400"}>
      {ok ? "✓" : "○"} {text}
    </li>
  );
}
