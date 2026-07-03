import { _decorator, Component, Node, director, game, Game } from 'cc';
import { EventManager, GameEvents } from './EventManager';
import { SaveManager } from '../data/SaveManager';
import { AudioManager } from '../audio/AudioManager';

const { ccclass, property } = _decorator;

/**
 * 游戏总控 — 全局单例，管理游戏生命周期和核心状态
 * 挂载在初始场景的根节点上
 */
@ccclass('GameManager')
export class GameManager extends Component {
  @property(Node)
  dialogueLayer: Node = null!;   // 对话 UI 层

  @property(Node)
  characterLayer: Node = null!;  // 角色展示层

  @property(Node)
  backgroundLayer: Node = null!; // 背景层

  // ---- 游戏全局状态 ----
  gameState: GameState = GameState.INIT;
  currentStoryId: string = '';
  currentDialogueIndex: number = 0;
  /** 已触发的剧情标记，用于条件分支 */
  flags: Set<string> = new Set();
  /** 角色好感度 */
  affection: Map<string, number> = new Map();
  /** 当前是否自动播放 */
  autoMode: boolean = false;
  /** 是否显示未读文本（Log 模式） */
  logMode: boolean = false;

  private static _instance: GameManager | null = null;

  static get instance(): GameManager {
    return GameManager._instance!;
  }

  onLoad(): void {
    if (GameManager._instance) {
      this.destroy();
      return;
    }
    GameManager._instance = this;
    game.addPersistRootNode(this.node); // 常驻节点，场景切换不销毁
  }

  start(): void {
    this.gameState = GameState.READY;
    EventManager.emit(GameEvents.SCENE_LOADED, 'init');
  }

  /** 开始新游戏 */
  startNewGame(storyId: string): void {
    this.flags.clear();
    this.affection.clear();
    this.currentStoryId = storyId;
    this.currentDialogueIndex = 0;
    this.gameState = GameState.PLAYING;
    EventManager.emit(GameEvents.DIALOGUE_START, storyId);
  }

  /** 继续游戏（读档） */
  async continueGame(): Promise<void> {
    const data = await SaveManager.load();
    if (!data) {
      this.startNewGame('chapter_1');
      return;
    }
    this.currentStoryId = data.storyId;
    this.currentDialogueIndex = data.dialogueIndex;
    this.flags = new Set(data.flags);
    this.affection = new Map(data.affection);
    this.gameState = GameState.PLAYING;
    EventManager.emit(GameEvents.GAME_LOADED, data);
    EventManager.emit(GameEvents.DIALOGUE_START, this.currentStoryId, this.currentDialogueIndex);
  }

  /** 设置剧情标记 */
  setFlag(flag: string): void {
    this.flags.add(flag);
  }

  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  /** 修改角色好感度 */
  modifyAffection(characterId: string, delta: number): void {
    const current = this.affection.get(characterId) || 0;
    this.affection.set(characterId, current + delta);
  }

  getAffection(characterId: string): number {
    return this.affection.get(characterId) || 0;
  }

  /** 切换场景（带淡入淡出） */
  switchScene(sceneName: string): void {
    EventManager.emit(GameEvents.SCENE_CHANGE, sceneName);
    director.loadScene(sceneName);
  }

  onDestroy(): void {
    if (GameManager._instance === this) {
      GameManager._instance = null;
    }
  }
}

export enum GameState {
  INIT,
  READY,
  PLAYING,
  PAUSED,
  ENDING,
}
