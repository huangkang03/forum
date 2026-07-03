# Cocos Creator 场景搭建指南

## 前提

用 Cocos Creator 3.x 打开 `D:\hk\learn` 作为项目。控制台应该没有红色报错（黄色警告可以忽略）。

---

## 第一步：创建主场景

1. 在 `assets/scenes` 右键 → 新建 → Scene，命名为 `MainScene`
2. 双击打开 `MainScene`
3. Canvas 节点已存在，设置其 `UITransform` 为 750×1334

---

## 第二步：挂载核心脚本

在 Canvas 下创建以下空节点，分别挂载对应脚本：

| 节点名 | 挂载的脚本 |
|--------|-----------|
| `SceneBoot` | `assets/scripts/SceneBoot.ts` |
| `GameManager` | `assets/scripts/core/GameManager.ts` |
| `EventManager` | 不需要挂载（单例自动创建） |
| `StoryManager` | `assets/scripts/story/StoryManager.ts` |
| `CalendarManager` | `assets/scripts/calendar/CalendarManager.ts` |
| `CharacterManager` | `assets/scripts/character/CharacterManager.ts` |
| `AudioManager` | `assets/scripts/audio/AudioManager.ts` |

**绑定属性：** 选中 `SceneBoot` 节点，把 `GameManager` 节点拖到 `gameManagerNode` 属性框。

---

## 第三步：创建 UI 层

在 Canvas 下创建 `UILayer` 节点，下面创建子节点：

```
UILayer
├── DialoguePanel     — 挂载 DialoguePanel.ts
├── CalendarPanel     — 挂载 CalendarPanel.ts
├── StatusPanel       — 挂载 StatusPanel.ts
├── ChoicePanel       — 挂载 ChoicePanel.ts
├── CharacterDisplay  — 挂载 CharacterDisplay.ts
├── WeekSummaryPanel  — 挂载 WeekSummaryPanel.ts
└── CharacterCreate   — 主角创建界面（先手动搭建）
```

把 `UILayer` 拖到 `GameManager` 的 `uiLayer` 属性框。

---

## 第四步：搭建对话面板 (DialoguePanel)

`DialoguePanel` 节点下创建：

```
DialoguePanel (挂载 DialoguePanel.ts)
├── Background — Sprite（半透明黑色底）
├── SpeakerLabel — Label
├── TextLabel — Label（多行，字体大小 28）
└── ContinueHint — Label（显示 "▼"）
```

**绑定：** 把 `SpeakerLabel` 拖到脚本的 `speakerLabel` 属性，`TextLabel` 拖到 `textLabel`，`ContinueHint` 拖到 `continueHint`。

---

## 第五步：搭建角色创建界面 (CharacterCreate)

```
CharacterCreate
├── TitleLabel — Label "创建你的角色"
├── NameInput — （Cocos 没有原生输入框，用微信的 wx.showKeyboard 或做一个选择器）
├── GenderGroup
│   ├── MaleBtn — Button + Label "男生"
│   └── FemaleBtn — Button + Label "女生"
└── ConfirmBtn — Button + Label "开始游戏"
```

男生按钮点击时记录 gender = 'male'，女生按钮点击时记录 gender = 'female'。
确认按钮点击时调用 `SceneBoot.instance.onCharacterConfirmed(name, gender)`。

**绑定：** 把 `CharacterCreate` 节点拖到 `SceneBoot` 的 `characterCreateNode` 属性。

---

## 第六步：搭建日历面板 (CalendarPanel)

```
CalendarPanel (挂载 CalendarPanel.ts)
├── Header
│   ├── PhaseLabel — Label "小学一年级"
│   └── WeekLabel — Label "第 1 周"
├── GridContainer — Layout (Grid, 7列)
│   └── DayColumn (7个，周一到周日)
│       ├── DayLabel — Label "一"
│       ├── MorningSlot — Button + Label "上午"
│       ├── AfternoonSlot — Button + Label "下午"
│       └── EveningSlot — Button + Label "晚上"
├── ActivityPicker — 弹出的活动选择面板
└── ExecuteBtn — Button + Label "执行本周"
```

**绑定：** `PhaseLabel` → `phaseLabel`, `WeekLabel` → `weekLabel`, `GridContainer` → `gridContainer`。

---

## 第七步：搭建状态面板 (StatusPanel)

```
StatusPanel (挂载 StatusPanel.ts，放在顶部)
├── EnergyBar — Sprite (红色长条，Scale X 控制)
├── EnergyLabel — Label "80/100"
├── AcademicLabel  — Label "📚 50"
├── SportsLabel    — Label "⚽ 50"
├── ArtLabel       — Label "🎨 50"
├── SocialLabel    — Label "💬 50"
└── InterestLabel  — Label "🎮 50"
```

**绑定：** 六个 Label + EnergyBar 拖到对应属性。

---

## 第八步：搭建周总结面板 (WeekSummaryPanel)

```
WeekSummaryPanel
├── Panel (弹窗容器)
│   ├── WeekLabel — Label
│   ├── SummaryLabel — Label (多行)
│   └── CloseBtn — Button + Label "继续"
```

**绑定：** `Panel` → `panel`, `WeekLabel` → `weekLabel`, `SummaryLabel` → `summaryLabel`, `CloseBtn` → `closeButton`。

---

## 第九步：搭建角色展示层 (CharacterDisplay)

```
CharacterDisplay (挂载 CharacterDisplay.ts)
├── CharLeft   — Sprite (左侧站位)
├── CharCenter — Sprite (中央站位)
└── CharRight  — Sprite (右侧站位)
```

**绑定：** 三个 Node 拖到对应属性 `charLeft/charCenter/charRight`。

---

## 第十步：搭建选项面板 (ChoicePanel)

```
ChoicePanel (挂载 ChoicePanel.ts)
├── ButtonContainer — Layout (Vertical, 从上到下排列)
│   └── ChoiceButton (Prefab)
└── ChoiceButtonPrefab (预制体)
    └── Label — Label
```

**步骤：**
1. 先创建 `ChoiceButton` 预制体（一个 Button + Label）
2. 绑定 `choiceButtonPrefab` 到脚本属性
3. 绑定 `buttonContainer` 到脚本属性

---

## 第十一步：设置常驻节点

选中 `GameManager` 节点，在属性面板勾选「Persist Root」（如果有此选项），或者脚本中已经通过 `game.addPersistRootNode` 处理。

---

## 第十二步：运行测试

1. 点击编辑器顶部的播放按钮 ▶
2. 应该看到主角创建界面（如果没有存档）
3. 选择性别后点击确认 → 开始播放第一章剧情
4. 点击对话框 → 文本逐句推进 → 遇到选项做出选择
5. 剧情结束 → 进入日历自由模式
6. 安排一周活动 → 点击执行 → 周总结弹出
7. 测试存档：关闭再打开，应该自动读档

---

## 常见问题

| 问题 | 解决 |
|------|------|
| `Cannot read property 'instance' of null` | 脚本挂载顺序问题。确保 GameManager 在 SceneBoot 之前加载 |
| 黑屏无反应 | 检查 Canvas 节点是否有 Camera 组件 |
| 点击无响应 | 检查节点是否有 UITransform + Button/Sprite 组件 |
| 微信 API 报错 | 在 Cocos 预览中 `wx` 不存在是正常的，真机调试才有 |
| 剧情不播放 | 检查 `chapter_1.json` 和 `primary_1_semester_1.json` 是否在 resources 目录下 |
