import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isStorageConfigured, uploadMaterialTexture } from '@/backend/firebase/storageUpload';
import type { Material } from '@/types';
import { toast } from 'sonner';

interface CustomMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (material: Material) => void;
  userId?: string;
}

export default function CustomMaterialDialog({ open, onOpenChange, onCreate, userId }: CustomMaterialDialogProps) {
  const [name, setName] = useState('Custom');
  const [color, setColor] = useState('#c4a882');
  const [textureFile, setTextureFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setName('Custom');
    setColor('#c4a882');
    setTextureFile(null);
  };

  const handleCreate = async () => {
    setUploading(true);
    try {
      let textureUrl: string | undefined;
      if (textureFile) {
        if (!isStorageConfigured()) {
          toast.error('Firebase Storage not configured — saving color-only material');
        } else if (!userId) {
          toast.error('Sign in to upload textures — saving color-only material');
        } else {
          textureUrl = await uploadMaterialTexture(textureFile, userId);
        }
      }

      const material: Material = {
        id: `material-custom-${Date.now()}`,
        name: name.trim() || 'Custom',
        type: 'custom',
        color,
        roughness: 0.7,
        textureUrl,
      };
      onCreate(material);
      onOpenChange(false);
      resetForm();
      toast.success(textureUrl ? 'Custom material with texture added' : 'Custom material added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Texture upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="vish-dialog-chrome">
        <DialogHeader>
          <DialogTitle>Create custom material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">Name</Label>
            <Input id="material-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="material-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border"
                aria-label="Material color"
              />
              <span className="font-mono text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="material-texture">Texture image (optional)</Label>
            <Input
              id="material-texture"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setTextureFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · max 2 MB · requires Firebase Storage</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
          <Button onClick={() => void handleCreate()} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Add material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
