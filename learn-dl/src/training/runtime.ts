export type TrainingJobStatus =
  | "queued"
  | "running"
  | "evaluating"
  | "completed"
  | "error"
  | "cancelled";

const KNOWN_TRAINING_STATUSES = new Set([
  "queued",
  "running",
  "completed",
  "error",
  "cancelled",
  "evaluating",
]);

export const TERMINAL_TRAINING_STATUSES = new Set<TrainingJobStatus>([
  "completed",
  "error",
  "cancelled",
]);

export const TRAIN_STATUS_POLL_INTERVAL_MS = 2000;

export const parseTrainingStatusUpdate = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: null, progress: null };
  }

  const { status, progress } = payload as {
    status?: unknown;
    progress?: unknown;
  };

  const normalizedStatus = typeof status === "string" ? status : null;

  if (typeof progress !== "number" && typeof progress !== "string") {
    return { status: normalizedStatus, progress: null };
  }

  const parsedProgress = Number(progress);

  if (!Number.isFinite(parsedProgress)) {
    return { status: normalizedStatus, progress: null };
  }

  const normalizedProgress =
    parsedProgress >= 0 && parsedProgress <= 1
      ? parsedProgress * 100
      : parsedProgress;

  return {
    status: normalizedStatus,
    progress: Math.min(100, Math.max(0, Math.round(normalizedProgress))),
  };
};

export const parseTrainingError = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const rawError = (payload as { error?: unknown }).error;

  if (typeof rawError === "string" && rawError.trim() !== "") {
    return rawError;
  }

  if (!rawError || typeof rawError !== "object" || Array.isArray(rawError)) {
    return null;
  }

  const errorRecord = rawError as Record<string, unknown>;
  const errorMessage = errorRecord.message ?? errorRecord.detail ?? errorRecord.error;

  if (typeof errorMessage === "string" && errorMessage.trim() !== "") {
    return errorMessage;
  }

  return JSON.stringify(rawError);
};

export const isEvaluatingStatus = (status: string | null) =>
  status === "evaluating";

export const normalizeTrainingStatus = (status: string | null): TrainingJobStatus | null => {
  if (!status) {
    return null;
  }

  if (isEvaluatingStatus(status)) {
    return "evaluating";
  }

  return KNOWN_TRAINING_STATUSES.has(status) ? (status as TrainingJobStatus) : null;
};

export const isTerminalTrainingStatus = (status: string | null) =>
  !!status && TERMINAL_TRAINING_STATUSES.has(status as TrainingJobStatus);

export const formatTrainingStatus = (status: string | null) => {
  if (!status) {
    return "Starting";
  }

  if (isEvaluatingStatus(status)) {
    return "Evaluating";
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};
