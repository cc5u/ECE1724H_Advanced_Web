import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Progress from "@radix-ui/react-progress";
import { Upload } from "lucide-react";
import Papa from "papaparse";

import api from "../api/axiosClient";
import {
  cancelTrainingRun,
  deleteUserDataset,
  getTrainingStatus,
  readUserDataset,
  startTrainingRun,
  type TrainingPayload,
} from "../api/mlTraining";
import { getCurrentUserId } from "../api/session";
import {
  type TrainingVisualizationData,
} from "../components/TrainingVisualizations";
import { ClassfierCard } from "../components/ClassfierCard";
import { InfoTooltip } from "../components/InfoTooltip";
import { ModelParamsCard } from "../components/ModelParamsCard";
import { PreprocessingCard } from "../components/PreprocessingCard";
import { SelectedCard, type SelectedCardOption } from "../components/SelectedCard";
import { TrainingResult } from "../components/TrainingResult";
import type { Dataset, TextHandlingMode } from "../type";

type PreviewRow = {
  text: string;
  label: string;
};

type UploadedDatasetResult = {
  getUrl: string | null;
  trainingSessionId: string | null;
};

type ReloadedDatasetResult = {
  getUrl: string | null;
  trainingSessionId: string | null;
};

const PREVIEW_TEXT_LIMIT = 200;
const TRAIN_STATUS_POLL_INTERVAL_MS = 2000;
const DEFAULT_DATASET_TRAINING_SESSION_ID = "default-session";
const DEFAULT_TRAIN_SPLIT = 80;
const DEFAULT_CLASSIFIER_DROPOUT = 0.3;
const MIN_CLASSIFIER_DROPOUT = 0.1;
const MAX_CLASSIFIER_DROPOUT = 0.5;
const MAX_LEARNING_RATE = 0.01;
const BATCH_SIZE_OPTIONS = [8, 16, 32, 64, 128, 256];

const EVALUATING_TRAINING_STATUSES = new Set(["evaluting", "evaluating"]);
const KNOWN_TRAINING_STATUSES = new Set([
  "queued",
  "running",
  "completed",
  "error",
  "cancelled",
  "evaluting",
  "evaluating",
]);
const TERMINAL_TRAINING_STATUSES = new Set([
  "completed",
  "error",
  "cancelled",
]);

const DEFAULT_DATASETS: Dataset[] = [
  {
    id: "imdb",
    label: "IMDB Sentiment",
    type: "default",
    url: import.meta.env.VITE_IMDB_DATASET_URL,
  },
  {
    id: "sms",
    label: "SMS Spam",
    type: "default",
    url: import.meta.env.VITE_SMS_DATASET_URL,
  },
  {
    id: "agnews",
    label: "AG News",
    type: "default",
    url: import.meta.env.VITE_AGNEWS_DATASET_URL,
  },
  {
    id: "upload",
    label: "Upload CSV",
    type: "upload",
  },
];

const toNullableString = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value);

const clampClassifierDropout = (value: number) =>
  Math.min(MAX_CLASSIFIER_DROPOUT, Math.max(MIN_CLASSIFIER_DROPOUT, value));

const isLearningRateValid = (value: string) => {
  const parsedValue = Number(value);
  return (
    value.trim() !== "" &&
    Number.isFinite(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= MAX_LEARNING_RATE
  );
};

const parseEpochs = (value: string) => {
  const parsedValue = Number(value);

  return (
    value.trim() !== "" &&
    Number.isFinite(parsedValue) &&
    Number.isInteger(parsedValue) &&
    parsedValue > 0
  )
    ? parsedValue
    : null;
};

const parseTrainingStatusUpdate = (payload: unknown) => {
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

const parseTrainingError = (payload: unknown) => {
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

const isEvaluatingStatus = (status: string | null) =>
  !!status && EVALUATING_TRAINING_STATUSES.has(status);

const formatTrainingStatus = (status: string | null) => {
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

const normalizeTrainingStatus = (status: string | null) => {
  if (!status) {
    return null;
  }

  if (isEvaluatingStatus(status)) {
    return "evaluating";
  }

  return KNOWN_TRAINING_STATUSES.has(status) ? status : null;
};

const getUploadedFile = (dataset: Dataset | null) =>
  dataset?.type === "uploaded" ? dataset.file ?? null : null;

const getDatasetUrl = (dataset: Dataset | null) =>
  dataset?.type === "default" ? dataset.url ?? null : null;

export function Training() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  const [modelName, setModelName] = useState("");

  const [datasets, setDatasets] = useState<Dataset[]>(DEFAULT_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState(DEFAULT_DATASETS[0].id);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const [lowercase, setLowercase] = useState(true);
  const [removePunctuation, setRemovePunctuation] = useState(true);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [lemmatization, setLemmatization] = useState(false);
  const [trainSplit, setTrainSplit] = useState(DEFAULT_TRAIN_SPLIT);
  const [stratifiedSplit, setStratifiedSplit] = useState(false);
  const [handleURLs, setHandleURLs] = useState<TextHandlingMode>("keep");
  const [handleEmails, setHandleEmails] = useState<TextHandlingMode>("keep");

  const [model, setModel] = useState("distilbert_model");
  const [epochs, setEpochs] = useState("4");
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [evaluationFrequency, setEvaluationFrequency] = useState(1);
  const [fineTune, setFineTune] = useState("freeze_all");
  const [unfreezeLastNLayers, setUnfreezeLastNLayers] = useState(1);
  const [classifierType, setClassifierType] = useState("GRU");
  const [hiddenNeurons, setHiddenNeurons] = useState(512);
  const [classifierDropout, setClassifierDropout] = useState(DEFAULT_CLASSIFIER_DROPOUT);

  const [isCanceling, setIsCanceling] = useState(false);
  const [trainingSessionID, setTrainingSessionID] = useState<string | null>(null);

  const [hasResults, setHasResults] = useState(false);
  const [visualizationData, setVisualizationData] =
    useState<TrainingVisualizationData | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trainingUserIdRef = useRef<string | null>(null);

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

  const datasetOptions = useMemo<SelectedCardOption[]>(
    () =>
      datasets.map((dataset) => {
        if (dataset.type === "upload") {
          return {
            value: dataset.id,
            label: dataset.label,
            deletable: false,
            variant: "upload",
          };
        }

        if (dataset.type !== "saved") {
          return {
            value: dataset.id,
            label: dataset.label,
            deletable: false,
          };
        }

        return {
          value: dataset.id,
          label: dataset.csvName ?? dataset.label,
          deletable: true,
        };
      }),
    [datasets],
  );

  const shouldShowTrainingStatusCard =
    isTraining || trainingStatus === "error" || Boolean(trainingError);

  const canStartTraining =
    !!selectedDataset &&
    selectedDataset.type !== "upload" &&
    (selectedDataset.type !== "uploaded" || !!selectedDataset.file) &&
    parseEpochs(epochs) !== null &&
    isLearningRateValid(learningRate) &&
    BATCH_SIZE_OPTIONS.includes(batchSize);

  const formatPreviewText = (text: string) => {
    const compactText = text.replace(/\s+/g, " ").trim();

    if (compactText.length <= PREVIEW_TEXT_LIMIT) {
      return compactText;
    }

    return `${compactText.slice(0, PREVIEW_TEXT_LIMIT)}......`;
  };

  const normalizePreviewRows = (rows: unknown[]): PreviewRow[] => {
    const textKeys = ["text", "review", "input", "message", "content", "sentence"];
    const labelKeys = ["label", "sentiment", "output", "class", "category", "target"];

    return rows
      .map((row) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          return null;
        }

        const entries = Object.entries(row as Record<string, unknown>);
        if (entries.length === 0) {
          return null;
        }

        const normalizedEntries = entries.map(([key, value]) => ({
          normalizedKey: key.trim().toLowerCase().replace(/[\s_-]+/g, ""),
          value,
        }));

        const primitiveEntries = normalizedEntries.filter(
          (entry) => typeof entry.value === "string" || typeof entry.value === "number",
        );

        const findPreferredEntry = (preferredKeys: string[]) =>
          normalizedEntries.find((entry) => preferredKeys.includes(entry.normalizedKey));

        const textEntry = findPreferredEntry(textKeys) ?? primitiveEntries[0];
        const labelEntry =
          findPreferredEntry(labelKeys) ??
          primitiveEntries.find((entry) => entry !== textEntry);

        const text = textEntry ? String(textEntry.value ?? "").trim() : "";
        const label = labelEntry ? String(labelEntry.value ?? "").trim() : "";

        if (!text && !label) {
          return null;
        }

        return { text, label };
      })
      .filter((row): row is PreviewRow => row !== null);
  };

  const parsePreview = (source: File | string) =>
    new Promise<PreviewRow[]>((resolve, reject) => {
      Papa.parse(source, {
        header: true,
        preview: 5,
        complete: (results) => {
          resolve(normalizePreviewRows(Array.isArray(results.data) ? results.data : []));
        },
        error: reject,
      });
    });

  const parseRawPreviewRows = (file: File) =>
    new Promise<Record<string, unknown>[]>((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        preview: 5,
        complete: (results) => {
          const rows = Array.isArray(results.data)
            ? results.data.filter((row) => {
                if (!row || typeof row !== "object" || Array.isArray(row)) {
                  return false;
                }

                return Object.values(row).some(
                  (value) => String(value ?? "").trim() !== "",
                );
              })
            : [];

          resolve(rows);
        },
        error: reject,
      });
    });

  const loadPreview = async (dataset: Dataset): Promise<PreviewRow[]> => {
    if (dataset.type === "default") {
      if (!dataset.url) {
        return [];
      }

      const response = await fetch(dataset.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch dataset preview (${response.status})`);
      }

      const csvText = await response.text();
      return parsePreview(csvText);
    }

    if (dataset.type === "uploaded" && dataset.file) {
      return parsePreview(dataset.file);
    }

    if (dataset.type === "saved") {
      return normalizePreviewRows(dataset.previewRows ?? []);
    }

    return [];
  };

  const mergeUserDatasetsIntoState = useCallback((savedDatasets: Dataset[]) => {
    setDatasets((previousDatasets) => {
      const uploadOption = previousDatasets.find((dataset) => dataset.type === "upload");
      const localDefaults = previousDatasets.filter((dataset) => dataset.type === "default");
      const localUploaded = previousDatasets.filter((dataset) => dataset.type === "uploaded");

      const mergedDatasets = [...localDefaults, ...savedDatasets, ...localUploaded];

      if (uploadOption) {
        mergedDatasets.push(uploadOption);
      }

      return mergedDatasets;
    });
  }, []);

  const loadUserDatasets = useCallback(
    async (deletedDatasetId?: string) => {
      try {
        const datasetsResponse = await readUserDataset();

        const savedDatasets: Dataset[] = datasetsResponse.map((dataset) => ({
          id: dataset.datasetId,
          label: dataset.csvName,
          type: "saved",
          datasetId: dataset.datasetId,
          csvName: dataset.csvName,
          isDefault: dataset.isDefault,
          previewRows: Array.isArray(dataset.preview) ? dataset.preview : [],
        }));

        mergeUserDatasetsIntoState(savedDatasets);

        if (deletedDatasetId) {
          setSelectedDatasetId((current) =>
            current === deletedDatasetId ? DEFAULT_DATASETS[0].id : current,
          );
        }
      } catch (error) {
        console.error("Failed to fetch user datasets", error);
      }
    },
    [mergeUserDatasetsIntoState],
  );

  useEffect(() => {
    void loadUserDatasets();
  }, [loadUserDatasets]);

  useEffect(() => {
    if (!selectedDataset || selectedDataset.type === "upload") {
      setPreviewData([]);
      return;
    }

    let isMounted = true;

    const loadSelectedDatasetPreview = async () => {
      try {
        const nextPreviewRows = await loadPreview(selectedDataset);

        if (isMounted) {
          setPreviewData(nextPreviewRows);
        }
      } catch (error) {
        console.error("Failed to load dataset preview", error);

        if (isMounted) {
          setPreviewData([]);
        }
      }
    };

    void loadSelectedDatasetPreview();

    return () => {
      isMounted = false;
    };
  }, [selectedDataset]);

  useEffect(() => {
    if (!isTraining || !trainingUserIdRef.current || !trainingSessionID) {
      return;
    }

    let isMounted = true;
    let timeoutId: number | undefined;

    const pollTrainingStatus = async () => {
      const trainingUserId = trainingUserIdRef.current;

      if (!trainingUserId) {
        return;
      }

      try {
        const response = await getTrainingStatus({
          userId: trainingUserId,
          trainingSessionId: trainingSessionID,
        });

        if (!isMounted) {
          return;
        }

        const { status: nextStatus, progress: nextProgress } =
          parseTrainingStatusUpdate(response.data);
        const nextError = parseTrainingError(response.data);
        const normalizedStatus = normalizeTrainingStatus(nextStatus);

        if (normalizedStatus) {
          setTrainingStatus(normalizedStatus);
        }

        if (normalizedStatus === "evaluating" || normalizedStatus === "completed") {
          setProgress(100);
        } else if (nextProgress !== null) {
          setProgress(nextProgress);
        }

        if (nextError) {
          setTrainingError(nextError);
        } else if (normalizedStatus !== "error") {
          setTrainingError(null);
        }

        if (normalizedStatus && TERMINAL_TRAINING_STATUSES.has(normalizedStatus)) {
          if (normalizedStatus === "completed") {
            setProgress(100);
            setHasResults(true);
            setVisualizationData(response.data.result);
          }

          setIsTraining(false);
          trainingUserIdRef.current = null;
          return;
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to fetch training status", error);
      }

      if (isMounted) {
        timeoutId = window.setTimeout(() => {
          void pollTrainingStatus();
        }, TRAIN_STATUS_POLL_INTERVAL_MS);
      }
    };

    void pollTrainingStatus();

    return () => {
      isMounted = false;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isTraining, trainingSessionID]);

  const handleDatasetDelete = useCallback(async (datasetId: string) => {
    const userId = await getCurrentUserId();
    await deleteUserDataset(userId, datasetId);
  }, []);

  const handleDatasetDeleted = useCallback(
    (datasetId: string) => {
      void loadUserDatasets(datasetId);
    },
    [loadUserDatasets],
  );

  const handleDatasetSelection = (datasetId: string) => {
    const dataset = datasets.find((item) => item.id === datasetId);

    if (!dataset) {
      return;
    }

    if (dataset.type === "upload") {
      setSelectedDatasetId(dataset.id);
      setPreviewData([]);
      fileInputRef.current?.click();
      return;
    }

    setSelectedDatasetId(dataset.id);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    const uploadedDataset: Dataset = {
      id: crypto.randomUUID(),
      label: file.name,
      type: "uploaded",
      file,
    };

    setDatasets((previousDatasets) => {
      const uploadOptionIndex = previousDatasets.findIndex(
        (dataset) => dataset.type === "upload",
      );

      if (uploadOptionIndex === -1) {
        return [...previousDatasets, uploadedDataset];
      }

      return [
        ...previousDatasets.slice(0, uploadOptionIndex),
        uploadedDataset,
        ...previousDatasets.slice(uploadOptionIndex),
      ];
    });

    setSelectedDatasetId(uploadedDataset.id);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    handleFileUpload(file);
  };

  const uploadDatasetFile = async (
    file: File,
    userId: string,
  ): Promise<UploadedDatasetResult> => {
    const previewData = await parseRawPreviewRows(file);

    const presignedUrlResponse = await api.post(`/users/${userId}/datasets/upload`, {
      fileName: file.name,
      modelName: modelName.trim(),
      previewData,
    });

    const uploadUrl = toNullableString(presignedUrlResponse.data?.url);
    const getUrl = toNullableString(presignedUrlResponse.data?.getUrl);
    const trainingSessionId = toNullableString(presignedUrlResponse.data?.sessionId);

    if (!uploadUrl) {
      throw new Error("Missing upload URL for CSV upload.");
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "text/csv",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload CSV (${response.status})`);
    }

    return {
      getUrl,
      trainingSessionId,
    };
  };

  const reloadDatasetFile = async (
    dataset: Dataset,
    userId: string,
  ): Promise<ReloadedDatasetResult> => {
    if (!dataset.datasetId) {
      throw new Error("Missing datasetId for selected dataset.");
    }

    const fileName = dataset.csvName ?? dataset.label;
    const modelNameValue = modelName.trim();

    if (!modelNameValue) {
      throw new Error("Model name is required.");
    }

    const reloadResponse = await api.post(`/users/${userId}/datasets/reload`, {
      fileName,
      modelName: modelNameValue,
      datasetid: dataset.datasetId,
      isDefault: Boolean(dataset.isDefault),
    });

    return {
      getUrl: toNullableString(reloadResponse.data?.getUrl),
      trainingSessionId: toNullableString(reloadResponse.data?.sessionId),
    };
  };

  const buildTrainingPayload = (trainingDatasetUrl: string): TrainingPayload => {
    const validEpochs = parseEpochs(epochs) ?? 1;

    return {
      training_config: {
        learning_rate: Number(learningRate),
        n_epochs: validEpochs,
        batch_size: batchSize,
        eval_step: evaluationFrequency,
      },
      data_config: {
        data_path: trainingDatasetUrl,
        lowercase,
        remove_punctuation: removePunctuation,
        remove_stopwords: removeStopwords,
        lemmatization,
        handle_urls: handleURLs,
        handle_emails: handleEmails,
        train_ratio: trainSplit / 100,
        test_ratio: (100 - trainSplit) / 100,
        stratify: stratifiedSplit,
        class_map: {},
      },
      embed_model_config: {
        embed_model: model,
        fine_tune_mode: fineTune,
        unfreeze_last_n_layers:
          fineTune === "unfreeze_last_n_layers" ? unfreezeLastNLayers : null,
      },
      classifier_config: {
        model_name: modelName,
        hidden_neurons: hiddenNeurons,
        dropout: clampClassifierDropout(classifierDropout),
        num_classes: 2,
        classifier_type: classifierType,
      },
    };
  };

  const startTraining = async () => {
    if (!selectedDataset || selectedDataset.type === "upload") {
      alert("Please select a dataset.");
      return;
    }

    if (parseEpochs(epochs) === null) {
      alert("Epochs must be a whole number greater than 0.");
      return;
    }

    if (!BATCH_SIZE_OPTIONS.includes(batchSize)) {
      alert("Batch size must be one of: 8, 16, 32, 64, 128, 256.");
      return;
    }

    if (!isLearningRateValid(learningRate)) {
      alert("Learning rate must satisfy: 0 < learning_rate <= 0.01.");
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setTrainingStatus("running");
    setTrainingError(null);
    setTrainingSessionID(null);
    trainingUserIdRef.current = null;
    setHasResults(false);
    setVisualizationData(null);

    try {
      const userId = await getCurrentUserId();
      const uploadedFile = getUploadedFile(selectedDataset);
      const datasetUrl = getDatasetUrl(selectedDataset);

      let trainingDatasetUrl = datasetUrl;
      let currentTrainingSessionId = DEFAULT_DATASET_TRAINING_SESSION_ID;

      if (uploadedFile) {
        const uploadResult = await uploadDatasetFile(uploadedFile, userId);
        trainingDatasetUrl = uploadResult.getUrl;
        currentTrainingSessionId = uploadResult.trainingSessionId ?? "";
      } else if (selectedDataset.type === "saved") {
        const reloadResult = await reloadDatasetFile(selectedDataset, userId);
        trainingDatasetUrl = reloadResult.getUrl;
        currentTrainingSessionId = reloadResult.trainingSessionId ?? "";
      }

      if (!trainingDatasetUrl) {
        throw new Error("Dataset URL is missing.");
      }

      if (!currentTrainingSessionId) {
        throw new Error("Training session ID is missing.");
      }

      const payload = buildTrainingPayload(trainingDatasetUrl);

      const response = await startTrainingRun(
        {
          userId,
          trainingSessionId: currentTrainingSessionId,
        },
        payload,
      );

      trainingUserIdRef.current = userId;
      setTrainingSessionID(currentTrainingSessionId);

      const { status: parsedStatus, progress: nextProgress } =
        parseTrainingStatusUpdate(response.data);
      const nextError = parseTrainingError(response.data);
      const nextStatus = normalizeTrainingStatus(parsedStatus) ?? "queued";

      setTrainingStatus(nextStatus);

      if (nextStatus === "evaluating" || nextStatus === "completed") {
        setProgress(100);
      } else if (nextProgress !== null) {
        setProgress(nextProgress);
      }

      if (nextError) {
        setTrainingError(nextError);
      }

      if (TERMINAL_TRAINING_STATUSES.has(nextStatus)) {
        setIsTraining(false);
        trainingUserIdRef.current = null;
      }
    } catch (error) {
      console.error("Failed to start training", error);

      const errorMessage = axios.isAxiosError(error)
        ? (error.response?.data?.detail ??
          error.response?.data?.error ??
          error.message)
        : error instanceof Error
          ? error.message
          : "Failed to start training.";

      alert(errorMessage);
      setIsTraining(false);
      setProgress(0);
      setTrainingStatus("error");
      setTrainingError(errorMessage);
      setTrainingSessionID(null);
      trainingUserIdRef.current = null;
    }
  };

  const cancelTraining = async () => {
    setIsCanceling(true);

    try {
      if (!trainingUserIdRef.current) {
        throw new Error("You must be logged in to cancel training.");
      }

      if (!trainingSessionID) {
        throw new Error("Missing training session ID for cancel request.");
      }

      const res = await cancelTrainingRun({
        userId: trainingUserIdRef.current,
        trainingSessionId: trainingSessionID,
      });

      const { status: nextStatus, progress: nextProgress } =
        parseTrainingStatusUpdate(res.data);
      const nextError = parseTrainingError(res.data);
      const normalizedStatus = normalizeTrainingStatus(nextStatus);

      setTrainingStatus(normalizedStatus);

      if (normalizedStatus === "evaluating" || normalizedStatus === "completed") {
        setProgress(100);
      } else if (nextProgress !== null) {
        setProgress(nextProgress);
      }

      if (nextError) {
        setTrainingError(nextError);
      } else if (normalizedStatus !== "error") {
        setTrainingError(null);
      }

      if (normalizedStatus && TERMINAL_TRAINING_STATUSES.has(normalizedStatus)) {
        setIsTraining(false);
        trainingUserIdRef.current = null;
      }
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-6 text-3xl">Training</h1>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1">
              Model Name
              <InfoTooltip content="A unique name to identify this trained model later." />
            </span>
          </label>

          <input
            type="text"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="e.g., IMDB-DistilBERT-v1"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <p className="mt-1 text-xs text-gray-500">
            Give your model a unique name for easy identification
          </p>
        </div>

        <div className="mb-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SelectedCard
              title="Dataset"
              selectLabel="Select Dataset"
              selectLabelTooltip="Choose a default dataset or upload your own CSV file."
              options={datasetOptions}
              selectedValue={selectedDatasetId}
              onSelectedValueChange={handleDatasetSelection}
              onDelete={handleDatasetDelete}
              onOptionDeleted={handleDatasetDeleted}
              placeholder="Choose a dataset"
            >
              {() => (
                <>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {selectedDataset?.type === "upload" && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400"
                    >
                      <Upload className="mx-auto mb-2 size-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm text-gray-600">
                        Sample Preview
                      </label>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Text</th>
                            <th className="px-3 py-2 text-left">Label</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.length > 0 ? (
                            previewData.map((row, index) => (
                              <tr className="border-t border-gray-200" key={index}>
                                <td className="px-3 py-2 text-xs" title={row.text}>
                                  {formatPreviewText(row.text)}
                                </td>
                                <td className="px-3 py-2 text-xs">{row.label}</td>
                              </tr>
                            ))
                          ) : (
                            <>
                              <tr>
                                <td className="px-3 py-2 text-xs">
                                  This is an amazing sample text
                                </td>
                                <td className="px-3 py-2 text-xs">Positive</td>
                              </tr>
                              <tr className="border-t border-gray-200">
                                <td className="px-3 py-2 text-xs">
                                  Worst sample text ever
                                </td>
                                <td className="px-3 py-2 text-xs">Negative</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </SelectedCard>

            <PreprocessingCard
              lowercase={lowercase}
              removePunctuation={removePunctuation}
              removeStopwords={removeStopwords}
              lemmatization={lemmatization}
              trainSplit={trainSplit}
              stratifiedSplit={stratifiedSplit}
              handleURLs={handleURLs}
              handleEmails={handleEmails}
              onLowercaseSwitchChange={setLowercase}
              onPunctuationSwitchChange={setRemovePunctuation}
              onStopwordsSwitchChange={setRemoveStopwords}
              onLemmatizationSwitchChange={setLemmatization}
              onTrainSplitChange={setTrainSplit}
              onStratifiedSplitChange={setStratifiedSplit}
              onHandleURLsChange={setHandleURLs}
              onHandleEmailsChange={setHandleEmails}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ClassfierCard
              classifierType={classifierType}
              hiddenNeurons={hiddenNeurons}
              dropout={classifierDropout}
              onClassifierTypeChange={setClassifierType}
              onHiddenNeuronsChange={setHiddenNeurons}
              onDropoutChange={(value) =>
                setClassifierDropout(clampClassifierDropout(value))
              }
            />

            <ModelParamsCard
              model={model}
              epochs={epochs}
              batchSize={batchSize}
              learningRate={learningRate}
              evaluationFrequency={evaluationFrequency}
              fineTune={fineTune}
              unfreezeLastNLayers={unfreezeLastNLayers}
              onModelChange={setModel}
              onEpochsChange={setEpochs}
              onBatchSizeChange={setBatchSize}
              onLearningRateChange={setLearningRate}
              onEvaluationFrequencyChange={setEvaluationFrequency}
              onFineTuneModeChange={setFineTune}
              onUnfreezeLastNLayersChange={setUnfreezeLastNLayers}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                void startTraining();
              }}
              disabled={isTraining || !canStartTraining}
              className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isTraining ? "Training..." : "Start Training"}
            </button>

            {isTraining && (
              <button
                onClick={() => {
                  void cancelTraining();
                }}
                disabled={isCanceling}
                className="rounded-lg bg-red-600 px-8 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isCanceling ? "Canceling..." : "Cancel Training"}
              </button>
            )}
          </div>

          {shouldShowTrainingStatusCard && (
            <div className="w-full max-w-md">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm">Training Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>

                <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Status</span>
                  <span className="font-medium text-gray-700">
                    {formatTrainingStatus(trainingStatus)}
                  </span>
                </div>

                <Progress.Root className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <Progress.Indicator
                    className="h-full bg-blue-600 transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>

                {trainingError && (
                  <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {trainingError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <TrainingResult hasResults={hasResults} visualizationData={visualizationData} />
    </div>
  );
}