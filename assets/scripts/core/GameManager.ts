import { _decorator, Component, Node, director, game } from 'cc';
import { EventManager, GameEvents } from './EventManager';
import { SchoolPhase, StatType, PHASE_CONFIG, MAX_ENERGY } from '../data/GameConfig';

const { ccclass, property } = _decorator;

export enum GameMode { INIT, CHARACTER_CREATE, STORY, CALENDAR, EXAM, ENDING }

export interface PlayerData {
  playerName: string;
  playerGender: 'male' | 'female';
  currentPhase: SchoolPhase;
  currentWeek: number;
  energy: number;
  stats: Record<StatType, number>;
  flags: Set<string>;
  affection: Map<string, number>;
}

@ccclass('GameManager')
export class GameManager extends Component {
  @property(Node) uiLayer: Node = null!;

  gameMode: GameMode = GameMode.INIT;
  player: PlayerData = this.createDefaultPlayer();

  private static _instance: GameManager | null = null;
  static get instance(): GameManager { return GameManager._instance!; }

  private createDefaultPlayer(): PlayerData {
    return {
      playerName: '', playerGender: 'male',
      currentPhase: SchoolPhase.PRIMARY_1, currentWeek: 0,
      energy: MAX_ENERGY,
      stats: { [StatType.ACADEMIC]: 50, [StatType.SPORTS]: 50, [StatType.ART]: 50, [StatType.SOCIAL]: 50, [StatType.INTEREST]: 50 },
      flags: new Set(), affection: new Map(),
    };
  }

  onLoad(): void {
    if (GameManager._instance) { this.destroy(); return; }
    GameManager._instance = this;
    game.addPersistRootNode(this.node);
  }

  start(): void {
    this.gameMode = GameMode.CHARACTER_CREATE;
    EventManager.emit(GameEvents.SCENE_LOADED, 'init');
  }

  setCharacter(name: string, gender: 'male' | 'female'): void {
    this.player.playerName = name;
    this.player.playerGender = gender;
    this.player.flags.add(gender === 'male' ? 'protagonist_male' : 'protagonist_female');
    this.player.flags.add('childhood_friend_' + (gender === 'male' ? 'xiaowei' : 'xiaokang'));
  }

  enterStoryMode(): void { this.gameMode = GameMode.STORY; }
  enterCalendarMode(): void { this.gameMode = GameMode.CALENDAR; }
  enterExamMode(): void { this.gameMode = GameMode.EXAM; }

  modifyStat(stat: StatType, delta: number): void {
    const v = this.player.stats[stat] + delta;
    this.player.stats[stat] = Math.max(0, Math.min(100, v));
  }

  modifyEnergy(delta: number): void {
    this.player.energy = Math.max(0, Math.min(MAX_ENERGY, this.player.energy + delta));
  }

  modifyAffection(charId: string, delta: number): void {
    const v = (this.player.affection.get(charId) || 0) + delta;
    this.player.affection.set(charId, Math.max(0, Math.min(100, v)));
  }

  setFlag(flag: string): void { this.player.flags.add(flag); }
  hasFlag(flag: string): boolean { return this.player.flags.has(flag); }
  getAffection(charId: string): number { return this.player.affection.get(charId) || 0; }

  advancePhase(): void {
    const next = PHASE_CONFIG[this.player.currentPhase].nextPhase;
    if (next) {
      this.player.currentPhase = next;
      this.player.currentWeek = 0;
      EventManager.emit(GameEvents.SCENE_CHANGE, next);
    }
  }

  switchScene(sceneName: string): void { director.loadScene(sceneName); }

  onDestroy(): void {
    if (GameManager._instance === this) GameManager._instance = null;
  }
}
