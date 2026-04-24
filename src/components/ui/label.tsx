import * as React from 'react'

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={['form-label', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
)
Label.displayName = 'Label'
export { Label }
