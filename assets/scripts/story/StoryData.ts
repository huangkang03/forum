/**
 * 剧情数据结构定义
 * 所有剧情以 JSON 文件形式存放在 assets/resources/stories/ 目录下
 */

/** 单个对话片段 */
export interface Dialogue {
  /** 对话唯一 ID（可选，默认按数组顺序） */
  id?: string;
  /** 说话者 ID，null 表示旁白 */
  speaker: string | null;
  /** 说话者显示名称 */
  speakerName?: string;
  /** 对话文本 */
  text: string;
  /** 角色表情 */
  emotion?: string;
  /** 对话触发条件（flag 全部满足才显示） */
  conditions?: Condition[];
  /** 分支选项 */
  choices?: Choice[];
  /** 对话结束后的行为 */
  actions?: Action[];
  /** 剧情特效 */
  effects?: Effect[];
  /** 跳转到指定对话 ID（优先级高于顺序播放） */
  jumpTo?: string;
}

/** 分支选项 */
export interface Choice {
  /** 选项文本 */
  text: string;
  /** 显示条件 */
  conditions?: Condition[];
  /** 选择后跳转的对话 ID */
  jumpTo: string;
  /** 选择后执行的行动 */
  actions?: Action[];
}

/** 条件判断 */
export interface Condition {
  /** 条件类型 */
  type: 'hasFlag' | 'noFlag' | 'affectionGE' | 'affectionLE';
  /** 参数：flag 名 / 角色 ID */
  key: string;
  /** 参数：值（affection 判断用） */
  value?: number;
}

/** 动作/效果 */
export interface Action {
  type: 'setFlag' | 'removeFlag' | 'affection' | 'unlockCG' | 'switchScene' | 'playBGM' | 'playSFX';
  /** 参数 */
  key?: string;
  /** 数值（好感度变化量） */
  value?: number;
}

/** 画面特效 */
export interface Effect {
  type: 'shake' | 'flash' | 'fadeIn' | 'fadeOut' | 'zoomIn';
  /** 持续时间（秒） */
  duration?: number;
}

/** 章节定义 */
export interface Chapter {
  id: string;
  title: string;
  /** 开场对话组 */
  dialogues: Dialogue[];
  /** 章节背景图（resources/textures/ 下的路径） */
  background?: string;
  /** 章节 BGM */
  bgm?: string;
}

/** 完整故事定义 */
export interface Story {
  id: string;
  title: string;
  author: string;
  /** 角色定义 */
  characters: CharacterDef[];
  /** 章节列表 */
  chapters: Chapter[];
}

/** 角色定义 */
export interface CharacterDef {
  id: string;
  name: string;
  /** 默认立绘路径 */
  defaultSprite?: string;
  /** 各表情立绘映射 */
  emotions?: Record<string, string>;
}
