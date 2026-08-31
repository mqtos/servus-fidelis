import { contentErrors } from './engine/content';
import DeploymentSelect from './screens/DeploymentSelect';
import EventCard from './screens/EventCard';
import OriginSelect from './screens/OriginSelect';
import SectorStatus from './screens/SectorStatus';
import ServiceRecord from './screens/ServiceRecord';
import StageTransition from './screens/StageTransition';
import TitleScreen from './screens/TitleScreen';
import { useGameStore } from './store/gameStore';
import { useUiStore } from './store/uiStore';

function ContentErrors({ errors }: { errors: string[] }) {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-2xl text-blood-lit">Content failed validation</h1>
      <p className="mt-2 text-parchment/70">
        The game will not start until every item below is fixed.
      </p>
      <ul className="mt-6 space-y-2 font-mono text-sm">
        {errors.map((error) => (
          <li key={error} className="border-l-2 border-blood pl-3">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const sectorOpen = useUiStore((state) => state.sectorOpen);

  if (contentErrors.length > 0) return <ContentErrors errors={contentErrors} />;

  return (
    <div className="min-h-full">
      {screen === 'title' && <TitleScreen />}
      {screen === 'deployment_select' && <DeploymentSelect />}
      {screen === 'origin_select' && <OriginSelect />}
      {screen === 'event' && <EventCard />}
      {screen === 'stage_transition' && <StageTransition />}
      {screen === 'service_record' && <ServiceRecord />}
      {/* The chart sits over the run rather than replacing it, so opening and closing it
          cannot disturb where the player was. */}
      {sectorOpen && <SectorStatus />}
    </div>
  );
}
