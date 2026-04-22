import * as React from 'react'

type Variant = 'default' | 'primary' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'default' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

function getClasses(variant: Variant, size: Size): string {
  const v: Record<Variant, string> = {
    default:     'btn btn-primary',
    primary:     'btn btn-primary',
    outline:     'btn btn-outline',
    ghost:       'btn btn-ghost',
    destructive: 'btn btn-destructive',
    link:        'btn btn-ghost',
  }
  const s: Record<Size, string> = {
    default:  '',
    md:       '',
    sm:       'btn-sm',
    lg:       'btn-lg',
    icon:     'btn-icon',
    'icon-sm': 'btn-sm btn-icon',
  }
  return [v[variant], s[size]].filter(Boolean).join(' ')
}

function Button({ className, variant = 'default', size = 'default', asChild = false, children, ...props }: ButtonProps) {
  const cls = [getClasses(variant, size), className].filter(Boolean).join(' ')

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>
    return React.cloneElement(child, {
      className: [cls, child.props.className].filter(Boolean).join(' '),
    })
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}

Button.displayName = 'Button'
export { Button }
export type { ButtonProps }
