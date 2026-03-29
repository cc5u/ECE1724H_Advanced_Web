"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cancelTrainingRun,
  getTrainingStatus,
  updateTrainingSession,
  type TrainingPayload,
} from "../api/mlTraining";
import { useAuth } from "../auth/useAuth";
import type { TrainingVisualizationData } from "../components/TrainingVisualizations";
import {
  TRAIN_STATUS_POLL_INTERVAL_MS,
  isTerminalTrainingStatus,
  normalizeTrainingStatus,
  parseTrainingError,
  parseTrainingStatusUpdate,
  type TrainingJobStatus,
} from "./runtime";

const STORAGE_KEY = "training.runtime.jobs.v1";

export type TrainingRuntimeJob = {
  userId: string;
  trainingSessionId: string;
  modelName: string;
  status: TrainingJobStatus;
  progress: number;
  errorMessage: string | null;
  hyperParams: TrainingPayload | null;
  metrics: TrainingVisualizationData | null;
  startedAt: string | null;
  completedAt: string | null;
  syncedStateKey: string | null;
};

type TrainingRuntimeJobMap = Record<string, TrainingRuntimeJob>;

type TrackTrainingJobInput = {
  userId: string;
  trainingSessionId: string;
  modelName: string;
  hyperParams: TrainingPayload | null;
  initialStatus?: string | null;
  initialProgress?: number | null;
  initialError?: string | null;
  metrics?: TrainingVisualizationData | null;
};

type TrainingRuntimeContextValue = {
  currentJob: TrainingRuntimeJob | null;
  jobsVersion: number;
  trackTrainingJob: (input: TrackTrainingJobInput) => void;
  cancelCurrentJob: () => Promise<void>;
  forgetJob: (trainingSessionId: string) => void;
};

const TrainingRuntimeContext = createContext<TrainingRuntimeContextValue | null>(null);

const clampProgress = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const buildJobSyncKey = (job: TrainingRuntimeJob) =>
  JSON.stringify({
    modelName: job.modelName,
    status: job.status,
    progress: job.progress,
    errorMessage: job.errorMessage,
    hyperParams: job.hyperParams,
    metrics: job.metrics,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  });

const readStoredJobs = (): TrainingRuntimeJobMap => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.sessionStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as Record<string, unknown>;

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return {};
    }

    const restoredJobs: TrainingRuntimeJobMap = {};

    for (const [userId, rawJob] of Object.entries(parsedValue)) {
      if (!rawJob || typeof rawJob !== "object" || Array.isArray(rawJob)) {
        continue;
      }

      const job = rawJob as Record<string, unknown>;
      const status = normalizeTrainingStatus(
        typeof job.status === "string" ? job.status : null,
      );
      const trainingSessionId =
        typeof job.trainingSessionId === "string" ? job.trainingSessionId : null;

      if (!userId || !trainingSessionId || !status) {
        continue;
      }

      restoredJobs[userId] = {
        userId,
        trainingSessionId,
        modelName:
          typeof job.modelName === "string" && job.modelName.trim() !== ""
            ? job.modelName
            : "Untitled model",
        status,
        progress: clampProgress(
          typeof job.progress === "number" ? job.progress : Number(job.progress),
        ),
        errorMessage:
          typeof job.errorMessage === "string" && job.errorMessage.trim() !== ""
            ? job.errorMessage
            : null,
        hyperParams: (job.hyperParams as TrainingPayload | null | undefined) ?? null,
        metrics: (job.metrics as TrainingVisualizationData | null | undefined) ?? null,
        startedAt: typeof job.startedAt === "string" ? job.startedAt : null,
        completedAt: typeof job.completedAt === "string" ? job.completedAt : null,
        syncedStateKey:
          typeof job.syncedStateKey === "string" ? job.syncedStateKey : null,
      };
    }

    return restoredJobs;
  } catch (error) {
    console.error("Failed to restore training runtime state", error);
    return {};
  }
};

export function TrainingRuntimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [jobsByUserId, setJobsByUserId] = useState<TrainingRuntimeJobMap>(() =>
    readStoredJobs(),
  );
  const [jobsVersion, setJobsVersion] = useState(0);
  const jobsRef = useRef<TrainingRuntimeJobMap>(jobsByUserId);
  const syncInFlightRef = useRef<Record<string, string>>({});

  const currentJob = user?.userId ? jobsByUserId[user.userId] ?? null : null;

  useEffect(() => {
    jobsRef.current = jobsByUserId;
  }, [jobsByUserId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(jobsByUserId));
  }, [jobsByUserId]);

  const bumpJobsVersion = useCallback(() => {
    setJobsVersion((previousVersion) => previousVersion + 1);
  }, []);

  const trackTrainingJob = useCallback(
    ({
      userId,
      trainingSessionId,
      modelName,
      hyperParams,
      initialStatus,
      initialProgress,
      initialError,
      metrics,
    }: TrackTrainingJobInput) => {
      const normalizedStatus = normalizeTrainingStatus(initialStatus ?? null) ?? "queued";
      const isTerminal = isTerminalTrainingStatus(normalizedStatus);
      const nextJob: TrainingRuntimeJob = {
        userId,
        trainingSessionId,
        modelName: modelName.trim() || "Untitled model",
        status: normalizedStatus,
        progress:
          normalizedStatus === "evaluating" || normalizedStatus === "completed"
            ? 100
            : clampProgress(initialProgress),
        errorMessage: initialError ?? null,
        hyperParams,
        metrics: metrics ?? null,
        startedAt: new Date().toISOString(),
        completedAt: isTerminal ? new Date().toISOString() : null,
        syncedStateKey: null,
      };

      setJobsByUserId((previousJobs) => ({
        ...previousJobs,
        [userId]: nextJob,
      }));
      bumpJobsVersion();
    },
    [bumpJobsVersion],
  );

  const cancelCurrentJob = useCallback(async () => {
    if (!currentJob) {
      throw new Error("No active training job was found.");
    }

    if (isTerminalTrainingStatus(currentJob.status)) {
      throw new Error("This training job has already finished.");
    }

    const response = await cancelTrainingRun({
      userId: currentJob.userId,
      trainingSessionId: currentJob.trainingSessionId,
    });

    const { status: nextStatus, progress: nextProgress } =
      parseTrainingStatusUpdate(response.data);
    const nextError = parseTrainingError(response.data);

    if (nextError) {
      throw new Error(nextError);
    }

    const resolvedStatus = normalizeTrainingStatus(nextStatus) ?? "cancelled";
    const completedAt = new Date().toISOString();

    setJobsByUserId((previousJobs) => {
      const job = previousJobs[currentJob.userId];

      if (!job || job.trainingSessionId !== currentJob.trainingSessionId) {
        return previousJobs;
      }

      return {
        ...previousJobs,
        [currentJob.userId]: {
          ...job,
          status: resolvedStatus,
          progress:
            resolvedStatus === "evaluating" || resolvedStatus === "completed"
              ? 100
              : nextProgress ?? job.progress,
          errorMessage: null,
          completedAt,
          syncedStateKey: null,
        },
      };
    });
    bumpJobsVersion();
  }, [bumpJobsVersion, currentJob]);

  const forgetJob = useCallback(
    (trainingSessionId: string) => {
      const hasTrackedJob = Object.values(jobsRef.current).some(
        (job) => job.trainingSessionId === trainingSessionId,
      );

      if (!hasTrackedJob) {
        return;
      }

      setJobsByUserId((previousJobs) => {
        const nextJobs = { ...previousJobs };

        for (const [userId, job] of Object.entries(previousJobs)) {
          if (job.trainingSessionId === trainingSessionId) {
            delete nextJobs[userId];
          }
        }

        return nextJobs;
      });
      bumpJobsVersion();
    },
    [bumpJobsVersion],
  );

  useEffect(() => {
    if (!currentJob || currentJob.userId !== user?.userId) {
      return;
    }

    const syncKey = buildJobSyncKey(currentJob);
    const existingSyncKey = syncInFlightRef.current[currentJob.userId];

    if (currentJob.syncedStateKey === syncKey || existingSyncKey === syncKey) {
      return;
    }

    syncInFlightRef.current[currentJob.userId] = syncKey;
    let isActive = true;

    const syncCurrentJob = async () => {
      try {
        await updateTrainingSession({
          userId: currentJob.userId,
          trainingSessionId: currentJob.trainingSessionId,
          modelName: currentJob.modelName,
          hyperParams: currentJob.hyperParams,
          metrics: currentJob.metrics,
          status: currentJob.status,
          progress: currentJob.progress,
          errorMessage: currentJob.errorMessage,
          startedAt: currentJob.startedAt,
          completedAt: currentJob.completedAt,
        });

        if (!isActive) {
          return;
        }

        setJobsByUserId((previousJobs) => {
          const job = previousJobs[currentJob.userId];

          if (!job || job.trainingSessionId !== currentJob.trainingSessionId) {
            return previousJobs;
          }

          if (buildJobSyncKey(job) !== syncKey) {
            return previousJobs;
          }

          return {
            ...previousJobs,
            [currentJob.userId]: {
              ...job,
              syncedStateKey: syncKey,
            },
          };
        });
      } catch (error) {
        console.error("Failed to sync training session state", error);
      } finally {
        if (syncInFlightRef.current[currentJob.userId] === syncKey) {
          delete syncInFlightRef.current[currentJob.userId];
        }
      }
    };

    void syncCurrentJob();

    return () => {
      isActive = false;
    };
  }, [currentJob, user?.userId]);

  useEffect(() => {
    if (!currentJob || currentJob.userId !== user?.userId) {
      return;
    }

    if (isTerminalTrainingStatus(currentJob.status)) {
      return;
    }

    let isActive = true;
    let timeoutId: number | undefined;
    const trackedUserId = currentJob.userId;
    const trackedSessionId = currentJob.trainingSessionId;

    const pollTrainingJob = async () => {
      try {
        const activeJob = jobsRef.current[trackedUserId];

        if (
          !activeJob ||
          activeJob.trainingSessionId !== trackedSessionId ||
          isTerminalTrainingStatus(activeJob.status)
        ) {
          return;
        }

        const response = await getTrainingStatus({
          userId: trackedUserId,
          trainingSessionId: trackedSessionId,
        });

        if (!isActive) {
          return;
        }

        const { status: nextStatus, progress: nextProgress } =
          parseTrainingStatusUpdate(response.data);
        const normalizedStatus = normalizeTrainingStatus(nextStatus) ?? activeJob.status;
        const normalizedProgress =
          normalizedStatus === "evaluating" || normalizedStatus === "completed"
            ? 100
            : nextProgress ?? activeJob.progress;
        const nextError = parseTrainingError(response.data);
        const metrics =
          normalizedStatus === "completed"
            ? ((response.data?.result as TrainingVisualizationData | null | undefined) ??
              activeJob.metrics)
            : activeJob.metrics;
        const hyperParams =
          (response.data?.config as TrainingPayload | null | undefined) ??
          activeJob.hyperParams;
        const completedAt = isTerminalTrainingStatus(normalizedStatus)
          ? activeJob.completedAt ?? new Date().toISOString()
          : null;

        setJobsByUserId((previousJobs) => {
          const job = previousJobs[trackedUserId];

          if (!job || job.trainingSessionId !== trackedSessionId) {
            return previousJobs;
          }

          return {
            ...previousJobs,
            [trackedUserId]: {
              ...job,
              status: normalizedStatus,
              progress: clampProgress(normalizedProgress),
              errorMessage:
                nextError ?? (normalizedStatus === "error" ? job.errorMessage : null),
              hyperParams,
              metrics,
              completedAt,
              syncedStateKey: null,
            },
          };
        });

        if (isTerminalTrainingStatus(normalizedStatus)) {
          bumpJobsVersion();
          return;
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        console.error("Failed to poll training status", error);
      }

      if (isActive) {
        timeoutId = window.setTimeout(() => {
          void pollTrainingJob();
        }, TRAIN_STATUS_POLL_INTERVAL_MS);
      }
    };

    void pollTrainingJob();

    return () => {
      isActive = false;

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    bumpJobsVersion,
    currentJob?.status,
    currentJob?.trainingSessionId,
    currentJob?.userId,
    user?.userId,
  ]);

  const value = useMemo<TrainingRuntimeContextValue>(
    () => ({
      currentJob,
      jobsVersion,
      trackTrainingJob,
      cancelCurrentJob,
      forgetJob,
    }),
    [cancelCurrentJob, currentJob, forgetJob, jobsVersion, trackTrainingJob],
  );

  return (
    <TrainingRuntimeContext.Provider value={value}>
      {children}
    </TrainingRuntimeContext.Provider>
  );
}

export function useTrainingRuntime() {
  const context = useContext(TrainingRuntimeContext);

  if (!context) {
    throw new Error("useTrainingRuntime must be used inside TrainingRuntimeProvider");
  }

  return context;
}
