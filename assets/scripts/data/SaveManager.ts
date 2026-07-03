import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { SchoolPhase, StatType } from './GameConfig';

export interface SaveData {
  version: number;
  slot: number;
  timestamp: number;
  player: {
    playerName: string;
    playerGender: 'male' | 'female';
    currentPhase: SchoolPhase;
    currentWeek: number;
    energy: number;
    stats: Record<StatType, number>;
    flags: string[];
    affection: [string, number][];
  };
  saveName: string;
}

class SaveManagerCls {
  private readonly KEY_PREFIX = 'pixel_campus_save_';
  private readonly CLOUD_PATH = 'saves/';
  private readonly SAVE_VERSION = 1;
  private readonly MAX_SLOTS = 5;

  async save(slot: number = 0): Promise<boolean> {
    const gm = GameManager.instance;
    const data: SaveData = {
      version: this.SAVE_VERSION, slot, timestamp: Date.now(),
      player: {
        playerName: gm.player.playerName,
        playerGender: gm.player.playerGender,
        currentPhase: gm.player.currentPhase,
        currentWeek: gm.player.currentWeek,
        energy: gm.player.energy,
        stats: gm.player.stats,
        flags: Array.from(gm.player.flags),
        affection: Array.from(gm.player.affection.entries()),
      },
      saveName: `存档 ${slot + 1}`,
    };

    const json = JSON.stringify(data);
    this.setLocalSave(slot, json);

    try { await this.cloudUpload(slot, json); } catch {}

    EventManager.emit(GameEvents.GAME_SAVED, slot, data);
    return true;
  }

  async load(slot: number = 0): Promise<SaveData | null> {
    let json: string | null = null;
    try { json = await this.cloudDownload(slot); } catch {}
    if (!json) json = this.getLocalSave(slot);
    if (!json) return null;

    const data = JSON.parse(json) as SaveData;
    this.applySaveData(data);
    EventManager.emit(GameEvents.GAME_LOADED, data);
    return data;
  }

  private applySaveData(data: SaveData): void {
    const gm = GameManager.instance;
    gm.player.playerName = data.player.playerName;
    gm.player.playerGender = data.player.playerGender;
    gm.player.currentPhase = data.player.currentPhase;
    gm.player.currentWeek = data.player.currentWeek;
    gm.player.energy = data.player.energy;
    gm.player.stats = data.player.stats;
    gm.player.flags = new Set(data.player.flags);
    gm.player.affection = new Map(data.player.affection);
  }

  async listSaves(): Promise<{ slot: number; data: SaveData }[]> {
    const saves: { slot: number; data: SaveData }[] = [];
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const json = this.getLocalSave(i);
      if (json) { try { saves.push({ slot: i, data: JSON.parse(json) }); } catch {} }
    }
    saves.sort((a, b) => b.data.timestamp - a.data.timestamp);
    return saves;
  }

  async deleteSave(slot: number): Promise<void> { this.removeLocalSave(slot); }

  private setLocalSave(slot: number, json: string): void {
    if (typeof wx !== 'undefined' && wx.setStorageSync) wx.setStorageSync(this.KEY_PREFIX + slot, json);
    else localStorage.setItem(this.KEY_PREFIX + slot, json);
  }
  private getLocalSave(slot: number): string | null {
    if (typeof wx !== 'undefined' && wx.getStorageSync) return wx.getStorageSync(this.KEY_PREFIX + slot);
    return localStorage.getItem(this.KEY_PREFIX + slot);
  }
  private removeLocalSave(slot: number): void {
    if (typeof wx !== 'undefined' && wx.removeStorageSync) wx.removeStorageSync(this.KEY_PREFIX + slot);
    else localStorage.removeItem(this.KEY_PREFIX + slot);
  }

  private async cloudUpload(slot: number, json: string): Promise<void> {
    if (typeof wx === 'undefined' || !wx.cloud) return;
    await wx.cloud.uploadFile({ cloudPath: this.CLOUD_PATH + `save_${slot}.json`, fileContent: json });
  }
  private async cloudDownload(slot: number): Promise<string | null> {
    if (typeof wx === 'undefined' || !wx.cloud) return null;
    const res = await wx.cloud.downloadFile({ fileID: this.CLOUD_PATH + `save_${slot}.json` });
    return (res as any).tempFilePath ? 'from_cloud' : null;
  }
}

export const SaveManager = new SaveManagerCls();
