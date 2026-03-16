import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";
import type { TextHandlingMode } from "../type";

const TEXT_HANDLING_OPTIONS: Array<{
    label: string;
    value: TextHandlingMode;
}> = [
    { label: "Keep", value: "keep" },
    { label: "Remove", value: "remove" },
    { label: "Replace", value: "replace" },
];

type PreprocessingCardProps = {
    lowercase: boolean;
    removePunctuation: boolean;
    removeStopwords: boolean;
    lemmatization: boolean;
    trainSplit: number[];
    stratifiedSplit: boolean;
    handleURLs: TextHandlingMode;
    handleEmails: TextHandlingMode;
    onLowercaseSwitchChange: (value: boolean) => void;
    onPunctuationSwitchChange: (value: boolean) => void;
    onStopwordsSwitchChange: (value: boolean) => void;
    onLemmatizationSwitchChange: (value: boolean) => void;
    onTrainSplitChange: (value: number[]) => void;
    onStratifiedSplitChange: (value: boolean) => void;
    onHandleURLsChange: (value: TextHandlingMode) => void;
    onHandleEmailsChange: (value: TextHandlingMode) => void;
}

export function PreprocessingCard({
    lowercase,
    removePunctuation,
    removeStopwords,
    lemmatization,
    trainSplit,
    stratifiedSplit,
    handleURLs,
    handleEmails,
    onLowercaseSwitchChange,
    onPunctuationSwitchChange,
    onStopwordsSwitchChange,
    onLemmatizationSwitchChange,
    onTrainSplitChange,
    onStratifiedSplitChange,
    onHandleURLsChange,
    onHandleEmailsChange,
}: PreprocessingCardProps){
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="font-semibold mb-4">Preprocessing</h3>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Lowercase</label>
                        <Switch.Root
                          checked={lowercase}
                          onCheckedChange={onLowercaseSwitchChange}
                          className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                        >
                          <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Remove punctuation</label>
                        <Switch.Root
                          checked={removePunctuation}
                          onCheckedChange={onPunctuationSwitchChange}
                          className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                        >
                          <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Remove stopwords</label>
                        <Switch.Root
                          checked={removeStopwords}
                          onCheckedChange={onStopwordsSwitchChange}
                          className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                        >
                          <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm">Lemmatization</label>
                        <Switch.Root
                          checked={lemmatization}
                          onCheckedChange={onLemmatizationSwitchChange}
                          className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                        >
                          <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm">Stratified split</label>
                        <Switch.Root
                          checked={stratifiedSplit}
                          onCheckedChange={onStratifiedSplitChange}
                          className="w-11 h-6 bg-gray-200 rounded-full data-[state=checked]:bg-blue-600 relative transition-colors"
                        >
                          <Switch.Thumb className="block size-5 bg-white rounded-full shadow-sm transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
                        </Switch.Root>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm">Handle emails</label>
                        <select
                          value={handleEmails}
                          onChange={(event) => onHandleEmailsChange(event.target.value as TextHandlingMode)}
                          className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TEXT_HANDLING_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm">Handle URLs</label>
                        <select
                          value={handleURLs}
                          onChange={(event) => onHandleURLsChange(event.target.value as TextHandlingMode)}
                          className="min-w-28 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TEXT_HANDLING_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
        
                    <div>
                      <label className="text-sm text-gray-600 mb-3 block">
                        Train/Val Split: {trainSplit[0]}/{100 - trainSplit[0]}
                      </label>
                      <Slider.Root
                        value={trainSplit}
                        onValueChange={onTrainSplitChange}
                        min={50}
                        max={95}
                        step={5}
                        className="relative flex items-center w-full h-5"
                      >
                        <Slider.Track className="relative grow h-1 bg-gray-200 rounded-full">
                          <Slider.Range className="absolute h-full bg-blue-600 rounded-full" />
                        </Slider.Track>
                        <Slider.Thumb className="block size-4 bg-blue-600 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </Slider.Root>
                    </div>
                  </div>
    );
}
