import React, {
  cloneElement,
  createContext,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useState,
} from 'react';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  return useContext(DialogContext) ?? {
    open: true,
    setOpen: () => {},
    titleId: 'test-dialog-title',
    descriptionId: 'test-dialog-description',
  };
}

type DialogProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Dialog({ children, open, defaultOpen = false, onOpenChange }: DialogProps) {
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
    <DialogContext.Provider value={{ open: currentOpen, setOpen, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

type TriggerProps = HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
  children: ReactNode;
};

export function DialogTrigger({ asChild, children, onClick, ...props }: TriggerProps) {
  const { setOpen } = useDialogContext();

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

export function DialogContent({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, titleId, descriptionId } = useDialogContext();
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2 id={titleId} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();
  return (
    <p id={descriptionId} {...props}>
      {children}
    </p>
  );
}

export function DialogHeader({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function DialogFooter({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props}>{children}</div>;
}

export function DialogClose({ children, onClick, ...props }: TriggerProps) {
  const { setOpen } = useDialogContext();
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
    setOpen(false);
  };

  return (
    <button type="button" {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

export function DialogPortal({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DialogOverlay({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open } = useDialogContext();
  if (!open) return null;
  return <div {...props}>{children}</div>;
}
