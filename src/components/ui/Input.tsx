import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-navy">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-card border px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            error ? "border-red-400" : "border-navy/15"
          } ${className ?? ""}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";