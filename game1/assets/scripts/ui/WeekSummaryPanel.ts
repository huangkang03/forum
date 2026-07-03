import { _decorator, Component, Node, Label, tween, Vec3 } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { GameManager, GameMode } from '../core/GameManager';
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
    if (this.panel) this.panel.active = false;
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

    for (const event of result.triggeredEvents) {
      text += `\n\n【${event.title}】\n${event.description}`;
    }

    this.summaryLabel.string = text;
    this.panel.active = true;

    this.panel.setScale(0.5, 0.5, 1);
    tween(this.panel).to(0.3, { scale: new Vec3(1, 1, 1) }).start();
  }

  onClose(): void {
    tween(this.panel).to(0.2, { scale: new Vec3(0.5, 0.5, 1) }).call(() => {
      this.panel.active = false;

      const gm = GameManager.instance;
      const isExamWeek = gm.player.currentWeek >= 7;
      if (isExamWeek && gm.hasFlag('exam_ready')) {
        gm.enterExamMode();
        EventManager.emit(GameEvents.MODE_CHANGED, gm.gameMode);
      }
    }).start();
  }

  onDestroy(): void { EventManager.targetOff(this); }
}
