import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Color, tween, Vec3, Size } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ResourceManager } from '../core/ResourceManager';
import { CharacterDef } from '../story/StoryData';

const { ccclass, property } = _decorator;

/**
 * 角色展示层 — 管理角色立绘的显示、切换、表情变化
 *
 * 支持多个角色同时显示（左/中/右站位）
 * 结构:
 *   CharacterLayer (this.node)
 *   ├── CharLeft (Node + Sprite)    — 左侧角色
 *   ├── CharCenter (Node + Sprite)  — 中间角色
 *   └── CharRight (Node + Sprite)   — 右侧角色
 */
@ccclass('CharacterDisplay')
export class CharacterDisplay extends Component {
  @property(Node) charLeft: Node   = null!;
  @property(Node) charCenter: Node = null!;
  @property(Node) charRight: Node  = null!;

  /** 角色 ID → 站位映射 */
  private _characterPositions: Map<string, Node> = new Map();
  /** 当前显示中的角色 */
  private _activeCharacters: Set<string> = new Set();

  onLoad(): void {
    EventManager.on(GameEvents.CHARACTER_SHOW, this.onShowCharacter, this);
    EventManager.on(GameEvents.CHARACTER_HIDE, this.onHideCharacter, this);
    EventManager.on(GameEvents.CHARACTER_EMOTION, this.onChangeEmotion, this);
    EventManager.on('EFFECT_SHAKE', this.onShake, this);
    EventManager.on('EFFECT_ZOOMIN', this.onZoomIn, this);

    // 初始隐藏所有（由 SceneBuilder 赋值后才有效）
    if (this.charLeft) this.charLeft.active = false;
    if (this.charCenter) this.charCenter.active = false;
    if (this.charRight) this.charRight.active = false;
  }

  /** 显示角色 */
  private async onShowCharacter(charId: string, emotion?: string, charDef?: CharacterDef): Promise<void> {
    if (!charDef) return;

    // 确定站位
    const position = this.getPositionFor(charId);
    const slot = this.getSlotNode(position);
    if (!slot) return;

    this._activeCharacters.add(charId);
    this._characterPositions.set(charId, slot);

    // 加载立绘
    let spritePath = charDef.defaultSprite || '';
    if (emotion && charDef.emotions && charDef.emotions[emotion]) {
      spritePath = charDef.emotions[emotion];
    }

    if (spritePath) {
      try {
        const spriteFrame = await ResourceManager.loadSprite(spritePath);
        const sprite = slot.getComponent(Sprite);
        if (sprite) {
          sprite.spriteFrame = spriteFrame;
        }
      } catch (err) {
        console.warn(`[CharacterDisplay] 加载角色立绘失败: ${spritePath}`, err);
      }
    }

    slot.active = true;

    // 入场动画 - 从下方滑入
    const startY = -100;
    slot.setPosition(new Vec3(slot.position.x, startY, slot.position.z));
    tween(slot).to(0.3, { position: new Vec3(slot.position.x, 0, slot.position.z) }).start();

    // 其他角色变暗（聚焦当前说话者）
    this.focusCharacter(charId);
  }

  /** 隐藏角色 */
  private onHideCharacter(charId: string): void {
    const slot = this._characterPositions.get(charId);
    if (slot) {
      // 退场动画
      tween(slot)
        .to(0.3, { position: new Vec3(slot.position.x, -100, slot.position.z) })
        .call(() => { slot.active = false; })
        .start();
    }
    this._activeCharacters.delete(charId);
    this._characterPositions.delete(charId);
  }

  /** 切换表情 */
  private async onChangeEmotion(charId: string, emotion: string, charDef: CharacterDef): Promise<void> {
    const slot = this._characterPositions.get(charId);
    if (!slot || !charDef.emotions || !charDef.emotions[emotion]) return;

    try {
      const spriteFrame = await ResourceManager.loadSprite(charDef.emotions[emotion]);
      const sprite = slot.getComponent(Sprite);
      if (sprite) {
        sprite.spriteFrame = spriteFrame;
      }
    } catch (err) {
      console.warn(`[CharacterDisplay] 切换表情失败: ${emotion}`, err);
    }
  }

  /** 高亮当前说话角色，其他变暗 */
  private focusCharacter(charId: string): void {
    this._activeCharacters.forEach(id => {
      const slot = this._characterPositions.get(id);
      if (!slot) return;
      const sprite = slot.getComponent(Sprite);
      if (!sprite) return;
      if (id === charId) {
        sprite.color = Color.WHITE;
      } else {
        sprite.color = new Color(128, 128, 128, 255);
      }
    });
  }

  /** 画面震动特效 */
  private onShake(duration: number): void {
    const origPos = this.node.position.clone();
    const shakeAmount = 5;
    const shakeCount = Math.floor(duration / 0.05);
    let count = 0;

    const timer = setInterval(() => {
      if (count >= shakeCount) {
        clearInterval(timer);
        this.node.setPosition(origPos);
        return;
      }
      const offsetX = (Math.random() - 0.5) * shakeAmount * 2;
      const offsetY = (Math.random() - 0.5) * shakeAmount * 2;
      this.node.setPosition(new Vec3(origPos.x + offsetX, origPos.y + offsetY, origPos.z));
      count++;
    }, 50);
  }

  /** 放大特效 */
  private onZoomIn(duration: number): void {
    const center = this.charCenter;
    if (!center || !center.active) return;

    tween(center)
      .to(duration * 0.3, { scale: new Vec3(1.05, 1.05, 1) })
      .to(duration * 0.7, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  /** 根据角色 ID 分配站位 */
  private getPositionFor(charId: string): string {
    // 简单策略：轮流分配
    if (!this._characterPositions.has(charId)) {
      if (this._activeCharacters.size === 0) return 'center';
      if (this._activeCharacters.size === 1) return 'left';
      return 'right';
    }
    return ''; // 已在场上
  }

  private getSlotNode(position: string): Node | null {
    switch (position) {
      case 'left':   return this.charLeft;
      case 'center': return this.charCenter;
      case 'right':  return this.charRight;
      default: return null;
    }
  }

  onDestroy(): void {
    EventManager.targetOff(this);
  }
}
