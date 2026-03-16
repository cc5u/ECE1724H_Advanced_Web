import { useEffect, useMemo, useRef, useState } from "react";
import * as Progress from "@radix-ui/react-progress";
import { Upload } from "lucide-react";
import { SelectedCard, type SelectedCardOption } from "../components/SelectedCard";
import { PreprocessingCard } from "../components/PreprocessingCard";
import { ClassfierCard } from "../components/ClassfierCard";
import { ModelParamsCard } from "../components/ModelParamsCard";
import { TrainingResult } from "../components/TrainingResult";
import Papa from "papaparse";
import mlClient from "../api/mlClient";
import type { Dataset, TextHandlingMode } from "../type";

type PreviewRow = {
  text: string;
  label: string;
};

const PREVIEW_TEXT_LIMIT = 200;

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

export function Training() {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasResults] = useState(false);

  // Model Name
  const [modelName, setModelName] = useState("");
  
  // Model Dataset
  const [datasets, setDatasets] = useState<Dataset[]>(DEFAULT_DATASETS);
  const [selectedDatasetId, setSelectedDatasetId] = useState(DEFAULT_DATASETS[0].id);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  // Dataset Preprosessing
  const [lowercase, setLowercase] = useState(true);
  const [removePunctuation, setRemovePunctuation] = useState(true);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [lemmatization, setLemmatization] = useState(false);
  const [trainSplit, setTrainSplit] = useState([80]);
  const [stratifiedSplut, setStratifiedSplit] = useState(false);
  const [handleURLs, setHandleURLs] = useState<TextHandlingMode>("keep");
  const [handleEmails, setHandleEmails] = useState<TextHandlingMode>("keep");

  // Model Hyperparams
  const [model, setModel] = useState("distilbert");
  const [epochs, setEpochs] = useState(4);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [evaluationFrequency, setEvaluationFrequency] = useState("1");
  const [fineTune, setFineTune] = useState(true);
  const [classifierType, setClassifierType] = useState("GRU");
  const [hiddenNeurons, setHiddenNeurons] = useState(512);
  const [classifierDropout, setClassifierDropout] = useState([30]);

  // Training status
  const [isCanceling, setIsCanceling] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const datasetOptions = useMemo<SelectedCardOption[]>(
    () => datasets.map((dataset) => ({ value: dataset.id, label: dataset.label })),
    [datasets],
  );

  const selectedDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  );

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
          resolve(
            normalizePreviewRows(Array.isArray(results.data) ? results.data : []),
          );
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
      console.log(response);
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset preview (${response.status})`);
      }

      const csvText = await response.text();
      return parsePreview(csvText);
    }

    if (dataset.type === "uploaded" && dataset.file) {
      return parsePreview(dataset.file);
    }

    return [];
  };

  useEffect(() => {
    if (!selectedDataset) {
      setPreviewData([]);
      return;
    }

    if (selectedDataset.type === "upload") {
      setPreviewData([]);
      return;
    }

    let isActive = true;

    const loadSelectedDatasetPreview = async () => {
      try {
        const nextPreviewRows = await loadPreview(selectedDataset);
        if (isActive) {
          setPreviewData(nextPreviewRows);
        }
      } catch (error) {
        console.error("Failed to load dataset preview", error);
        if (isActive) {
          setPreviewData([]);
        }
      }
    };

    void loadSelectedDatasetPreview();

    return () => {
      isActive = false;
    };
  }, [selectedDataset]);

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
      alert("Please upload a CSV file");
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

  const startTraining = async () => {
    if (!selectedDataset || selectedDataset.type === "upload") {
      alert("Please select a dataset");
      return;
    }

    const res = await mlClient.post(
      "/train",
      {
        training_config: {
          learning_rate: 0.001,
          n_epochs: 1,
          batch_size: 16,
          eval_step: 1
        },
        data_config: {
          data_path: "data/IMDB.csv",
          lowercase: false,
          remove_punctuation: false,
          remove_stopwords: false,
          lemmatization: false,
          handle_urls: handleURLs,
          handle_emails: handleEmails,
          train_ratio: 0.8,
          test_ratio: 0.2,
          stratify: true
        },
        embed_model_config: {
          embed_model: "bert_model",
          fine_tune_mode: "freeze_all"
        },
        classifier_config: {
          model_name: "default",
          hidden_neurons: hiddenNeurons,
          dropout: classifierDropout[0] / 100,
          classifier_type: classifierType
        }
      },
      {
        params: {
          user_id: 0,
          training_session_id: 3,
        },
      }
    );

  console.log(res);

    // if (!dataset) {
    //   alert("Please select a dataset");
    //   return;
    // }

    // if (!modelName.trim()) {
    //   alert("Please enter a model name");
    //   return;
    // }

    // if (!Number.isFinite(epochs) || epochs <= 0) {
    //   alert("Epochs must be a number bigger than 0");
    //   return;
    // }

    // if (!Number.isFinite(batchSize) || batchSize <= 0) {
    //   alert("Batch size must be a number bigger than 0");
    //   return;
    // }
    
    setIsTraining(true);
    setProgress(0);

    // useEffect(() => {
    //   if (!sessionId) return

    //   const interval = setInterval(async () => {
    //     try {
    //       const res = await axios.get(`https://steering-stones-viewers-ordered.trycloudflare.com/model_api/get_train_status?user_id=0&training_session_id=0`)
    //       const data = res.data

    //       setStatus(data.status)
    //       setProgress(data.progress)

    //       if (data.status === "completed") {
    //         setResult(data.result)
    //         clearInterval(interval)
    //       }

    //       if (data.status === "failed") {
    //         clearInterval(interval)
    //       }

    //     } catch (err) {
    //       console.error(err)
    //       clearInterval(interval)
    //     }
    //   }, 2000) // poll every 2 seconds

    //   return () => clearInterval(interval)

    // }, [sessionId])
  };

  const cancelTraining = async () => {
    // if (status !== "running") return;
    setIsCanceling(true);
    const res = await mlClient.post(
      "/cancel_train",
      null,
      {
        params: {
          user_id: 0,
          training_session_id: 3,
        },
      }
    );
    setIsCanceling(false);
    console.log(res.data);
    setIsTraining(false);
  }

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
        
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SelectedCard
              title="Dataset"
              selectLabel="Select Dataset"
              options={datasetOptions}
              selectedValue={selectedDatasetId}
              onSelectedValueChange={handleDatasetSelection}
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

                  {(selectedDataset?.type === "upload" || selectedDataset?.type === "uploaded") && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4 hover:border-gray-400 cursor-pointer"
                    >
                      <Upload className="size-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm text-gray-600">Sample Preview</label>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Text</th>
                            <th className="px-3 py-2 text-left">Label</th>
                          </tr>
                        </thead>
                        <tbody>
                            {previewData && previewData.length > 0 ? (previewData.map((row, i) => (
                              <tr className="border-t border-gray-200" key={i}>
                                <td className="px-3 py-2 text-xs" title={row.text}>
                                  {formatPreviewText(row.text)}
                                </td>
                                <td className="px-3 py-2 text-xs">{row.label}</td>
                              </tr>
                            )))
                          :
                          (<>
                          <tr >
                            <td className="px-3 py-2 text-xs">This is an amazing sample text</td>
                            <td className="px-3 py-2 text-xs">Positive</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-3 py-2 text-xs">Worst sample text ever</td>
                            <td className="px-3 py-2 text-xs">Negative</td>
                          </tr>
                          </>)}
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
              stratifiedSplit={stratifiedSplut}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClassfierCard
              classifierType={classifierType}
              hiddenNeurons={hiddenNeurons}
              dropout={classifierDropout}
              onClassifierTypeChange={setClassifierType}
              onHiddenNeuronsChange={setHiddenNeurons}
              onDropoutChange={setClassifierDropout}
            />

            <ModelParamsCard
              model={model}
              epochs={epochs}
              batchSize={batchSize}
              learningRate={learningRate}
              evaluationFrequency={evaluationFrequency}
              fineTune={fineTune}
              onModelChange={setModel}
              onEpochsChange={setEpochs}
              onBatchSizeChange={setBatchSize}
              onLearningRateChange={setLearningRate}
              onEvaluationFrequencyChange={setEvaluationFrequency}
              onFineTuneSwitchChange={setFineTune}
            />
          </div>
        </div>

        {/* Training actions */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={startTraining}
              disabled={isTraining}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTraining ? "Training..." : "Start Training"}
            </button>

            {isTraining && (
              <button
                onClick={cancelTraining}
                disabled={isCanceling}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isCanceling ? "Canceling..." : "Cancel Training"}
              </button>
            )}
          </div>

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

      <TrainingResult hasResults={hasResults} />
    </div>
  );
}
