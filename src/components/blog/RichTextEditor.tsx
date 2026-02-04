import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image,
  Quote,
  Code,
} from 'lucide-react';
import { BlogImageUpload } from './BlogImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    onChange(newText);

    // Move cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  const wrapSelection = (tag: string) => {
    insertAtCursor(`<${tag}>`, `</${tag}>`);
  };

  const insertLink = () => {
    const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText || linkUrl}</a>`;
    insertAtCursor(linkHtml);
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertImage = (url: string) => {
    const imgHtml = `<img src="${url}" alt="" class="rounded-lg my-4 max-w-full" />`;
    insertAtCursor(imgHtml);
    setImageDialogOpen(false);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => wrapSelection('strong'), title: 'Pogrubienie' },
    { icon: Italic, action: () => wrapSelection('em'), title: 'Kursywa' },
    { icon: Heading1, action: () => wrapSelection('h2'), title: 'Nagłówek 1' },
    { icon: Heading2, action: () => wrapSelection('h3'), title: 'Nagłówek 2' },
    { icon: Heading3, action: () => wrapSelection('h4'), title: 'Nagłówek 3' },
    { icon: List, action: () => insertAtCursor('<ul>\n  <li>', '</li>\n</ul>'), title: 'Lista' },
    { icon: ListOrdered, action: () => insertAtCursor('<ol>\n  <li>', '</li>\n</ol>'), title: 'Lista numerowana' },
    { icon: Quote, action: () => wrapSelection('blockquote'), title: 'Cytat' },
    { icon: Code, action: () => wrapSelection('code'), title: 'Kod' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 p-2 border rounded-lg bg-muted/30">
        {toolbarButtons.map((btn, i) => (
          <Button
            key={i}
            type="button"
            variant="ghost"
            size="icon"
            onClick={btn.action}
            title={btn.title}
            className="h-8 w-8"
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Wstaw link"
              className="h-8 w-8"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wstaw link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkText">Tekst linku (opcjonalnie)</Label>
                <Input
                  id="linkText"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Kliknij tutaj"
                />
              </div>
              <Button onClick={insertLink} disabled={!linkUrl}>
                Wstaw
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Wstaw zdjęcie"
              className="h-8 w-8"
            >
              <Image className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wstaw zdjęcie</DialogTitle>
            </DialogHeader>
            <BlogImageUpload
              imageUrl=""
              onImageChange={(url) => {
                if (url) insertImage(url);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit">Edycja</TabsTrigger>
          <TabsTrigger value="preview">Podgląd</TabsTrigger>
        </TabsList>
        <TabsContent value="edit">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Napisz treść wpisu... Możesz używać tagów HTML."
            className="min-h-[400px] font-mono text-sm"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div
            className="prose prose-lg dark:prose-invert max-w-none min-h-[400px] p-4 border rounded-md bg-background"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted-foreground">Podgląd treści...</p>' }}
          />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Możesz używać tagów HTML do formatowania. Użyj paska narzędzi lub wpisuj ręcznie.
      </p>
    </div>
  );
}
