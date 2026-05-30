// Material picker component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Material } from '@/types';

interface MaterialPickerProps {
  materials: Material[];
  selectedMaterial: string;
  onMaterialSelect: (materialId: string) => void;
}

export const MATERIAL_PRESETS: Material[] = [
  {
    id: 'material-paint',
    name: 'Paint',
    type: 'paint',
    color: '#FFFFFF',
    roughness: 0.8,
  },
  {
    id: 'material-wood',
    name: 'Wood',
    type: 'wood',
    color: '#8B4513',
    roughness: 0.6,
  },
  {
    id: 'material-concrete',
    name: 'Concrete',
    type: 'concrete',
    color: '#808080',
    roughness: 0.9,
  },
];

export function getMaterialVisual(materialId: string): { color: string; roughness: number; metalness: number } {
  const preset = MATERIAL_PRESETS.find((material) => material.id === materialId);
  if (preset) {
    return { color: preset.color, roughness: preset.roughness, metalness: preset.metalness ?? 0.06 };
  }
  return { color: '#B5A58F', roughness: 0.72, metalness: 0.06 };
}

export default function MaterialPicker({
  materials,
  selectedMaterial,
  onMaterialSelect,
}: MaterialPickerProps) {
  const allMaterials = [...MATERIAL_PRESETS, ...materials];

  return (
    <Card>
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
              <div
                className="mr-3 h-6 w-6 rounded border border-border"
                style={{ backgroundColor: material.color }}
              />
              <span className="flex-1 text-left">{material.name}</span>
              <Badge variant="secondary" className="text-xs">
                {material.type}
              </Badge>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
