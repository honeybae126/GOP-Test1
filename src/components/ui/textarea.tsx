import * as React from 'react'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      className={['form-input', className].filter(Boolean).join(' ')}
      style={{ minHeight: '6rem', resize: 'vertical', ...style }}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
export { Textarea }
