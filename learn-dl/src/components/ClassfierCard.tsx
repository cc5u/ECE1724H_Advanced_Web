import { InfoTooltip } from "./InfoTooltip";
import { Select, SelectContent, SelectItem, SelectItemText, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const CLASSIFIER_OPTIONS: Array<{
    label: string;
    value: string;
}> = [
    { label: "GRU", value: "GRU" },
    { label: "Linear", value: "LINEAR" },
];

const HIDDEN_NEURONS_OPTIONS = [64, 128, 256, 512].map((value) => ({ label: value.toString(), value }));

type ClassifierCardProps = {
    classifierType: string;
    hiddenNeurons: number;
    dropout: number;
    onClassifierTypeChange: (value: string) => void;
    onHiddenNeuronsChange: (value: number) => void;
    onDropoutChange: (value: number) => void;
}

export function ClassfierCard({
    classifierType,
    hiddenNeurons,
    dropout,
    onClassifierTypeChange,
    onHiddenNeuronsChange,
    onDropoutChange,
}: ClassifierCardProps){
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Classifier Configuration</h3>
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-1">
                        Classifier Type
                        <InfoTooltip content="Choose model head type (e.g., GRU or Linear)." />
                    </label>
                    <Select
                        value={classifierType}
                        onValueChange={onClassifierTypeChange}
                    >
                        <SelectTrigger className="h-9 min-w-28 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CLASSIFIER_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    <SelectItemText>{option.label}</SelectItemText>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>


                <div className="flex items-center justify-between">
                    <label className="text-sm flex items-center gap-1">
                        Hidden Neurons
                        <InfoTooltip content="Number of hidden units in the classifier layer." />
                    </label>
                    <Select
                        value={hiddenNeurons.toString()}
                        onValueChange={(value) => onHiddenNeuronsChange(Number(value))}
                    >
                        <SelectTrigger className="h-9 min-w-28 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {HIDDEN_NEURONS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                    <SelectItemText>{option.label}</SelectItemText>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                    
                <div>
                    <label className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    Dropout: {dropout.toFixed(2)}
                    <InfoTooltip content="Regularization rate to reduce overfitting." />
                    </label>
                    <Slider
                      value={[dropout * 100]}
                      onValueChange={(value) => onDropoutChange((value[0] ?? dropout * 100) / 100)}
                      min={10}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}
