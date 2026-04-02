export type Dataset = {
  id: string
  label: string
  type: "default" | "uploaded" | "upload" | "saved"
  file?: File
  datasetId?: string
  csvName?: string
  isDefault?: boolean
  previewRows?: Record<string, unknown>[]
}

export type TextHandlingMode = "keep" | "remove" | "replace"
