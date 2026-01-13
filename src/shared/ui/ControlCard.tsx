type ControlDefinition = {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
};

type ControlCardProps = {
  control: ControlDefinition;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ControlCard({
  control,
  value,
  onChange,
  disabled,
}: ControlCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-900">{control.label}</span>
          <p className="text-xs text-gray-500">{control.description}</p>
        </div>
        <span className="font-semibold text-gray-900">
          {control.format(value)}
        </span>
      </div>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ accentColor: "#0891b2" }}
        className="mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
