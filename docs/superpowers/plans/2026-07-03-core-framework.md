# 像素校园 · 核心框架 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建游戏核心框架 — 学段系统、日历养成、故事引擎、存档云同步，供后续填充每个学段的具体剧情内容。

**Architecture:** GameManager 为全局单例持有所有状态；StoryManager 和 CalendarManager 通过 EventManager 解耦；UI 层（CalendarPanel / DialoguePanel / StatusPanel）监听事件刷新；数据通过 SaveManager 持久化至本地 + 微信云。

**Tech Stack:** Cocos Creator 3.x, TypeScript, 微信云开发 (CloudBase), 微信小游戏 API

## Global Constraints

- 设计分辨率：750 × 1334
- 微信小游戏代码包 ≤ 4MB
- TypeScript strict mode
- 所有常量定义在 `GameConfig.ts`，禁止硬编码数值
- 模块间通过 EventManager 通信，不直接引用
- 文件名使用 PascalCase，目录名使用 camelCase

---

### Task 1: 游戏全局常量配置

**Files:**
- Create: `assets/scripts/data/GameConfig.ts`

**Interfaces:**
- Consumes: 无
- Produces: `SchoolPhase` enum, `ActivityType` enum, `StatType` enum, `ACTIVITY_CONFIG` map, `PHASE_CONFIG` map, `AFFECTION_LEVELS`

- [ ] **Step 1: 创建 GameConfig.ts**

```typescript
// assets/scripts/data/GameConfig.ts

/** 游戏学段 */
export enum SchoolPhase {
  KINDERGARTEN = 'kindergarten',
  PRIMARY_1 = 'primary_1', PRIMARY_2 = 'primary_2', PRIMARY_3 = 'primary_3',
  PRIMARY_4 = 'primary_4', PRIMARY_5 = 'primary_5', PRIMARY_6 = 'primary_6',
  JUNIOR_1 = 'junior_1', JUNIOR_2 = 'junior_2', JUNIOR_3 = 'junior_3',
  SENIOR_1 = 'senior_1', SENIOR_2 = 'senior_2', SENIOR_3 = 'senior_3',
  COLLEGE_1 = 'college_1', COLLEGE_2 = 'college_2', COLLEGE_3 = 'college_3', COLLEGE_4 = 'college_4',
  MASTER_1 = 'master_1', MASTER_2 = 'master_2',
  PHD_1 = 'phd_1', PHD_2 = 'phd_2', PHD_3 = 'phd_3',
}

/** 活动槽位 */
export enum ActivitySlot { MORNING = 'morning', AFTERNOON = 'afternoon', EVENING = 'evening' }

/** 活动类型 */
export enum ActivityType { STUDY = 'study', SPORTS = 'sports', ART = 'art', SOCIAL = 'social', INTEREST = 'interest', REST = 'rest', EVENT = 'event' }

/** 五项数值 */
export enum StatType { ACADEMIC = 'academic', SPORTS = 'sports', ART = 'art', SOCIAL = 'social', INTEREST = 'interest' }

/** 活动配置 */
export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string; energy: number; stats: Partial<Record<StatType, number>> }> = {
  [ActivityType.STUDY]:   { label: '学习', icon: '📚', energy: -15, stats: { [StatType.ACADEMIC]: 4 } },
  [ActivityType.SPORTS]:  { label: '运动', icon: '⚽', energy: -20, stats: { [StatType.SPORTS]: 4 } },
  [ActivityType.ART]:     { label: '艺术', icon: '🎨', energy: -10, stats: { [StatType.ART]: 4 } },
  [ActivityType.SOCIAL]:  { label: '社交', icon: '💬', energy: -10, stats: { [StatType.SOCIAL]: 4 } },
  [ActivityType.INTEREST]:{ label: '兴趣', icon: '🎮', energy: -10, stats: { [StatType.INTEREST]: 4 } },
  [ActivityType.REST]:    { label: '休息', icon: '😴', energy: 30,  stats: {} },
  [ActivityType.EVENT]:   { label: '特殊', icon: '🔀', energy: 0,   stats: {} },
};

/** 学段配置 */
export const PHASE_CONFIG: Record<SchoolPhase, { name: string; weeks: number; prevPhase: SchoolPhase | null; nextPhase: SchoolPhase | null }> = {
  [SchoolPhase.KINDERGARTEN]: { name: '幼儿园', weeks: 4,  prevPhase: null,             nextPhase: SchoolPhase.PRIMARY_1 },
  [SchoolPhase.PRIMARY_1]:    { name: '小学一年级', weeks: 8,  prevPhase: SchoolPhase.KINDERGARTEN, nextPhase: SchoolPhase.PRIMARY_2 },
  [SchoolPhase.PRIMARY_2]:    { name: '小学二年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_1,    nextPhase: SchoolPhase.PRIMARY_3 },
  [SchoolPhase.PRIMARY_3]:    { name: '小学三年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_2,    nextPhase: SchoolPhase.PRIMARY_4 },
  [SchoolPhase.PRIMARY_4]:    { name: '小学四年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_3,    nextPhase: SchoolPhase.PRIMARY_5 },
  [SchoolPhase.PRIMARY_5]:    { name: '小学五年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_4,    nextPhase: SchoolPhase.PRIMARY_6 },
  [SchoolPhase.PRIMARY_6]:    { name: '小学六年级', weeks: 10, prevPhase: SchoolPhase.PRIMARY_5,    nextPhase: SchoolPhase.JUNIOR_1 },
  [SchoolPhase.JUNIOR_1]:     { name: '初中一年级', weeks: 10, prevPhase: SchoolPhase.PRIMARY_6,    nextPhase: SchoolPhase.JUNIOR_2 },
  [SchoolPhase.JUNIOR_2]:     { name: '初中二年级', weeks: 10, prevPhase: SchoolPhase.JUNIOR_1,     nextPhase: SchoolPhase.JUNIOR_3 },
  [SchoolPhase.JUNIOR_3]:     { name: '初中三年级', weeks: 12, prevPhase: SchoolPhase.JUNIOR_2,     nextPhase: SchoolPhase.SENIOR_1 },
  [SchoolPhase.SENIOR_1]:     { name: '高中一年级', weeks: 12, prevPhase: SchoolPhase.JUNIOR_3,     nextPhase: SchoolPhase.SENIOR_2 },
  [SchoolPhase.SENIOR_2]:     { name: '高中二年级', weeks: 12, prevPhase: SchoolPhase.SENIOR_1,     nextPhase: SchoolPhase.SENIOR_3 },
  [SchoolPhase.SENIOR_3]:     { name: '高中三年级', weeks: 14, prevPhase: SchoolPhase.SENIOR_2,     nextPhase: SchoolPhase.COLLEGE_1 },
  [SchoolPhase.COLLEGE_1]:    { name: '大学一年级', weeks: 14, prevPhase: SchoolPhase.SENIOR_3,     nextPhase: SchoolPhase.COLLEGE_2 },
  [SchoolPhase.COLLEGE_2]:    { name: '大学二年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_1,    nextPhase: SchoolPhase.COLLEGE_3 },
  [SchoolPhase.COLLEGE_3]:    { name: '大学三年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_2,    nextPhase: SchoolPhase.COLLEGE_4 },
  [SchoolPhase.COLLEGE_4]:    { name: '大学四年级', weeks: 16, prevPhase: SchoolPhase.COLLEGE_3,    nextPhase: SchoolPhase.MASTER_1 },
  [SchoolPhase.MASTER_1]:     { name: '硕士一年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_4,    nextPhase: SchoolPhase.MASTER_2 },
  [SchoolPhase.MASTER_2]:     { name: '硕士二年级', weeks: 16, prevPhase: SchoolPhase.MASTER_1,     nextPhase: SchoolPhase.PHD_1 },
  [SchoolPhase.PHD_1]:        { name: '博士一年级', weeks: 14, prevPhase: SchoolPhase.MASTER_2,     nextPhase: SchoolPhase.PHD_2 },
  [SchoolPhase.PHD_2]:        { name: '博士二年级', weeks: 16, prevPhase: SchoolPhase.PHD_1,        nextPhase: SchoolPhase.PHD_3 },
  [SchoolPhase.PHD_3]:        { name: '博士三年级', weeks: 18, prevPhase: SchoolPhase.PHD_2,        nextPhase: null },
};

/** 好感度等级 */
export const AFFECTION_LEVELS = [
  { min: 0,  max: 19, label: '陌生人',  unlock: 'basic' },
  { min: 20, max: 39, label: '相识',    unlock: 'chat' },
  { min: 40, max: 59, label: '朋友',    unlock: 'weekend' },
  { min: 60, max: 79, label: '好友',    unlock: 'personal_story' },
  { min: 80, max: 100,label: '挚友/恋人', unlock: 'ending' },
];

/** 能量上限 */
export const MAX_ENERGY = 100;

/** 能量低收益惩罚阈值 */
export const LOW_ENERGY_THRESHOLD = 30;

/** 每日活动槽位（周末上午自动休息） */
export const WEEKDAY_SLOTS = [ActivitySlot.MORNING, ActivitySlot.AFTERNOON, ActivitySlot.EVENING];
export const WEEKEND_SLOTS = [ActivitySlot.AFTERNOON, ActivitySlot.EVENING];
```

- [ ] **Step 2: 验证编译**

```bash
# 在 Cocos Creator 中打开项目，确认控制台无 TypeScript 报错
```

- [ ] **Step 3: 提交**

```bash
git add assets/scripts/data/GameConfig.ts
git commit -m "feat: add game constants config (phases, activities, affection levels)"
```

---

### Task 2: 日历数据类型定义

**Files:**
- Create: `assets/scripts/calendar/CalendarData.ts`

**Interfaces:**
- Consumes: `data/GameConfig.ts` (ActivityType, StatType, ActivitySlot, SchoolPhase)
- Produces: `WeekPlan`, `DayPlan`, `WeekResult`, `CalendarState`, `RandomEvent` 接口

- [ ] **Step 1: 创建 CalendarData.ts**

```typescript
// assets/scripts/calendar/CalendarData.ts
import { ActivityType, StatType, ActivitySlot } from '../data/GameConfig';

/** 单日活动计划 */
export interface DayPlan {
  /** 上午活动 */
  morning: ActivityType;
  /** 下午活动 */
  afternoon: ActivityType;
  /** 晚上活动 */
  evening: ActivityType;
}

/** 一周活动计划（7天） */
export interface WeekPlan {
  weekNumber: number;
  days: [DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan]; // 周一~周日
}

/** 周结算结果 */
export interface WeekResult {
  weekNumber: number;
  statChanges: Partial<Record<StatType, number>>;
  energyDelta: number;
  triggeredEvents: RandomEvent[];
  unlockedFlags: string[];
}

/** 随机事件 */
export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  /** 触发条件 */
  conditions: EventCondition[];
  /** 选项 */
  choices?: EventChoice[];
  /** 执行效果 */
  effects: EventEffect[];
}

export interface EventCondition {
  stat: StatType;
  min?: number;
  max?: number;
  flag?: string;
  weekDay?: number; // 0-6, 一周中的某天
}

export interface EventChoice {
  text: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'statChange' | 'setFlag' | 'energyChange' | 'triggerStory';
  stat?: StatType;
  delta?: number;
  flag?: string;
  storyId?: string;
}

/** 日历全局状态 */
export interface CalendarState {
  phase: string;
  currentWeek: number;
  totalWeeks: number;
  weekPlan: WeekPlan | null;
  isSpecialWeek: boolean; // 考试周/活动周等，锁定活动
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/calendar/CalendarData.ts
git commit -m "feat: add calendar data types (WeekPlan, DayPlan, RandomEvent)"
```

---

### Task 3: GameManager 重写 — 全局状态管理

**Files:**
- Modify: `assets/scripts/core/GameManager.ts`

**Interfaces:**
- Consumes: `data/GameConfig.ts` (SchoolPhase, StatType, ActivityType)
- Produces: `GameManager.instance` 单例，`PlayerData` 接口，`gameMode` 枚举

- [ ] **Step 1: 重写 GameManager.ts**

```typescript
// assets/scripts/core/GameManager.ts
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

  // ---- 主角创建 ----
  setCharacter(name: string, gender: 'male' | 'female'): void {
    this.player.playerName = name;
    this.player.playerGender = gender;
    this.player.flags.add(gender === 'male' ? 'protagonist_male' : 'protagonist_female');
    this.player.flags.add('childhood_friend_' + (gender === 'male' ? 'xiaowei' : 'xiaokang'));
  }

  // ---- 模式切换 ----
  enterStoryMode(): void { this.gameMode = GameMode.STORY; }
  enterCalendarMode(): void { this.gameMode = GameMode.CALENDAR; }
  enterExamMode(): void { this.gameMode = GameMode.EXAM; }

  // ---- 数值操作 ----
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

  /** 推进到下一学段 */
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
```

- [ ] **Step 2: 更新 EventManager 事件常量**

修改 `assets/scripts/core/EventManager.ts`，在 GameEvents 对象末尾新增：

```typescript
MODE_CHANGED:       'MODE_CHANGED',
WEEK_START:         'WEEK_START',
WEEK_EXECUTED:      'WEEK_EXECUTED',
WEEK_SUMMARY_SHOW:  'WEEK_SUMMARY_SHOW',
STAT_CHANGED:       'STAT_CHANGED',
ENERGY_CHANGED:     'ENERGY_CHANGED',
RANDOM_EVENT:       'RANDOM_EVENT',
PHASE_ADVANCE:      'PHASE_ADVANCE',
CHARACTER_CREATED:  'CHARACTER_CREATED',
```

- [ ] **Step 3: 提交**

```bash
git add assets/scripts/core/GameManager.ts assets/scripts/core/EventManager.ts
git commit -m "feat: rewrite GameManager with phase system, stats, and game modes"
```

---

### Task 4: CalendarManager — 日历推演引擎

**Files:**
- Create: `assets/scripts/calendar/CalendarManager.ts`

**Interfaces:**
- Consumes: `GameConfig.ts` (ACTIVITY_CONFIG, WEEKDAY_SLOTS, WEEKEND_SLOTS, LOW_ENERGY_THRESHOLD, StatType, ActivityType), `GameManager.instance.player/stats/energy`, `CalendarData.ts` (WeekPlan, DayPlan), `EventManager`
- Produces: `CalendarManager.instance`, `executeWeek(plan)` → WeekResult

- [ ] **Step 1: 创建 CalendarManager.ts**

```typescript
// assets/scripts/calendar/CalendarManager.ts
import { _decorator, Component } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { ACTIVITY_CONFIG, WEEKDAY_SLOTS, WEEKEND_SLOTS, LOW_ENERGY_THRESHOLD, StatType, ActivityType } from '../data/GameConfig';
import { WeekPlan, WeekResult, RandomEvent } from './CalendarData';

const { ccclass } = _decorator;

@ccclass('CalendarManager')
export class CalendarManager extends Component {
  private static _instance: CalendarManager | null = null;
  static get instance(): CalendarManager { return CalendarManager._instance!; }

  onLoad(): void {
    if (CalendarManager._instance) { this.destroy(); return; }
    CalendarManager._instance = this;
    EventManager.on(GameEvents.WEEK_START, this.onWeekStart, this);
  }

  /** 执行一周计划 */
  executeWeek(plan: WeekPlan): WeekResult {
    const gm = GameManager.instance;
    const result: WeekResult = {
      weekNumber: gm.player.currentWeek,
      statChanges: {},
      energyDelta: 0,
      triggeredEvents: [],
      unlockedFlags: [],
    };

    // 逐日执行
    for (let i = 0; i < 7; i++) {
      const isWeekend = i >= 5;
      const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
      const day = plan.days[i];

      for (const slot of slots) {
        const activity = day[slot];
        const config = ACTIVITY_CONFIG[activity];

        // 能量低的收益惩罚
        const penalty = gm.player.energy < LOW_ENERGY_THRESHOLD ? 0.5 : 1.0;

        // 应用数值变化
        for (const [stat, baseDelta] of Object.entries(config.stats)) {
          const delta = Math.round(baseDelta * penalty);
          gm.modifyStat(stat as StatType, delta);
          result.statChanges[stat as StatType] = (result.statChanges[stat as StatType] || 0) + delta;
        }

        // 能量变化
        gm.modifyEnergy(config.energy);
        result.energyDelta += config.energy;

        // 随机事件检测（每周约30%概率触发）
        if (Math.random() < 0.05) {
          const event = this.pickRandomEvent(gm);
          if (event) result.triggeredEvents.push(event);
        }
      }
    }

    gm.player.currentWeek++;

    EventManager.emit(GameEvents.WEEK_EXECUTED, result);
    return result;
  }

  private pickRandomEvent(gm: GameManager): RandomEvent | null {
    // 从事件池中按条件匹配
    return null; // TODO: 阶段二填充事件池
  }

  private onWeekStart(): void {
    EventManager.emit(GameEvents.WEEK_SUMMARY_SHOW);
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/calendar/CalendarManager.ts
git commit -m "feat: add calendar engine with week execution and stat calculation"
```

---

### Task 5: CharacterManager — 角色管理

**Files:**
- Create: `assets/scripts/character/CharacterManager.ts`

**Interfaces:**
- Consumes: `GameManager.instance.player.affection/flags`, `AFFECTION_LEVELS`, `EventManager`
- Produces: `CharacterManager.instance`, `getCharacter(id)`, `getAffectionLevel(charId)`, `registerCharacter(def)`

- [ ] **Step 1: 创建 CharacterManager.ts**

```typescript
// assets/scripts/character/CharacterManager.ts
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

  getCharacter(id: string): CharacterDef | undefined { return this._characters.get(id); }

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
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/character/CharacterManager.ts
git commit -m "feat: add character manager with affection levels and childhood friend system"
```

---

### Task 6: SaveManager 重写 — 加入云端同步

**Files:**
- Modify: `assets/scripts/data/SaveManager.ts`

**Interfaces:**
- Consumes: `GameManager.instance.player`, `PlayerData`
- Produces: `SaveManager.save(slot)`, `SaveManager.load(slot)`, 云端同步

- [ ] **Step 1: 重写 SaveManager.ts**

```typescript
// assets/scripts/data/SaveManager.ts
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager, PlayerData } from '../core/GameManager';
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

  /** 保存 */
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

    // 本地存储
    this.setLocalSave(slot, json);

    // 云端同步（静默，失败不影响游戏）
    try { await this.cloudUpload(slot, json); } catch {}

    EventManager.emit(GameEvents.GAME_SAVED, slot, data);
    return true;
  }

  /** 读档 */
  async load(slot: number = 0): Promise<SaveData | null> {
    // 优先云端
    let json: string | null = null;
    try { json = await this.cloudDownload(slot); } catch {}

    // 降级本地
    if (!json) json = this.getLocalSave(slot);
    if (!json) return null;

    const data = JSON.parse(json) as SaveData;
    this.applySaveData(data);
    EventManager.emit(GameEvents.GAME_LOADED, data);
    return data;
  }

  /** 应用存档到 GameManager */
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

  /** 获取存档列表 */
  async listSaves(): Promise<{ slot: number; data: SaveData }[]> {
    const saves: { slot: number; data: SaveData }[] = [];
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      const json = this.getLocalSave(i);
      if (json) {
        try { saves.push({ slot: i, data: JSON.parse(json) }); } catch {}
      }
    }
    saves.sort((a, b) => b.data.timestamp - a.data.timestamp);
    return saves;
  }

  async deleteSave(slot: number): Promise<void> {
    this.removeLocalSave(slot);
  }

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
    await wx.cloud.uploadFile({
      cloudPath: this.CLOUD_PATH + `save_${slot}.json`,
      fileContent: json,
    });
  }
  private async cloudDownload(slot: number): Promise<string | null> {
    if (typeof wx === 'undefined' || !wx.cloud) return null;
    const res = await wx.cloud.downloadFile({
      fileID: this.CLOUD_PATH + `save_${slot}.json`,
    });
    return (res as any).tempFilePath ? 'from_cloud' : null;
  }
}

export const SaveManager = new SaveManagerCls();
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/data/SaveManager.ts
git commit -m "feat: rewrite save system with cloud sync and new player data structure"
```

---

### Task 7: CalendarPanel — 日历 UI 组件

**Files:**
- Create: `assets/scripts/ui/CalendarPanel.ts`

**Interfaces:**
- Consumes: `GameManager.instance.player`, `CalendarManager.instance.executeWeek()`, `ACTIVITY_CONFIG`, `WEEKDAY_SLOTS`, `WEEKEND_SLOTS`
- Produces: 日历 UI 面板，玩家交互 → 提交 WeekPlan

- [ ] **Step 1: 创建 CalendarPanel.ts**

```typescript
// assets/scripts/ui/CalendarPanel.ts
import { _decorator, Component, Node, Label, Sprite, Color, instantiate, Prefab, Layout, Button } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager, GameMode } from '../core/GameManager';
import { CalendarManager } from '../calendar/CalendarManager';
import { ACTIVITY_CONFIG, WEEKDAY_SLOTS, WEEKEND_SLOTS, SchoolPhase, PHASE_CONFIG } from '../data/GameConfig';
import { ActivityType, ActivitySlot } from '../data/GameConfig';
import { WeekPlan, DayPlan } from '../calendar/CalendarData';

const { ccclass, property } = _decorator;

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const SLOT_LABELS = { morning: '上午', afternoon: '下午', evening: '晚上' };

@ccclass('CalendarPanel')
export class CalendarPanel extends Component {
  @property(Prefab) dayColumnPrefab: Prefab = null!;
  @property(Prefab) activityButtonPrefab: Prefab = null!;
  @property(Label) weekLabel: Label = null!;
  @property(Label) phaseLabel: Label = null!;
  @property(Node) gridContainer: Node = null!;

  private _currentPlan: WeekPlan;
  private _selectedDay: number = 0;
  private _selectedSlot: ActivitySlot = ActivitySlot.MORNING;

  onLoad(): void {
    EventManager.on(GameEvents.MODE_CHANGED, this.onModeChanged, this);
    this.node.active = false;
  }

  /** 进入日历模式时触发 */
  private onModeChanged(mode: GameMode): void {
    if (mode !== GameMode.CALENDAR) { this.node.active = false; return; }
    this.node.active = true;
    this.buildCalendar();
  }

  private buildCalendar(): void {
    const gm = GameManager.instance;
    const phaseConfig = PHASE_CONFIG[gm.player.currentPhase];
    this.weekLabel.string = `第 ${gm.player.currentWeek + 1} 周`;
    this.phaseLabel.string = phaseConfig.name;

    this._currentPlan = { weekNumber: gm.player.currentWeek, days: Array(7).fill(null).map(() => ({
      morning: ActivityType.REST, afternoon: ActivityType.REST, evening: ActivityType.REST,
    })) as any };
  }

  /** 点击活动槽 → 弹出活动选择器 */
  onSlotClick(dayIndex: number, slot: ActivitySlot): void {
    if (dayIndex >= 5 && slot === ActivitySlot.MORNING) return; // 周末上午不能选
    this._selectedDay = dayIndex;
    this._selectedSlot = slot;
    // 显示活动选择 UI
    EventManager.emit('ACTIVITY_PICKER_SHOW', dayIndex, slot);
  }

  /** 选择活动后回调 */
  setActivity(activity: ActivityType): void {
    this._currentPlan.days[this._selectedDay][this._selectedSlot] = activity;
    // 更新对应格子的文字
  }

  /** 点击「执行本周」 */
  onExecuteWeek(): void {
    CalendarManager.instance.executeWeek(this._currentPlan);
    EventManager.emit(GameEvents.WEEK_EXECUTED);
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/ui/CalendarPanel.ts
git commit -m "feat: add calendar UI panel with week planning interface"
```

---

### Task 8: StatusPanel — 数值展示 UI

**Files:**
- Create: `assets/scripts/ui/StatusPanel.ts`

**Interfaces:**
- Consumes: `GameManager.instance.player.stats/energy`, `EventManager`
- Produces: 常驻顶部或底部的数值 HUD

- [ ] **Step 1: 创建 StatusPanel.ts**

```typescript
// assets/scripts/ui/StatusPanel.ts
import { _decorator, Component, Label, Sprite, Color } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { StatType, MAX_ENERGY } from '../data/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('StatusPanel')
export class StatusPanel extends Component {
  @property(Label) academicLabel: Label = null!;
  @property(Label) sportsLabel: Label = null!;
  @property(Label) artLabel: Label = null!;
  @property(Label) socialLabel: Label = null!;
  @property(Label) interestLabel: Label = null!;
  @property(Label) energyLabel: Label = null!;
  @property(Sprite) energyBar: Sprite = null!; // 能量条用 Scale X 控制长度

  onLoad(): void {
    EventManager.on(GameEvents.WEEK_EXECUTED, this.refresh, this);
    EventManager.on(GameEvents.GAME_LOADED, this.refresh, this);
  }

  refresh(): void {
    const s = GameManager.instance.player.stats;
    this.academicLabel.string = `${s[StatType.ACADEMIC]}`;
    this.sportsLabel.string = `${s[StatType.SPORTS]}`;
    this.artLabel.string = `${s[StatType.ART]}`;
    this.socialLabel.string = `${s[StatType.SOCIAL]}`;
    this.interestLabel.string = `${s[StatType.INTEREST]}`;

    const e = GameManager.instance.player.energy;
    this.energyLabel.string = `${e}/${MAX_ENERGY}`;
    if (this.energyBar) {
      this.energyBar.node.setScale(e / MAX_ENERGY, 1, 1);
    }
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/ui/StatusPanel.ts
git commit -m "feat: add stats HUD panel with energy bar"
```

---

### Task 9: SceneBoot 重写 — 主角创建流程

**Files:**
- Modify: `assets/scripts/SceneBoot.ts`

**Interfaces:**
- Consumes: `GameManager`, `CharacterManager`, `SaveManager`
- Produces: 游戏启动 → 主角选择 → 进入第一章

- [ ] **Step 1: 重写 SceneBoot.ts**

```typescript
// assets/scripts/SceneBoot.ts
import { _decorator, Component, Node } from 'cc';
import { GameManager, GameMode } from './core/GameManager';
import { EventManager, GameEvents } from './core/EventManager';
import { SaveManager } from './data/SaveManager';
import { CharacterManager } from './character/CharacterManager';

const { ccclass, property } = _decorator;

@ccclass('SceneBoot')
export class SceneBoot extends Component {
  @property(Node) gameManagerNode: Node = null!;
  @property(Node) characterCreateNode: Node = null!; // 主角创建界面

  async start(): Promise<void> {
    // 注册青梅竹马角色
    const cm = CharacterManager.instance;
    const friend = cm.getChildhoodFriendDef();
    cm.registerCharacter(friend);

    // 检查是否有存档
    const saves = await SaveManager.listSaves();
    if (saves.length > 0) {
      // 有存档 → 继续游戏
      await SaveManager.load(saves[0].slot);
      GameManager.instance.enterStoryMode();
      EventManager.emit(GameEvents.GAME_LOADED, saves[0].data);
    } else {
      // 新游戏 → 显示角色创建
      this.showCharacterCreate();
    }
  }

  private showCharacterCreate(): void {
    if (this.characterCreateNode) this.characterCreateNode.active = true;
  }

  /** 由 UI 按钮调用 */
  onCharacterConfirmed(name: string, gender: 'male' | 'female'): void {
    const gm = GameManager.instance;
    gm.setCharacter(name, gender);

    // 重新注册青梅竹马（性别确定后）
    const cm = CharacterManager.instance;
    const friend = cm.getChildhoodFriendDef();
    cm.registerCharacter(friend);

    if (this.characterCreateNode) this.characterCreateNode.active = false;
    gm.enterStoryMode();
    EventManager.emit(GameEvents.CHARACTER_CREATED, { name, gender });
    EventManager.emit(GameEvents.DIALOGUE_START, 'chapter_1');
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/SceneBoot.ts
git commit -m "feat: rewrite SceneBoot with character creation flow and save detection"
```

---

### Task 10: WeekSummaryPanel — 周总结 UI

**Files:**
- Create: `assets/scripts/ui/WeekSummaryPanel.ts`

**Interfaces:**
- Consumes: `EventManager` (WEEK_EXECUTED), `GameManager`, `WeekResult`
- Produces: 周总结弹窗

- [ ] **Step 1: 创建 WeekSummaryPanel.ts**

```typescript
// assets/scripts/ui/WeekSummaryPanel.ts
import { _decorator, Component, Node, Label, tween, Vec3 } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { WeekResult } from '../calendar/CalendarData';
import { StatType } from '../data/GameConfig';

const { ccclass, property } = _decorator;

const STAT_LABELS: Record<StatType, string> = {
  [StatType.ACADEMIC]: '学业', [StatType.SPORTS]: '体育', [StatType.ART]: '艺术',
  [StatType.SOCIAL]: '社交', [StatType.INTEREST]: '兴趣',
};

@ccclass('WeekSummaryPanel')
export class WeekSummaryPanel extends Component {
  @property(Node) panel: Node = null!;
  @property(Label) weekLabel: Label = null!;
  @property(Label) summaryLabel: Label = null!;
  @property(Node) closeButton: Node = null!;

  onLoad(): void {
    EventManager.on(GameEvents.WEEK_EXECUTED, this.onWeekExecuted, this);
    this.panel.active = false;
  }

  private onWeekExecuted(result: WeekResult): void {
    const gm = GameManager.instance;
    this.weekLabel.string = `第 ${gm.player.currentWeek} 周 总结`;

    let text = '';
    const changes = result.statChanges;
    for (const [stat, delta] of Object.entries(changes)) {
      if (delta !== 0) {
        const sign = delta > 0 ? '+' : '';
        text += `${STAT_LABELS[stat as StatType]}: ${sign}${delta}\n`;
      }
    }
    text += `\n体力变化: ${result.energyDelta > 0 ? '+' : ''}${result.energyDelta}`;

    // 显示触发的事件
    for (const event of result.triggeredEvents) {
      text += `\n\n【${event.title}】\n${event.description}`;
    }

    this.summaryLabel.string = text;
    this.panel.active = true;

    // 弹入动画
    this.panel.setScale(0.5, 0.5, 1);
    tween(this.panel).to(0.3, { scale: new Vec3(1, 1, 1) }).start();
  }

  onClose(): void {
    tween(this.panel).to(0.2, { scale: new Vec3(0.5, 0.5, 1) }).call(() => {
      this.panel.active = false;

      // 检查是否触发考试/剧情事件
      const gm = GameManager.instance;
      const isExamWeek = gm.player.currentWeek >= 7; // 简化版：第7周后可能触发
      if (isExamWeek && gm.hasFlag('exam_ready')) {
        gm.enterExamMode();
        EventManager.emit(GameEvents.MODE_CHANGED, GameManager.instance.gameMode);
      }
    }).start();
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
```

- [ ] **Step 2: 提交**

```bash
git add assets/scripts/ui/WeekSummaryPanel.ts
git commit -m "feat: add week summary panel with stat changes and event display"
```

---

- [ ] **Phase 1 完成检查:** 所有核心模块已创建，GameManager → CalendarManager → StoryManager → CharacterManager 链路可通，存档可用。

- [ ] **Commit**

```bash
git add -A && git commit -m "chore: complete phase 1 core framework"
```

---

## 后续阶段预览

- **Phase 2 (不在本计划):** 小学阶段剧情 JSON、题库 JSON、像素角色/场景美术资源、StoryManager 接入学段系统
- **Phase 3:** 好友系统 + 考试排行（云函数）
- **Phase 4:** 云端同步完善、远程题库更新、CDN 资源分包
- **Phase 5:** 后续学段内容更新
