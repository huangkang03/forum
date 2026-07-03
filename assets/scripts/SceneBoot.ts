import { _decorator, Component, Node, director, game } from 'cc';
import { GameManager } from './core/GameManager';
import { EventManager, GameEvents } from './core/EventManager';
import { wxSetupShare, wxShowShareMenu } from './utils/WeChatPlatform';

const { ccclass, property } = _decorator;

/**
 * 场景启动器 — 挂载在初始场景的根节点上
 *
 * 负责：
 * 1. 初始化所有核心管理器
 * 2. 配置微信分享
 * 3. 根据启动参数决定「新游戏」还是「继续游戏」
 */
@ccclass('SceneBoot')
export class SceneBoot extends Component {
  @property(Node)
  gameManagerNode: Node = null!;

  onLoad(): void {
    // 配置微信分享菜单
    wxShowShareMenu();
    wxSetupShare('樱花物语 - 剧情互动小游戏');

    // 监听场景加载
    EventManager.once(GameEvents.SCENE_LOADED, () => {
      this.startGame();
    }, this);
  }

  private startGame(): void {
    const gm = GameManager.instance;

    // 检查是否有存档
    const hasSave = this.checkHasSaveSync();

    if (hasSave) {
      // 自动读档继续
      gm.continueGame();
    } else {
      // 新游戏
      gm.startNewGame('chapter_1');
    }
  }

  /** 同步检查是否存在存档（避免异步） */
  private checkHasSaveSync(): boolean {
    try {
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        return !!wx.getStorageSync('save_0');
      }
      return !!localStorage.getItem('save_0');
    } catch {
      return false;
    }
  }

  onDestroy(): void {
    EventManager.targetOff(this);
  }
}
