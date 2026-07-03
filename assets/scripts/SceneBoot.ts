import { _decorator, Component, Node } from 'cc';
import { GameManager, GameMode } from './core/GameManager';
import { EventManager, GameEvents } from './core/EventManager';
import { SaveManager } from './data/SaveManager';
import { CharacterManager } from './character/CharacterManager';

const { ccclass, property } = _decorator;

@ccclass('SceneBoot')
export class SceneBoot extends Component {
  @property(Node) gameManagerNode: Node = null!;
  @property(Node) characterCreateNode: Node = null!;

  async start(): Promise<void> {
    const cm = CharacterManager.instance;
    const friend = cm.getChildhoodFriendDef();
    cm.registerCharacter(friend);

    const saves = await SaveManager.listSaves();
    if (saves.length > 0) {
      await SaveManager.load(saves[0].slot);
      GameManager.instance.enterStoryMode();
      EventManager.emit(GameEvents.GAME_LOADED, saves[0].data);
    } else {
      this.showCharacterCreate();
    }
  }

  private showCharacterCreate(): void {
    if (this.characterCreateNode) this.characterCreateNode.active = true;
  }

  /** Called by character create UI button after player confirms */
  onCharacterConfirmed(name: string, gender: 'male' | 'female'): void {
    const gm = GameManager.instance;
    gm.setCharacter(name, gender);

    const cm = CharacterManager.instance;
    const friend = cm.getChildhoodFriendDef();
    cm.registerCharacter(friend);

    if (this.characterCreateNode) this.characterCreateNode.active = false;
    gm.enterStoryMode();
    EventManager.emit(GameEvents.CHARACTER_CREATED, { name, gender });
    EventManager.emit(GameEvents.DIALOGUE_START, 'chapter_1');
  }
}
