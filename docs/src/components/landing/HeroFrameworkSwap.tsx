import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type TransitionEvent,
} from 'react';
import clsx from 'clsx';
import reactLogo from '@/assets/react-logo.svg';
import vueLogo from '@/assets/vuejs-logo.svg';
import angularLogo from '@/assets/angular-logo.svg';
import nextjsLogo from '@/assets/nextjs-logo.svg';
import { Icon } from '@/components/ui/Icon/Icon';
import {
  frameworkSwapReducer,
  initialFrameworkSwapState,
  type FrameworkSwapAction,
  type FrameworkSwapState,
} from '@/components/landing/frameworkSwapState';

interface Framework {
  id: string;
  name: string;
  logo: string;
  /** Border and tint color of the framework's plate and rail chip */
  accent: string;
  /** File the command menu lives in for this framework */
  file: string;
}

const FRAMEWORKS: readonly Framework[] = [
  {
    id: 'react',
    name: 'React',
    logo: reactLogo,
    accent: '#61dafb',
    file: 'CommandMenu.tsx',
  },
  {
    id: 'vue',
    name: 'Vue',
    logo: vueLogo,
    accent: '#42b883',
    file: 'CommandMenu.vue',
  },
  {
    id: 'angular',
    name: 'Angular',
    logo: angularLogo,
    accent: '#f0436a',
    file: 'command-menu.component.ts',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    logo: nextjsLogo,
    accent: 'var(--wa-color-text-normal)',
    file: 'CommandMenu.tsx',
  },
];

const COUNT = FRAMEWORKS.length;
const INTERVAL_MS = 2800;
const STAGE_WIDTH = 560;
const SLOT_WIDTH = 128;
/** The rail shows three slots: one preview on each side of the active framework */
const RAIL_WIDTH = 3 * SLOT_WIDTH;

const RAIL = Array.from({ length: 3 * COUNT }, (_, i) => FRAMEWORKS[i % COUNT]);

const reduceMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(reduceMotionQuery);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reduceMotionQuery).matches,
    () => true
  );
}

/** Scales the fixed-size stage down when the hero column is narrower than the stage */
function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(1, entry.contentRect.width / STAGE_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, scale };
}

function swapReducer(state: FrameworkSwapState, action: FrameworkSwapAction) {
  return frameworkSwapReducer(COUNT, state, action);
}

function accentStyle(framework: Framework): CSSProperties {
  return { '--framework-accent': framework.accent } as CSSProperties;
}

/**
 * Hero visual: a command menu that stays the same while the framework underneath it
 * swaps between React, Vue, Angular, and Next.js. The rail below shows the active
 * framework with one preview on each side.
 */
export function HeroFrameworkSwap() {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, scale } = useStageScale();
  const [state, dispatch] = useReducer(
    swapReducer,
    COUNT,
    initialFrameworkSwapState
  );
  const { step, railPos, railAnimated } = state;

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') dispatch({ type: 'tick' });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    if (railAnimated) return;
    // Two frames: the first paints the snapped position without a transition
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => dispatch({ type: 'resume' }));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [railAnimated]);

  const onRailTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) dispatch({ type: 'snap' });
    },
    []
  );

  const current = FRAMEWORKS[step % COUNT];
  const previous = FRAMEWORKS[(step - 1 + COUNT) % COUNT];
  const railOffset = RAIL_WIDTH / 2 - (railPos * SLOT_WIDTH + SLOT_WIDTH / 2);

  return (
    <div
      ref={ref}
      className="framework-swap"
      role="img"
      aria-label="A command menu that looks the same while the framework underneath it switches between React, Vue, Angular, and Next.js"
    >
      <div
        className="framework-swap__stage"
        aria-hidden="true"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="framework-swap__scene">
          <div className="framework-swap__sheet framework-swap__sheet--framework">
            {step > 0 && (
              <FrameworkPlate
                key={`out-${step}`}
                framework={previous}
                state="out"
              />
            )}
            <FrameworkPlate key={`in-${step}`} framework={current} state="in" />
          </div>

          <div className="framework-swap__sheet framework-swap__sheet--wireframe">
            <span className="framework-swap__wire framework-swap__wire--search" />
            <span className="framework-swap__wire framework-swap__wire--label" />
            <span className="framework-swap__wire framework-swap__wire--row" />
            <span className="framework-swap__wire framework-swap__wire--row" />
            <span className="framework-swap__wire framework-swap__wire--row" />
          </div>

          <span className="framework-swap__pin framework-swap__pin--tl" />
          <span className="framework-swap__pin framework-swap__pin--tr" />
          <span className="framework-swap__pin framework-swap__pin--bl" />
          <span className="framework-swap__pin framework-swap__pin--br" />

          <div className="framework-swap__sheet framework-swap__sheet--ui">
            {step > 0 && (
              <span
                key={step}
                className="framework-swap__ring"
                style={accentStyle(current)}
              />
            )}
            <CommandMenu />
          </div>
        </div>

        <div className="framework-swap__rail">
          <div
            className={clsx(
              'framework-swap__track',
              !railAnimated && 'framework-swap__track--instant'
            )}
            style={{ transform: `translateX(${railOffset}px)` }}
            onTransitionEnd={onRailTransitionEnd}
          >
            {RAIL.map((framework, i) => (
              <div key={i} className="framework-swap__slot">
                <span
                  className={clsx(
                    'framework-swap__chip',
                    i === railPos && 'framework-swap__chip--active'
                  )}
                  style={accentStyle(framework)}
                >
                  <img src={framework.logo} alt="" width={20} height={20} />
                  {framework.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FrameworkPlate({
  framework,
  state,
}: {
  framework: Framework;
  state: 'in' | 'out';
}) {
  return (
    <div
      className={`framework-swap__plate framework-swap__plate--${state}`}
      style={accentStyle(framework)}
    >
      <img src={framework.logo} alt="" width={56} height={56} />
      <div className="framework-swap__plate-text">
        <span className="framework-swap__plate-name">{framework.name}</span>
        <span className="framework-swap__plate-file">{framework.file}</span>
      </div>
    </div>
  );
}

function CommandMenu() {
  return (
    <div className="framework-swap__menu">
      <div className="framework-swap__search">
        <Icon name="magnifying-glass" />
        <span className="framework-swap__search-text">Search commands…</span>
        <kbd className="framework-swap__kbd">⌘K</kbd>
      </div>
      <span className="framework-swap__group">Actions</span>
      <div className="framework-swap__item framework-swap__item--selected">
        <Icon name="plus" />
        <span className="framework-swap__item-text">New project</span>
        <kbd className="framework-swap__kbd">↵</kbd>
      </div>
      <div className="framework-swap__item">
        <Icon name="user-plus" />
        <span className="framework-swap__item-text">Invite teammate</span>
      </div>
      <div className="framework-swap__item">
        <Icon name="gear" />
        <span className="framework-swap__item-text">Open settings</span>
      </div>
    </div>
  );
}
