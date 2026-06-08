interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
}

export default function GradientButton({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3.5 rounded-lg text-white font-semibold text-[15px] bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899] hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
