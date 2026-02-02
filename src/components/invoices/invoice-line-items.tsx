"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { InvoiceLineItem } from "@/types";

interface InvoiceLineItemsProps {
  lineItems: InvoiceLineItem[];
  editable?: boolean;
  onUpdate?: (lineItemId: number, data: Partial<InvoiceLineItem>) => void;
  onDelete?: (lineItemId: number) => void;
}

export function InvoiceLineItems({
  lineItems,
  editable = false,
  onUpdate,
  onDelete,
}: InvoiceLineItemsProps) {
  const [editingValues, setEditingValues] = React.useState<
    Record<number, { quantity?: string; unit_price?: string }>
  >({});

  const handleQuantityChange = (lineItemId: number, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [lineItemId]: { ...prev[lineItemId], quantity: value },
    }));
  };

  const handleRateChange = (lineItemId: number, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [lineItemId]: { ...prev[lineItemId], unit_price: value },
    }));
  };

  const handleQuantityBlur = (lineItem: InvoiceLineItem) => {
    const editedValue = editingValues[lineItem.id]?.quantity;
    if (editedValue !== undefined) {
      const quantity = parseFloat(editedValue);
      if (!isNaN(quantity) && quantity !== lineItem.quantity) {
        onUpdate?.(lineItem.id, { quantity });
      }
      setEditingValues((prev) => {
        const updated = { ...prev };
        if (updated[lineItem.id]) {
          delete updated[lineItem.id].quantity;
          if (Object.keys(updated[lineItem.id]).length === 0) {
            delete updated[lineItem.id];
          }
        }
        return updated;
      });
    }
  };

  const handleRateBlur = (lineItem: InvoiceLineItem) => {
    const editedValue = editingValues[lineItem.id]?.unit_price;
    if (editedValue !== undefined) {
      const unit_price = parseFloat(editedValue);
      if (!isNaN(unit_price) && unit_price !== lineItem.unit_price) {
        onUpdate?.(lineItem.id, { unit_price });
      }
      setEditingValues((prev) => {
        const updated = { ...prev };
        if (updated[lineItem.id]) {
          delete updated[lineItem.id].unit_price;
          if (Object.keys(updated[lineItem.id]).length === 0) {
            delete updated[lineItem.id];
          }
        }
        return updated;
      });
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    lineItem: InvoiceLineItem,
    field: "quantity" | "unit_price"
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingValues((prev) => {
        const updated = { ...prev };
        if (updated[lineItem.id]) {
          delete updated[lineItem.id][field];
          if (Object.keys(updated[lineItem.id]).length === 0) {
            delete updated[lineItem.id];
          }
        }
        return updated;
      });
      e.currentTarget.blur();
    }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  if (lineItems.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right w-[100px]">Qty</TableHead>
              <TableHead className="text-right w-[120px]">Rate</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              {editable && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={editable ? 5 : 4}
                className="h-24 text-center text-muted-foreground"
              >
                No line items.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[100px]">Qty</TableHead>
            <TableHead className="text-right w-[120px]">Rate</TableHead>
            <TableHead className="text-right w-[120px]">Amount</TableHead>
            {editable && <TableHead className="w-[60px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((lineItem) => (
            <TableRow key={lineItem.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{lineItem.description}</span>
                  {lineItem.charge_type && (
                    <span className="text-xs text-muted-foreground">
                      {lineItem.charge_type}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {editable ? (
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={
                      editingValues[lineItem.id]?.quantity ??
                      lineItem.quantity.toString()
                    }
                    onChange={(e) =>
                      handleQuantityChange(lineItem.id, e.target.value)
                    }
                    onBlur={() => handleQuantityBlur(lineItem)}
                    onKeyDown={(e) => handleKeyDown(e, lineItem, "quantity")}
                    className="h-8 w-20 text-right ml-auto"
                  />
                ) : (
                  lineItem.quantity
                )}
              </TableCell>
              <TableCell className="text-right">
                {editable ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      editingValues[lineItem.id]?.unit_price ??
                      lineItem.unit_price.toString()
                    }
                    onChange={(e) =>
                      handleRateChange(lineItem.id, e.target.value)
                    }
                    onBlur={() => handleRateBlur(lineItem)}
                    onKeyDown={(e) => handleKeyDown(e, lineItem, "unit_price")}
                    className="h-8 w-24 text-right ml-auto"
                  />
                ) : (
                  formatCurrency(lineItem.unit_price)
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(lineItem.amount)}
              </TableCell>
              {editable && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete?.(lineItem.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete line item</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={editable ? 3 : 3} className="text-right">
              Subtotal
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(subtotal)}
            </TableCell>
            {editable && <TableCell />}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
