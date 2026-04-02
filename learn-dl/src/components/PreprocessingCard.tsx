import type { TextHandlingMode } from "../types/app";
import { InfoTooltip } from "./InfoTooltip";
import { Select, SelectContent, SelectItem, SelectItemText, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

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
    trainSplit: number;
    stratifiedSplit: boolean;
    handleURLs: TextHandlingMode;
    handleEmails: TextHandlingMode;
    onLowercaseSwitchChange: (value: boolean) => void;
    onPunctuationSwitchChange: (value: boolean) => void;
    onStopwordsSwitchChange: (value: boolean) => void;
    onLemmatizationSwitchChange: (value: boolean) => void;
    onTrainSplitChange: (value: number) => void;
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
                        <label className="text-sm flex items-center gap-1">
                          Lowercase
                          <InfoTooltip content="Convert text to lowercase before tokenization." />
                        </label>
                        <Switch
                          checked={lowercase}
                          onCheckedChange={onLowercaseSwitchChange}
                        />
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Remove punctuation
                          <InfoTooltip content="Remove punctuation characters from text." />
                        </label>
                        <Switch
                          checked={removePunctuation}
                          onCheckedChange={onPunctuationSwitchChange}
                        />
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Remove stopwords
                          <InfoTooltip content='Remove common words like "the", "is", and "and".' />
                        </label>
                        <Switch
                          checked={removeStopwords}
                          onCheckedChange={onStopwordsSwitchChange}
                        />
                      </div>
        
                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Lemmatization
                          <InfoTooltip content='Reduce words to their base form (e.g. "running" to "run").' />
                        </label>
                        <Switch
                          checked={lemmatization}
                          onCheckedChange={onLemmatizationSwitchChange}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Stratified split
                          <InfoTooltip content="Keep label proportions consistent between train and validation splits." />
                        </label>
                        <Switch
                          checked={stratifiedSplit}
                          onCheckedChange={onStratifiedSplitChange}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Handle emails
                          <InfoTooltip content="Choose to keep, remove, or replace email addresses." />
                        </label>
                        <Select
                          value={handleEmails}
                          onValueChange={(value) => onHandleEmailsChange(value as TextHandlingMode)}
                        >
                          <SelectTrigger className="h-9 min-w-28 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_HANDLING_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <SelectItemText>{option.label}</SelectItemText>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-1">
                          Handle URLs
                          <InfoTooltip content="Choose to keep, remove, or replace URLs." />
                        </label>
                        <Select
                          value={handleURLs}
                          onValueChange={(value) => onHandleURLsChange(value as TextHandlingMode)}
                        >
                          <SelectTrigger className="h-9 min-w-28 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEXT_HANDLING_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <SelectItemText>{option.label}</SelectItemText>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
        
                    <div>
                      <label className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        Train/Val Split: {trainSplit}/{100 - trainSplit}
                        <InfoTooltip content="Controls how much data goes to train vs validation." />
                      </label>
                      <Slider
                        value={[trainSplit]}
                        onValueChange={(value) => onTrainSplitChange(value[0] ?? trainSplit)}
                        min={50}
                        max={95}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
    );
}
