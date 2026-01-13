import type { ReactNode } from "react";

type StatRowProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function StatRow({ label, value, className }: StatRowProps) {
  const baseClasses = "flex items-center justify-between text-sm";
  const combinedClasses = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  return (
    <div className={combinedClasses}>
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
