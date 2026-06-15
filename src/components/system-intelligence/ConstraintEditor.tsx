import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface ConstraintValues {
  prompt: string;
  targetBudget: string;
  lifestyleGoals: string;
  bedrooms: string;
  bathrooms: string;
  garageSpaces: string;
  parcelArea: string;
}

export function constraintsFromResolvedRequest(
  input: ConstraintValues,
  resolved: {
    bedrooms: number;
    bathrooms: number;
    garageSpaces: number;
    parcel: { area: number };
  },
): ConstraintValues {
  return {
    ...input,
    bedrooms: input.bedrooms || String(resolved.bedrooms),
    bathrooms: input.bathrooms || String(resolved.bathrooms),
    garageSpaces: input.garageSpaces || String(resolved.garageSpaces),
    parcelArea: input.parcelArea || String(resolved.parcel.area),
  };
}

export function constraintValuesEqual(a: ConstraintValues, b: ConstraintValues): boolean {
  return (
    a.prompt === b.prompt &&
    a.targetBudget === b.targetBudget &&
    a.lifestyleGoals === b.lifestyleGoals &&
    a.bedrooms === b.bedrooms &&
    a.bathrooms === b.bathrooms &&
    a.garageSpaces === b.garageSpaces &&
    a.parcelArea === b.parcelArea
  );
}

export default function ConstraintEditor({
  values,
  onChange,
  dirty,
  loading,
  onRegenerate,
  showPrompt = true,
}: {
  values: ConstraintValues;
  onChange: (values: ConstraintValues) => void;
  dirty?: boolean;
  loading?: boolean;
  onRegenerate: () => void;
  showPrompt?: boolean;
}) {
  return (
    <div
      className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-4 lg:p-6"
      data-testid="constraint-editor"
      data-tutorial="optimization-intake"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Live constraints
        </h3>
        {dirty && (
          <span className="text-xs text-earth-500" data-testid="constraints-dirty">
            Changed — regenerate to update
          </span>
        )}
      </div>

      {showPrompt && (
        <div className="space-y-2">
          <Label htmlFor="constraint-prompt">Design brief</Label>
          <Textarea
            id="constraint-prompt"
            value={values.prompt}
            onChange={(e) => onChange({ ...values, prompt: e.target.value })}
            rows={2}
            disabled={loading}
            data-testid="constraint-prompt"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="constraint-budget">Target budget (AUD)</Label>
          <Input
            id="constraint-budget"
            type="number"
            value={values.targetBudget}
            onChange={(e) => onChange({ ...values, targetBudget: e.target.value })}
            placeholder="450000"
            disabled={loading}
            data-testid="constraint-budget"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-parcel">Parcel area m²</Label>
          <Input
            id="constraint-parcel"
            type="number"
            value={values.parcelArea}
            onChange={(e) => onChange({ ...values, parcelArea: e.target.value })}
            placeholder="600"
            disabled={loading}
            data-testid="constraint-parcel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-bedrooms">Bedrooms</Label>
          <Input
            id="constraint-bedrooms"
            type="number"
            min={1}
            max={8}
            value={values.bedrooms}
            onChange={(e) => onChange({ ...values, bedrooms: e.target.value })}
            placeholder="4"
            disabled={loading}
            data-testid="constraint-bedrooms"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-bathrooms">Bathrooms</Label>
          <Input
            id="constraint-bathrooms"
            type="number"
            min={1}
            max={6}
            value={values.bathrooms}
            onChange={(e) => onChange({ ...values, bathrooms: e.target.value })}
            placeholder="2"
            disabled={loading}
            data-testid="constraint-bathrooms"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-garage">Garage spaces</Label>
          <Input
            id="constraint-garage"
            type="number"
            min={0}
            max={4}
            value={values.garageSpaces}
            onChange={(e) => onChange({ ...values, garageSpaces: e.target.value })}
            placeholder="2"
            disabled={loading}
            data-testid="constraint-garage"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-lifestyle">Lifestyle goals</Label>
          <Input
            id="constraint-lifestyle"
            value={values.lifestyleGoals}
            onChange={(e) => onChange({ ...values, lifestyleGoals: e.target.value })}
            placeholder="family entertaining, home office"
            disabled={loading}
            data-testid="constraint-lifestyle"
          />
        </div>
      </div>

      <Button
        onClick={onRegenerate}
        disabled={loading || !values.prompt.trim()}
        className="w-full"
        data-testid="constraint-regenerate"
        data-tutorial="optimization-run"
      >
        {loading ? 'Regenerating…' : dirty ? 'Regenerate with updated constraints' : 'Regenerate designs'}
      </Button>
    </div>
  );
}
