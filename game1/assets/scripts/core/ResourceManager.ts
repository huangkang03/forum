import { resources, JsonAsset, SpriteFrame, Asset, Texture2D, AudioClip } from 'cc';

/**
 * 资源管理器 — 负责资源的异步加载与缓存
 * 所有资源放在 assets/resources/ 下，通过路径字符串加载
 */

type ResPath = string;

class ResourceManagerCls {
  private _cache: Map<ResPath, Asset> = new Map();
  private _loading: Map<ResPath, Promise<Asset>> = new Map();

  /** 加载 JSON 剧情文件 */
  async loadJson<T = any>(path: string): Promise<T> {
    const fullPath = `stories/${path}`;
    const asset = await this.load<JsonAsset>(fullPath, JsonAsset);
    return asset.json as T;
  }

  /** 加载精灵图（角色立绘、背景等） */
  async loadSprite(path: string): Promise<SpriteFrame> {
    const fullPath = `textures/${path}`;
    return this.load<SpriteFrame>(fullPath, SpriteFrame);
  }

  /** 加载音频 */
  async loadAudio(path: string): Promise<AudioClip> {
    const fullPath = `audio/${path}`;
    return this.load<AudioClip>(fullPath, AudioClip);
  }

  /** 通用加载方法，带缓存和重复请求合并 */
  private load<T extends Asset>(path: string, type: typeof Asset): Promise<T> {
    // 命中缓存
    const cached = this._cache.get(path);
    if (cached) return Promise.resolve(cached as T);

    // 合并重复请求
    const loading = this._loading.get(path);
    if (loading) return loading as Promise<T>;

    const promise = new Promise<T>((resolve, reject) => {
      resources.load(path, type, (err, asset) => {
        this._loading.delete(path);
        if (err) {
          reject(err);
          return;
        }
        this._cache.set(path, asset);
        resolve(asset as T);
      });
    });

    this._loading.set(path, promise);
    return promise;
  }

  /** 预加载一组资源 */
  async preload(paths: string[]): Promise<void> {
    const tasks = paths.map(p => this.load(p, Asset));
    await Promise.all(tasks);
  }

  /** 释放指定资源 */
  release(path: string): void {
    const asset = this._cache.get(path);
    if (asset) {
      resources.release(path);
      this._cache.delete(path);
    }
  }

  /** 清空所有缓存 */
  releaseAll(): void {
    this._cache.forEach((_, path) => resources.release(path));
    this._cache.clear();
    this._loading.clear();
  }
}

export const ResourceManager = new ResourceManagerCls();
