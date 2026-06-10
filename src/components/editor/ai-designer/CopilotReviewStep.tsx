import type { CopilotIngestionResult } from '@/domain/copilot/copilotSession';
import type { BuildingRequest } from '@/domain/buildings/buildingRequest';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CopilotReviewStep({
  ingestion,
  request,
  parcelArea,
  onParcelAreaChange,
}: {
  ingestion: CopilotIngestionResult;
  request: BuildingRequest;
  parcelArea: string;
  onParcelAreaChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Program</p>
          <p>
            {request.bedrooms} bed · {request.bathrooms} bath · {request.garageSpaces} car · {request.style}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="review-parcel">Parcel area m²</Label>
          <Input
            id="review-parcel"
            type="number"
            value={parcelArea}
            onChange={(e) => onParcelAreaChange(e.target.value)}
          />
        </div>
      </div>

      {ingestion.siteSurvey && (
        <div className="rounded-lg border border-border/40 p-3">
          <p className="font-medium">Site survey</p>
          <p className="text-muted-foreground">
            Slope {ingestion.siteSurvey.slope}% · Orientation {ingestion.siteSurvey.orientation}
          </p>
          {ingestion.siteSurvey.easements.length > 0 && (
            <p className="text-xs text-muted-foreground">Easements: {ingestion.siteSurvey.easements.join('; ')}</p>
          )}
        </div>
      )}

      {ingestion.boundary && (
        <div className="rounded-lg border border-border/40 p-3">
          <p className="font-medium">Boundary</p>
          <p className="text-muted-foreground">
            {ingestion.boundary.widthM}m × {ingestion.boundary.depthM}m · {ingestion.boundary.areaSqM} m² ·{' '}
            {ingestion.boundary.boundaryPolygon.length} vertices
          </p>
        </div>
      )}

      {ingestion.council && (
        <div className="rounded-lg border border-border/40 p-3">
          <p className="font-medium">Council requirements</p>
          <p className="text-muted-foreground">
            Setbacks F{ingestion.council.setbacks.front}m S{ingestion.council.setbacks.side}m R
            {ingestion.council.setbacks.rear}m · Max coverage {(ingestion.council.maxCoverageRatio * 100).toFixed(0)}%
          </p>
          {ingestion.council.councilName && (
            <p className="text-xs text-muted-foreground">{ingestion.council.councilName}</p>
          )}
        </div>
      )}
    </div>
  );
}
