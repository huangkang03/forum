import { _decorator, Component, AudioClip, AudioSource, tween, Node } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ResourceManager } from '../core/ResourceManager';

const { ccclass, property } = _decorator;

/**
 * 音频管理器 — BGM 和 SFX 控制
 *
 * 通过两个 AudioSource 组件分别控制 BGM 和 SFX
 * BGM AudioSource 挂在本节点上
 * SFX AudioSource 挂在本节点上
 */
@ccclass('AudioManager')
export class AudioManager extends Component {
  @property
  bgmVolume: number = 0.6;

  @property
  sfxVolume: number = 0.8;

  private _bgmSource: AudioSource = null!;
  private _sfxSource: AudioSource = null!;
  private _currentBgm: string = '';
  private _bgmCache: Map<string, AudioClip> = new Map();

  private static _instance: AudioManager | null = null;
  static get instance(): AudioManager { return AudioManager._instance!; }

  onLoad(): void {
    if (AudioManager._instance) { this.destroy(); return; }
    AudioManager._instance = this;

    this._bgmSource = this.node.addComponent(AudioSource);
    this._bgmSource.loop = true;
    this._bgmSource.volume = this.bgmVolume;

    this._sfxSource = this.node.addComponent(AudioSource);
    this._sfxSource.loop = false;
    this._sfxSource.volume = this.sfxVolume;

    EventManager.on(GameEvents.BGM_CHANGE, this.onBgmChange, this);
    EventManager.on(GameEvents.SFX_PLAY, this.onSfxPlay, this);
  }

  /** 切换 BGM（带淡入淡出） */
  private async onBgmChange(bgmName: string): Promise<void> {
    if (bgmName === this._currentBgm) return;

    // 淡出当前 BGM
    if (this._currentBgm) {
      this.fadeOutBgm(0.5);
    }

    // 加载并播放新 BGM
    let clip = this._bgmCache.get(bgmName);
    if (!clip) {
      try {
        clip = await ResourceManager.loadAudio(bgmName);
        this._bgmCache.set(bgmName, clip);
      } catch (err) {
        console.warn(`[AudioManager] 加载BGM失败: ${bgmName}`, err);
        return;
      }
    }

    this._currentBgm = bgmName;
    this._bgmSource.clip = clip;
    this._bgmSource.volume = 0;
    this._bgmSource.play();

    // 淡入
    tween(this._bgmSource)
      .to(0.8, { volume: this.bgmVolume })
      .start();
  }

  /** 播放音效 */
  private async onSfxPlay(sfxName: string): Promise<void> {
    try {
      const clip = await ResourceManager.loadAudio(sfxName);
      this._sfxSource.playOneShot(clip, this.sfxVolume);
    } catch (err) {
      console.warn(`[AudioManager] 播放音效失败: ${sfxName}`, err);
    }
  }

  /** 淡出 BGM */
  fadeOutBgm(duration: number = 1.0): void {
    tween(this._bgmSource)
      .to(duration, { volume: 0 })
      .call(() => { this._bgmSource.stop(); })
      .start();
  }

  /** 暂停/恢复 BGM */
  setBgmPaused(paused: boolean): void {
    if (paused) {
      this._bgmSource.pause();
    } else {
      this._bgmSource.play();
    }
  }

  setBgmVolume(vol: number): void {
    this.bgmVolume = vol;
    this._bgmSource.volume = vol;
  }

  setSfxVolume(vol: number): void {
    this.sfxVolume = vol;
    this._sfxSource.volume = vol;
  }

  onDestroy(): void {
    EventManager.targetOff(this);
    AudioManager._instance = null;
  }
}
