"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  startOfYear,
  format,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export type DatePreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "custom";

export interface DateRangeFilterProps {
  /** Current date range values */
  value?: DateRange;
  /** Callback fired when date range changes */
  onChange: (range: DateRange) => void;
  /** Optional class name for the root container */
  className?: string;
  /** Placeholder text when no range selected */
  placeholder?: string;
  /** Whether to show the presets dropdown inline */
  inline?: boolean;
}

// ============================================================================
// Preset Calculations
// ============================================================================

function calculatePresetRange(preset: DatePreset): DateRange | null {
  const now = new Date();

  switch (preset) {
    case "today":
      return {
        dateFrom: format(startOfDay(now), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "last_7_days":
      return {
        dateFrom: format(subDays(startOfDay(now), 6), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "last_30_days":
      return {
        dateFrom: format(subDays(startOfDay(now), 29), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "this_month":
      return {
        dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return {
        dateFrom: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        dateTo: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      };
    }
    case "this_quarter":
      return {
        dateFrom: format(startOfQuarter(now), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "this_year":
      return {
        dateFrom: format(startOfYear(now), "yyyy-MM-dd"),
        dateTo: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "custom":
      return null;
    default:
      return null;
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  custom: "Custom",
};

// ============================================================================
// Component
// ============================================================================

export function DateRangeFilter({
  value,
  onChange,
  className,
  placeholder = "Select date range",
  inline = false,
}: DateRangeFilterProps) {
  const [preset, setPreset] = React.useState<DatePreset>("custom");
  const [fromOpen, setFromOpen] = React.useState(false);
  const [toOpen, setToOpen] = React.useState(false);

  const dateFrom = value?.dateFrom ?? "";
  const dateTo = value?.dateTo ?? "";

  const handlePresetChange = (newPreset: string) => {
    const p = newPreset as DatePreset;
    setPreset(p);

    const range = calculatePresetRange(p);
    if (range) {
      onChange(range);
    }
  };

  const handleFromChange = (date: Date | undefined) => {
    setPreset("custom");
    onChange({
      dateFrom: date ? format(date, "yyyy-MM-dd") : "",
      dateTo,
    });
    setFromOpen(false);
  };

  const handleToChange = (date: Date | undefined) => {
    setPreset("custom");
    onChange({
      dateFrom,
      dateTo: date ? format(date, "yyyy-MM-dd") : "",
    });
    setToOpen(false);
  };

  const handleClearFrom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreset("custom");
    onChange({ dateFrom: "", dateTo });
  };

  const handleClearTo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreset("custom");
    onChange({ dateFrom, dateTo: "" });
  };

  const handleClearAll = () => {
    setPreset("custom");
    onChange({ dateFrom: "", dateTo: "" });
  };

  const fromDate = dateFrom ? new Date(dateFrom + "T00:00:00") : undefined;
  const toDate = dateTo ? new Date(dateTo + "T00:00:00") : undefined;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (inline) {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {/* Presets dropdown */}
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRESET_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* From date picker */}
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? formatDisplayDate(dateFrom) : "From"}
              {dateFrom && (
                <X
                  className="ml-auto h-3 w-3 opacity-50 hover:opacity-100"
                  onClick={handleClearFrom}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={handleFromChange}
              disabled={(date) => (toDate ? date > toDate : false)}
              defaultMonth={fromDate}
            />
          </PopoverContent>
        </Popover>

        {/* To date picker */}
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? formatDisplayDate(dateTo) : "To"}
              {dateTo && (
                <X
                  className="ml-auto h-3 w-3 opacity-50 hover:opacity-100"
                  onClick={handleClearTo}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={handleToChange}
              disabled={(date) => (fromDate ? date < fromDate : false)}
              defaultMonth={toDate || fromDate}
            />
          </PopoverContent>
        </Popover>

        {/* Clear all button */}
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-9 px-2 text-muted-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear dates
          </Button>
        )}
      </div>
    );
  }

  // Compact mode: single popover trigger showing the range
  const hasRange = dateFrom || dateTo;
  const displayText = hasRange
    ? `${dateFrom ? formatDisplayDate(dateFrom) : "Start"} - ${dateTo ? formatDisplayDate(dateTo) : "End"}`
    : placeholder;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRESET_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !dateFrom && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? formatDisplayDate(dateFrom) : "From"}
            {dateFrom && (
              <X
                className="ml-auto h-3 w-3 opacity-50 hover:opacity-100"
                onClick={handleClearFrom}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={handleFromChange}
            disabled={(date) => (toDate ? date > toDate : false)}
            defaultMonth={fromDate}
          />
        </PopoverContent>
      </Popover>

      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !dateTo && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? formatDisplayDate(dateTo) : "To"}
            {dateTo && (
              <X
                className="ml-auto h-3 w-3 opacity-50 hover:opacity-100"
                onClick={handleClearTo}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={handleToChange}
            disabled={(date) => (fromDate ? date < fromDate : false)}
            defaultMonth={toDate || fromDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
