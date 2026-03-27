import type { TrainingVisualizationData } from "../components/TrainingVisualizations";
import type { TrainingPayload } from "./mlTraining";
import api from "./axiosClient";
import { getCurrentUserId } from "./session";
import type { TrainingJobStatus } from "../training/runtime";

export interface TrainingRunConfig {
  epochs: number;
  batchSize: number;
  learningRate: string;
  fineTune: boolean;
  trainSplit: number;
  lowercase: boolean;
  removePunctuation: boolean;
  removeStopwords: boolean;
  lemmatization: boolean;
}

export interface TrainingRun {
  id: string;
  name: string;
  model: string;
  dataset: string;
  accuracy: string;
  date: string;
  status: TrainingJobStatus;
  progress: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  config: TrainingRunConfig;
  datasetPreview: Record<string, unknown>[];
  hyperParams: TrainingPayload | null;
  visualizationData?: TrainingVisualizationData;
}

export type BackendTrainingSession = {
  sessionId: string;
  userId: string;
  datasetId: string;
  modelName: string;
  status: TrainingJobStatus;
  progress: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  dataset: {
    csvName: string;
    preview: Record<string, unknown>[] | null;
  };
  hyperParams: TrainingPayload | null;
  metrics: TrainingVisualizationData | null;
};

const formatAccuracy = (accuracy: number) => {
  const percentage = accuracy <= 1 ? accuracy * 100 : accuracy;
  return `${percentage.toFixed(1)}%`;
};

const toTrainSplit = (trainRatio: number) => {
  const percentage = trainRatio <= 1 ? trainRatio * 100 : trainRatio;
  return Math.round(percentage);
};

const defaultTrainingRunConfig: TrainingRunConfig = {
  epochs: 1,
  batchSize: 1,
  learningRate: "",
  fineTune: false,
  trainSplit: 80,
  lowercase: false,
  removePunctuation: false,
  removeStopwords: false,
  lemmatization: false,
};

const getSessionAccuracy = (metrics: TrainingVisualizationData | null) =>
  metrics?.metrics.accuracy ?? null;

const getAccuracyLabel = (
  status: TrainingJobStatus,
  accuracy: number | null,
) => {
  if (accuracy !== null) {
    return formatAccuracy(accuracy);
  }

  switch (status) {
    case "queued":
    case "running":
    case "evaluating":
      return "Pending";
    case "error":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "N/A";
  }
};

const getTrainingRunConfig = (
  hyperParams: BackendTrainingSession["hyperParams"],
): TrainingRunConfig => {
  const trainingConfig = hyperParams?.training_config;
  const embedModelConfig = hyperParams?.embed_model_config;
  const dataConfig = hyperParams?.data_config;

  return {
    ...defaultTrainingRunConfig,
    ...(trainingConfig
      ? {
          epochs: trainingConfig.n_epochs,
          batchSize: trainingConfig.batch_size,
          learningRate: String(trainingConfig.learning_rate),
        }
      : {}),
    ...(dataConfig
      ? {
          trainSplit: toTrainSplit(dataConfig.train_ratio),
          lowercase: dataConfig.lowercase,
          removePunctuation: dataConfig.remove_punctuation,
          removeStopwords: dataConfig.remove_stopwords,
          lemmatization: dataConfig.lemmatization,
        }
      : {}),
    fineTune: embedModelConfig
      ? embedModelConfig.fine_tune_mode !== "freeze_all"
      : defaultTrainingRunConfig.fineTune,
  };
};

const mapTrainingSession = (session: BackendTrainingSession): TrainingRun => {
  const accuracy = getSessionAccuracy(session.metrics);
  return {
    id: session.sessionId,
    name: session.modelName,
    model: session.hyperParams?.classifier_config.classifier_type ?? "Unknown",
    dataset: session.dataset.csvName,
    accuracy: getAccuracyLabel(session.status, accuracy),
    date: new Date(session.createdAt).toLocaleDateString(),
    status: session.status,
    progress: Math.max(0, Math.min(100, Math.round(session.progress ?? 0))),
    errorMessage: session.errorMessage,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    config: getTrainingRunConfig(session.hyperParams),
    datasetPreview: session.dataset.preview ?? [],
    hyperParams: session.hyperParams,
    visualizationData: session.metrics ?? undefined,
  };
};

export const getUserTrainingSessions = async (): Promise<TrainingRun[]> => {
  const userId = await getCurrentUserId();
  const response = await api.get<{ trainingSessions: BackendTrainingSession[] }>(
    `/users/${userId}/training_sessions`,
  );
  return response.data.trainingSessions.map(mapTrainingSession);
};
