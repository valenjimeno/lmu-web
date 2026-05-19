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
  allowedValues?: number[];
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
  allowedValues,
}: RangeFieldProps) {
  const id = useId();
  const hasAllowedValues = Boolean(allowedValues?.length);
  const allowedValueList = hasAllowedValues ? allowedValues : undefined;
  const resolvedInitialValue = initialValue ?? defaultValue;
  const initialIndex = allowedValueList
    ? allowedValueList.reduce((closestIndex, currentValue, currentIndex) => {
        const closestDistance = Math.abs(allowedValueList[closestIndex] - resolvedInitialValue);
        const currentDistance = Math.abs(currentValue - resolvedInitialValue);

        return currentDistance < closestDistance ? currentIndex : closestIndex;
      }, 0)
    : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [value, setValue] = useState(
    allowedValueList ? allowedValueList[initialIndex] : resolvedInitialValue,
  );
  const percentage = allowedValueList
    ? (selectedIndex / Math.max(allowedValueList.length - 1, 1)) * 100
    : ((value - min) / (max - min)) * 100;
  const displayValue = showRemainingToMax
    ? `${value.toFixed(decimals)}:${(max - value).toFixed(decimals)}`
    : `${value.toFixed(decimals)}${valueSuffix}`;
  const displayedMin = allowedValueList ? allowedValueList[0] : min;
  const displayedMax = allowedValueList ? allowedValueList[allowedValueList.length - 1] : max;

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
        <input name={name} type="hidden" value={value} />
        <input
          id={id}
          type="range"
          min={allowedValueList ? 0 : min}
          max={allowedValueList ? allowedValueList.length - 1 : max}
          step={allowedValueList ? 1 : step}
          value={allowedValueList ? selectedIndex : value}
          onChange={(event) => {
            if (allowedValueList) {
              const nextIndex = Number(event.target.value);
              setSelectedIndex(nextIndex);
              setValue(allowedValueList[nextIndex]);
              return;
            }

            setValue(Number(event.target.value));
          }}
          onInput={(event) => {
            if (allowedValueList) {
              const nextIndex = Number(event.currentTarget.value);
              setSelectedIndex(nextIndex);
              setValue(allowedValueList[nextIndex]);
              return;
            }

            setValue(Number(event.currentTarget.value));
          }}
          aria-valuetext={`${value}${valueSuffix}`}
          className="range-slider h-3 w-full cursor-pointer appearance-none rounded-full border border-white/6 bg-transparent"
          style={{
            background: `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-strong) ${percentage}%, rgba(255,255,255,0.08) ${percentage}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        <span>
          {displayedMin}
          {valueSuffix}
        </span>
        <span>
          {displayedMax}
          {valueSuffix}
        </span>
      </div>
    </label>
  );
}
