import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
}

interface CategorySubcategorySelectProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  mode?: "single" | "multi";
  showDescription?: boolean;
  className?: string;
}

export function CategorySubcategorySelect({
  selectedCategories,
  onCategoriesChange,
  mode = "multi",
  showDescription = false,
  className,
}: CategorySubcategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, parent_id, description")
      .order("name");
    
    if (data && !error) {
      setCategories(data);
    }
    setLoading(false);
  };

  // Group categories by parent
  const { mainCategories, subcategoriesMap } = useMemo(() => {
    const main = categories.filter(c => !c.parent_id);
    const subMap = new Map<string, Category[]>();
    
    categories.forEach(c => {
      if (c.parent_id) {
        const existing = subMap.get(c.parent_id) || [];
        subMap.set(c.parent_id, [...existing, c]);
      }
    });
    
    return { mainCategories: main, subcategoriesMap: subMap };
  }, [categories]);

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryToggle = (categoryId: string, isMain: boolean) => {
    if (mode === "single") {
      // In single mode, just select the clicked category
      onCategoriesChange([categoryId]);
      return;
    }

    // Multi mode
    const subcategories = subcategoriesMap.get(categoryId) || [];
    const subcategoryIds = subcategories.map(s => s.id);
    
    if (isMain) {
      // If main category is clicked
      const isSelected = selectedCategories.includes(categoryId);
      
      if (isSelected) {
        // Deselect main category and all its subcategories
        onCategoriesChange(
          selectedCategories.filter(id => id !== categoryId && !subcategoryIds.includes(id))
        );
      } else {
        // Select main category (which means "all subcategories")
        // Remove individual subcategories since parent is now selected
        onCategoriesChange([
          ...selectedCategories.filter(id => !subcategoryIds.includes(id)),
          categoryId
        ]);
      }
    } else {
      // Subcategory clicked
      const isSelected = selectedCategories.includes(categoryId);
      const parentId = categories.find(c => c.id === categoryId)?.parent_id;
      
      if (isSelected) {
        onCategoriesChange(selectedCategories.filter(id => id !== categoryId));
      } else {
        // If parent was selected, remove it and add all subcategories except this one initially
        // Actually simpler: just add the subcategory
        let newSelection = [...selectedCategories, categoryId];
        
        // If parent is selected, remove parent since we're now selecting specific subcategories
        if (parentId && selectedCategories.includes(parentId)) {
          newSelection = newSelection.filter(id => id !== parentId);
          // Add all sibling subcategories that weren't individually selected
          const siblings = subcategoriesMap.get(parentId) || [];
          siblings.forEach(s => {
            if (!newSelection.includes(s.id)) {
              newSelection.push(s.id);
            }
          });
        }
        
        onCategoriesChange(newSelection);
      }
    }
  };

  const isCategorySelected = (categoryId: string, isMain: boolean) => {
    if (selectedCategories.includes(categoryId)) return true;
    
    // For subcategories, check if parent is selected (means all subcategories are included)
    if (!isMain) {
      const parentId = categories.find(c => c.id === categoryId)?.parent_id;
      if (parentId && selectedCategories.includes(parentId)) {
        return true;
      }
    }
    
    return false;
  };

  const isMainCategoryPartiallySelected = (categoryId: string) => {
    const subcategories = subcategoriesMap.get(categoryId) || [];
    if (subcategories.length === 0) return false;
    
    const selectedSubcats = subcategories.filter(s => selectedCategories.includes(s.id));
    return selectedSubcats.length > 0 && selectedSubcats.length < subcategories.length && !selectedCategories.includes(categoryId);
  };

  // Auto-expand categories that have selected subcategories
  useEffect(() => {
    const toExpand = new Set<string>();
    selectedCategories.forEach(catId => {
      const cat = categories.find(c => c.id === catId);
      if (cat?.parent_id) {
        toExpand.add(cat.parent_id);
      }
    });
    if (toExpand.size > 0) {
      setExpandedCategories(prev => new Set([...prev, ...toExpand]));
    }
  }, [selectedCategories, categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {mainCategories.map(mainCat => {
        const subcategories = subcategoriesMap.get(mainCat.id) || [];
        const hasSubcategories = subcategories.length > 0;
        const isExpanded = expandedCategories.has(mainCat.id);
        const isSelected = isCategorySelected(mainCat.id, true);
        const isPartial = isMainCategoryPartiallySelected(mainCat.id);
        
        return (
          <div key={mainCat.id} className="border rounded-lg overflow-hidden">
            {/* Main category header */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
              )}
            >
              {hasSubcategories && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(mainCat.id);
                  }}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              
              <Checkbox
                id={`cat-${mainCat.id}`}
                checked={isSelected}
                className={cn(isPartial && "data-[state=checked]:bg-muted-foreground")}
                onCheckedChange={() => handleCategoryToggle(mainCat.id, true)}
              />
              
              <div 
                className="flex items-center gap-2 flex-1"
                onClick={() => handleCategoryToggle(mainCat.id, true)}
              >
                <CategoryIcon name={mainCat.name} className="h-5 w-5 text-primary" />
                <Label 
                  htmlFor={`cat-${mainCat.id}`}
                  className="font-medium cursor-pointer flex-1"
                >
                  {mainCat.name}
                </Label>
                {hasSubcategories && (
                  <Badge variant="outline" className="text-xs">
                    {subcategories.length} podkategorii
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Subcategories */}
            {hasSubcategories && isExpanded && (
              <div className="border-t bg-muted/20 p-2 pl-10 space-y-1">
                {subcategories.map(subCat => {
                  const isSubSelected = isCategorySelected(subCat.id, false);
                  
                  return (
                    <div
                      key={subCat.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        isSubSelected ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                      onClick={() => handleCategoryToggle(subCat.id, false)}
                    >
                      <Checkbox
                        id={`cat-${subCat.id}`}
                        checked={isSubSelected}
                        onCheckedChange={() => handleCategoryToggle(subCat.id, false)}
                      />
                      <Label 
                        htmlFor={`cat-${subCat.id}`}
                        className="cursor-pointer flex-1 text-sm"
                      >
                        {subCat.name}
                      </Label>
                      {showDescription && subCat.description && (
                        <span className="text-xs text-muted-foreground">
                          {subCat.description}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
