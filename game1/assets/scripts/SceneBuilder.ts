import { _decorator, Component, Node, Canvas, UITransform, Label, Sprite, SpriteFrame, Button, Layout, Color, Widget, Size, Vec3, Prefab, director, Camera, view, Layers } from 'cc';
import { GameManager } from './core/GameManager';
import { StoryManager } from './story/StoryManager';
import { CalendarManager } from './calendar/CalendarManager';
import { CharacterManager } from './character/CharacterManager';
import { AudioManager } from './audio/AudioManager';
import { DialoguePanel } from './ui/DialoguePanel';
import { ChoicePanel } from './ui/ChoicePanel';
import { CharacterDisplay } from './ui/CharacterDisplay';
import { CalendarPanel } from './ui/CalendarPanel';
import { StatusPanel } from './ui/StatusPanel';
import { WeekSummaryPanel } from './ui/WeekSummaryPanel';
import { SceneBoot } from './SceneBoot';

const { ccclass, property } = _decorator;

/**
 * 场景构建器 — 运行时从代码构建全部 UI 和挂载脚本
 * 只需在 Canvas 上挂此脚本，启动时自动搭建整个游戏框架
 */
@ccclass('SceneBuilder')
export class SceneBuilder extends Component {
  onLoad(): void {
    console.log('[SceneBuilder] onLoad START');
    this.buildScene();
    console.log('[SceneBuilder] onLoad DONE');
  }

  private buildScene(): void {
    const canvas = this.node;

    // ===== 核心管理器节点（直接挂场景根节点）=====
    const sceneRoot = canvas.parent!;
    const gameMgr = this.createNode('GameManager', sceneRoot);
    gameMgr.addComponent(GameManager);

    const storyMgr = this.createNode('StoryManager', sceneRoot);
    storyMgr.addComponent(StoryManager);

    const calendarMgr = this.createNode('CalendarManager', sceneRoot);
    calendarMgr.addComponent(CalendarManager);

    const charMgr = this.createNode('CharacterManager', sceneRoot);
    charMgr.addComponent(CharacterManager);

    const audioMgr = this.createNode('AudioManager', sceneRoot);
    audioMgr.addComponent(AudioManager);

    const sceneBoot = this.createNode('SceneBoot', sceneRoot);
    const boot = sceneBoot.addComponent(SceneBoot);
    boot.gameManagerNode = gameMgr;

    // ===== UI 层 =====
    const uiLayer = this.createNode('UILayer', canvas);
    gameMgr.getComponent(GameManager)!.uiLayer = uiLayer;

    // 构建各 UI 面板
    this.buildDialoguePanel(uiLayer);
    this.buildChoicePanel(uiLayer);
    this.buildCharacterDisplay(uiLayer);
    this.buildCalendarPanel(uiLayer);
    this.buildStatusPanel(uiLayer);
    this.buildWeekSummaryPanel(uiLayer);
    this.buildCharacterCreate(uiLayer, boot);
  }

  // ==================== Dialogue Panel ====================

  private buildDialoguePanel(parent: Node): void {
    const panel = this.createNode('DialoguePanel', parent);
    panel.active = false;
    const dialogue = panel.addComponent(DialoguePanel);

    // 半透明底
    const bg = this.createNode('Bg', panel);
    this.addSprite(bg, new Color(0, 0, 0, 180));
    this.setSize(bg, 750, 300);
    bg.setPosition(0, -400, 0);

    // 说话者标签
    const speakerNode = this.createNode('SpeakerName', panel);
    const speakerLabel = speakerNode.addComponent(Label);
    speakerLabel.string = '';
    speakerLabel.fontSize = 26;
    speakerLabel.color = new Color(255, 220, 100, 255);
    this.setSize(speakerNode, 700, 36);
    speakerNode.setPosition(0, -270, 0);

    // 对话文本
    const textNode = this.createNode('DialogueText', panel);
    const textLabel = textNode.addComponent(Label);
    textLabel.string = '';
    textLabel.fontSize = 24;
    textLabel.color = new Color(255, 255, 255, 255);
    textLabel.lineHeight = 34;
    textLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    this.setSize(textNode, 700, 200);
    textNode.setPosition(0, -330, 0);

    // 继续提示
    const hint = this.createNode('ContinueHint', panel);
    const hintLabel = hint.addComponent(Label);
    hintLabel.string = '▼';
    hintLabel.fontSize = 20;
    hintLabel.color = new Color(255, 255, 255, 180);
    this.setSize(hint, 60, 30);
    hint.setPosition(320, -440, 0);
    hint.active = false;

    dialogue.speakerLabel = speakerLabel;
    dialogue.textLabel = textLabel;
    dialogue.continueHint = hint;
  }

  // ==================== Choice Panel ====================

  private buildChoicePanel(parent: Node): void {
    const panel = this.createNode('ChoicePanel', parent);
    panel.active = false;
    const choice = panel.addComponent(ChoicePanel);

    const container = this.createNode('ButtonContainer', panel);
    const layout = container.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.spacingY = 12;
    layout.horizontalDirection = Layout.HorizontalDirection.CENTER;
    this.setSize(container, 600, 400);
    container.setPosition(0, -200, 0);

    // 创建选项按钮模板
    const btnPrefab = this.createNode('ChoiceButtonTemplate', container);
    this.setSize(btnPrefab, 500, 52);
    const btnSprite = btnPrefab.addComponent(Sprite);
    btnSprite.color = new Color(60, 60, 80, 220);
    btnPrefab.addComponent(Button);
    const btnLabelNode = this.createNode('Label', btnPrefab);
    const btnLabel = btnLabelNode.addComponent(Label);
    btnLabel.fontSize = 22;
    btnLabel.color = new Color(255, 255, 255, 255);

    choice.buttonContainer = container;
    (choice as any).choiceButtonPrefab = btnPrefab; // Prefab ref
  }

  // ==================== Character Display ====================

  private buildCharacterDisplay(parent: Node): void {
    const panel = this.createNode('CharacterDisplay', parent);

    const charLeft = this.createCharSlot('CharLeft', panel, -200, 0);
    const charCenter = this.createCharSlot('CharCenter', panel, 0, 0);
    const charRight = this.createCharSlot('CharRight', panel, 200, 0);

    const charDisplay = panel.addComponent(CharacterDisplay);
    charDisplay.charLeft = charLeft;
    charDisplay.charCenter = charCenter;
    charDisplay.charRight = charRight;
  }

  private createCharSlot(name: string, parent: Node, x: number, y: number): Node {
    const slot = this.createNode(name, parent);
    slot.setPosition(x, y, 0);
    this.setSize(slot, 300, 500);
    const sprite = slot.addComponent(Sprite);
    sprite.color = Color.WHITE;
    slot.active = false;
    return slot;
  }

  // ==================== Calendar Panel ====================

  private buildCalendarPanel(parent: Node): void {
    const panel = this.createNode('CalendarPanel', parent);
    panel.active = false;
    const calendar = panel.addComponent(CalendarPanel);

    // 头部
    const phaseLabelNode = this.createNode('PhaseLabel', panel);
    const phaseLabel = phaseLabelNode.addComponent(Label);
    phaseLabel.string = '';
    phaseLabel.fontSize = 32;
    phaseLabel.color = new Color(255, 255, 255, 255);
    this.setSize(phaseLabelNode, 400, 44);
    phaseLabelNode.setPosition(0, 520, 0);

    const weekLabelNode = this.createNode('WeekLabel', panel);
    const weekLabel = weekLabelNode.addComponent(Label);
    weekLabel.string = '';
    weekLabel.fontSize = 24;
    weekLabel.color = new Color(200, 200, 200, 255);
    this.setSize(weekLabelNode, 300, 36);
    weekLabelNode.setPosition(0, 480, 0);

    // 网格
    const grid = this.createNode('GridContainer', panel);
    const gridLayout = grid.addComponent(Layout);
    gridLayout.type = Layout.Type.GRID;
    gridLayout.startAxis = Layout.AxisDirection.HORIZONTAL;
    gridLayout.constraint = Layout.Constraint.FIXED_COL;
    gridLayout.constraintNum = 7;
    gridLayout.spacingX = 4;
    this.setSize(grid, 720, 500);
    grid.setPosition(0, 100, 0);

    // 执行按钮
    const execBtn = this.createNode('ExecuteBtn', panel);
    const execSprite = execBtn.addComponent(Sprite);
    execSprite.color = new Color(80, 160, 80, 255);
    execBtn.addComponent(Button);
    this.setSize(execBtn, 200, 50);
    execBtn.setPosition(0, -550, 0);
    const execText = this.createNode('Label', execBtn);
    const execLabel = execText.addComponent(Label);
    execLabel.string = '执行本周';
    execLabel.fontSize = 24;
    execLabel.color = Color.WHITE;
    execBtn.on(Button.EventType.CLICK, () => { calendar.onExecuteWeek(); });

    calendar.phaseLabel = phaseLabel;
    calendar.weekLabel = weekLabel;
    calendar.gridContainer = grid;
  }

  // ==================== Status Panel ====================

  private buildStatusPanel(parent: Node): void {
    const panel = this.createNode('StatusPanel', parent);
    const status = panel.addComponent(StatusPanel);
    panel.setPosition(0, 620, 0);

    // 能量条
    const barBg = this.createNode('EnergyBarBg', panel);
    this.addSprite(barBg, new Color(40, 40, 40, 200));
    this.setSize(barBg, 700, 16);
    barBg.setPosition(0, 20, 0);

    const energyBarNode = this.createNode('EnergyBar', barBg);
    const energyBar = energyBarNode.addComponent(Sprite);
    energyBar.color = new Color(80, 200, 80, 255);
    this.setSize(energyBarNode, 700, 16);
    energyBarNode.setPosition(0, 0, 0);
    energyBarNode.setAnchorPoint(0, 0.5);
    energyBarNode.setPosition(-350, 0, 0);

    const energyLabelNode = this.createNode('EnergyLabel', panel);
    const energyLabel = energyLabelNode.addComponent(Label);
    energyLabel.string = '100/100';
    energyLabel.fontSize = 16;
    energyLabel.color = new Color(220, 220, 220, 255);
    this.setSize(energyLabelNode, 120, 24);
    energyLabelNode.setPosition(300, 40, 0);

    // 五项数值
    const stats = [
      { name: 'academicLabel', label: '学', pos: -280 },
      { name: 'sportsLabel', label: '体', pos: -140 },
      { name: 'artLabel', label: '艺', pos: 0 },
      { name: 'socialLabel', label: '社', pos: 140 },
      { name: 'interestLabel', label: '兴', pos: 280 },
    ];

    for (const s of stats) {
      const node = this.createNode(s.name, panel);
      const lbl = node.addComponent(Label);
      lbl.string = `${s.label} 50`;
      lbl.fontSize = 18;
      lbl.color = Color.WHITE;
      this.setSize(node, 110, 28);
      node.setPosition(s.pos, 60, 0);
      (status as any)[s.name] = lbl;
    }

    status.energyLabel = energyLabel;
    status.energyBar = energyBar;
  }

  // ==================== Week Summary Panel ====================

  private buildWeekSummaryPanel(parent: Node): void {
    const panel = this.createNode('WeekSummaryPanel', parent);
    panel.active = false;
    const summary = panel.addComponent(WeekSummaryPanel);

    const innerPanel = this.createNode('Panel', panel);
    this.addSprite(innerPanel, new Color(30, 30, 50, 240));
    this.setSize(innerPanel, 650, 500);
    innerPanel.setPosition(0, 0, 0);

    const weekLabelNode = this.createNode('WeekLabel', innerPanel);
    const weekLabel = weekLabelNode.addComponent(Label);
    weekLabel.string = '';
    weekLabel.fontSize = 30;
    weekLabel.color = new Color(255, 220, 100, 255);
    this.setSize(weekLabelNode, 500, 44);
    weekLabelNode.setPosition(0, 210, 0);

    const summaryText = this.createNode('SummaryLabel', innerPanel);
    const summaryLabel = summaryText.addComponent(Label);
    summaryLabel.string = '';
    summaryLabel.fontSize = 22;
    summaryLabel.color = new Color(220, 220, 220, 255);
    summaryLabel.lineHeight = 32;
    summaryLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    this.setSize(summaryText, 580, 380);
    summaryText.setPosition(0, -20, 0);
    summaryText.setAnchorPoint(0.5, 1);

    const closeBtn = this.createNode('CloseBtn', innerPanel);
    const closeSprite = closeBtn.addComponent(Sprite);
    closeSprite.color = new Color(80, 160, 80, 255);
    closeBtn.addComponent(Button);
    this.setSize(closeBtn, 150, 44);
    closeBtn.setPosition(0, -210, 0);
    const closeText = this.createNode('Label', closeBtn);
    const closeLabel = closeText.addComponent(Label);
    closeLabel.string = '继续';
    closeLabel.fontSize = 22;
    closeLabel.color = Color.WHITE;
    closeBtn.on(Button.EventType.CLICK, () => { summary.onClose(); });

    summary.panel = innerPanel;
    summary.weekLabel = weekLabel;
    summary.summaryLabel = summaryLabel;
    summary.closeButton = closeBtn;
  }

  // ==================== Character Create ====================

  private buildCharacterCreate(parent: Node, boot: SceneBoot): void {
    const panel = this.createNode('CharacterCreate', parent);
    this.addSprite(panel, new Color(20, 20, 40, 255));
    this.setSize(panel, 750, 1334);
    panel.setPosition(0, 0, 0);

    const titleNode = this.createNode('TitleLabel', panel);
    const titleLabel = titleNode.addComponent(Label);
    titleLabel.string = '欢迎来到像素校园';
    titleLabel.fontSize = 36;
    titleLabel.color = new Color(255, 255, 255, 255);
    this.setSize(titleNode, 600, 56);
    titleNode.setPosition(0, 300, 0);

    const subTitleNode = this.createNode('SubTitleLabel', panel);
    const subLabel = subTitleNode.addComponent(Label);
    subLabel.string = '创建你的角色';
    subLabel.fontSize = 24;
    subLabel.color = new Color(200, 200, 200, 255);
    this.setSize(subTitleNode, 400, 36);
    subTitleNode.setPosition(0, 250, 0);

    // 性别选择
    let selectedGender: 'male' | 'female' = 'male';

    const maleBtn = this.createButton('MaleBtn', panel, '男生', 0, 100, 200, 80);
    const maleSprite = maleBtn.getComponent(Sprite)!;
    maleSprite.color = new Color(80, 120, 200, 255);
    maleBtn.on(Button.EventType.CLICK, () => {
      selectedGender = 'male';
      maleSprite.color = new Color(80, 160, 255, 255);
      panel.getChildByName('FemaleBtn')!.getComponent(Sprite)!.color = new Color(80, 80, 100, 255);
    });

    const femaleBtn = this.createButton('FemaleBtn', panel, '女生', 0, -20, 200, 80);
    const femaleSprite = femaleBtn.getComponent(Sprite)!;
    femaleSprite.color = new Color(80, 80, 100, 255);
    femaleBtn.on(Button.EventType.CLICK, () => {
      selectedGender = 'female';
      femaleSprite.color = new Color(255, 140, 180, 255);
      maleSprite.color = new Color(80, 80, 100, 255);
    });

    // 确认按钮
    const confirmBtn = this.createButton('ConfirmBtn', panel, '开始游戏', 0, -160, 300, 64);
    const confirmSprite = confirmBtn.getComponent(Sprite)!;
    confirmSprite.color = new Color(80, 180, 80, 255);
    confirmBtn.on(Button.EventType.CLICK, () => {
      const name = selectedGender === 'male' ? '小明' : '小丽';
      boot.onCharacterConfirmed(name, selectedGender);
      panel.active = false;
    });

    boot.characterCreateNode = panel;
  }

  // ==================== Utility ====================

  private createNode(name: string, parent: Node): Node {
    const node = new Node(name);
    node.layer = parent.layer; // 确保渲染层级正确
    node.addComponent(UITransform);
    node.setParent(parent);
    return node;
  }

  private createButton(name: string, parent: Node, text: string, x: number, y: number, w: number, h: number): Node {
    const btn = this.createNode(name, parent);
    btn.addComponent(Sprite);
    btn.addComponent(Button);
    this.setSize(btn, w, h);
    btn.setPosition(x, y, 0);

    const labelNode = this.createNode('Label', btn);
    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = 24;
    label.color = Color.WHITE;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    this.setSize(labelNode, w - 20, h - 10);

    return btn;
  }

  private addSprite(node: Node, color: Color): void {
    const sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
    sprite.color = color;
  }

  private setSize(node: Node, w: number, h: number): void {
    const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
    ui.setContentSize(w, h);
  }
}
