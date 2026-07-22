// Material picker component
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPresetPatternForMaterial } from '@/core/sceneTextureCatalog';
import { createPatternCanvas, type PatternKey } from '@/core/texturePatterns';
import type { Material } from '@/types';

interface MaterialPickerProps {
  materials: Material[];
  selectedMaterial: string;
  onMaterialSelect: (materialId: string) => void;
  onCreateCustom?: () => void;
}

export const MATERIAL_PRESETS: Material[] = [
  {
    id: 'material-paint',
    name: 'Paint',
    type: 'paint',
    color: '#FFFFFF',
    roughness: 0.84,
  },
  {
    id: 'material-wood',
    name: 'Wood',
    type: 'wood',
    color: '#8B4513',
    roughness: 0.64,
  },
  {
    id: 'material-concrete',
    name: 'Concrete',
    type: 'concrete',
    color: '#808080',
    roughness: 0.94,
  },
  {
    id: 'material-marble',
    name: 'Marble',
    type: 'stone',
    color: '#E8E4DC',
    roughness: 0.28,
    metalness: 0.08,
  },
  {
    id: 'material-tile',
    name: 'Ceramic Tile',
    type: 'tile',
    color: '#C8C0B0',
    roughness: 0.42,
  },
  {
    id: 'material-metal',
    name: 'Brass Trim',
    type: 'metal',
    color: '#B8860B',
    roughness: 0.32,
    metalness: 0.92,
  },
  {
    id: 'material-glass',
    name: 'Glass Panel',
    type: 'glass',
    color: '#E8F4FF',
    roughness: 0.06,
    metalness: 0.02,
  },
];

export function getMaterialVisual(
  materialId: string,
  customMaterials: Material[] = [],
): { color: string; roughness: number; metalness: number; textureUrl?: string } {
  const material = [...MATERIAL_PRESETS, ...customMaterials].find((entry) => entry.id === materialId);
  if (material) {
    return {
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness ?? 0.06,
      textureUrl: material.textureUrl,
    };
  }
  return { color: '#B5A58F', roughness: 0.72, metalness: 0.06 };
}

function MaterialSwatch({ materialId, color }: { materialId: string; color: string }) {
  const swatchStyle = useMemo(() => {
    const pattern = getPresetPatternForMaterial(materialId) as PatternKey;
    const canvas = createPatternCanvas(pattern, 64);
    if (canvas) {
      return {
        backgroundImage: `url(${canvas.toDataURL('image/png')})`,
        backgroundSize: 'cover',
        backgroundColor: color,
      };
    }
    return { backgroundColor: color };
  }, [materialId, color]);

  return (
    <div
      className="mr-3 h-6 w-6 rounded border border-border"
      style={swatchStyle}
      aria-hidden
    />
  );
}

export default function MaterialPicker({
  materials,
  selectedMaterial,
  onMaterialSelect,
  onCreateCustom,
}: MaterialPickerProps) {
  const allMaterials = [...MATERIAL_PRESETS, ...materials];

  return (
    <Card className="vish-editor-picker-card">
      <CardHeader>
        <CardTitle className="text-sm">Materials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allMaterials.map((material) => {
          const isSelected = material.id === selectedMaterial;
          return (
            <Button
              key={material.id}
              variant={isSelected ? 'default' : 'outline'}
              className="w-full justify-start touch-target"
              onClick={() => onMaterialSelect(material.id)}
            >
              <MaterialSwatch materialId={material.id} color={material.color} />
              <span className="flex-1 text-left">{material.name}</span>
              {material.type === 'custom' && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Custom
                </Badge>
              )}
            </Button>
          );
        })}
        {onCreateCustom && (
          <Button variant="ghost" className="w-full touch-target" onClick={onCreateCustom}>
            + Custom Material
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
