import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Table as TanstackTable } from "@tanstack/table-core";
import { BPLog } from "../BPLog";
import { GraphView } from "./GraphView";
import { DeleteAllButton } from "./DeleteAllButton";
import { MarkdownView } from "./MarkdownView";
import { TableView } from "./TableView";
import { TabNavigation } from "./TabNavigation";

export const ReviewEntries = ({
  activeTab,
  setActiveTab,
  data,
  table,
  columns,
  meanSystolic,
  meanDiastolic,
  hypertensionClassification,
  setData,
}: {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  data: BPLog[];
  table: TanstackTable<BPLog>;
  columns: ColumnDef<BPLog>[];
  meanSystolic: number;
  meanDiastolic: number;
  hypertensionClassification: string;
  setData: React.Dispatch<React.SetStateAction<BPLog[]>>;
}) => {
  return (
    <div className="p-4 border-gray-400 border rounded mt-4 mx-2">
      <label className="block text-md font-medium text-gray-700 mb-2">
        Review Entries
      </label>
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="border rounded-b-md border-gray-400">
        {activeTab === "table" && (
          <TableView
            table={table}
            columns={columns}
            data={data}
            meanSystolic={meanSystolic}
            meanDiastolic={meanDiastolic}
            hypertensionClassification={hypertensionClassification}
          />
        )}
        {activeTab === "graph" && <GraphView data={data} />}
        {activeTab === "markdown" && <MarkdownView data={data} />}
      </div>
      <DeleteAllButton setData={setData} />
    </div>
  );
};
