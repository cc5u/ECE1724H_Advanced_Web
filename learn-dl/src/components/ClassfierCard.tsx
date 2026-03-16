import * as Slider from "@radix-ui/react-slider";

const CLASSIFIER_OPTIONS: Array<{
    label: string;
    value: string;
}> = [
    { label: "GRU", value: "GRU" },
    { label: "Linear", value: "LINEAR" },
];

type ClassifierCardProps = {
    classifierType: string;
    hiddenNeurons: number;
    dropout: number[];
    onClassifierTypeChange: (value: string) => void;
    onHiddenNeuronsChange: (value: number) => void;
    onDropoutChange: (value: number[]) => void;
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
                    <label className="text-sm">Classifier Type</label>
                    <select
                        value={classifierType}
                        onChange={(event) => onClassifierTypeChange(event.target.value)}
                        className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {CLASSIFIER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-gray-600 mb-1">Hidden Neurons</label>
                    <input
                        type="number"
                        value={hiddenNeurons}
                        onChange={(event) => onHiddenNeuronsChange(Number(event.target.value))}
                        className={"w-full px-3 py-2 border rounded-lg text-sm border-gray-300"}
                    />
                </div>
                    
                <div>
                    <label className="text-sm text-gray-600 mb-3 block">
                    Dropout: {(dropout[0] / 100).toFixed(2)}
                    </label>
                    <Slider.Root
                    value={dropout}
                    onValueChange={onDropoutChange}
                    min={0}
                    max={100}
                    step={1}
                    className="relative flex items-center w-full h-5"
                    >
                    <Slider.Track className="relative grow h-1 bg-gray-200 rounded-full">
                        <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
                    </Slider.Track>
                    <Slider.Thumb className="block size-4 bg-blue-600 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </Slider.Root>
                </div>
            </div>
        </div>
    );
}
