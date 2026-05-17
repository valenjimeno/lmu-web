'use client';

import { useId, useState } from 'react';

type RangeFieldProps = {
  name: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  valueSuffix?: string;
  decimals?: number;
  showRemainingToMax?: boolean;
};

export function RangeField({
  name,
  label,
  min = 0,
  max = 11,
  step = 1,
  defaultValue = 5,
  value: initialValue,
  valueSuffix = '',
  decimals = 0,
  showRemainingToMax = false,
}: RangeFieldProps) {
  const id = useId();
  const [value, setValue] = useState(initialValue ?? defaultValue);
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = showRemainingToMax
    ? `${value.toFixed(decimals)}:${(max - value).toFixed(decimals)}`
    : `${value.toFixed(decimals)}${valueSuffix}`;

  return (
    <label
      className="block rounded-[1.1rem] border border-white/8 bg-white/[0.025] p-4"
      htmlFor={id}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {label}
        </span>
        <span className="min-w-14 rounded-[0.8rem] border border-white/10 bg-white/[0.04] px-3 py-1 text-center text-sm font-semibold text-foreground">
          {displayValue}
        </span>
      </div>
      <div className="relative mt-4 px-1">
        <input
          id={id}
          name={name}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          onInput={(event) => setValue(Number(event.currentTarget.value))}
          aria-valuetext={`${value}${valueSuffix}`}
          className="range-slider h-3 w-full cursor-pointer appearance-none rounded-full border border-white/6 bg-transparent"
          style={{
            background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-strong) ${percentage}%, rgba(255,255,255,0.08) ${percentage}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        <span>
          {min}
          {valueSuffix}
        </span>
        <span>
          {max}
          {valueSuffix}
        </span>
      </div>
    </label>
  );
}
