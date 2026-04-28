'use client'

import React from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

/** Toggle switch — SynthCare design system primitive.
 *  Renders with an optional label wrapper when `label` is provided. */
export function Toggle({ checked, onChange, disabled, label, id }: ToggleProps) {
  const button = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={
        `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-200 ` +
        `focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1 ` +
        `${checked ? 'bg-primary-600' : 'bg-gray-200'} ` +
        `${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}` +
        `${disabled && !label ? ' opacity-50' : ''}`
      }
    >
      <span
        className={
          `pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white ` +
          `shadow-lg ring-0 transition-transform duration-200 ease-in-out ` +
          `${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`
        }
      />
    </button>
  )

  if (!label) return button

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      {button}
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

