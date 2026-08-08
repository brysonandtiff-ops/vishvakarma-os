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
      className="space-y-4 rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 lg:p-6 shadow-xl"
      data-testid="constraint-editor"
      data-tutorial="optimization-intake"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-technical text-xs font-bold uppercase tracking-widest text-vish-gold/90">
          Live constraints
        </h3>
        {dirty && (
          <span className="text-xs text-vish-blue-400 font-semibold" data-testid="constraints-dirty">
            Changed — regenerate to update
          </span>
        )}
      </div>

      {showPrompt && (
        <div className="space-y-2">
          <Label htmlFor="constraint-prompt" className="text-slate-300">Design brief</Label>
          <Textarea
            id="constraint-prompt"
            value={values.prompt}
            onChange={(e) => onChange({ ...values, prompt: e.target.value })}
            rows={2}
            disabled={loading}
            data-testid="constraint-prompt"
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="constraint-budget" className="text-slate-300">Target budget (AUD)</Label>
          <Input
            id="constraint-budget"
            type="number"
            value={values.targetBudget}
            onChange={(e) => onChange({ ...values, targetBudget: e.target.value })}
            placeholder="450000"
            disabled={loading}
            data-testid="constraint-budget"
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-parcel" className="text-slate-300">Parcel area m²</Label>
          <Input
            id="constraint-parcel"
            type="number"
            value={values.parcelArea}
            onChange={(e) => onChange({ ...values, parcelArea: e.target.value })}
            placeholder="600"
            disabled={loading}
            data-testid="constraint-parcel"
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-bedrooms" className="text-slate-300">Bedrooms</Label>
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
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-bathrooms" className="text-slate-300">Bathrooms</Label>
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
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-garage" className="text-slate-300">Garage spaces</Label>
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
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="constraint-lifestyle" className="text-slate-300">Lifestyle goals</Label>
          <Input
            id="constraint-lifestyle"
            value={values.lifestyleGoals}
            onChange={(e) => onChange({ ...values, lifestyleGoals: e.target.value })}
            placeholder="family entertaining, home office"
            disabled={loading}
            data-testid="constraint-lifestyle"
            className="bg-vish-navy-950/80 border-vish-navy-700/50 text-white placeholder:text-slate-500 shadow-inner h-9"
          />
        </div>
      </div>

      <Button
        onClick={onRegenerate}
        disabled={loading || !values.prompt.trim()}
        className="touch-target w-full min-h-[44px] bg-vish-gold hover:bg-vish-gold-light text-vish-navy-950 font-bold shadow-lg shadow-vish-gold/20 tracking-wide"
        data-testid="constraint-regenerate"
        data-tutorial="optimization-run"
      >
        {loading ? 'Regenerating…' : dirty ? 'Regenerate with updated constraints' : 'Regenerate designs'}
      </Button>
    </div>
  );
}
