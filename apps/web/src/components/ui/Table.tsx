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

export function Table({ headers, rows, className, ...props }: TableProps) {
  const tableClass = ["dense-table", className].filter(Boolean).join(" ");

  return (
    <table className={tableClass} {...props}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={`${header.label}-${index}`} style={{ textAlign: header.align ?? "left" }}>
              {header.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.key ?? rowIndex}>
            {row.cells.map((cell, cellIndex) => (
              <td key={`${row.key ?? rowIndex}-${cellIndex}`} style={{ textAlign: headers[cellIndex]?.align ?? "left" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
