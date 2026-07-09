import React, {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useState,
} from 'react';

type RootContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const RootContext = createContext<RootContextValue | null>(null);

function useRootContext() {
  return useContext(RootContext) ?? { open: true, setOpen: () => {} };
}

type RootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Root({ children, open, defaultOpen = false, onOpenChange }: RootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? Boolean(open) : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return <RootContext.Provider value={{ open: currentOpen, setOpen }}>{children}</RootContext.Provider>;
}

type TriggerProps = HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
  children?: ReactNode;
};

export function Trigger({ asChild, children, onClick, ...props }: TriggerProps) {
  const { setOpen } = useRootContext();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (isValidElement(children)) {
      (children.props as { onClick?: (event: React.MouseEvent<HTMLElement>) => void }).onClick?.(event);
    }
    setOpen(true);
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(children as ReactElement, {
      ...props,
      onClick: handleClick,
    });
  }

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

export function Portal({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

type ContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
};

export const Content = forwardRef<HTMLDivElement, ContentProps>(({ children, align, side, sideOffset, ...props }, ref) => {
  const { open } = useRootContext();
  if (!open) return null;

  return (
    <div ref={ref} data-align={align} data-side={side} data-side-offset={sideOffset} {...props}>
      {children}
    </div>
  );
});
Content.displayName = 'PopoverContent';

export function Anchor({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
