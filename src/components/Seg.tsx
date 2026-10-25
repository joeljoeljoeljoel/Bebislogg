/** Segmented control (Nocturne .seg). `full` stretches it to the width available. */
export function Seg<T extends string | number | boolean>({
  options,
  value,
  onChange,
  full = false,
  label,
}: {
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
  full?: boolean;
  label?: string;
}) {
  return (
    <div className={full ? 'seg seg-full' : 'seg'} role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" className="seg-opt" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
