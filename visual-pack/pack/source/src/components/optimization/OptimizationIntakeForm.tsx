import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface OptimizationIntakeValues {
  prompt: string;
  targetBudget: string;
  lifestyleGoals: string;
}

export default function OptimizationIntakeForm({
  values,
  onChange,
  onSubmit,
  loading,
}: {
  values: OptimizationIntakeValues;
  onChange: (values: OptimizationIntakeValues) => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6">
      <div className="space-y-2">
        <Label htmlFor="opt-prompt">Block details & design brief</Label>
        <Textarea
          id="opt-prompt"
          value={values.prompt}
          onChange={(e) => onChange({ ...values, prompt: e.target.value })}
          placeholder="4-bedroom modern home on 600m² corner block with double garage"
          rows={3}
          disabled={loading}
          data-testid="optimization-prompt"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="opt-budget">Target budget (AUD)</Label>
          <Input
            id="opt-budget"
            type="number"
            value={values.targetBudget}
            onChange={(e) => onChange({ ...values, targetBudget: e.target.value })}
            placeholder="450000"
            disabled={loading}
            data-testid="optimization-budget"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="opt-lifestyle">Lifestyle goals</Label>
          <Input
            id="opt-lifestyle"
            value={values.lifestyleGoals}
            onChange={(e) => onChange({ ...values, lifestyleGoals: e.target.value })}
            placeholder="family entertaining, home office"
            disabled={loading}
            data-testid="optimization-lifestyle"
          />
        </div>
      </div>
      <Button onClick={onSubmit} disabled={loading || !values.prompt.trim()} data-testid="optimization-submit">
        {loading ? 'Generating 5 candidates…' : 'Generate & compare 5 designs'}
      </Button>
    </div>
  );
}
