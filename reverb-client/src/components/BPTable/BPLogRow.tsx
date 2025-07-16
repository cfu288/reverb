import { RowData, Row, Cell, flexRender } from "@tanstack/react-table";
import { TableRow, TableCell } from "../ui/table";

export const BPLogRow = <TData extends RowData>({
  row,
}: {
  row: Row<TData>;
}) => {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
};
