import { _decorator, Component } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { ResourceManager } from '../core/ResourceManager';
import { Story, Dialogue, Choice, Chapter, Condition } from './StoryData';

const { ccclass } = _decorator;

/**
 * 剧情引擎 — 负责解析故事数据、控制对话流程、处理分支逻辑
 */
@ccclass('StoryManager')
export class StoryManager extends Component {
  private _currentStory: Story | null = null;
  private _currentChapter: Chapter | null = null;
  private _dialogueMap: Map<string, Dialogue> = new Map();
  private _isPlaying: boolean = false;

  /** 当前正在显示的对话 */
  currentDialogue: Dialogue | null = null;

  onLoad(): void {
    EventManager.on(GameEvents.DIALOGUE_START, this.onDialogueStart, this);
    EventManager.on(GameEvents.DIALOGUE_NEXT + '_REQUEST', this.playNext, this);
    EventManager.on(GameEvents.CHOICE_SELECTED, (choice: any) => this.onChoiceSelected(choice), this);
  }

  /** 加载并开始一个故事 */
  async loadStory(storyId: string): Promise<void> {
    try {
      this._currentStory = await ResourceManager.loadJson<Story>(storyId);
      // 构建 ID 映射表
      this._dialogueMap.clear();
      this._currentStory.chapters.forEach(ch => {
        ch.dialogues.forEach((d, i) => {
          const id = d.id || `${ch.id}_${i}`;
          d.id = id;
          this._dialogueMap.set(id, d);
        });
      });
    } catch (err) {
      console.error(`[StoryManager] 加载剧情失败: ${storyId}`, err);
    }
  }

  /** 进入指定章节 */
  enterChapter(chapterId: string): void {
    if (!this._currentStory) return;
    const ch = this._currentStory.chapters.find(c => c.id === chapterId);
    if (!ch) return;

    this._currentChapter = ch;

    // 设置背景
    if (ch.background) {
      EventManager.emit(GameEvents.SCENE_CHANGE, ch.background);
    }
    // 播放 BGM
    if (ch.bgm) {
      EventManager.emit(GameEvents.BGM_CHANGE, ch.bgm);
    }

    // 从第一条对话开始
    this.playDialogue(chapterId, 0);
  }

  /** 播放指定对话 */
  playDialogue(chapterId: string, index: number): void {
    console.log('[StoryManager] playDialogue:', chapterId, 'index:', index);
    const ch = this._currentStory?.chapters.find(c => c.id === chapterId);
    if (!ch || index >= ch.dialogues.length) {
      console.log('[StoryManager] Chapter or index invalid, ending');
      this.onChapterEnd();
      return;
    }

    const dialogue = ch.dialogues[index];
    const gm = GameManager.instance;
    gm.currentDialogueIndex = index;

    // 检查条件
    if (dialogue.conditions && !this.checkConditions(dialogue.conditions)) {
      // 条件不满足，跳过本条
      this.playNext();
      return;
    }

    this.currentDialogue = dialogue;
    this._isPlaying = true;

    // 执行特效
    dialogue.effects?.forEach(e => this.applyEffect(e));

    // 显示角色
    if (dialogue.speaker) {
      const charDef = this._currentStory?.characters.find(c => c.id === dialogue.speaker);
      EventManager.emit(GameEvents.CHARACTER_SHOW, dialogue.speaker, dialogue.emotion, charDef);
    }

    // 通知 UI 显示对话
    console.log('[StoryManager] Emitting DIALOGUE_NEXT:', dialogue.speaker, dialogue.text?.substring(0, 20));
    EventManager.emit(GameEvents.DIALOGUE_NEXT, dialogue);

    // 如果没有选项，等待玩家点击继续
    // 如果有选项，触发选项显示
    if (dialogue.choices && dialogue.choices.length > 0) {
      const validChoices = dialogue.choices.filter(c => {
        if (!c.conditions) return true;
        return this.checkConditions(c.conditions);
      });
      if (validChoices.length > 0) {
        EventManager.emit(GameEvents.CHOICE_SHOW, validChoices);
      }
    }
  }

  /** 播放下一条对话（玩家点击继续时调用） */
  playNext(): void {
    if (!this._currentChapter) return;

    const dialogue = this.currentDialogue;
    if (!dialogue) return;

    // 执行当前对话的行动
    dialogue.actions?.forEach(a => this.executeAction(a));

    // 有跳转目标
    if (dialogue.jumpTo) {
      const target = this._dialogueMap.get(dialogue.jumpTo);
      if (target) {
        this.playDialogueById(target);
        return;
      }
    }

    // 顺序播放
    const gm = GameManager.instance;
    this.playDialogue(this._currentChapter.id, gm.currentDialogueIndex + 1);
  }

  /** 处理玩家选择 */
  onChoiceSelected(choice: Choice): void {
    EventManager.emit(GameEvents.CHOICE_SELECTED, choice);

    choice.actions?.forEach(a => this.executeAction(a));

    const target = this._dialogueMap.get(choice.jumpTo);
    if (target) {
      this.playDialogueById(target);
    }
  }

  /** 通过 ID 播放对话 */
  private playDialogueById(dialogue: Dialogue): void {
    if (!this._currentStory || !dialogue.id) return;

    // 找到这个对话所在的章节和索引
    for (const ch of this._currentStory.chapters) {
      const idx = ch.dialogues.findIndex(d => d.id === dialogue.id);
      if (idx >= 0) {
        this._currentChapter = ch;
        this.playDialogue(ch.id, idx);
        return;
      }
    }
  }

  /** 章节结束 */
  private onChapterEnd(): void {
    this._isPlaying = false;
    EventManager.emit(GameEvents.DIALOGUE_END);
    // TODO: 跳转到下一章或返回主界面
  }

  /** 检查条件组（全部满足才返回 true） */
  private checkConditions(conditions: Condition[]): boolean {
    const gm = GameManager.instance;
    return conditions.every(c => {
      switch (c.type) {
        case 'hasFlag':    return gm.hasFlag(c.key);
        case 'noFlag':     return !gm.hasFlag(c.key);
        case 'affectionGE': return gm.getAffection(c.key) >= (c.value || 0);
        case 'affectionLE': return gm.getAffection(c.key) <= (c.value || 0);
        default: return true;
      }
    });
  }

  /** 执行行动 */
  private executeAction(action: { type: string; key?: string; value?: number }): void {
    const gm = GameManager.instance;
    switch (action.type) {
      case 'setFlag':
        if (action.key) gm.setFlag(action.key);
        break;
      case 'removeFlag':
        if (action.key) gm.flags.delete(action.key);
        break;
      case 'affection':
        if (action.key) gm.modifyAffection(action.key, action.value || 0);
        break;
      case 'playBGM':
        if (action.key) EventManager.emit(GameEvents.BGM_CHANGE, action.key);
        break;
      case 'playSFX':
        if (action.key) EventManager.emit(GameEvents.SFX_PLAY, action.key);
        break;
      case 'switchScene':
        if (action.key) gm.switchScene(action.key);
        break;
    }
  }

  /** 应用画面特效 */
  private applyEffect(effect: { type: string; duration?: number }): void {
    // 特效由 UI 层接收并实现
    EventManager.emit('EFFECT_' + effect.type.toUpperCase(), effect.duration || 0.5);
  }

  private onDialogueStart(storyId: string, startIndex: number = 0): void {
    console.log('[StoryManager] DIALOGUE_START received:', storyId);
    this.loadStory(storyId).then(() => {
      console.log('[StoryManager] Story loaded:', this._currentStory?.title, 'chapters:', this._currentStory?.chapters.length);
      if (this._currentStory && this._currentStory.chapters.length > 0) {
        const ch = this._currentStory.chapters[0];
        this.enterChapter(ch.id);
      }
    }).catch(err => {
      console.error('[StoryManager] Failed to load story:', err);
    });
  }

  onDestroy(): void {
    EventManager.targetOff(this);
  }
}
