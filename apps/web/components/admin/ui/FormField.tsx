import React from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export function FormField({ 
  label, 
  error, 
  multiline = false, 
  className = "", 
  ...props 
}: FormFieldProps) {
  const baseClasses = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#6d8c5a] transition-all";
  const errorClasses = error ? "border-red-500 focus:ring-red-200" : "border-gray-300";
  const finalClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      
      {multiline ? (
        <textarea 
          className={finalClasses} 
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} 
        />
      ) : (
        <input 
          className={finalClasses} 
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)} 
        />
      )}
      
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
