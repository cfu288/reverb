import { markdownTable } from "markdown-table";
import { useCallback, useEffect, useState } from "react";
import { BPLog } from "../BPLog";
import { useMeanAndClassification } from "../hooks/useMeanAndClassification";

export const MarkdownView = ({ data }: { data: BPLog[] }) => {
  const [copied, setCopied] = useState(false);
  const [markdownRepresentation, setMarkdownRepresentation] =
    useState<string>("");

  const { meanSystolic, meanDiastolic, hypertensionClassification } =
    useMeanAndClassification(data);

  const storeMarkdownRepresentation = useCallback(
    (data: BPLog[]) => {
      const groupedData: { [key: string]: string[] } = {};

      data.forEach((entry) => {
        const localDateTime = new Date(entry.dateTime).toLocaleString("en-US", {
          hour12: true,
        });
        if (!groupedData[localDateTime]) {
          groupedData[localDateTime] = [];
        }
        groupedData[localDateTime].push(`${entry.systolic}/${entry.diastolic}`);
      });

      const markdownData = Object.entries(groupedData).map(([date, bps]) => [
        date,
        ...bps,
      ]);

      const markdownString = markdownTable([
        ["Date", "Blood Pressures"],
        ...markdownData,
        ["Average", `${meanSystolic.toFixed(0)}/${meanDiastolic.toFixed(0)}`],
        ["Classification", hypertensionClassification],
      ]);

      setMarkdownRepresentation(markdownString);
    },
    [hypertensionClassification, meanDiastolic, meanSystolic]
  );

  useEffect(() => {
    storeMarkdownRepresentation(data);
  }, [data, storeMarkdownRepresentation]);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 3000);
      return () => {
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [copied, setCopied]);

  return (
    <div className="relative m-2">
      <div className="text-center text-black">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600"> </span>
          <button
            className={`bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md ${
              copied
                ? "cursor-not-allowed bg-green-700 hover:bg-green-600 text-white"
                : "cursor-pointer"
            }`}
            onClick={() => {
              navigator.clipboard.writeText(markdownRepresentation);
              setCopied(true);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <pre id="markdown-code" className="text-black">
            <code>
              {data.length > 0
                ? markdownRepresentation
                : "Start entering blood pressure entries to see data here."}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
