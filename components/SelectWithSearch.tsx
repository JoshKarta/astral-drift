"use client";

import { useEffect, useId, useState } from "react";
import { CheckIcon, ChevronDownIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectWithSearchProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  options?: SelectOption[];
  fetchUrl?: string;
  transformData?: (data: unknown) => SelectOption[];
  id?: string;
  allowCustomInput?: boolean;
  customInputMessage?: string;
}

export default function SelectWithSearch({
  value = "",
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  label,
  className,
  disabled = false,
  options: staticOptions,
  fetchUrl,
  transformData,
  id: providedId,
  allowCustomInput = false,
  customInputMessage = "Add custom option",
}: SelectWithSearchProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const [open, setOpen] = useState<boolean>(false);
  const [options, setOptions] = useState<SelectOption[]>(staticOptions || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState<string>("");

  // Fetch data from API if fetchUrl is provided
  useEffect(() => {
    if (!fetchUrl || staticOptions) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();

        if (transformData) {
          const transformedOptions = transformData(data);
          setOptions(transformedOptions);
        } else {
          // Default transformation - assumes data is array of objects with value and label
          setOptions(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchUrl, transformData, staticOptions]);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    onValueChange?.(newValue);
    setOpen(false);
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : selectedOption ? (
                selectedOption.label
              ) : (
                placeholder
              )}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              onValueChange={setSearchValue}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-red-500">
                  {error}
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {allowCustomInput && searchValue.trim() ? (
                      <CommandItem
                        onSelect={() => {
                          onValueChange?.(searchValue.trim());
                          setOpen(false);
                          setSearchValue("");
                        }}
                        className="cursor-pointer"
                      >
                        <span className="text-blue-600">
                          {customInputMessage}: &quot;{searchValue.trim()}&quot;
                        </span>
                      </CommandItem>
                    ) : (
                      emptyMessage
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={handleSelect}
                      >
                        {option.label}
                        {value === option.value && (
                          <CheckIcon size={16} className="ml-auto" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
