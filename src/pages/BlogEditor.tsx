import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogImageUpload } from '@/components/blog/BlogImageUpload';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ADMIN_EMAIL = 'michalzborowski@interia.pl';

interface BlogPostData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  published: boolean;
}

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BlogPostData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    published: false,
  });

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isEditing && isAdmin) {
      fetchPost();
    }
  }, [id, isAdmin]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować wpisu',
        variant: 'destructive',
      });
      navigate('/blog/admin');
      return;
    }

    setFormData({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || '',
      cover_image_url: data.cover_image_url || '',
      published: data.published,
    });
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[ąàáâãäå]/g, 'a')
      .replace(/[ćč]/g, 'c')
      .replace(/[ęèéêë]/g, 'e')
      .replace(/[łℓ]/g, 'l')
      .replace(/[ńñ]/g, 'n')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[śš]/g, 's')
      .replace(/[źżž]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: isEditing ? prev.slug : generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Błąd',
        description: 'Tytuł i treść są wymagane',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const postData = {
      title: formData.title.trim(),
      slug: formData.slug || generateSlug(formData.title),
      content: formData.content,
      excerpt: formData.excerpt.trim() || null,
      cover_image_url: formData.cover_image_url || null,
      published: formData.published,
      author_email: ADMIN_EMAIL,
    };

    let error;

    if (isEditing) {
      const result = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id);
      error = result.error;
    } else {
      const result = await supabase
        .from('blog_posts')
        .insert(postData);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      toast({
        title: 'Błąd',
        description: error.message.includes('duplicate')
          ? 'Wpis o takim adresie URL już istnieje'
          : 'Nie udało się zapisać wpisu',
        variant: 'destructive',
      });
    } else {
      toast({
        title: isEditing ? 'Zaktualizowano wpis' : 'Dodano wpis',
      });
      navigate('/blog/admin');
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć do listy
          </Link>
        </Button>

        <h1 className="text-3xl font-display font-bold mb-8">
          {isEditing ? 'Edytuj wpis' : 'Nowy wpis'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Podstawowe informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Tytuł wpisu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Adres URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="adres-url-wpisu"
                />
                <p className="text-xs text-muted-foreground">
                  Zostanie użyty w linku: /blog/{formData.slug || 'adres-url'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Krótki opis</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Krótki opis wyświetlany na liście postów"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zdjęcie główne</CardTitle>
            </CardHeader>
            <CardContent>
              <BlogImageUpload
                imageUrl={formData.cover_image_url}
                onImageChange={(url) => setFormData((prev) => ({ ...prev, cover_image_url: url }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treść *</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published" className="text-base font-medium">
                    Opublikuj
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Włącz, aby wpis był widoczny publicznie
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, published: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Zapisz zmiany' : 'Dodaj wpis'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
