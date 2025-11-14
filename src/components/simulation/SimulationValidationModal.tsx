"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  isOpen: boolean;
  initial: {
    temperature?: string | number | null;
    operationHour?: string | number | null;
    goodProduct?: string | number | null;
    defectProduct?: string | number | null;
  };
  onCloseAction: () => void;
  onSubmitAction: (payload: {
    temperature: string;
    operationHour: string;
    goodProduct: string;
    defectProduct: string;
  }) => void;
};

export default function SimulationValidationModal({
  isOpen,
  initial,
  onCloseAction,
  onSubmitAction,
}: Props) {
  const [temperature, setTemperature] = useState<string>("");
  const [operationHour, setOperationHour] = useState<string>("");
  const [goodProduct, setGoodProduct] = useState<string>("");
  const [defectProduct, setDefectProduct] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setTemperature(
      initial.temperature == null ? "" : String(initial.temperature)
    );
    setOperationHour(
      initial.operationHour == null ? "" : String(initial.operationHour)
    );
    setGoodProduct(
      initial.goodProduct == null ? "" : String(initial.goodProduct)
    );
    setDefectProduct(
      initial.defectProduct == null ? "" : String(initial.defectProduct)
    );
  }, [isOpen, initial]);

  const handleSubmit = () => {
    onSubmitAction({
      temperature: temperature.trim(),
      operationHour: operationHour.trim(),
      goodProduct: goodProduct.trim(),
      defectProduct: defectProduct.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle>Validation</DialogTitle>
          <DialogDescription>
            Verify or adjust sensor summary values before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pb-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Avg. Temperature
            </label>
            <Input
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="e.g. 75"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Operation Hour
            </label>
            <Input
              value={operationHour}
              onChange={(e) => setOperationHour(e.target.value)}
              placeholder="e.g. 2"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Good Product
            </label>
            <Input
              value={goodProduct}
              onChange={(e) => setGoodProduct(e.target.value)}
              placeholder="e.g. 28"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Defect Product
            </label>
            <Input
              value={defectProduct}
              onChange={(e) => setDefectProduct(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="ghost"
              onClick={onCloseAction}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
