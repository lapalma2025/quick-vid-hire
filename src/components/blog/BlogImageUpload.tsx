import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlogImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export function BlogImageUpload({ imageUrl, onImageChange }: BlogImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Błąd',
        description: 'Tylko pliki graficzne są obsługiwane',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Błąd',
        description: 'Maksymalny rozmiar pliku to 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Błąd przesyłania',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    onImageChange(publicUrl);
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = async () => {
    if (imageUrl) {
      // Extract filename from URL
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      await supabase.storage
        .from('blog-images')
        .remove([fileName]);
    }
    onImageChange('');
  };

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden border max-w-md">
          <img src={imageUrl} alt="" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="block w-full max-w-md h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Kliknij, aby dodać zdjęcie</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        Obsługiwane formaty: JPG, PNG, WebP. Max 5MB.
      </p>
    </div>
  );
}
