import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ResponsiveColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Shown as label in mobile card layout */
  mobileLabel?: string;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveDataViewProps<T> {
  rows: T[];
  columns: ResponsiveColumn<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  className?: string;
  mobileCardClassName?: string;
}

export default function ResponsiveDataView<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage = 'No records yet.',
  className,
  mobileCardClassName,
}: ResponsiveDataViewProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <>
      <div className={cn('hidden overflow-x-auto tablet:block', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 tablet:hidden">
        {rows.map((row) => (
          <article
            key={getRowKey(row)}
            className={cn(
              'vish-crafted-card rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm',
              mobileCardClassName,
            )}
          >
            <dl className="space-y-2">
              {mobileColumns.map((col) => (
                <div key={col.key} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className="min-w-0 text-sm text-foreground">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
