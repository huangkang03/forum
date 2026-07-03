import { _decorator } from 'cc';

/**
 * 全局事件总线 — 解耦各模块间的通信
 * 用法: EventManager.emit('DIALOGUE_END'); EventManager.on('DIALOGUE_END', callback, this);
 */

// 事件名称常量，避免字符串拼写错误
export const GameEvents = {
  // 对话
  DIALOGUE_START:     'DIALOGUE_START',
  DIALOGUE_NEXT:      'DIALOGUE_NEXT',
  DIALOGUE_END:       'DIALOGUE_END',
  DIALOGUE_TYPING:    'DIALOGUE_TYPING',

  // 选择
  CHOICE_SHOW:        'CHOICE_SHOW',
  CHOICE_SELECTED:    'CHOICE_SELECTED',

  // 场景
  SCENE_CHANGE:       'SCENE_CHANGE',
  SCENE_LOADED:       'SCENE_LOADED',

  // 存档
  GAME_SAVED:         'GAME_SAVED',
  GAME_LOADED:        'GAME_LOADED',

  // 音频
  BGM_CHANGE:         'BGM_CHANGE',
  SFX_PLAY:           'SFX_PLAY',

  // 角色
  CHARACTER_SHOW:     'CHARACTER_SHOW',
  CHARACTER_HIDE:     'CHARACTER_HIDE',
  CHARACTER_EMOTION:  'CHARACTER_EMOTION',
} as const;

type Callback = (...args: any[]) => void;

interface Listener {
  callback: Callback;
  target: any;
  once: boolean;
}

class EventManagerCls {
  private _listeners: Map<string, Listener[]> = new Map();

  on(event: string, callback: Callback, target?: any): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ callback, target, once: false });
  }

  once(event: string, callback: Callback, target?: any): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push({ callback, target, once: true });
  }

  off(event: string, callback?: Callback, target?: any): void {
    const listeners = this._listeners.get(event);
    if (!listeners) return;

    if (!callback && !target) {
      this._listeners.delete(event);
      return;
    }

    for (let i = listeners.length - 1; i >= 0; i--) {
      const l = listeners[i];
      if ((callback && l.callback === callback) || (target && l.target === target)) {
        listeners.splice(i, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this._listeners.get(event);
    if (!listeners) return;

    for (let i = listeners.length - 1; i >= 0; i--) {
      const l = listeners[i];
      l.callback.apply(l.target, args);
      if (l.once) {
        listeners.splice(i, 1);
      }
    }
  }

  /** 清理指定 target 的所有监听（组件销毁时调用） */
  targetOff(target: any): void {
    this._listeners.forEach((listeners, event) => {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].target === target) {
          listeners.splice(i, 1);
        }
      }
      if (listeners.length === 0) {
        this._listeners.delete(event);
      }
    });
  }

  clear(): void {
    this._listeners.clear();
  }
}

export const EventManager = new EventManagerCls();
