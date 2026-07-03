/** 微信小游戏 API 类型声明 */
declare const wx: {
  getSystemInfoSync(): WechatMinigame.SystemInfo;
  getStorageSync(key: string): string | null;
  setStorageSync(key: string, data: string): void;
  removeStorageSync(key: string): void;
  login(options: WechatMinigame.CallbackOption): void;
  getUserInfo(options: WechatMinigame.CallbackOption): void;
  shareAppMessage(options: WechatMinigame.ShareOption): void;
  showShareMenu(options: WechatMinigame.ShareMenuOption): void;
  onShareAppMessage(callback: () => WechatMinigame.ShareOption): void;
  createRewardedVideoAd(options: { adUnitId: string }): WechatMinigame.RewardedVideoAd;
  vibrateShort(options?: { type: string }): void;
  vibrateLong(): void;
  cloud?: {
    init(options: { env: string; traceUser?: boolean }): void;
    database(): WechatMinigame.Database;
  };
};

declare namespace WechatMinigame {
  interface SystemInfo {
    platform: string;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
    brand?: string;
    model?: string;
  }

  interface CallbackOption {
    success?: (res: any) => void;
    fail?: (err: any) => void;
    complete?: () => void;
  }

  interface ShareOption {
    title: string;
    imageUrl?: string;
    query?: string;
  }

  interface ShareMenuOption {
    menus?: string[];
  }

  interface RewardedVideoAd {
    onClose(callback: (res: { isEnded: boolean }) => void): void;
    show(): Promise<void>;
    load(): Promise<void>;
  }

  interface Database {
    collection(name: string): Collection;
  }

  interface Collection {
    where(condition: any): Query;
    doc(id: string): Document;
    add(data: any): Promise<any>;
  }

  interface Query {
    get(): Promise<any>;
  }

  interface Document {
    get(): Promise<any>;
    update(data: any): Promise<any>;
    remove(): Promise<any>;
  }
}
