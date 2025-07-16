import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BPLog } from "../BPLog";
import { sessionStorageKey } from "../BPLogApp";

export const DeleteAllButton = ({
  setData,
}: {
  setData: React.Dispatch<React.SetStateAction<BPLog[]>>;
}) => (
  <div className="flex justify-end mt-2">
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete All</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This will delete the log data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button
              variant="destructive"
              onClick={() => {
                setData([]);
                sessionStorage.removeItem(sessionStorageKey);
              }}
            >
              Confirm Delete
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="ml-2">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
