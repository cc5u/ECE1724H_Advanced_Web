export type Dataset = {
  id: string
  label: string
  type: "default" | "uploaded" | "upload"
  url?: string
  file?: File
}

export type TextHandlingMode = "keep" | "remove" | "replace"
