import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';

/**
 * 存档数据结构
 */
export interface SaveData {
  storyId: string;
  dialogueIndex: number;
  flags: string[];
  affection: [string, number][]; // Map 序列化为键值对数组
  timestamp: number;
  saveName: string;
  /** 存档预览 — 当前对话前30字 */
  preview?: string;
}

/**
 * 存档管理器 — 支持本地存储和微信云存储
 */
class SaveManagerCls {
  private readonly SAVE_KEY_PREFIX = 'save_';
  private readonly CLOUD_COLLECTION = 'game_saves';
  private readonly MAX_SLOTS = 10;

  /** 当前存档数据缓存 */
  private _currentSave: SaveData | null = null;

  /** 保存到指定档位 */
  async save(slot: number = 0): Promise<boolean> {
    const gm = GameManager.instance;
    const data: SaveData = {
      storyId: gm.currentStoryId,
      dialogueIndex: gm.currentDialogueIndex,
      flags: Array.from(gm.flags),
      affection: Array.from(gm.affection.entries()),
      timestamp: Date.now(),
      saveName: `存档 ${slot + 1}`,
    };

    this._currentSave = data;
    const json = JSON.stringify(data);

    try {
      // 本地存储
      if (typeof wx !== 'undefined' && wx.setStorageSync) {
        wx.setStorageSync(this.SAVE_KEY_PREFIX + slot, json);
      } else {
        localStorage.setItem(this.SAVE_KEY_PREFIX + slot, json);
      }

      // 尝试同步到微信云存储
      await this.cloudSave(slot, data);

      EventManager.emit(GameEvents.GAME_SAVED, slot, data);
      return true;
    } catch (err) {
      console.error('[SaveManager] 存档失败:', err);
      return false;
    }
  }

  /** 读档 */
  async load(slot: number = 0): Promise<SaveData | null> {
    try {
      let json: string | null = null;

      // 优先从云存储读取
      const cloudData = await this.cloudLoad(slot);
      if (cloudData) {
        this._currentSave = cloudData;
        return cloudData;
      }

      // 本地存储
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        json = wx.getStorageSync(this.SAVE_KEY_PREFIX + slot);
      } else {
        json = localStorage.getItem(this.SAVE_KEY_PREFIX + slot);
      }

      if (json) {
        const data = JSON.parse(json) as SaveData;
        this._currentSave = data;
        EventManager.emit(GameEvents.GAME_LOADED, data);
        return data;
      }
    } catch (err) {
      console.error('[SaveManager] 读档失败:', err);
    }
    return null;
  }

  /** 快速保存（覆盖最新档位） */
  async quickSave(): Promise<boolean> {
    return this.save(0);
  }

  /** 获取所有存档列表 */
  async listSaves(): Promise<{ slot: number; data: SaveData }[]> {
    const saves: { slot: number; data: SaveData }[] = [];

    for (let i = 0; i < this.MAX_SLOTS; i++) {
      let json: string | null = null;
      try {
        if (typeof wx !== 'undefined' && wx.getStorageSync) {
          json = wx.getStorageSync(this.SAVE_KEY_PREFIX + i);
        } else {
          json = localStorage.getItem(this.SAVE_KEY_PREFIX + i);
        }
        if (json) {
          saves.push({ slot: i, data: JSON.parse(json) });
        }
      } catch { /* skip corrupt saves */ }
    }

    saves.sort((a, b) => b.data.timestamp - a.data.timestamp);
    return saves;
  }

  /** 删除存档 */
  async deleteSave(slot: number): Promise<void> {
    if (typeof wx !== 'undefined' && wx.removeStorageSync) {
      wx.removeStorageSync(this.SAVE_KEY_PREFIX + slot);
    } else {
      localStorage.removeItem(this.SAVE_KEY_PREFIX + slot);
    }
  }

  /** 微信云存储 */
  private async cloudSave(slot: number, data: SaveData): Promise<void> {
    if (typeof wx === 'undefined' || !wx.cloud) return;
    try {
      const db = wx.cloud.database();
      const collection = db.collection(this.CLOUD_COLLECTION);
      // 先查是否存在
      const exist = await collection.where({ _id: `save_${slot}` }).get();
      if ((exist as any).data?.length > 0) {
        await collection.doc(`save_${slot}`).update({ data });
      } else {
        await collection.add({ _id: `save_${slot}`, data });
      }
    } catch (err) {
      console.warn('[SaveManager] 云存档同步失败:', err);
    }
  }

  private async cloudLoad(slot: number): Promise<SaveData | null> {
    if (typeof wx === 'undefined' || !wx.cloud) return null;
    try {
      const db = wx.cloud.database();
      const result = await db.collection(this.CLOUD_COLLECTION).doc(`save_${slot}`).get();
      return (result as any).data as SaveData;
    } catch {
      return null;
    }
  }
}

export const SaveManager = new SaveManagerCls();
