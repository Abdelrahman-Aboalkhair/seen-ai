import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ children, className = "" }) => {
  return <div className={`relative ${className}`}>{children}</div>;
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = "",
}) => {
  return (
    <button
      type="button"
      className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-600 ${className}`}
      data-value={value}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  className = "",
}) => {
  return <span className={className}>{placeholder}</span>;
};
