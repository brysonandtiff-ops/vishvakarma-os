import React, { forwardRef, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type CommandRootProps = HTMLAttributes<HTMLDivElement> & {
  shouldFilter?: boolean;
};

const CommandRoot = forwardRef<HTMLDivElement, CommandRootProps>(({ children, ...props }, ref) => (
  <div ref={ref} cmdk-root="" {...props}>
    {children}
  </div>
));
CommandRoot.displayName = 'Command';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input ref={ref} cmdk-input="" {...props} />
));
Input.displayName = 'Command.Input';

const List = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} cmdk-list="" {...props}>
    {children}
  </div>
));
List.displayName = 'Command.List';

const Empty = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
  <div ref={ref} cmdk-empty="" {...props}>
    {children}
  </div>
));
Empty.displayName = 'Command.Empty';

type GroupProps = HTMLAttributes<HTMLDivElement> & {
  heading?: ReactNode;
};

const Group = forwardRef<HTMLDivElement, GroupProps>(({ children, heading, ...props }, ref) => (
  <div ref={ref} cmdk-group="" {...props}>
    {heading ? <div cmdk-group-heading="">{heading}</div> : null}
    {children}
  </div>
));
Group.displayName = 'Command.Group';

type ItemProps = HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onSelect?: (value: string) => void;
};

const Item = forwardRef<HTMLDivElement, ItemProps>(({ children, value = '', onSelect, onClick, ...props }, ref) => (
  <div
    ref={ref}
    role="option"
    cmdk-item=""
    tabIndex={0}
    {...props}
    onClick={(event) => {
      onClick?.(event);
      onSelect?.(value);
    }}
  >
    {children}
  </div>
));
Item.displayName = 'Command.Item';

const Separator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} cmdk-separator="" {...props} />
));
Separator.displayName = 'Command.Separator';

export const Command = Object.assign(CommandRoot, {
  Input,
  List,
  Empty,
  Group,
  Item,
  Separator,
});
