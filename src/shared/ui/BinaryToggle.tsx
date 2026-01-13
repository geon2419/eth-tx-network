type BinaryToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  disabled?: boolean;
};

export function BinaryToggle({
  value,
  onChange,
  trueLabel,
  falseLabel,
  disabled = false,
}: BinaryToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        aria-pressed={value === true}
        className={`w-full cursor-pointer h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
          value === true
            ? "border border-cyan-400 bg-cyan-50 text-cyan-700"
            : "border border-gray-300 bg-white text-gray-700 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700 disabled:hover:bg-white"
        }`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-pressed={value === false}
        className={`w-full cursor-pointer h-11 rounded-xl px-4 text-sm font-semibold transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
          value === false
            ? "border border-cyan-400 bg-cyan-50 text-cyan-700"
            : "border border-gray-300 bg-white text-gray-700 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 disabled:hover:border-gray-300 disabled:hover:text-gray-700 disabled:hover:bg-white"
        }`}
      >
        {falseLabel}
      </button>
    </div>
  );
}
