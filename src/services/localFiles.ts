const localFiles = new Map<string, File>()

export const LocalFileService = {
  set(documentId: string, file: File) {
    localFiles.set(documentId, file)
  },
  get(documentId: string) {
    return localFiles.get(documentId)
  },
  has(documentId: string) {
    return localFiles.has(documentId)
  },
}
