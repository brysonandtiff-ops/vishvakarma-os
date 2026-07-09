import React, {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react';

type RootContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const RootContext = createContext<RootContextValue | null>(null);

function useRootContext() {
  return useContext(RootContext) ?? {
    open: true,
    setOpen: () => {},
    titleId: 'test-dialog-title',
    descriptionId: 'test-dialog-description',
  };
}

type RootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Root({ children, open, defaultOpen = false, onOpenChange }: RootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const titleId = useId();
  const descriptionId = useId();
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? Boolean(open) : internalOpen;

  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <RootContext.Provider value={{ open: currentOpen, setOpen, titleId, descriptionId }}>
      {children}
    </RootContext.Provider>
  );
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

export function Close({ asChild, children, onClick, ...props }: TriggerProps) {
  const { setOpen } = useRootContext();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (isValidElement(children)) {
      (children.props as { onClick?: (event: React.MouseEvent<HTMLElement>) => void }).onClick?.(event);
    }
    setOpen(false);
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

export const Overlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => {
  const { open } = useRootContext();
  if (!open) return null;
  return (
    <div ref={ref} data-state="open" {...props}>
      {children}
    </div>
  );
});
Overlay.displayName = 'DialogOverlay';

export const Content = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => {
  const { open, titleId, descriptionId } = useRootContext();
  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-state="open"
      {...props}
    >
      {children}
    </div>
  );
});
Content.displayName = 'DialogContent';

export const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ children, ...props }, ref) => {
  const { titleId } = useRootContext();
  return (
    <h2 ref={ref} id={titleId} {...props}>
      {children}
    </h2>
  );
});
Title.displayName = 'DialogTitle';

export const Description = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ children, ...props }, ref) => {
  const { descriptionId } = useRootContext();
  return (
    <p ref={ref} id={descriptionId} {...props}>
      {children}
    </p>
  );
});
Description.displayName = 'DialogDescription';
