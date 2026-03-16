import type { TrainingVisualizationData } from "../components/TrainingVisualizations"

export interface TrainingRunConfig {
  epochs: number
  batchSize: number
  learningRate: string
  fineTune: boolean
  trainSplit: number
  lowercase: boolean
  removePunctuation: boolean
  removeStopwords: boolean
  lemmatization: boolean
}

export interface TrainingRun {
  name: string
  model: string
  dataset: string
  accuracy: string
  date: string
  config: TrainingRunConfig
  visualizationData?: TrainingVisualizationData
}

export const readStoredTrainingRuns = (): TrainingRun[] => {
  if (typeof window === "undefined") {
    return []
  }

  const rawTrainingRuns = window.localStorage.getItem("trainedModels")

  if (!rawTrainingRuns) {
    return []
  }

  try {
    const parsedTrainingRuns = JSON.parse(rawTrainingRuns)

    return Array.isArray(parsedTrainingRuns) ? parsedTrainingRuns as TrainingRun[] : []
  } catch {
    return []
  }
}
