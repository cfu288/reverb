import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { BPLogRow } from "../BPLogRow";
import { Table as TanstackTable } from "@tanstack/table-core";
import { BPLog } from "../BPLog";

export const TableView = ({
  table,
  columns,
  data,
  meanSystolic,
  meanDiastolic,
  hypertensionClassification,
}: {
  table: TanstackTable<BPLog>;
  columns: ColumnDef<BPLog>[];
  data: BPLog[];
  meanSystolic: number;
  meanDiastolic: number;
  hypertensionClassification: string;
}) => (
  <div className="">
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => <BPLogRow key={row.id} row={row} />)
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-12 text-center">
              Start entering blood pressure entries to see data here.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    {data.length > 0 && (
      <div className="p-2 border-t border-gray-400 flex justify-between">
        <p className="text-sm">
          <strong>Classification:</strong> {hypertensionClassification}
        </p>
        <p className="text-sm">
          <strong>Average:</strong> {meanSystolic.toFixed(0)}/
          {meanDiastolic.toFixed(0)}
        </p>
      </div>
    )}
  </div>
);
