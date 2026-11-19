import { ArrowUpRight } from 'lucide-react';
import './RoomConceptGallery.css';

const studies = [
  {
    id: 'six-three-atrium-wing',
    title: 'Atrium Wing',
    description: 'Twin residential wings meet at a glazed central gallery.',
  },
  {
    id: 'five-three-sky-court',
    title: 'Sky Court',
    description: 'A main house and two detached studios frame an open court.',
  },
  {
    id: 'dual-key-3242-courtyard',
    title: 'Dual-Key Courtyard',
    description: 'Two homes share a garden court while keeping separate entrances.',
  },
] as const;

interface RoomConceptGalleryProps {
  activeSampleId: string | null;
  onSelectSample: (sampleId: string) => void;
}

export default function RoomConceptGallery({ activeSampleId, onSelectSample }: RoomConceptGalleryProps) {
  return (
    <section id="room-concepts" className="room-concepts" aria-labelledby="room-concepts-heading">
      <header className="room-concepts__heading">
        <h2 id="room-concepts-heading">3D concept gallery</h2>
        <p>Explore three architectural studies, then open the matching floor plan in the 3D Room.</p>
      </header>
      <ul className="room-concepts__grid">
        {studies.map(({ id, title, description }) => (
          <li key={id}>
            <button
              type="button"
              className="room-concepts__card"
              aria-pressed={activeSampleId === id}
              aria-label={`View ${title} in 3D`}
              aria-describedby={`room-concept-description-${id}`}
              onClick={() => onSelectSample(id)}
            >
              <span className="room-concepts__image">
                <img src={`${import.meta.env.BASE_URL}room-studies/concepts.webp`} alt="" loading="lazy" width={1040} height={740} />
              </span>
              <span className="room-concepts__copy">
                <strong>{title}</strong>
                <span id={`room-concept-description-${id}`}>{description}</span>
                <ArrowUpRight size={20} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
