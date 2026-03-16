import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { readStoredTrainingRuns, type TrainingRun } from "../utils/trainingRuns";
import mlClient from "../api/mlClient";

export function Prediction() {
  const [trainedModels] = useState<TrainingRun[]>(readStoredTrainingRuns);
  const [selectedModel, setSelectedModel] = useState(
    () => readStoredTrainingRuns()[0]?.name ?? ""
  );
  const [inputText, setInputText] = useState("I really loved this product, highly recommended!");
  const [prediction] = useState<{
    label: string;
    confidence: number;
    probabilities: { label: string; value: number }[];
  } | null>(null);

  const handlePredict = async () => {
    // Mock prediction
    // const isPositive = inputText.toLowerCase().includes("love") || 
    //                    inputText.toLowerCase().includes("great") || 
    //                    inputText.toLowerCase().includes("recommend");
    
    // setPrediction({
    //   label: isPositive ? "Positive" : "Negative",
    //   confidence: isPositive ? 0.94 : 0.88,
    //   probabilities: isPositive 
    //     ? [{ label: "Positive", value: 94 }, { label: "Negative", value: 6 }]
    //     : [{ label: "Positive", value: 12 }, { label: "Negative", value: 88 }],
    // });

    const res = await mlClient.post(
      "/model_output",
      {
        "user_input": inputText,
        "config": {
          "classifier_config": {
            "model_name": "default",
            "hidden_neurons": 512,
            "dropout": 0.3,
            "num_classes": 2,
            "classifier_type": "GRU"
          },
          "embed_model_config": {
            "embed_model": "bert_model",
            "fine_tune_mode": "freeze_all",
            "unfreeze_last_n_layers": null
          },
          "training_config": {
            "learning_rate": 0.001,
            "n_epochs": 1,
            "batch_size": 256,
            "eval_step": 1
          }
        }
      },
      {
        params: {
          user_id: "test",
          training_session_id: "test",
        },
      }
    );
    console.log(res);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl mb-8">Prediction</h1>

      {/* Model Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Model</label>
        {trainedModels.length > 0 ? (
          <Select.Root value={selectedModel} onValueChange={setSelectedModel}>
            <Select.Trigger className="w-full px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white hover:border-gray-400">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="size-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Select.Viewport className="p-1">
                  {trainedModels.map((model) => (
                    <Select.Item 
                      key={model.name} 
                      value={model.name} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer rounded outline-none"
                    >
                      <Select.ItemText>{model.name} ({model.accuracy})</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : (
          <div className="text-sm text-gray-500 py-3">
            No trained models available. Please train a model first.
          </div>
        )}
      </div>

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
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Predict
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
                <div className={`text-2xl font-semibold ${prediction.label === "Positive" ? "text-green-600" : "text-red-600"}`}>
                  {prediction.label}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Confidence</div>
                <div className="text-2xl font-semibold">{prediction.confidence.toFixed(2)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-3">Probability Distribution</div>
              <div className="space-y-3">
                {prediction.probabilities.map((prob) => (
                  <div key={prob.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{prob.label}</span>
                      <span className="font-medium">{prob.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${prob.label === "Positive" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${prob.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attention Highlight */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Attention Highlight</h3>
            {/* <AttentionView /> */}
          </div>
        </div>
      )}
    </div>
  );
}
