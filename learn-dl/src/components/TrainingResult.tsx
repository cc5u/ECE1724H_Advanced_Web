import { TrainingVisualizations, type TrainingVisualizationData } from "./TrainingVisualizations";

type TrainingResultProps = {
  hasResults: boolean;
  visualizationData: TrainingVisualizationData | null;
};

export function TrainingResult({ hasResults, visualizationData }: TrainingResultProps) {
  if (!hasResults) return null;
  return <TrainingVisualizations data={visualizationData} />;
}
