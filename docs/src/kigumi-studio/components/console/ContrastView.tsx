import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/ui';
import {
  formatRatio,
  violationKey,
  type ContrastResult,
} from '../../theme-agent/contrast';
import './ContrastView.css';

const MODES = [
  ['light', 'Light mode'],
  ['dark', 'Dark mode'],
] as const;

/** One table per mode, a row per checked pair, under a summary of the failing ones. */
export function ContrastView({ results }: { results: ContrastResult[] }) {
  const failing = results.filter((result) => !result.passes).length;
  return (
    <div className="wa-stack wa-gap-m studio-contrast">
      <p className="studio-contrast__summary">
        {failing === 0
          ? `All ${results.length} pairs meet WCAG 2.1 AA contrast.`
          : `${failing} of ${results.length} pairs fall short of WCAG 2.1 AA contrast.`}{' '}
        Checked on every change to the custom theme.
      </p>
      {MODES.map(([mode, caption]) => (
        <div key={mode} className="studio-contrast__scroll">
          <table className="studio-contrast__table">
            <caption>{caption}</caption>
            <thead>
              <tr>
                <th scope="col">Pair</th>
                <th scope="col">Colours</th>
                <th scope="col">Ratio</th>
                <th scope="col">Minimum</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {results
                .filter((result) => result.mode === mode)
                .map((result) => (
                  <ContrastRow key={violationKey(result)} result={result} />
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function ContrastRow({ result }: { result: ContrastResult }) {
  const unresolved = result.ratio === null;
  return (
    <tr
      className={clsx(
        'studio-contrast__row',
        !result.passes && 'studio-contrast__row--failing'
      )}
    >
      <th scope="row">
        <span className="studio-contrast__label">{result.label}</span>
        <code className="studio-contrast__tokens">
          {result.foreground} on {result.background}
        </code>
        {result.setBy && (
          <span className="studio-contrast__set-by">
            Set by <code>{result.setBy}</code>
          </span>
        )}
      </th>
      <td>
        <div className="wa-stack wa-gap-2xs">
          <Swatch
            role="Text"
            swatch={result.foregroundSwatch}
            raw={result.foregroundColor}
          />
          <Swatch
            role="Background"
            swatch={result.backgroundSwatch}
            raw={result.backgroundColor}
          />
        </div>
      </td>
      <td className="studio-contrast__number">
        {result.ratio === null ? 'Unknown' : formatRatio(result.ratio)}
      </td>
      <td className="studio-contrast__number">{result.minimum}:1</td>
      <td>
        <span className="wa-cluster wa-gap-2xs wa-align-items-center studio-contrast__result">
          <Icon
            name={result.passes ? 'circle-check' : 'triangle-exclamation'}
          />
          {result.passes
            ? 'Passes'
            : unresolved
              ? 'Fails: a colour could not be resolved'
              : 'Fails'}
        </span>
      </td>
    </tr>
  );
}

/** One colour: its swatch, and its value in text, which carries it alone. */
function Swatch({
  role,
  swatch,
  raw,
}: {
  role: string;
  swatch: string | null;
  raw: string;
}) {
  return (
    <span className="wa-cluster wa-gap-2xs wa-align-items-center studio-contrast__colour">
      <span
        aria-hidden="true"
        className={clsx(
          'studio-contrast__swatch',
          !swatch && 'studio-contrast__swatch--unresolved'
        )}
        style={
          swatch ? ({ '--studio-swatch': swatch } as CSSProperties) : undefined
        }
      />
      <span>
        {role}: {swatch ?? `not resolved (${raw || 'not set'})`}
      </span>
    </span>
  );
}
