import React, { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import { Error } from "@/components/ui/error"

const sizes = {
  xSmall: "h-6 text-xs rounded-md",
  small: "h-8 text-sm rounded-md",
  mediumSmall: "h-10 text-sm rounded-md",
  medium: "h-10 text-sm rounded-md",
  large: "h-12 text-base rounded-lg",
}

interface InputProps {
  placeholder?: string
  size?: keyof typeof sizes
  prefix?: React.ReactNode | string
  suffix?: React.ReactNode | string
  prefixStyling?: boolean | string
  suffixStyling?: boolean | string
  disabled?: boolean
  error?: string | boolean
  label?: string
  value?: string
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  ref?: React.RefObject<HTMLInputElement>
  className?: string
  wrapperClassName?: string
}

export const ShugarInput = ({
  placeholder,
  size = "medium",
  prefix,
  suffix,
  prefixStyling = true,
  suffixStyling = true,
  disabled = false,
  error,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  ref,
  className,
  wrapperClassName,
  ...rest
}: InputProps) => {
  const [internalValue, setInternalValue] = useState(value ?? "")
  const fallbackRef = useRef<HTMLInputElement>(null)
  const inputRef = (ref ?? fallbackRef) as React.RefObject<HTMLInputElement>

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(event.target.value)
    onChange?.(event.target.value)
  }

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  return (
    <div className="flex flex-col gap-2" onClick={() => inputRef.current?.focus()}>
      {label && <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>}
      <div
        className={clsx(
          "flex items-center transition font-sans",
          error ? "ring-2 ring-red-500 bg-red-50" : "border border-slate-200 hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#2D2DDD]/40 focus-within:border-[#2D2DDD]",
          sizes[size],
          disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-white dark:bg-slate-900",
          wrapperClassName
        )}
      >
        {prefix && (
          <div
            className={clsx(
              "text-slate-500 flex items-center justify-center h-full",
              prefixStyling === true
                ? "bg-slate-100 border-r border-slate-200 px-3"
                : prefixStyling
                ? prefixStyling
                : "pl-3",
              size === "large" ? "rounded-l-lg" : "rounded-l-md"
            )}
          >
            {prefix}
          </div>
        )}
        <input
          className={clsx(
            "w-full appearance-none outline-none placeholder:text-slate-400",
            size === "xSmall" || size === "mediumSmall" ? "px-2" : "px-3",
            disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-transparent text-slate-900 dark:text-slate-100",
            className
          )}
          placeholder={placeholder}
          disabled={disabled}
          value={internalValue}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          ref={inputRef}
          {...rest}
        />
        {suffix && (
          <div
            className={clsx(
              "text-slate-500 flex items-center justify-center h-full",
              suffixStyling === true
                ? "bg-slate-100 border-l border-slate-200 px-3"
                : suffixStyling
                ? suffixStyling
                : "pr-3",
              size === "large" ? "rounded-r-lg" : "rounded-r-md"
            )}
          >
            {suffix}
          </div>
        )}
      </div>
      {typeof error === "string" && <Error size={size === "large" ? "large" : "small"}>{error}</Error>}
    </div>
  )
}


