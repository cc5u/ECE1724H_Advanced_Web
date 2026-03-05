import * as Switch from "@radix-ui/react-switch";
import * as Slider from "@radix-ui/react-slider";

type PreprocessingCardProps = {
    lowercase: boolean;
    removePunctuation: boolean;
    removeStopwords: boolean;
    lemmatization: boolean;
    trainSplit: number[];
    onLowercaseSwitchChange: (value: boolean) => void;
    onPunctuationSwitchChange: (value: boolean) => void;
    onStopwordsSwitchChange: (value: boolean) => void;
    onLemmatizationSwitchChange: (value: boolean) => void;
    onTrainSplitChange: (value: number[]) => void;
}

export function PreprocessingCard({
    lowercase,
    removePunctuation,
    removeStopwords,
    lemmatization,
    trainSplit,
    onLowercaseSwitchChange,
    onPunctuationSwitchChange,
    onStopwordsSwitchChange,
    onLemmatizationSwitchChange,
    onTrainSplitChange,
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