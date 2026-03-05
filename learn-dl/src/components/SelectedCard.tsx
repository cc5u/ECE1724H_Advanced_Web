import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Loader2 } from "lucide-react";

export type SelectedCardOption = {
  value: string;
  label: string;
};

export type SelectedCardChildrenArgs = {
  options: SelectedCardOption[];
  selectedValue: string;
  selectedOption: SelectedCardOption | undefined;
  isLoading: boolean;
  error: string | null;
};

type SelectedCardProps = {
  title: string;
  selectLabel?: string;
  optionsEndpoint?: string;
  options?: SelectedCardOption[];
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  children?: ReactNode | ((args: SelectedCardChildrenArgs) => ReactNode);
};

function toOption(option: unknown): SelectedCardOption | null {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  if (!option || typeof option !== "object") {
    return null;
  }

  const record = option as Record<string, unknown>;
  const rawValue = record.value ?? record.id ?? record.key;
  const rawLabel = record.label ?? record.name ?? record.title ?? rawValue;

  const value =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? String(rawValue)
      : null;
  const label =
    typeof rawLabel === "string" || typeof rawLabel === "number"
      ? String(rawLabel)
      : null;

  if (!value || !label) {
    return null;
  }

  return { value, label };
}

function parseOptions(payload: unknown): SelectedCardOption[] {
  if (Array.isArray(payload)) {
    return payload
      .map(toOption)
      .filter((option): option is SelectedCardOption => option !== null);
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = record.options ?? record.data ?? record.results;

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map(toOption)
    .filter((option): option is SelectedCardOption => option !== null);
}

export function SelectedCard({
  title,
  selectLabel = "Select Option",
  optionsEndpoint,
  options: providedOptions,
  selectedValue,
  onSelectedValueChange,
  required = true,
  placeholder = "Choose an option",
  emptyMessage = "No options available.",
  children,
}: SelectedCardProps) {
  const [options, setOptions] = useState<SelectedCardOption[]>([]);
  const [isLoading, setIsLoading] = useState(providedOptions === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providedOptions !== undefined) {
      setOptions(providedOptions);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!optionsEndpoint) {
      setOptions([]);
      setIsLoading(false);
      setError("No options source configured.");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadOptions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(optionsEndpoint, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load options (${response.status})`);
        }

        const payload: unknown = await response.json();
        if (!isActive) {
          return;
        }

        setOptions(parseOptions(payload));
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setOptions([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load options.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [optionsEndpoint, providedOptions]);

  useEffect(() => {
    if (!required || isLoading || options.length === 0) {
      return;
    }

    const hasSelected = options.some((option) => option.value === selectedValue);
    if (!hasSelected) {
      onSelectedValueChange(options[0].value);
    }
  }, [isLoading, onSelectedValueChange, options, required, selectedValue]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const childrenContent =
    typeof children === "function"
      ? children({
          options,
          selectedValue,
          selectedOption,
          isLoading,
          error,
        })
      : children;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold mb-4">{title}</h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">
          {selectLabel}
          {required ? " *" : ""}
        </label>

        {isLoading && (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Loading options...
          </div>
        )}

        {!isLoading && error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!isLoading && !error && options.length === 0 && (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        )}

        {!isLoading && !error && options.length > 0 && (
          <Select.Root value={selectedValue} onValueChange={onSelectedValueChange}>
            <Select.Trigger className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:border-gray-400">
              <Select.Value placeholder={placeholder} />
              <Select.Icon>
                <ChevronDown className="size-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <Select.Viewport className="p-1">
                  {options.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      className="px-3 py-2 cursor-pointer rounded outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      </div>

      {childrenContent}
    </div>
  );
}
