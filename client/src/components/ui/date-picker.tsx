import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  selected,
  onSelect,
  disabled = false,
  className,
  placeholder = "YYYY-MM-DD",
}: DatePickerProps) {
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Parse date from string
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelect) {
      onSelect(parseDate(e.target.value));
    }
  };

  // Handle clear button click
  const handleClear = () => {
    if (onSelect) {
      onSelect(null);
    }
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={formatDate(selected)}
          onChange={handleDateChange}
          className="pl-10"
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
      {selected && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClear}
          type="button"
        >
          Clear
        </Button>
      )}
    </div>
  );
}