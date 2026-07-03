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

  /** 执行一周计划，返回结算结果 */
  executeWeek(plan: WeekPlan): WeekResult {
    const gm = GameManager.instance;
    const result: WeekResult = {
      weekNumber: gm.player.currentWeek,
      statChanges: {},
      energyDelta: 0,
      triggeredEvents: [],
      unlockedFlags: [],
    };

    for (let i = 0; i < 7; i++) {
      const isWeekend = i >= 5;
      const slots = isWeekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
      const day = plan.days[i];

      for (const slot of slots) {
        const activity = day[slot];
        const config = ACTIVITY_CONFIG[activity];

        const penalty = gm.player.energy < LOW_ENERGY_THRESHOLD ? 0.5 : 1.0;

        for (const [stat, baseDelta] of Object.entries(config.stats)) {
          const delta = Math.round(baseDelta * penalty);
          gm.modifyStat(stat as StatType, delta);
          result.statChanges[stat as StatType] = (result.statChanges[stat as StatType] || 0) + delta;
        }

        gm.modifyEnergy(config.energy);
        result.energyDelta += config.energy;

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

  /** 从事件池匹配随机事件（阶段二填充事件池） */
  private pickRandomEvent(_gm: GameManager): RandomEvent | null {
    return null;
  }

  private onWeekStart(): void {
    EventManager.emit(GameEvents.WEEK_SUMMARY_SHOW);
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
