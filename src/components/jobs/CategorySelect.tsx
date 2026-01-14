import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
}

interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  className?: string;
}

let categoryCache: Category[] | null = null;
let categoryCachePromise: Promise<Category[]> | null = null;

export function CategorySelect({
  value,
  onChange,
  placeholder = "Wybierz kategorię...",
  className,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>(() => categoryCache ?? []);
  const [loading, setLoading] = useState(() => !categoryCache);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (categoryCache) return;

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        if (!categoryCachePromise) {
          categoryCachePromise = (async () => {
            const { data, error } = await supabase
              .from("categories")
              .select("id, name, parent_id, description")
              .order("name");

            if (error) throw error;
            return (data ?? []) as Category[];
          })();
        }

        const data = await categoryCachePromise;
        categoryCache = data;

        if (!cancelled) setCategories(data);
      } catch {
        // ignore - UI will just show placeholder
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();

    return () => {
      cancelled = true;
    };
  }, []);

  // Group categories by parent
  const { mainCategories, subcategoriesMap } = useMemo(() => {
    const main = categories.filter((c) => !c.parent_id);
    const subMap = new Map<string, Category[]>();

    categories.forEach((c) => {
      if (c.parent_id) {
        const existing = subMap.get(c.parent_id) || [];
        subMap.set(c.parent_id, [...existing, c]);
      }
    });

    return { mainCategories: main, subcategoriesMap: subMap };
  }, [categories]);

  const selectedCategory = categories.find(c => c.id === value);
  const parentCategory = selectedCategory?.parent_id 
    ? categories.find(c => c.id === selectedCategory.parent_id)
    : null;

  if (loading) {
    return (
      <Button variant="outline" className={cn("w-full justify-start", className)} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Ładowanie kategorii...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <CategoryIcon name={parentCategory?.name || selectedCategory.name} className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                {parentCategory ? `${parentCategory.name} → ${selectedCategory.name}` : selectedCategory.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Szukaj kategorii..." />
          <CommandList>
            <CommandEmpty>Nie znaleziono kategorii.</CommandEmpty>
            {mainCategories.map(mainCat => {
              const subcategories = subcategoriesMap.get(mainCat.id) || [];
              
              return (
                <CommandGroup key={mainCat.id} heading={mainCat.name}>
                  {/* Main category as option */}
                  <CommandItem
                    value={`${mainCat.name}`}
                    onSelect={() => {
                      onChange(mainCat.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <CategoryIcon name={mainCat.name} className="h-4 w-4 text-primary" />
                    <span className="font-medium">{mainCat.name}</span>
                    {subcategories.length > 0 && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        Ogólna
                      </Badge>
                    )}
                    {value === mainCat.id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                  
                  {/* Subcategories */}
                  {subcategories.map(subCat => (
                    <CommandItem
                      key={subCat.id}
                      value={`${mainCat.name} ${subCat.name}`}
                      onSelect={() => {
                        onChange(subCat.id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 pl-8"
                    >
                      <span className="text-sm">{subCat.name}</span>
                      {value === subCat.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
