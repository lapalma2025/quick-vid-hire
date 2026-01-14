import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Loader2, X } from "lucide-react";
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
  icon: string | null;
}

interface CategoryMultiSelectProps {
  value: string[];
  onChange: (categoryIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

let categoryCache: Category[] | null = null;
let categoryCachePromise: Promise<Category[]> | null = null;

export function CategoryMultiSelect({
  value,
  onChange,
  placeholder = "Wyszukaj i dodaj kategorię...",
  className,
}: CategoryMultiSelectProps) {
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
              .select("id, name, parent_id, icon")
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

  // Get selected categories info
  const selectedCategories = categories.filter(c => value.includes(c.id));
  
  // Available categories (not selected)
  const availableCategories = categories.filter(c => !value.includes(c.id));

  const toggleCategory = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter(id => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
  };

  const removeCategory = (categoryId: string) => {
    onChange(value.filter(id => id !== categoryId));
  };

  if (loading) {
    return (
      <Button variant="outline" className={cn("w-full justify-start", className)} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Ładowanie kategorii...
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected categories badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => {
            const parentCategory = category.parent_id 
              ? categories.find(c => c.id === category.parent_id)
              : null;
            
            return (
              <Badge
                key={category.id}
                variant="secondary"
                className="gap-1.5 pr-1.5 py-1.5 text-sm"
              >
                <CategoryIcon
                  name={parentCategory?.name || category.name}
                  className="h-3.5 w-3.5"
                />
                {parentCategory ? `${parentCategory.name} → ${category.name}` : category.name}
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Category search dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            <span className="text-muted-foreground">{placeholder}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 z-50" align="start">
          <Command>
            <CommandInput placeholder="Szukaj kategorii..." />
            <CommandList>
              <CommandEmpty>Nie znaleziono kategorii.</CommandEmpty>
              {mainCategories.map(mainCat => {
                const subcategories = (subcategoriesMap.get(mainCat.id) || [])
                  .filter(sub => !value.includes(sub.id));
                const isMainSelected = value.includes(mainCat.id);
                
                // Skip if main category and all subcategories are selected
                if (isMainSelected && subcategories.length === 0) return null;
                
                return (
                  <CommandGroup key={mainCat.id} heading={mainCat.name}>
                    {/* Main category as option */}
                    {!isMainSelected && (
                      <CommandItem
                        value={`${mainCat.name}`}
                        onSelect={() => {
                          toggleCategory(mainCat.id);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <CategoryIcon name={mainCat.name} className="h-4 w-4 text-primary" />
                        <span className="font-medium">{mainCat.name}</span>
                        {subcategoriesMap.get(mainCat.id)?.length ? (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Ogólna
                          </Badge>
                        ) : null}
                      </CommandItem>
                    )}
                    
                    {/* Subcategories */}
                    {subcategories.map(subCat => (
                      <CommandItem
                        key={subCat.id}
                        value={`${mainCat.name} ${subCat.name}`}
                        onSelect={() => {
                          toggleCategory(subCat.id);
                        }}
                        className="flex items-center gap-2 pl-8 cursor-pointer"
                      >
                        <span className="text-sm">{subCat.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              {availableCategories.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Wszystkie kategorie zostały wybrane
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}