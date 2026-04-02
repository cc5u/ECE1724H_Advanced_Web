import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectItemText, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "./InfoTooltip";

const FINE_TUNE_MODE_OPTIONS: Array<{
  label: string;
  value: string;
}> = [
  { label: "Freeze All", value: "freeze_all" },
  { label: "Unfreeze Last N Layers", value: "unfreeze_last_n_layers" },
  { label: "Unfreeze All", value: "unfreeze_all" },
];
const BATCH_SIZE_OPTIONS = [8, 16, 32, 64, 128, 256];
const UNFREEZE_LAST_N_LAYER_OPTIONS = [1, 2, 3];

type ModelParamsCardProps = {
  model: string;
  epochs: string;
  batchSize: number;
  learningRate: string;
  evaluationFrequency: number;
  fineTune: string;
  unfreezeLastNLayers: number;
  onModelChange: (value: string) => void;
  onEpochsChange: (value: string) => void;
  onBatchSizeChange: (value: number) => void;
  onLearningRateChange: (value: string) => void;
  onEvaluationFrequencyChange: (value: number) => void;
  onFineTuneModeChange: (value: string) => void;
  onUnfreezeLastNLayersChange: (value: number) => void;
};

export function ModelParamsCard({
  model,
  epochs,
  batchSize,
  learningRate,
  evaluationFrequency,
  fineTune,
  unfreezeLastNLayers,
  onModelChange,
  onEpochsChange,
  onBatchSizeChange,
  onLearningRateChange,
  onEvaluationFrequencyChange,
  onFineTuneModeChange,
  onUnfreezeLastNLayersChange,
}: ModelParamsCardProps) {
  const parsedEpochs = Number(epochs);
  const isEpochsValid =
    epochs.trim() !== "" &&
    Number.isFinite(parsedEpochs) &&
    Number.isInteger(parsedEpochs) &&
    parsedEpochs > 0;
  const isBatchSizeValid = BATCH_SIZE_OPTIONS.includes(batchSize);
  const parsedLearningRate = Number(learningRate);
  const isLearningRateValid =
    learningRate.trim() !== "" &&
    Number.isFinite(parsedLearningRate) &&
    parsedLearningRate > 0 &&
    parsedLearningRate <= 0.01;

    return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold mb-4">Model Parameters</h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-3">
          <span className="inline-flex items-center gap-1">
            Model
            <InfoTooltip content="Select the embedding model architecture." />
          </span>
        </label>
        <RadioGroup value={model} onValueChange={onModelChange} className="space-y-2">
          <div className="flex items-center">
            <RadioGroupItem
              value="bert_model"
              id="bert_model"
            />
            <label htmlFor="bert_model" className="ml-2 text-sm">
              Bert Model
            </label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem
              value="distilbert_model"
              id="distilbert_model"
            />
            <label htmlFor="distilbert_model" className="ml-2 text-sm">
              DistilBERT Model
            </label>
          </div>
          <div className="flex items-center">
            <RadioGroupItem
              value="roberta_model"
              id="roberta_model"
            />
            <label htmlFor="roberta_model" className="ml-2 text-sm">
              RoBERTa
            </label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            <span className="inline-flex items-center gap-1">
              Epochs
              <InfoTooltip content="Number of full passes over the training dataset." />
            </span>
          </label>
          <Input
            type="text"
            inputMode="numeric"
            value={epochs}
            onChange={(event) => {
              const digitsOnly = event.target.value.replace(/[^\d]/g, "");
              const normalizedValue = digitsOnly.replace(/^0+(?=\d)/, "");
              onEpochsChange(normalizedValue);
            }}
            aria-invalid={!isEpochsValid}
            className="h-10"
          />
          {!isEpochsValid && (
            <p className="text-xs text-red-600 mt-1">
              Epochs must be a whole number greater than 0.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            <span className="inline-flex items-center gap-1">
              Batch size
              <InfoTooltip content="Number of samples processed per optimization step." />
            </span>
          </label>
          <Select
            value={batchSize.toString()}
            onValueChange={(value) => onBatchSizeChange(Number(value))}
          >
            <SelectTrigger
              aria-invalid={!isBatchSizeValid}
              className="h-10 w-full bg-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BATCH_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  <SelectItemText>{option}</SelectItemText>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isBatchSizeValid && (
            <p className="text-xs text-red-600 mt-1">
              Batch size must be one of: 8, 16, 32, 64, 128, 256.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            <span className="inline-flex items-center gap-1">
              Learning rate
              <InfoTooltip content="Step size used for gradient updates (0 < lr <= 0.01)." />
            </span>
          </label>
          <Input
            type="text"
            value={learningRate}
            onChange={(event) => onLearningRateChange(event.target.value)}
            aria-invalid={!isLearningRateValid}
            className="h-10"
          />
          {!isLearningRateValid && (
            <p className="text-xs text-red-600 mt-1">
              Learning rate must satisfy: 0 &lt; learning_rate &lt;= 0.01
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            <span className="inline-flex items-center gap-1">
              Evaluation frequency
              <InfoTooltip content="How often to run validation during training." />
            </span>
          </label>
          <Input
            type="text"
            min={1}
            value={evaluationFrequency}
            onChange={(event) => onEvaluationFrequencyChange(Number(event.target.value))}
            className="h-10"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm flex items-center gap-1">
            Fine Tune Mode
            <InfoTooltip content="Choose how many encoder layers are trainable." />
          </label>
          <Select
            value={fineTune}
            onValueChange={onFineTuneModeChange}
          >
            <SelectTrigger className="h-9 min-w-44 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINE_TUNE_MODE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <SelectItemText>{option.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {fineTune === "unfreeze_last_n_layers" && (
          <div className="flex items-center justify-between">
            <label className="text-sm flex items-center gap-1">
              Unfreeze Last N Layers
              <InfoTooltip content="Number of last encoder layers to unfreeze (1-3)." />
            </label>
            <Select
              value={unfreezeLastNLayers.toString()}
              onValueChange={(value) => onUnfreezeLastNLayersChange(Number(value))}
            >
              <SelectTrigger className="h-9 min-w-28 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNFREEZE_LAST_N_LAYER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    <SelectItemText>{option}</SelectItemText>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
