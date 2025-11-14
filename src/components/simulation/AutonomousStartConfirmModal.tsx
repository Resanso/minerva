"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onConfirmAction: () => void;
  onCloseAction: () => void;
};

export default function AutonomousStartConfirmModal({
  isOpen,
  onConfirmAction,
  onCloseAction,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-md p-5">
        <DialogHeader>
          <DialogTitle>Start Autonomous Mode?</DialogTitle>
          <DialogDescription>
            Apakah anda akan memulai autonomus menggunakan akurasi data saat
            ini?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button variant="ghost" onClick={onCloseAction}>
              Cancel
            </Button>
            <Button onClick={onConfirmAction}>Start Autonomous</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
