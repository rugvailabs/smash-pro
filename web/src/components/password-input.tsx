"use client";

import { useState } from "react";

/* Password field with a show/hide toggle — one shared component so every
   password input in the app (sign-in, registration, admin account) gets
   the same eye-icon affordance instead of each form rolling its own. */
export function PasswordInput({
  id, value, onChange, className, autoComplete, required, minLength, placeholder,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
        style={{ paddingRight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-n600 hover:text-ink"
      >
        {show ? (
          <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.8">
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.83 2.83M9.3 5.3A10.6 10.6 0 0 1 12 5c5 0 9 4 10 7-.4 1.1-1.1 2.3-2.1 3.4M6.2 6.6C4 8.1 2.4 10.2 2 12c.7 2 2.6 4.5 5.1 6"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.8">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
