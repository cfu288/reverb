import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  useMemo,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BPLog } from "../BPLog";
import { BatchEntryForm } from "./BatchEntryForm";

const FormSchema = z.object({
  dateTime: z.date({
    required_error: "A date is required.",
  }),
  systolic: z.string().refine(
    (value) => {
      const num = Number(value);
      return num >= 0 && num <= 400;
    },
    {
      message: "Systolic value must be between 0 and 400.",
    }
  ),
  diastolic: z.string().refine(
    (value) => {
      const num = Number(value);
      return num >= 0 && num <= 400;
    },
    {
      message: "Diastolic value must be between 0 and 400.",
    }
  ),
});

type TabButtonsProps = {
  activeTab: "single" | "batch";
  setActiveTab: React.Dispatch<React.SetStateAction<"single" | "batch">>;
};

const TabButtons: React.FC<TabButtonsProps> = ({ activeTab, setActiveTab }) => (
  <div
    className="flex space-x-2"
    style={{ position: "relative", top: "1px", left: "0" }}
  >
    <button
      className={`tab px-4 py-1 rounded-t-md transition-colors duration-150 text-sm active:scale-[99%] ${
        activeTab === "single"
          ? "bg-white text-black hover:bg-gray-50 border-t border-l border-r border-gray-400"
          : "bg-gray-50 text-black hover:bg-gray-50 border-t border-l border-r border-b border-gray-400"
      }`}
      onClick={() => setActiveTab("single")}
    >
      Add Single Entry
    </button>
    <button
      className={`tab px-4 py-1 rounded-t-md transition-colors duration-150 text-sm active:scale-[99%] ${
        activeTab === "batch"
          ? "bg-white text-black hover:bg-gray-50 border-t border-l border-r border-gray-400"
          : "bg-gray-50 text-black hover:bg-gray-50 border-t border-l border-r border-b border-gray-400"
      }`}
      onClick={() => setActiveTab("batch")}
    >
      Add Batch Entry
    </button>
  </div>
);

type SingleEntryFormProps = {
  form: UseFormReturn<z.infer<typeof FormSchema>>;
  systolicInputRef: React.RefObject<HTMLInputElement>;
  diastolicInputRef: React.RefObject<HTMLInputElement>;
  handleSystolicChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDiastolicChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  updateFutureEntry: (
    field: "systolic" | "diastolic" | "dateTime",
    value: string
  ) => void;
  addRow: () => void;
  futureEntry: BPLog;
};

const SingleEntryForm: React.FC<SingleEntryFormProps> = ({
  form,
  systolicInputRef,
  diastolicInputRef,
  handleSystolicChange,
  handleDiastolicChange,
  handleTimeChange,
  handleKeyDown,
  updateFutureEntry,
  addRow,
  futureEntry,
}) => {
  return (
    <Form {...form}>
      <form
        className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 p-2"
        onSubmit={form.handleSubmit(() => {
          addRow();
          form.reset({
            systolic: "",
            diastolic: "",
            dateTime: new Date(futureEntry.dateTime),
          });
          if (systolicInputRef.current) {
            systolicInputRef.current.focus();
          }
        })}
      >
        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => {
            return (
              <FormItem className="flex flex-col w-full border border-gray-400 rounded-md">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"ghost"}
                        className={cn(
                          "w-full h-full text-left text-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? format(field.value, "PPP")
                          : format(new Date(futureEntry.dateTime), "PPP")}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || new Date(futureEntry.dateTime)}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date);
                          updateFutureEntry("dateTime", date.toISOString());
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <input
          type="time"
          value={new Date(futureEntry.dateTime)
            .toLocaleTimeString("en-US", { hour12: false })
            .slice(0, 5)}
          onChange={handleTimeChange}
          className="w-full px-3 py-1 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
        <FormField
          control={form.control}
          name="systolic"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full h-full">
              <input
                type="number"
                placeholder="Systolic"
                {...field}
                ref={systolicInputRef}
                onChange={(e) => {
                  field.onChange(e);
                  handleSystolicChange(e);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  form.formState.errors.systolic
                    ? "border-red-500"
                    : "focus:ring-blue-500"
                }`}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="diastolic"
          render={({ field }) => (
            <FormItem className="flex flex-col w-full">
              <input
                type="number"
                placeholder="Diastolic"
                {...field}
                ref={diastolicInputRef}
                onChange={(e) => {
                  field.onChange(e);
                  handleDiastolicChange(e);
                }}
                className={`w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  form.formState.errors.diastolic
                    ? "border-red-500"
                    : "focus:ring-blue-500"
                }`}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="h-auto">
          +
        </Button>
      </form>
    </Form>
  );
};

type NewEntryFormProps = {
  futureEntry: BPLog;
  updateFutureEntry: (
    field: "systolic" | "diastolic" | "dateTime",
    value: string
  ) => void;
  addRow: () => void;
  setData: (data: BPLog[]) => void;
};

export const NewEntryForm: React.FC<NewEntryFormProps> = ({
  futureEntry,
  updateFutureEntry,
  addRow,
  setData,
}) => {
  const systolicInputRef = useRef<HTMLInputElement>(null);
  const diastolicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (systolicInputRef.current) {
        systolicInputRef.current.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSystolicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFutureEntry("systolic", value);
  };

  const handleDiastolicChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateFutureEntry("diastolic", value);
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const [hours, minutes] = value.split(":").map(Number);
    const currentDateTime = new Date(futureEntry.dateTime);
    currentDateTime.setHours(hours, minutes, 0, 0);
    updateFutureEntry("dateTime", currentDateTime.toISOString());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/") {
      e.preventDefault();
      diastolicInputRef.current?.focus();
    }
  };

  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedPhoto(e.target.files[0]);
    }
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: useMemo(() => {
      return {
        dateTime: new Date(futureEntry.dateTime),
        systolic: futureEntry.systolic,
        diastolic: futureEntry.diastolic,
      };
    }, [futureEntry]),
  });

  useEffect(() => {
    form.reset({
      dateTime: new Date(futureEntry.dateTime),
      systolic: futureEntry.systolic,
      diastolic: futureEntry.diastolic,
    });
  }, [futureEntry, form]);

  return (
    <div className="p-4 border-gray-400 border rounded mx-2">
      <label className="block text-md font-medium text-gray-700 mb-2">
        Add New Entry
      </label>
      <p className="text-gray-700 mb-4 italic">
        Tip: To navigate quicker, hit{" "}
        <kbd className="hover:bg-gray-100 min-h-[30px] inline-flex justify-center items-center py-1 px-1.5 bg-white border border-gray-200 font-mono text-sm text-gray-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:shadow-[0px_2px_0px_0px_rgba(255,255,255,0.1)] rounded-md">
          Tab
        </kbd>{" "}
        to move between fields. Press{" "}
        <kbd className="hover:bg-gray-100 min-h-[30px] inline-flex justify-center items-center py-1 px-1.5 bg-white border border-gray-200 font-mono text-sm text-gray-800 shadow-[0px_2px_0px_0px_rgba(0,0,0,0.08)] hover:shadow-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:shadow-[0px_2px_0px_0px_rgba(255,255,255,0.1)] rounded-md">
          Enter
        </kbd>{" "}
        to add the new entry to the log.
      </p>
      <div className="relative mt-4">
        <TabButtons activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="border rounded-b-md border-gray-400 bg-white">
          {activeTab === "single" && (
            <SingleEntryForm
              form={form}
              systolicInputRef={systolicInputRef}
              diastolicInputRef={diastolicInputRef}
              handleSystolicChange={handleSystolicChange}
              handleDiastolicChange={handleDiastolicChange}
              handleTimeChange={handleTimeChange}
              handleKeyDown={handleKeyDown}
              updateFutureEntry={updateFutureEntry}
              addRow={addRow}
              futureEntry={futureEntry}
            />
          )}
          {activeTab === "batch" && (
            <BatchEntryForm
              uploadedPhoto={uploadedPhoto}
              handlePhotoUpload={handlePhotoUpload}
              setUploadedPhoto={setUploadedPhoto}
              setData={setData}
            />
          )}
        </div>
      </div>
    </div>
  );
};
