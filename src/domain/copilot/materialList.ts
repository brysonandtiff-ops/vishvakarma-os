export interface MaterialListRow {
  id: string;
  category: 'structure' | 'openings' | 'finish' | 'roof' | 'site';
  item: string;
  quantity: number;
  unit: string;
  notes?: string;
}
