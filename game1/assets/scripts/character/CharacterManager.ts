import { _decorator, Component } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { AFFECTION_LEVELS, SchoolPhase } from '../data/GameConfig';

const { ccclass } = _decorator;

export interface CharacterDef {
  id: string;
  name: string;
  gender: 'male' | 'female';
  firstAppearPhase: SchoolPhase;
  tags: string[];
  defaultSprite: string;
  emotions: Record<string, string>;
  personalStoryId?: string;
}

interface AffectionLevel { min: number; max: number; label: string; unlock: string; }

@ccclass('CharacterManager')
export class CharacterManager extends Component {
  private _characters: Map<string, CharacterDef> = new Map();

  private static _instance: CharacterManager | null = null;
  static get instance(): CharacterManager { return CharacterManager._instance!; }

  onLoad(): void {
    if (CharacterManager._instance) { this.destroy(); return; }
    CharacterManager._instance = this;
  }

  registerCharacter(def: CharacterDef): void {
    this._characters.set(def.id, def);
  }

  /** 获取当前学段已解锁的所有角色 */
  getAvailableCharacters(): CharacterDef[] {
    const currentPhase = GameManager.instance.player.currentPhase;
    return Array.from(this._characters.values())
      .filter(c => this.phaseOrder(c.firstAppearPhase) <= this.phaseOrder(currentPhase));
  }

  getCharacter(id: string): CharacterDef | undefined {
    return this._characters.get(id);
  }

  /** 获取好感度等级信息 */
  getAffectionLevel(charId: string): AffectionLevel {
    const value = GameManager.instance.getAffection(charId);
    for (let i = AFFECTION_LEVELS.length - 1; i >= 0; i--) {
      if (value >= AFFECTION_LEVELS[i].min) return AFFECTION_LEVELS[i];
    }
    return AFFECTION_LEVELS[0];
  }

  /** 获取青梅竹马角色 ID */
  getChildhoodFriendId(): string {
    const gm = GameManager.instance;
    return gm.player.playerGender === 'male' ? 'xiaowei' : 'xiaokang';
  }

  /** 青梅竹马角色定义 */
  getChildhoodFriendDef(): CharacterDef {
    const gm = GameManager.instance;
    const isMale = gm.player.playerGender === 'male';
    return {
      id: isMale ? 'xiaowei' : 'xiaokang',
      name: isMale ? '小维' : '小康',
      gender: isMale ? 'female' : 'male',
      firstAppearPhase: SchoolPhase.PRIMARY_1,
      tags: ['青梅竹马'],
      defaultSprite: isMale ? 'char/xiaowei_default' : 'char/xiaokang_default',
      emotions: { happy: '', sad: '', blush: '' },
      personalStoryId: isMale ? 'xiaowei_personal' : 'xiaokang_personal',
    };
  }

  private phaseOrder(phase: SchoolPhase): number {
    return Object.values(SchoolPhase).indexOf(phase);
  }

  onDestroy(): void { CharacterManager._instance = null; }
}
