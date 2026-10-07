import { Check } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectTrigger = SelectPrimitive.Trigger
const SelectIcon = SelectPrimitive.Icon

function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 6,
  align = 'end',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface-raised p-1 text-sm text-text shadow-modal',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex h-8 cursor-pointer items-center gap-2 rounded-sm pr-8 pl-2.5 whitespace-nowrap text-text-muted outline-none select-none',
        'data-highlighted:bg-surface-hover data-highlighted:text-text data-[state=checked]:font-medium data-[state=checked]:text-text',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
        <Check className="size-3.5 text-primary" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectIcon, SelectItem, SelectTrigger, SelectValue }
