import type { CSSProperties, ReactNode } from 'react';

export const Icon = ({ name, size = 24, fill, style, color }: { name: string; size?: number; fill?: boolean; style?: CSSProperties; color?: string }) => (
  <span className={'icon' + (fill ? ' fill' : '')} aria-hidden="true" style={{ fontSize: size, color, ...style }}>
    {name}
  </span>
);

export function Seg<T extends string>({
  options, value, onChange, className = '', label,
}: { options: [T, string][]; value: T; onChange: (v: T) => void; className?: string; label: string }) {
  return (
    <div className={'seg ' + className} role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export const Switch = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className="switch" onClick={onToggle}>
    <span />
  </button>
);

export const TopBar = ({ onBack, title, right }: { onBack?: () => void; title: string; right?: ReactNode }) => (
  <div className="topbar" style={onBack ? undefined : { padding: '0 20px' }}>
    {onBack && (
      <button className="icon-btn" onClick={onBack} aria-label="Back">
        <Icon name="arrow_back" />
      </button>
    )}
    <span className="h" style={{ flex: 1 }}>{title}</span>
    {right}
  </div>
);
