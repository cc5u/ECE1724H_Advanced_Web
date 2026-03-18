import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Loader2, Trash2, Upload } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import api from "../api/axiosClient";

export type SelectedCardOption = {
  value: string;
  label: string;
  deletable?: boolean;
  variant?: "default" | "upload";
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
  selectLabelTooltip?: string;
  optionsEndpoint?: string;
  options?: SelectedCardOption[];
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  deleteAPI?: string;
  onDelete?: (value: string) => Promise<void>;
  onOptionDeleted?: (value: string) => void;
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

function resolveDeleteUrl(baseUrl: string, optionValue: string) {
  if (baseUrl.includes(":value")) {
    return baseUrl.replace(":value", encodeURIComponent(optionValue));
  }

  return `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(optionValue)}`;
}

export function SelectedCard({
  title,
  selectLabel = "Select Option",
  selectLabelTooltip,
  optionsEndpoint,
  options: providedOptions,
  selectedValue,
  onSelectedValueChange,
  required = true,
  placeholder = "Choose an option",
  emptyMessage = "No options available.",
  deleteAPI,
  onDelete,
  onOptionDeleted,
  children,
}: SelectedCardProps) {
  const [loadedOptions, setLoadedOptions] = useState<SelectedCardOption[]>([]);
  const [remoteIsLoading, setRemoteIsLoading] = useState(providedOptions === undefined);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [deletingOptionValue, setDeletingOptionValue] = useState<string | null>(null);

  const options = providedOptions ?? loadedOptions;
  const isLoading = providedOptions === undefined ? remoteIsLoading : false;
  const error = providedOptions === undefined ? remoteError : null;
  const canDeleteOptions = Boolean(deleteAPI || onDelete);

  useEffect(() => {
    if (providedOptions !== undefined) {
      return;
    }

    if (!optionsEndpoint) {
      setLoadedOptions([]);
      setRemoteIsLoading(false);
      setRemoteError("No options source configured.");
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadOptions = async () => {
      setRemoteIsLoading(true);
      setRemoteError(null);

      try {
        const response = await fetch(optionsEndpoint, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Failed to load options (${response.status})`);
        }

        const payload: unknown = await response.json();

        if (!isMounted) {
          return;
        }

        setLoadedOptions(parseOptions(payload));
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          return;
        }

        setLoadedOptions([]);
        setRemoteError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load options.",
        );
      } finally {
        if (isMounted) {
          setRemoteIsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      isMounted = false;
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
  }, [required, isLoading, options, selectedValue, onSelectedValueChange]);

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

  const handleDeleteOption = async (optionValue: string) => {
    if (deletingOptionValue) {
      return;
    }

    if (!deleteAPI && !onDelete) {
      return;
    }

    setDeletingOptionValue(optionValue);

    try {
      if (onDelete) {
        await onDelete(optionValue);
      } else if (deleteAPI) {
        const deleteUrl = resolveDeleteUrl(deleteAPI, optionValue);
        await api.delete(deleteUrl, {
          data: { value: optionValue },
        });
      }

      onOptionDeleted?.(optionValue);
    } catch (deleteError) {
      console.error("Failed to delete option", deleteError);
      const backendError =
        typeof deleteError === "object" &&
        deleteError !== null &&
        "response" in deleteError &&
        deleteError.response &&
        typeof (deleteError.response as { data?: { error?: string } }).data?.error === "string"
          ? (deleteError.response as { data: { error: string } }).data.error
          : null;
      const message =
        backendError ??
        (deleteError instanceof Error ? deleteError.message : "Failed to delete option.");
      alert(message);
    } finally {
      setDeletingOptionValue(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold">{title}</h3>

      <div className="mb-4">
        <label className="mb-2 block text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            {selectLabel}
            {required ? " *" : ""}
            {selectLabelTooltip ? <InfoTooltip content={selectLabelTooltip} /> : null}
          </span>
        </label>

        {isLoading && (
          <div className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
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
            <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 hover:border-gray-400">
              <Select.Value placeholder={placeholder} />
              <Select.Icon>
                <ChevronDown className="size-4" />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <Select.Viewport className="p-1">
                  {options.map((option) => {
                    const isDeleting = deletingOptionValue === option.value;

                    return (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className={[
                          "relative flex cursor-pointer items-center gap-2 rounded px-3 py-2 outline-none",
                          "data-[highlighted]:bg-gray-100",
                          option.variant === "upload"
                            ? "mt-1 border-t border-dashed border-gray-200 pt-1 font-medium text-blue-600 first:mt-0 first:border-0 first:pt-0"
                            : "",
                        ].join(" ")}
                        onPointerDownCapture={(event) => {
                          if (
                            (event.target as HTMLElement).closest(
                              "button[data-delete-option]",
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {option.variant === "upload" && (
                          <Upload className="size-4 shrink-0" />
                        )}

                        <Select.ItemText className="min-w-0 flex-1">
                          {option.label}
                        </Select.ItemText>

                        {canDeleteOptions && option.deletable ? (
                          <button
                            type="button"
                            data-delete-option
                            className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${option.label}`}
                            title={`Delete ${option.label}`}
                            disabled={isDeleting}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void handleDeleteOption(option.value);
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            {isDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                        ) : null}
                      </Select.Item>
                    );
                  })}
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