import { useEffect, useState } from "react";
import { Calendar, Download, Loader2, Trash2 } from "lucide-react";
import {
  deleteTrainingSession,
  downloadTrainingSessionArtifacts,
} from "../api/mlTraining";
import { getCurrentUserId } from "../api/session";
import { getUserTrainingSessions, type TrainingRun } from "../api/trainingSessions";
import { TrainingVisualizations } from "../components/TrainingVisualizations";
import { formatTrainingStatus, isTerminalTrainingStatus } from "../training/runtime";
import { useTrainingRuntime } from "../training/useTrainingRuntime";

const getPreviewColumns = (rows: Record<string, unknown>[]) => {
  const columns = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      columns.add(key);
    });
  });

  return Array.from(columns);
};

const formatPreviewCell = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
};

export function Archives() {
  const { currentJob, jobsVersion, forgetJob } = useTrainingRuntime();
  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [downloadingRunId, setDownloadingRunId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTrainingRuns = async () => {
      setIsLoadingRuns(true);
      setRunsError(null);

      try {
        const sessions = await getUserTrainingSessions();

        if (!isActive) {
          return;
        }

        setTrainingRuns(sessions);
        setSelectedRun((currentSelection) =>
          currentSelection
            ? sessions.find((session) => session.id === currentSelection.id) ?? sessions[0] ?? null
            : sessions[0] ?? null,
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        setRunsError(error instanceof Error ? error.message : "Failed to load training history.");
      } finally {
        if (isActive) {
          setIsLoadingRuns(false);
        }
      }
    };

    void loadTrainingRuns();

    return () => {
      isActive = false;
    };
  }, [jobsVersion]);

  const handleDeleteTrainingRun = async (trainingSessionId: string) => {
    if (deletingRunId) {
      return;
    }

    setDeletingRunId(trainingSessionId);

    try {
      const userId = await getCurrentUserId();
      await deleteTrainingSession(userId, trainingSessionId);
      forgetJob(trainingSessionId);

      const remainingRuns = trainingRuns.filter((run) => run.id !== trainingSessionId);
      setTrainingRuns(remainingRuns);
      setSelectedRun((current) =>
        current?.id === trainingSessionId ? (remainingRuns[0] ?? null) : current,
      );
    } catch (error) {
      console.error("Failed to delete training session", error);
      alert(error instanceof Error ? error.message : "Failed to delete training session.");
    } finally {
      setDeletingRunId(null);
    }
  };

  const handleDownloadTrainingArtifacts = async (trainingSessionId: string) => {
    if (downloadingRunId) {
      return;
    }

    setDownloadingRunId(trainingSessionId);

    try {
      const userId = await getCurrentUserId();
      console.log("Training Session ID: ", trainingSessionId)
      const { downloadUrl } = await downloadTrainingSessionArtifacts(userId, trainingSessionId);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download training artifacts", error);
      alert(error instanceof Error ? error.message : "Failed to download training artifacts.");
    } finally {
      setDownloadingRunId(null);
    }
  };

  const previewRows = selectedRun?.datasetPreview ?? [];
  const previewColumns = getPreviewColumns(previewRows);
  const trainingConfig = selectedRun?.hyperParams?.training_config;
  const embedModelConfig = selectedRun?.hyperParams?.embed_model_config;
  const classifierConfig = selectedRun?.hyperParams?.classifier_config;
  const isSelectedRunCompleted = selectedRun?.status === "completed";

  if (isLoadingRuns) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading Training History</h2>
          <p className="text-gray-600">Fetching your training sessions.</p>
        </div>
      </div>
    );
  }

  if (trainingRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Training History</h2>
          <p className="text-gray-600">{runsError || "Train a model to see it appear here."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="font-semibold text-lg mb-4">Training History</h2>
          <div className="space-y-2">
            {trainingRuns.map((run) => (
              <div
                key={run.id}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedRun?.id === run.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRun(run)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="font-medium">{run.name}</div>
                  </button>
                  <button
                    type="button"
                    disabled={
                      deletingRunId === run.id ||
                      (currentJob?.trainingSessionId === run.id &&
                        !isTerminalTrainingStatus(currentJob.status))
                    }
                    onClick={() => void handleDeleteTrainingRun(run.id)}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Delete ${run.name}`}
                    title={`Delete ${run.name}`}
                  >
                    {deletingRunId === run.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRun(run)}
                  className="block w-full text-left"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        run.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : run.status === "error"
                            ? "bg-red-100 text-red-700"
                            : run.status === "cancelled"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {formatTrainingStatus(run.status)}
                    </span>
                    {run.status !== "completed" ? (
                      <span className="text-xs text-gray-500">{run.progress}%</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                    <Calendar className="size-3" />
                    {run.date}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Accuracy: </span>
                    <span className="font-medium text-green-600">{run.accuracy}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRun && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl mb-8">Run Details</h1>

            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Dataset Summary</h3>
                <div className="mb-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Dataset</div>
                    <div className="font-medium">{selectedRun.dataset}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Saved Preview Rows</div>
                    <div className="font-medium">{previewRows.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div className="font-medium">{formatTrainingStatus(selectedRun.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Split</div>
                    <div className="font-medium">
                      {selectedRun.config.trainSplit}/{100 - selectedRun.config.trainSplit}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Preprocessing Pipeline
                  </h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lowercase</span>
                      <span
                        className={`text-sm font-medium ${
                          selectedRun.config.lowercase ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {selectedRun.config.lowercase ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remove Punctuation</span>
                      <span
                        className={`text-sm font-medium ${
                          selectedRun.config.removePunctuation
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedRun.config.removePunctuation ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remove Stopwords</span>
                      <span
                        className={`text-sm font-medium ${
                          selectedRun.config.removeStopwords
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedRun.config.removeStopwords ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lemmatization</span>
                      <span
                        className={`text-sm font-medium ${
                          selectedRun.config.lemmatization
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedRun.config.lemmatization ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Saved Dataset Preview</h3>
                {previewRows.length > 0 && previewColumns.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">
                              #
                            </th>
                            {previewColumns.map((column) => (
                              <th
                                key={column}
                                className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewRows.map((row, index) => (
                            <tr key={`${selectedRun.id}-${index}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                              {previewColumns.map((column) => (
                                <td key={column} className="px-4 py-3 text-sm align-top">
                                  <div className="max-w-xl whitespace-pre-wrap break-words">
                                    {formatPreviewCell(row[column])}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                    No dataset preview was stored for this training session.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Hyperparameter Configuration</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Classifier</span>
                    <span className="font-medium">
                      {classifierConfig?.classifier_type ?? selectedRun.model}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Epochs</span>
                    <span className="font-medium">{trainingConfig?.n_epochs ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Batch Size</span>
                    <span className="font-medium">{trainingConfig?.batch_size ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Learning Rate</span>
                    <span className="font-medium">
                      {trainingConfig ? String(trainingConfig.learning_rate) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Embedding Model</span>
                    <span className="font-medium">{embedModelConfig?.embed_model ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Fine-tune Mode</span>
                    <span className="font-medium">
                      {embedModelConfig?.fine_tune_mode ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Eval Step</span>
                    <span className="font-medium">{trainingConfig?.eval_step ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Dropout</span>
                    <span className="font-medium">{classifierConfig?.dropout ?? "N/A"}</span>
                  </div>
                </div>
              </div>

              <TrainingVisualizations data={selectedRun.visualizationData} />

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Model Artifacts</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download the saved model artifacts for this training session.
                </p>
                <button
                  type="button"
                  disabled={downloadingRunId === selectedRun.id || !isSelectedRunCompleted}
                  onClick={() => void handleDownloadTrainingArtifacts(selectedRun.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {downloadingRunId === selectedRun.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {downloadingRunId === selectedRun.id
                    ? "Preparing Download..."
                    : "Download Model Artifacts"}
                </button>
                {!isSelectedRunCompleted ? (
                  <p className="mt-3 text-sm text-gray-500">
                    Model artifacts are available only after training completes successfully.
                  </p>
                ) : null}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Stored Session Details</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Session ID</span>
                    <span className="font-medium">{selectedRun.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">{selectedRun.date}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Model Name</span>
                    <span className="font-medium">{selectedRun.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{selectedRun.progress}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-medium">{selectedRun.accuracy}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Started</span>
                    <span className="font-medium">
                      {selectedRun.startedAt
                        ? new Date(selectedRun.startedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium">
                      {selectedRun.completedAt
                        ? new Date(selectedRun.completedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
                {selectedRun.errorMessage ? (
                  <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {selectedRun.errorMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
