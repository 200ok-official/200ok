"use client";

import React from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  error, 
  className = "", 
  id,
  ...props 
}) => {
  return (
    <label className="flex items-center group cursor-pointer w-fit">
      <div className="relative flex items-center justify-center">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div className={`w-5 h-5 border-2 rounded bg-white peer-checked:bg-[#20263e] peer-checked:border-[#20263e] transition-all duration-200 group-hover:border-[#20263e] flex items-center justify-center ${
          error ? "border-red-500" : "border-[#c5ae8c]"
        }`}>
          <svg
            className={`w-3.5 h-3.5 text-white transition-opacity duration-200 ${
              props.checked ? "opacity-100" : "opacity-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-[#20263e] group-hover:text-[#c5ae8c] transition-colors duration-200">
          {label}
        </span>
      )}
    </label>
  );
};

