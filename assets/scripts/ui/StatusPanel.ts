import { _decorator, Component, Label, Sprite } from 'cc';
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
  @property(Sprite) energyBar: Sprite = null!;

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
