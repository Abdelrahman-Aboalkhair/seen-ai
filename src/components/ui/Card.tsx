import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-slate-800/70 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6 shadow-2xl hover:border-cyan-500/40 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <h3
      className={cn("text-xl font-semibold text-white", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("text-gray-300", className)} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ children, className, ...props }: CardProps) {
  return (
    <p className={cn("text-sm text-gray-400", className)} {...props}>
      {children}
    </p>
  );
}
