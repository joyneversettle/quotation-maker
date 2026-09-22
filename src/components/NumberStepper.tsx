import React from 'react';

type NumberStepperProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> & {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  min?: number | string;
  max?: number | string;
  step?: number | string;
};

export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  className = '',
  disabled,
  ...inputProps
}) => {
  const numericValue = Number(value ?? 0);
  const numericMin = Number(min);
  const numericMax = max === undefined || max === '' ? undefined : Number(max);
  const numericStep = Number(step) || 1;

  const emitChange = (nextValue: number) => {
    let next = nextValue;

    if (Number.isFinite(numericMin)) next = Math.max(numericMin, next);
    if (numericMax !== undefined && Number.isFinite(numericMax)) {
      next = Math.min(numericMax, next);
    }

    const input = {
      value: String(next),
    } as HTMLInputElement;

    onChange?.({
      target: input,
      currentTarget: input,
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const decrease = () => {
    if (disabled) return;
    emitChange((Number.isFinite(numericValue) ? numericValue : numericMin || 0) - numericStep);
  };

  const increase = () => {
    if (disabled) return;
    emitChange((Number.isFinite(numericValue) ? numericValue : numericMin || 0) + numericStep);
  };

  const atMin =
    Number.isFinite(numericMin) &&
    Number.isFinite(numericValue) &&
    numericValue <= numericMin;

  const atMax =
    numericMax !== undefined &&
    Number.isFinite(numericValue) &&
    numericValue >= numericMax;

  return (
    <div className="flex w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white">
      <button
        type="button"
        onClick={decrease}
        disabled={disabled || atMin}
        aria-label="Decrease value"
        className="w-9 shrink-0 border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-base leading-none transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
      >
        −
      </button>

      <input
        {...inputProps}
        type="text"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={onChange}
        className={`${className} !min-w-0 !rounded-none !border-0 flex-1`}
      />

      <button
        type="button"
        onClick={increase}
        disabled={disabled || atMax}
        aria-label="Increase value"
        className="w-9 shrink-0 border-l border-slate-200 bg-slate-50 text-slate-700 font-bold text-base leading-none transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
      >
        +
      </button>
    </div>
  );
};
