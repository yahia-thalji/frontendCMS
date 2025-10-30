import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column<T = Record<string, unknown>> {
  header: string;
  accessor: string;
  cell?: (value: unknown, row: T) => ReactNode;
}

interface ResponsiveTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  mobileCardRender?: (item: T, index: number) => ReactNode;
}

export default function ResponsiveTable<T = Record<string, unknown>>({ columns, data, mobileCardRender }: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell 
                      ? column.cell((row as Record<string, unknown>)[column.accessor], row)
                      : String((row as Record<string, unknown>)[column.accessor] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              {mobileCardRender ? (
                mobileCardRender(item, index)
              ) : (
                <div className="space-y-3">
                  {columns.map((column, colIndex) => (
                    <div key={colIndex} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500">{column.header}:</span>
                      <span className="text-sm text-gray-900 text-left">
                        {column.cell 
                          ? column.cell((item as Record<string, unknown>)[column.accessor], item)
                          : String((item as Record<string, unknown>)[column.accessor] || '')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}