import { Table as DSTable, TableHead, TableBody, TableRow as DSTableRow, Th, Td } from "../../design-system";
import type { ReactNode, TableHTMLAttributes } from "react";

export type TableHeader = {
  label: string;
  align?: "left" | "center" | "right";
};

export type TableRow = {
  cells: ReactNode[];
  key?: string;
};

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  headers: TableHeader[];
  rows: TableRow[];
};

export function Table({ headers, rows, className }: TableProps) {
  return (
    <DSTable className={className}>
      <TableHead>
        <DSTableRow>
          {headers.map((header, i) => (
            <Th key={i} align={header.align ?? "left"}>{header.label}</Th>
          ))}
        </DSTableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <DSTableRow key={row.key ?? rowIndex}>
            {row.cells.map((cell, cellIndex) => (
              <Td key={cellIndex} align={headers[cellIndex]?.align ?? "left"}>{cell}</Td>
            ))}
          </DSTableRow>
        ))}
      </TableBody>
    </DSTable>
  );
}
