/**
 * 微信小游戏平台适配工具
 *
 * 提供：
 * - 平台检测
 * - 微信 API 封装
 * - 用户登录/授权
 * - 分享功能
 * - 排行榜（微信云开发）
 */

/** 检测是否在微信小游戏环境 */
export function isWeChat(): boolean {
  return typeof wx !== 'undefined' && typeof wx.getSystemInfoSync === 'function';
}

/** 获取系统信息 */
export function getSystemInfo() {
  if (!isWeChat()) {
    return {
      platform: 'web',
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    };
  }
  return wx.getSystemInfoSync();
}

/** 微信登录，获取 code */
export function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isWeChat()) {
      resolve('dev_code');
      return;
    }
    wx.login({
      success: (res: any) => resolve(res.code),
      fail: reject,
    });
  });
}

/** 获取用户信息（需用户授权） */
export function wxGetUserInfo(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isWeChat()) {
      resolve({ nickName: 'DevPlayer', avatarUrl: '' });
      return;
    }
    wx.getUserInfo({
      success: (res: any) => resolve(res.userInfo),
      fail: reject,
    });
  });
}

/** 分享到聊天 */
export function wxShare(title: string, imageUrl?: string): void {
  if (!isWeChat()) return;
  wx.shareAppMessage({
    title,
    imageUrl: imageUrl || '',
  });
}

/** 主动拉起分享面板 */
export function wxShowShareMenu(): void {
  if (!isWeChat()) return;
  wx.showShareMenu({
    menus: ['shareAppMessage', 'shareTimeline'],
  });
}

/** 设置分享参数（在 onLoad 中调用） */
export function wxSetupShare(title: string, query: string = ''): void {
  if (!isWeChat()) return;
  wx.onShareAppMessage(() => ({
    title,
    query,
  }));
}

/** 激励视频广告 */
export function wxShowRewardedVideo(adUnitId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isWeChat()) {
      // 开发环境模拟
      console.log('[Dev] 模拟激励视频播放完成');
      resolve(true);
      return;
    }
    const rewardedVideo = wx.createRewardedVideoAd({ adUnitId });
    rewardedVideo.onClose((res: any) => {
      resolve(res.isEnded);
    });
    rewardedVideo.show().catch(() => {
      // 广告未加载，先加载再播放
      rewardedVideo.load().then(() => rewardedVideo.show());
    });
  });
}

/** 微信云开发初始化 */
export function wxInitCloud(envId: string): void {
  if (!isWeChat() || !wx.cloud) return;
  wx.cloud.init({ env: envId, traceUser: true });
}

/** 震动反馈 */
export function wxVibrate(type: 'short' | 'long' = 'short'): void {
  if (!isWeChat()) return;
  if (type === 'short') {
    wx.vibrateShort({ type: 'light' });
  } else {
    wx.vibrateLong();
  }
}
