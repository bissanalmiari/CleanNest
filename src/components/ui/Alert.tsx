interface AlertProps {
  variant: "error" | "success" | "info";
  children: React.ReactNode;
}

const STYLES: Record<AlertProps["variant"], string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-green-200 bg-green-50 text-green-700",
  info: "border-primary-light bg-primary-light text-primary-dark",
};

export function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`rounded-card border px-4 py-3 text-sm font-medium ${STYLES[variant]}`}>
      {children}
    </div>
  );
}