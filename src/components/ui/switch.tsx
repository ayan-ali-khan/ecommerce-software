import * as React from 'react';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, children, ...props }, ref) => (
    <label
      className={cn(
        'inline-flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm',
        className,
      )}
    >
      <span className="grow">{children}</span>
      <input
        type="checkbox"
        className="shrink-0 cursor-pointer appearance-none rounded-md border border-input bg-transparent px-2 py-1 text-sm checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary"
        ref={ref}
        {...props}
      />
    </label>
  ),
);
Switch.displayName = 'Switch';

export { Switch };
