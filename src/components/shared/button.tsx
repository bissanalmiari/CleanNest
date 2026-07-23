import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-card font-medium font-body transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60";

  const variantClasses =
    variant === "primary"
      ? "bg-primary text-white shadow-card hover:bg-primary-dark"
      : variant === "secondary"
        ? "border border-primary text-primary hover:bg-primary-light"
        : "text-primary hover:bg-primary-light";

  const sizeClasses =
    size === "sm" ? "px-4 py-2 text-sm" : size === "lg" ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className ?? ""}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
};