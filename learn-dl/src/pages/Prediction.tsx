import { useEffect, useState } from "react";
import {
  deleteTrainingSession,
  predictWithTrainingSession,
} from "../api/mlTraining";
import { getCurrentUserId } from "../api/session";
import {
  getUserTrainingSessions,
  type TrainingRun,
} from "../api/trainingSessions";
import { SelectedCard, type SelectedCardOption } from "../components/SelectedCard";
import {
  AttentionPanel,
  type AttentionVisualizationData,
} from "../components/TrainingVisualizations";
import { useTrainingRuntime } from "../training/useTrainingRuntime";

type ModelPredictionOutput = {
  predicted_label: string;
  top_confidences: Array<{
    class: string;
    confidence: number;
  }>;
  attention_visualization: AttentionVisualizationData;
};

const isAttentionVisualizationData = (
  value: unknown,
): value is AttentionVisualizationData => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.text === "string" &&
    Array.isArray(candidate.tokens) &&
    candidate.tokens.every((token) => typeof token === "string") &&
    Array.isArray(candidate.scores) &&
    candidate.scores.every((score) => typeof score === "number")
  );
};

const isModelPredictionOutput = (value: unknown): value is ModelPredictionOutput => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.predicted_label === "string" &&
    Array.isArray(candidate.top_confidences) &&
    candidate.top_confidences.every((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return false;
      }

      const confidence = item as Record<string, unknown>;
      return (
        typeof confidence.class === "string" &&
        typeof confidence.confidence === "number"
      );
    }) &&
    isAttentionVisualizationData(candidate.attention_visualization)
  );
};

export function Prediction() {
  const { jobsVersion, forgetJob } = useTrainingRuntime();
  const [trainedModels, setTrainedModels] = useState<TrainingRun[]>([]);
  const [selectedTrainingSessionId, setSelectedTrainingSessionId] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("I really loved this product, highly recommended!");
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<ModelPredictionOutput | null>(null);
  const [attentionData, setAttentionData] = useState<AttentionVisualizationData | null>(null);
  const availableModels = trainedModels.filter(
    (model) => model.status === "completed" && !!model.hyperParams,
  );
  const selectedTrainingRun =
    availableModels.find((model) => model.id === selectedTrainingSessionId) || null;
  const sessionOptions: SelectedCardOption[] = availableModels.map((model) => ({
    value: model.id,
    label: `${model.name} (${model.accuracy})`,
    deletable: true,
  }));

  useEffect(() => {
    let isActive = true;

    const loadTrainingSessions = async () => {
      setIsLoadingSessions(true);
      setSessionsError(null);

      try {
        const sessions = await getUserTrainingSessions();

        if (!isActive) {
          return;
        }

        setTrainedModels(sessions);
        const nextAvailableModels = sessions.filter(
          (model) => model.status === "completed" && !!model.hyperParams,
        );

        setSelectedTrainingSessionId((currentSelection) =>
          nextAvailableModels.some((model) => model.id === currentSelection)
            ? currentSelection
            : (nextAvailableModels[0]?.id ?? ""),
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSessionsError(
          error instanceof Error ? error.message : "Failed to load training sessions."
        );
      } finally {
        if (isActive) {
          setIsLoadingSessions(false);
        }
      }
    };

    void loadTrainingSessions();

    return () => {
      isActive = false;
    };
  }, [jobsVersion]);

  const handleTrainingSessionDelete = async (trainingSessionId: string) => {
    const userId = await getCurrentUserId();
    await deleteTrainingSession(userId, trainingSessionId);
  };

  const handleTrainingSessionDeleted = (trainingSessionId: string) => {
    forgetJob(trainingSessionId);
    const remainingModels = trainedModels.filter((model) => model.id !== trainingSessionId);
    const remainingAvailableModels = remainingModels.filter(
      (model) => model.status === "completed" && !!model.hyperParams,
    );

    setTrainedModels(remainingModels);
    setSelectedTrainingSessionId(
      selectedTrainingSessionId === trainingSessionId
        ? (remainingAvailableModels[0]?.id ?? "")
        : selectedTrainingSessionId,
    );

    if (selectedTrainingSessionId === trainingSessionId) {
      setPrediction(null);
      setAttentionData(null);
    }
  };

  const handlePredict = async () => {
    if (isPredicting) {
      return;
    }

    if (!selectedTrainingRun) {
      alert("Please select a training session.");
      return;
    }

    if (!selectedTrainingRun.hyperParams) {
      alert("This training session does not have saved hyperparameters.");
      return;
    }

    setIsPredicting(true);

    try {
      const userId = await getCurrentUserId();
      console.log("Params and payload: ", {
        userId,
        inputText,
        selectedTrainingRun,
      });

      const res = await predictWithTrainingSession(
        {
          userId,
          trainingSessionId: selectedTrainingRun.id,
        },
        inputText,
        selectedTrainingRun.hyperParams,
      );

      console.log("Response: ", res);

      if (!isModelPredictionOutput(res.data)) {
        throw new Error("Prediction response is missing required fields.");
      }

      setPrediction(res.data);
      setAttentionData(res.data.attention_visualization);
    } catch (error) {
      console.error("Failed to predict", error);
      alert(error instanceof Error ? error.message : "Prediction failed.");
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl mb-8">Prediction</h1>

      {/* Model Selector */}
      {isLoadingSessions ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
          <div className="py-3 text-sm text-gray-500">Loading training sessions...</div>
        </div>
      ) : (
        <div className="mb-6">
          <SelectedCard
            title="Model Selector"
            selectLabel="Select Model"
            options={sessionOptions}
            selectedValue={selectedTrainingSessionId}
            onSelectedValueChange={setSelectedTrainingSessionId}
            onDelete={handleTrainingSessionDelete}
            onOptionDeleted={handleTrainingSessionDeleted}
            placeholder="Choose a model"
            emptyMessage={
              sessionsError ??
              "No completed models are available yet. Finish a training run first."
            }
          />
        </div>
      )}

      {/* Input Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter text to classify..."
        />
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isPredicting ? "Predicting..." : "Predict"}
        </button>
      </div>

      {/* Results */}
      {prediction && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Prediction Result</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Prediction</div>
                <div className="text-2xl font-semibold text-blue-700">
                  {prediction.predicted_label}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Confidence</div>
                <div className="text-2xl font-semibold">
                  {((prediction.top_confidences[0]?.confidence ?? 0) * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Probability Distribution</div>
              <div className="space-y-3">
                {prediction.top_confidences.map((prob) => {
                  const percentage = prob.confidence * 100;
                  return (
                  <div key={prob.class}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{prob.class}</span>
                      <span className="font-medium">{percentage.toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Attention Highlight */}
          {attentionData && <AttentionPanel attention={attentionData} />}
        </div>
      )}
    </div>
  );
}
