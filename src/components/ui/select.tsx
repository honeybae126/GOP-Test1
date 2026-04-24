'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, style, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={className}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '0.5rem', height: 36, padding: '0 0.75rem',
      border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      background: 'white', fontSize: 'var(--font-size-sm)', color: 'var(--foreground)',
      cursor: 'pointer', outline: 'none', transition: 'border-color var(--transition-base)',
      minWidth: 120, whiteSpace: 'nowrap',
      ...style,
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <i className="fas fa-chevron-down" style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)', flexShrink: 0 }} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', style, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={className}
      style={{
        background: 'white', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden', zIndex: 50, minWidth: 'var(--radix-select-trigger-width)',
        ...style,
      }}
      {...props}
    >
      <SelectPrimitive.Viewport style={{ padding: '0.25rem' }}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, style, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={className}
    style={{ padding: '0.25rem 0.5rem', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--muted-foreground)', ...style }}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, style, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={className}
    style={{
      display: 'flex', alignItems: 'center', padding: '0.5rem 0.75rem',
      fontSize: 'var(--font-size-sm)', color: 'var(--foreground)',
      borderRadius: 'calc(var(--radius) - 2px)', cursor: 'pointer',
      outline: 'none', userSelect: 'none',
      ...style,
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--secondary)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, style, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={className}
    style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0', ...style }}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select, SelectGroup, SelectValue, SelectTrigger,
  SelectContent, SelectLabel, SelectItem, SelectSeparator,
}
