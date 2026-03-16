import { useState } from "react";
import * as Progress from "@radix-ui/react-progress";
import { Upload } from "lucide-react";
import { SelectedCard, type SelectedCardOption } from "../components/SelectedCard";
import { PreprocessingCard } from "../components/PreprocessingCard";
import { ModelParamsCard } from "../components/ModelParamsCard";
import { TrainingResult } from "../components/TrainingResult";
import type { TrainingVisualizationData } from "../components/TrainingVisualizations";
import { readStoredTrainingRuns } from "../utils/trainingRuns";

const TEST_DATASET_OPTIONS: SelectedCardOption[] = [
  { value: "imdb", label: "IMDB Sentiment" },
  { value: "sms", label: "SMS Spam" },
  { value: "agnews", label: "AG News" },
  { value: "csv", label: "Upload CSV" },
];

const DUMMY_VISUALIZATION_DATA: TrainingVisualizationData = {
  metrics: {
    accuracy_pct: 91.8,
    precision_pct: 89.3,
    recall_pct: 93.1,
    f1_score_pct: 91.2,
  },
  confusion_matrix: {
    labels: ["Negative", "Neutral", "Positive"],
    matrix: [
      [310, 35, 20],
      [28, 295, 22],
      [18, 24, 348],
    ],
    normalize: false,
  },
  learning_curves: {
    x: [1, 2, 3, 4],
    train_loss: [0.65, 0.42, 0.28, 0.18],
    val_loss: [0.58, 0.4, 0.31, 0.25],
    train_acc: [0.72, 0.83, 0.89, 0.93],
    val_acc: [0.75, 0.84, 0.89, 0.92],
  },
  attention_visualization: {
    text: "The movie was absolutely wonderful and touching.",
    tokens: ["The", "movie", "was", "absolutely", "wonderful", "and", "touching", "."],
    scores: [0.06, 0.08, 0.05, 0.15, 0.28, 0.07, 0.24, 0.07],
  },
  embedding_2d: {
    points: [
      { x: 52.1, y: 41.2, label: "Positive", text: "Loved this film." },
      { x: 57.4, y: 49.8, label: "Positive", text: "Great acting and story." },
      { x: 61.3, y: 36.7, label: "Positive", text: "Amazing plot twists." },
      { x: 45.8, y: 28.4, label: "Negative", text: "Boring and too long." },
      { x: 38.6, y: 22.9, label: "Negative", text: "Not worth watching." },
      { x: 31.9, y: 34.1, label: "Negative", text: "Poor script and pacing." },
    ],
    legend: ["Positive", "Negative"],
  },
};

export function Training() {
  const [dataset, setDataset] = useState("");
  const [lowercase, setLowercase] = useState(true);
  const [removePunctuation, setRemovePunctuation] = useState(true);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [lemmatization, setLemmatization] = useState(false);
  const [trainSplit, setTrainSplit] = useState([80]);
  const [model, setModel] = useState("distilbert");
  const [modelName, setModelName] = useState("");
  const [epochs, setEpochs] = useState(4);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [fineTune, setFineTune] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasResults, setHasResults] = useState(false);
  const [visualizationData, setVisualizationData] = useState<TrainingVisualizationData | null>(null);

  const startTraining = async () => {
    // const response = await fetch("/api/train", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     dataset,
    //     model,
    //     epochs,
    //     batchSize,
    //     learningRate,
    //     fineTune,
    //     trainSplit: trainSplit[0],
    //     lowercase,
    //     removePunctuation,
    //     removeStopwords,
    //     lemmatization,
    //   }),
    // });

    if (!dataset) {
      alert("Please select a dataset");
      return;
    }

    if (!modelName.trim()) {
      alert("Please enter a model name");
      return;
    }

    if (!Number.isFinite(epochs) || epochs <= 0) {
      alert("Epochs must be a number bigger than 0");
      return;
    }

    if (!Number.isFinite(batchSize) || batchSize <= 0) {
      alert("Batch size must be a number bigger than 0");
      return;
    }
    
    setIsTraining(true);
    setProgress(0);
    setHasResults(false);
    setVisualizationData(null);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          setHasResults(true);
          setVisualizationData(DUMMY_VISUALIZATION_DATA);
          
          // Save trained model to localStorage
          const trainedModel = {
            name: modelName,
            model: model,
            dataset: dataset,
            accuracy: "91.8%",
            date: new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "short", 
              day: "numeric" 
            }),
            config: {
              epochs,
              batchSize,
              learningRate,
              fineTune,
              trainSplit: trainSplit[0],
              lowercase,
              removePunctuation,
              removeStopwords,
              lemmatization,
            },
            visualizationData: DUMMY_VISUALIZATION_DATA,
          };
          
          const existingModels = readStoredTrainingRuns();
          existingModels.unshift(trainedModel);
          localStorage.setItem("trainedModels", JSON.stringify(existingModels));
          
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Configuration Section - 40% */}
      <div className="mb-8">
        <h1 className="text-3xl mb-6">Training</h1>
        
        {/* Model Name Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., IMDB-DistilBERT-v1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Give your model a unique name for easy identification</p>
        </div>
        
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Card 1: Dataset */}
          <SelectedCard
            title="Dataset"
            selectLabel="Select Dataset"
            options={TEST_DATASET_OPTIONS}
            selectedValue={dataset}
            onSelectedValueChange={setDataset}
            placeholder="Choose a dataset"
          >
            {({ selectedValue }) => (
              <>
                {selectedValue === "csv" && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-gray-400 cursor-pointer">
                    <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Sample Preview</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Text</th>
                          <th className="px-3 py-2 text-left">Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-200">
                          <td className="px-3 py-2 text-xs">This movie was amazing</td>
                          <td className="px-3 py-2 text-xs">Positive</td>
                        </tr>
                        <tr className="border-t border-gray-200">
                          <td className="px-3 py-2 text-xs">Worst acting ever</td>
                          <td className="px-3 py-2 text-xs">Negative</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </SelectedCard>

          {/* Card 2: Preprocessing */}
          <PreprocessingCard
            lowercase={lowercase}
            removePunctuation={removePunctuation}
            removeStopwords={removeStopwords}
            lemmatization={lemmatization}
            trainSplit={trainSplit}
            onLowercaseSwitchChange={setLowercase}
            onPunctuationSwitchChange={setRemovePunctuation}
            onStopwordsSwitchChange={setRemoveStopwords}
            onLemmatizationSwitchChange={setLemmatization}
            onTrainSplitChange={setTrainSplit}
          />

          {/* Card 3: Model & Hyperparameters */}
          <ModelParamsCard
            model={model}
            epochs={epochs}
            batchSize={batchSize}
            learningRate={learningRate}
            fineTune={fineTune}
            onModelChange={setModel}
            onEpochsChange={setEpochs}
            onBatchSizeChange={setBatchSize}
            onLearningRateChange={setLearningRate}
            onFineTuneSwitchChange={setFineTune}
          />
        </div>

        {/* Train Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={startTraining}
            disabled={isTraining}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isTraining ? "Training..." : "Start Training"}
          </button>

          {isTraining && (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Training Progress</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full h-2">
                  <Progress.Indicator
                    className="bg-blue-600 h-full transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${100 - progress}%)` }}
                  />
                </Progress.Root>
              </div>
            </div>
          )}
        </div>
      </div>

      <TrainingResult hasResults={hasResults} visualizationData={visualizationData} />
    </div>
  );
}
