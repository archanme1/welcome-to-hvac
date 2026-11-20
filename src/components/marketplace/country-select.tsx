import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES, countryName } from "@/lib/marketplace/locations";
import { cn } from "@/lib/utils";

export function CountrySelect({ value, onChange, allowAny, id }: {
  value: string | undefined; onChange: (code: string | undefined) => void; allowAny?: boolean; id?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {value ? countryName(value) : allowAny ? "All countries" : "Choose a country"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {allowAny ? (
              <CommandItem value="all countries" onSelect={() => { onChange(undefined); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />All countries
              </CommandItem>
            ) : null}
            {COUNTRIES.map((c) => (
              <CommandItem key={c.code} value={`${c.name} ${c.code}`} onSelect={() => { onChange(c.code); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value === c.code ? "opacity-100" : "opacity-0")} />{c.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
