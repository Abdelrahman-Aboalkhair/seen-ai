import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isOpen?: boolean;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (value: string) => void;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  children,
  className = "",
  value,
  onValueChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue);
    setIsOpen(false);
  };

  // Clone children and pass down props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === SelectTrigger) {
        return React.cloneElement(child, {
          onClick: handleToggle,
          isOpen,
        } as any);
      }
      if (child.type === SelectContent) {
        return React.cloneElement(child, {
          isOpen,
        } as any);
      }
      if (child.type === SelectItem) {
        return React.cloneElement(child, {
          onClick: handleSelect,
        } as any);
      }
    }
    return child;
  });

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {childrenWithProps}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = "",
  onClick,
  isOpen = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
      {isOpen ? (
        <ChevronUp className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-500" />
      )}
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = "",
  isOpen = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  className = "",
  onClick,
}) => {
  const handleClick = () => {
    onClick?.(value);
  };

  return (
    <div
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  className = "",
  children,
}) => {
  return (
    <span className={`text-gray-900 dark:text-gray-100 ${className}`}>
      {children || placeholder}
    </span>
  );
};
