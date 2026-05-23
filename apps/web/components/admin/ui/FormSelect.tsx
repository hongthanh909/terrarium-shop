import React from "react";

interface Option {
  label: string;
  value: string;
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

export function FormSelect({ 
  label, 
  options, 
  error, 
  className = "", 
  ...props 
}: FormSelectProps) {
  const baseClasses = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] bg-white transition-all";
  const errorClasses = error ? "border-red-500 focus:ring-red-200" : "border-gray-300";
  const finalClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      
      <select className={finalClasses} {...props}>
        <option value="" disabled>-- Chọn {label.toLowerCase()} --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
