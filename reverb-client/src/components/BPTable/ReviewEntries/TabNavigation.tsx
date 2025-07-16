import React from "react";

export const TabNavigation = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const tabs = [
    { key: "table", label: "Table" },
    { key: "graph", label: "Graph" },
    { key: "markdown", label: "Copy Table as Text" },
  ];

  return (
    <div className="relative mt-4">
      <div
        className="flex space-x-2"
        style={{ position: "relative", top: "1px", left: "0" }}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            className={`tab px-4 py-1 rounded-t-md transition-colors duration-150 text-sm active:scale-[99%] ${
              activeTab === key
                ? "bg-white text-black hover:bg-gray-50 border-t border-l border-r border-gray-400"
                : "bg-gray-50 text-black hover:bg-gray-50 border-t border-l border-r border-b border-gray-400"
            }`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
