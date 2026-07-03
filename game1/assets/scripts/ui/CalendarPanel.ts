import { _decorator, Component, Node, Label, Sprite, instantiate, Prefab, Layout, Button } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager, GameMode } from '../core/GameManager';
import { CalendarManager } from '../calendar/CalendarManager';
import { ACTIVITY_CONFIG, WEEKDAY_SLOTS, WEEKEND_SLOTS, PHASE_CONFIG } from '../data/GameConfig';
import { ActivityType, ActivitySlot } from '../data/GameConfig';
import { WeekPlan, DayPlan } from '../calendar/CalendarData';

const { ccclass, property } = _decorator;

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
    console.log('[CalendarPanel] onLoad, registering MODE_CHANGED listener');
    EventManager.on(GameEvents.MODE_CHANGED, this.onModeChanged, this);
    this.node.active = false;
  }

  private onModeChanged(mode: GameMode): void {
    console.log('[CalendarPanel] onModeChanged:', mode, 'enum value:', GameMode.CALENDAR);
    if (mode !== GameMode.CALENDAR) { this.node.active = false; return; }
    this.node.active = true;
    this.buildCalendar();
    console.log('[CalendarPanel] Calendar panel activated');
  }

  private buildCalendar(): void {
    const gm = GameManager.instance;
    const phaseConfig = PHASE_CONFIG[gm.player.currentPhase];
    this.weekLabel.string = `第 ${gm.player.currentWeek + 1} 周`;
    this.phaseLabel.string = phaseConfig.name;

    const days = Array(7).fill(null).map(() => ({
      morning: ActivityType.REST, afternoon: ActivityType.REST, evening: ActivityType.REST,
    }));
    this._currentPlan = { weekNumber: gm.player.currentWeek, days: days as any };
  }

  onSlotClick(dayIndex: number, slot: ActivitySlot): void {
    if (dayIndex >= 5 && slot === ActivitySlot.MORNING) return;
    this._selectedDay = dayIndex;
    this._selectedSlot = slot;
    EventManager.emit('ACTIVITY_PICKER_SHOW', dayIndex, slot);
  }

  setActivity(activity: ActivityType): void {
    this._currentPlan.days[this._selectedDay][this._selectedSlot] = activity;
  }

  onExecuteWeek(): void {
    console.log('[CalendarPanel] onExecuteWeek called, plan:', this._currentPlan?.weekNumber);
    CalendarManager.instance.executeWeek(this._currentPlan);
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
