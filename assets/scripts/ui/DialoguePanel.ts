import { _decorator, Component, Node, Label, RichText, UITransform, Color, tween, Vec3 } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { Dialogue } from '../story/StoryData';

const { ccclass, property } = _decorator;

/**
 * 对话框 UI — 打字机效果 + 角色名 + 点击继续
 *
 * 挂载在对话面板预制体上
 * 结构:
 *   DialoguePanel (this.node)
 *   ├── SpeakerName (Label)    — 说话者名字
 *   ├── DialogueText (Label)   — 对话文本
 *   └── ContinueHint (Node)    — 点击继续提示
 */
@ccclass('DialoguePanel')
export class DialoguePanel extends Component {
  @property(Label)
  speakerLabel: Label = null!;

  @property(Label)
  textLabel: Label = null!;

  @property(Node)
  continueHint: Node = null!;  // 闪烁的 "▼" 提示

  @property
  typeSpeed: number = 0.05;  // 打字间隔（秒/字）

  private _fullText: string = '';
  private _currentIndex: number = 0;
  private _typeTimer: number = 0;
  private _typing: boolean = false;
  private _waiting: boolean = false; // 等待玩家点击继续
  private _autoTimer: number = 0;
  private _autoDelay: number = 1.5; // 自动模式下等待时间

  onLoad(): void {
    EventManager.on(GameEvents.DIALOGUE_NEXT, this.onShowDialogue, this);
    EventManager.on(GameEvents.DIALOGUE_END, this.onDialogueEnd, this);
    this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    this.hide();
  }

  /** 显示一条对话 */
  private onShowDialogue(dialogue: Dialogue): void {
    console.log('[DialoguePanel] Showing dialogue:', dialogue.speakerName, dialogue.text?.substring(0, 30));
    this.show();

    // 说话者
    const speakerName = dialogue.speakerName || dialogue.speaker || '';
    this.speakerLabel.string = speakerName;
    this.speakerLabel.node.active = speakerName !== '';

    // 开始打字
    this._fullText = dialogue.text;
    this._currentIndex = 0;
    this._typing = true;
    this._waiting = false;
    this._typeTimer = 0;
    this.textLabel.string = '';

    if (this.continueHint) {
      this.continueHint.active = false;
    }
  }

  update(dt: number): void {
    if (this._typing) {
      this._typeTimer += dt;
      if (this._typeTimer >= this.typeSpeed) {
        this._typeTimer -= this.typeSpeed;
        this._currentIndex++;
        this.textLabel.string = this._fullText.substring(0, this._currentIndex);

        if (this._currentIndex >= this._fullText.length) {
          // 打字完成
          this._typing = false;
          this._waiting = true;
          this._autoTimer = 0;

          // 有选择项时不显示继续提示
          EventManager.emit(GameEvents.DIALOGUE_TYPING, false);

          if (this.continueHint) {
            this.continueHint.active = true;
            // 呼吸闪烁效果
            tween(this.continueHint)
              .repeatForever(
                tween().sequence(
                  tween().to(0.5, { scale: new Vec3(1.1, 1.1, 1) }),
                  tween().to(0.5, { scale: new Vec3(1, 1, 1) }),
                ).union()
              )
              .start();
          }
        }
      }
    }

    // 自动模式
    if (this._waiting && GameManager.instance.autoMode) {
      this._autoTimer += dt;
      if (this._autoTimer >= this._autoDelay) {
        this.nextDialogue();
      }
    }
  }

  /** 点击对话区域 */
  private onClick(): void {
    // 选项中不允许点击跳过
    if (!this.node.active) return;

    if (this._typing) {
      // 正在打字 → 立即显示全部文本
      this._typing = false;
      this.textLabel.string = this._fullText;
      this._currentIndex = this._fullText.length;

      if (this.continueHint) {
        this.continueHint.active = true;
      }
      this._waiting = true;
      EventManager.emit(GameEvents.DIALOGUE_TYPING, false);
    } else if (this._waiting) {
      // 打完等待中 → 下一条
      this.nextDialogue();
    }
  }

  private nextDialogue(): void {
    this._waiting = false;
    if (this.continueHint) {
      this.continueHint.active = false;
      tween(this.continueHint).stop();
    }
    EventManager.emit(GameEvents.DIALOGUE_NEXT + '_REQUEST');
  }

  show(): void {
    this.node.active = true;
    this.node.setPosition(new Vec3(0, 0, 0));
  }

  hide(): void {
    this.node.active = false;
    this._typing = false;
    this._waiting = false;
  }

  private onDialogueEnd(): void {
    this.hide();
  }

  onDestroy(): void {
    EventManager.off(GameEvents.DIALOGUE_NEXT, this.onShowDialogue, this);
    EventManager.off(GameEvents.DIALOGUE_END, this.onDialogueEnd, this);
    this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
  }
}
