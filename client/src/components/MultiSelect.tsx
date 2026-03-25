import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustomValue?: boolean;
  onCustomValueAdd?: (value: string) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
  allowCustomValue = false,
  onCustomValueAdd,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUnselect = useCallback((item: string) => {
    onChange(selected.filter((i) => i !== item));
  }, [selected, onChange]);

  const handleSelect = useCallback((value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }, [selected, onChange]);

  const handleAddCustomValue = useCallback(() => {
    if (inputValue && allowCustomValue && onCustomValueAdd) {
      onCustomValueAdd(inputValue);
      setInputValue("");
    }
  }, [inputValue, allowCustomValue, onCustomValueAdd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputValue && allowCustomValue && onCustomValueAdd) {
      e.preventDefault();
      handleAddCustomValue();
    }
  }, [inputValue, allowCustomValue, onCustomValueAdd, handleAddCustomValue]);

  const displayedOptions = options.filter(option => {
    // Only show options that include the input value
    if (inputValue) {
      return option.label.toLowerCase().includes(inputValue.toLowerCase());
    }
    // Otherwise show all options
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-1.5">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between h-auto min-h-10 w-full", className)}
            onClick={() => setOpen(!open)}
          >
            <div className="flex gap-1 flex-wrap">
              {selected.length === 0 && (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selected.map((item) => {
                const displayName = options.find((option) => option.value === item)?.label || item;
                return (
                  <Badge variant="secondary" key={item} className="mr-1 mb-1">
                    {displayName}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false} onKeyDown={handleKeyDown}>
            <CommandInput 
              placeholder="Search..." 
              value={inputValue}
              onValueChange={setInputValue}
              ref={inputRef}
              className="h-9"
            />
            <CommandEmpty className="py-2 px-1 text-center text-sm">
              {allowCustomValue ? (
                <div className="flex flex-col items-center gap-2">
                  <span>No items found</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={handleAddCustomValue}
                  >
                    <Plus className="h-3 w-3" />
                    Add "{inputValue}"
                  </Button>
                </div>
              ) : (
                "No items found."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {displayedOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}>
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
              {allowCustomValue && inputValue && !options.some(option => 
                option.label.toLowerCase() === inputValue.toLowerCase()
              ) && (
                <CommandItem
                  value={inputValue}
                  className="text-muted-foreground"
                  onSelect={handleAddCustomValue}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  );
}