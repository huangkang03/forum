import { _decorator, Component, Node, Label, Button, Prefab, instantiate, Layout, Color, UITransform, Size } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { Choice } from '../story/StoryData';

const { ccclass, property } = _decorator;

/**
 * 选项面板 — 显示分支选项按钮
 *
 * 结构:
 *   ChoicePanel (this.node)
 *   └── ButtonContainer (Layout) — 垂直排列的选项按钮
 *         ├── ChoiceButton (Prefab)
 *         ├── ChoiceButton
 *         └── ...
 */
@ccclass('ChoicePanel')
export class ChoicePanel extends Component {
  @property(Prefab)
  choiceButtonPrefab: Prefab = null!;

  @property(Node)
  buttonContainer: Node = null!;  // 带 Layout 组件的容器

  private _buttons: Node[] = [];

  onLoad(): void {
    EventManager.on(GameEvents.CHOICE_SHOW, this.onShowChoices, this);
    this.node.active = false;
  }

  private onShowChoices(choices: Choice[]): void {
    // 清空旧按钮
    this._buttons.forEach(b => b.destroy());
    this._buttons = [];

    // 创建新按钮
    choices.forEach((choice, index) => {
      const btn = instantiate(this.choiceButtonPrefab);
      const label = btn.getComponentInChildren(Label);
      if (label) {
        label.string = choice.text;
      }

      // 绑定点击事件
      const btnComp = btn.getComponent(Button);
      if (btnComp) {
        btn.node.on(Button.EventType.CLICK, () => {
          this.onChoiceClick(choice);
        });
      }

      btn.setParent(this.buttonContainer);
      this._buttons.push(btn);
    });

    this.node.active = true;

    // 入场动画 — 按钮依次淡入
    this._buttons.forEach((btn, i) => {
      btn.setScale(0.8, 0.8, 1);
      btn.getComponent(UITransform)?.setContentSize(new Size(
        btn.getComponent(UITransform)?.contentSize.width || 500, 60
      ));
    });
  }

  private onChoiceClick(choice: Choice): void {
    EventManager.emit(GameEvents.CHOICE_SELECTED, choice);
    this.hide();
  }

  hide(): void {
    this.node.active = false;
    this._buttons.forEach(b => b.destroy());
    this._buttons = [];
  }

  onDestroy(): void {
    EventManager.off(GameEvents.CHOICE_SHOW, this.onShowChoices, this);
  }
}
