import React, {
  cloneElement,
  createContext,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useState,
} from 'react';

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  return useContext(PopoverContext) ?? { open: true, setOpen: () => {} };
}

type PopoverProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Popover({ children, open, defaultOpen = false, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? Boolean(open) : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return <PopoverContext.Provider value={{ open: currentOpen, setOpen }}>{children}</PopoverContext.Provider>;
}

type TriggerProps = HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
  children: ReactNode;
};

export function PopoverTrigger({ asChild, children, onClick, ...props }: TriggerProps) {
  const { setOpen } = usePopoverContext();

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

type PopoverContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'center' | 'end';
};

export function PopoverContent({ children, align, ...props }: PopoverContentProps) {
  const { open } = usePopoverContext();
  if (!open) return null;

  return (
    <div data-align={align} {...props}>
      {children}
    </div>
  );
}
