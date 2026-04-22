import * as React from 'react'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, style, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={['form-input', className].filter(Boolean).join(' ')}
      style={style}
      {...props}
    />
  )
)
Input.displayName = 'Input'
export { Input }
