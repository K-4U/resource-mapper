import {logger} from "../cli/utils/logger.js";

export abstract class YamlEntityService<T> {
    // Use a Map for rawFiles for faster lookups and predictable iteration order
    private rawFiles: Map<string, string> = new Map()
    protected fileIndex: Record<string, string> = {}
    private readonly cache = new Map<string, T>()

    protected constructor(initialFiles: Record<string, string>) {
        this.updateFiles(initialFiles)
    }

    protected abstract extractId(relativePath: string): string | null

    protected abstract parseEntity(id: string, raw: string): T | null

    protected getIds(): string[] {
        const ids = Object.keys(this.fileIndex)
        logger.debug('[YamlEntityService] getIds ->', ids.length, 'ids for', this.constructor.name)
        return ids
    }

    protected async fetchEntity(id: string): Promise<T | null> {
        logger.debug('[YamlEntityService] fetchEntity request', {service: this.constructor.name, id})
        this.loadIntoCache(id)
        const entity = this.cache.get(id) ?? null
        if (entity) {
            logger.debug('[YamlEntityService] fetchEntity hit', {service: this.constructor.name, id})
        } else {
            logger.warn('[YamlEntityService] fetchEntity miss', {service: this.constructor.name, id})
        }
        return entity
    }

    protected async fetchAllEntities(): Promise<Record<string, T>> {
        logger.debug('[YamlEntityService] fetchAllEntities start', this.constructor.name)
        const result: Record<string, T> = {}
        for (const id of this.getIds()) {
            const entity = await this.fetchEntity(id)
            if (entity) {
                result[id] = entity
            }
        }
        logger.debug('[YamlEntityService] fetchAllEntities done', {
            service: this.constructor.name,
            count: Object.keys(result).length
        })
        return result
    }

    public setFileMocks(files: Record<string, string>) {
        this.updateFiles(files)
    }

    private updateFiles(files: Record<string, string>) {
        logger.debug('[YamlEntityService] updateFiles', this.constructor.name, 'files:', Object.keys(files).length)
        this.rawFiles = this.normalizeFileMap(files)
        this.cache.clear()
        this.rebuildIndex()
    }

    // Normalize path separators to forward slashes for cross-platform consistency
    private normalizeFileMap(files: Record<string, string>): Map<string, string> {
        const map = new Map<string, string>()
        Object.entries(files).forEach(([p, contents]) => {
            const normalized = p.replaceAll('\\', '/')
            map.set(normalized, contents)
        })
        return map
    }

    private rebuildIndex() {
        this.fileIndex = {}
        // The keys in rawFiles are assumed to be relative to the data root already
        for (const path of this.rawFiles.keys()) {
            const relativePath = path
            const id = this.extractId(relativePath)
            if (id) {
                this.fileIndex[id] = path
            } else {
                logger.warn('[YamlEntityService] extractId returned null', {path, service: this.constructor.name})
            }
        }
        logger.debug('[YamlEntityService] rebuildIndex complete', {
            service: this.constructor.name,
            indexed: Object.keys(this.fileIndex).length
        })
    }

    private loadIntoCache(id: string) {
        if (this.cache.has(id)) {
            logger.debug('[YamlEntityService] cache hit', {service: this.constructor.name, id})
            return
        }
        const path = this.fileIndex[id]
        if (!path) {
            logger.warn('[YamlEntityService] no path for id', {service: this.constructor.name, id})
            return
        }
        const rawYaml = this.rawFiles.get(path)
        if (!rawYaml) {
            logger.warn('[YamlEntityService] empty raw yaml', {service: this.constructor.name, path})
            return
        }
        const entity = this.parseEntity(id, rawYaml)
        if (entity) {
            this.cache.set(id, entity)
            logger.debug('[YamlEntityService] cached entity', {service: this.constructor.name, id})
        } else {
            logger.warn('[YamlEntityService] parseEntity returned null', {service: this.constructor.name, id})
        }
    }
}
