export abstract class YamlEntityService<T> {
  private rawFiles: Record<string, string> = {}
  protected fileIndex: Record<string, string> = {}
  private cache = new Map<string, T>()

  protected constructor(initialFiles: Record<string, string>) {
    this.updateFiles(initialFiles)
  }

  protected abstract extractId(relativePath: string): string | null
  protected abstract parseEntity(id: string, raw: string): T | null

  protected getIds(): string[] {
    return Object.keys(this.fileIndex)
  }

  protected async fetchEntity(id: string): Promise<T | null> {
    this.loadIntoCache(id)
    return this.cache.get(id) ?? null
  }

  protected async fetchAllEntities(): Promise<Record<string, T>> {
    const result: Record<string, T> = {}
    for (const id of this.getIds()) {
      const entity = await this.fetchEntity(id)
      if (entity) {
        result[id] = entity
      }
    }
    return result
  }

  public setFileMocks(files: Record<string, string>) {
    this.updateFiles(files)
  }

  private updateFiles(files: Record<string, string>) {
    this.rawFiles = this.normalizeFileMap(files)
    this.cache.clear()
    this.rebuildIndex()
  }

  private normalizeFileMap(files: Record<string, string>) {
    const normalized: Record<string, string> = {}
    Object.entries(files).forEach(([path, contents]) => {
      normalized[path.replaceAll('\\', '/')] = contents
    })
    return normalized
  }

  private rebuildIndex() {
    this.fileIndex = {}
    Object.keys(this.rawFiles).forEach(path => {
      const relativePath = path.replace('../public', '')
      const id = this.extractId(relativePath)
      if (id) {
        this.fileIndex[id] = path
      }
    })
  }

  private loadIntoCache(id: string) {
    if (this.cache.has(id)) {
      return
    }
    const path = this.fileIndex[id]
    if (!path) {
      return
    }
    const rawYaml = this.rawFiles[path]
    if (!rawYaml) {
      return
    }
    const entity = this.parseEntity(id, rawYaml)
    if (entity) {
      this.cache.set(id, entity)
    }
  }
}
