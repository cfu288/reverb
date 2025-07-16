import debounce from "lodash.debounce";
import { useCallback, useState } from "react";

import {
  CellContext,
  ColumnDef,
  getCoreRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { AppLayout } from "../AppLayout";
import { NewEntryForm } from "./NewSingleEntryForm/NewEntryForm";
import { Table as TanstackTable } from "@tanstack/table-core";
import { DiastolicCell } from "./DiastolicCell";
import { SystolicCell } from "./SystolicCell";
import { DateCell } from "./DateCell";
import { generateDefaultDatetime } from "./helpers/generateDefaultDatetime";
import { BPLog } from "./BPLog";
import { useMeanAndClassification } from "./hooks/useMeanAndClassification";
import { useFutureEntryDate } from "./hooks/useFutureEntryDate";
import { useSaveDataToSession } from "./hooks/useSaveDataToSession";
import { ReviewEntries } from "./ReviewEntries/ReviewEntries";
import { Header } from "./Header";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

export const sessionStorageKey = "reverb_bp-log-data";

const saveDataToSession = debounce((data: BPLog[]) => {
  if (data.length !== 0) {
    console.log("Saving data to session storage");
    sessionStorage.setItem(sessionStorageKey, JSON.stringify(data));
  }
}, 100);

const BPLogApp = () => {
  const [data, setData] = useState<BPLog[]>(() => {
    const savedData = sessionStorage.getItem(sessionStorageKey);
    return savedData ? JSON.parse(savedData) : [];
  });

  const [futureEntry, setFutureEntry] = useState<BPLog>({
    id: "",
    dateTime: generateDefaultDatetime(),
    systolic: "",
    diastolic: "",
  });

  const [activeTab, setActiveTab] = useState("table");

  const { meanSystolic, meanDiastolic, hypertensionClassification } =
    useMeanAndClassification(data);

  useFutureEntryDate(data, setFutureEntry);

  const updateData = (rowIndex: number, columnId: string, value: unknown) => {
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex]!,
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  useSaveDataToSession(data, saveDataToSession);

  const deleteRow = (rowIndex: number) => {
    setData((old) => old.filter((_, index) => index !== rowIndex));
  };

  const addRow = useCallback(() => {
    setData((prevData) => [
      ...prevData,
      { ...futureEntry, id: new Date().toLocaleString() },
    ]);
    setFutureEntry({
      id: "",
      dateTime: generateDefaultDatetime(),
      systolic: "",
      diastolic: "",
    });
  }, [futureEntry]);

  const updateFutureEntry = (
    field: "systolic" | "diastolic" | "dateTime",
    value: string
  ) => {
    setFutureEntry((prevEntry) => ({ ...prevEntry, [field]: value }));
  };

  const columns: ColumnDef<BPLog>[] = [
    {
      accessorKey: "dateTime",
      header: "Date",
      cell: (props: CellContext<BPLog, unknown>) =>
        DateCell(props as CellContext<BPLog, string>),
    },
    {
      accessorKey: "systolic",
      header: "Systolic",
      cell: (props: CellContext<BPLog, unknown>) =>
        SystolicCell(props as CellContext<BPLog, string>),
    },
    {
      accessorKey: "diastolic",
      header: "Diastolic",
      cell: (props: CellContext<BPLog, unknown>) =>
        DiastolicCell(props as CellContext<BPLog, string>),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: CellContext<BPLog, unknown>) => (
        <button onClick={() => deleteRow(row.index)}>
          <span role="img" aria-label="delete">
            🗑️
          </span>
        </button>
      ),
    },
  ];

  const table: TanstackTable<BPLog> = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

  return (
    <AppLayout>
      <div className="container mx-auto py-10">
        <Header />
        <NewEntryForm
          futureEntry={futureEntry}
          updateFutureEntry={updateFutureEntry}
          addRow={addRow}
          setData={setData}
        />
        <ReviewEntries
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          data={data}
          table={table}
          columns={columns}
          meanSystolic={meanSystolic}
          meanDiastolic={meanDiastolic}
          hypertensionClassification={hypertensionClassification}
          setData={setData}
        />
      </div>
    </AppLayout>
  );
};

export default BPLogApp;
