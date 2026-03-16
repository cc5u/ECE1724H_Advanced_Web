import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import { readStoredTrainingRuns, type TrainingRun } from "../utils/trainingRuns";
import { TrainingVisualizations } from "../components/TrainingVisualizations";

const trainingData = [
  { id: 1, text: "I loved this movie", label: "Positive" },
  { id: 2, text: "Terrible acting", label: "Negative" },
  { id: 3, text: "Not bad at all", label: "Positive" },
  { id: 4, text: "Waste of time", label: "Negative" },
  { id: 5, text: "Amazing cinematography", label: "Positive" },
  { id: 6, text: "Poor script", label: "Negative" },
  { id: 7, text: "Great soundtrack", label: "Positive" },
  { id: 8, text: "Boring plot", label: "Negative" },
  { id: 9, text: "Highly recommend", label: "Positive" },
  { id: 10, text: "Disappointing ending", label: "Negative" },
];

export function Archives() {
  const [trainingRuns] = useState<TrainingRun[]>(readStoredTrainingRuns);
  const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(
    () => readStoredTrainingRuns()[0] ?? null
  );
  const getModelDisplayName = (modelCode: string) => {
    const names: Record<string, string> = {
      distilbert: "DistilBERT",
      roberta: "RoBERTa",
      bilstm: "BiLSTM + GloVe",
    };
    return names[modelCode] || modelCode;
  };

  const getDatasetDisplayName = (datasetCode: string) => {
    const names: Record<string, string> = {
      imdb: "IMDB Sentiment",
      sms: "SMS Spam",
      agnews: "AG News",
      csv: "Custom CSV",
    };
    return names[datasetCode] || datasetCode;
  };

  if (trainingRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Training History</h2>
          <p className="text-gray-600">Train a model to see it appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Training History */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="font-semibold text-lg mb-4">Training History</h2>
          <div className="space-y-2">
            {trainingRuns.map((run, index) => (
              <button
                key={index}
                onClick={() => setSelectedRun(run)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedRun?.name === run.name
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium mb-1">{run.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                  <Calendar className="size-3" />
                  {run.date}
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Accuracy: </span>
                  <span className="font-medium text-green-600">{run.accuracy}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel - Run Detail View */}
      {selectedRun && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl mb-8">Run Details</h1>

            <div className="space-y-6">
              {/* Section 1: Dataset Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Dataset Summary</h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Dataset</div>
                    <div className="font-medium">{getDatasetDisplayName(selectedRun.dataset)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Samples</div>
                    <div className="font-medium">10,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Split</div>
                    <div className="font-medium">{selectedRun.config.trainSplit}/{100 - selectedRun.config.trainSplit}</div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Preprocessing Pipeline</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lowercase</span>
                      <span className={`text-sm font-medium ${selectedRun.config.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedRun.config.lowercase ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remove Punctuation</span>
                      <span className={`text-sm font-medium ${selectedRun.config.removePunctuation ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedRun.config.removePunctuation ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remove Stopwords</span>
                      <span className={`text-sm font-medium ${selectedRun.config.removeStopwords ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedRun.config.removeStopwords ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lemmatization</span>
                      <span className={`text-sm font-medium ${selectedRun.config.lemmatization ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedRun.config.lemmatization ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: First 10 Training Data */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Training Data (First 10 Samples)</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-16">#</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Text</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">Label</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {trainingData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{item.id}</td>
                            <td className="px-4 py-3 text-sm">{item.text}</td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  item.label === "Positive"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Section 3: Hyperparameter Configuration */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Hyperparameter Configuration</h3>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Model</span>
                    <span className="font-medium">{getModelDisplayName(selectedRun.model)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Epochs</span>
                    <span className="font-medium">{selectedRun.config.epochs}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Batch Size</span>
                    <span className="font-medium">{selectedRun.config.batchSize}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Learning Rate</span>
                    <span className="font-medium">{selectedRun.config.learningRate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Fine-tuned</span>
                    <span className="font-medium">{selectedRun.config.fineTune ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Optimizer</span>
                    <span className="font-medium">AdamW</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Visualizations */}
              <TrainingVisualizations data={selectedRun.visualizationData} />

              {/* Section 5: Download */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Export Model</h3>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <Download className="size-5" />
                  Download Model (.zip)
                </button>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div>Model size: 256MB</div>
                  <div>Created: Feb 27, 2026</div>
                  <div>Framework: PyTorch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
