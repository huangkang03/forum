/** 游戏学段 */
export enum SchoolPhase {
  KINDERGARTEN = 'kindergarten',
  PRIMARY_1 = 'primary_1', PRIMARY_2 = 'primary_2', PRIMARY_3 = 'primary_3',
  PRIMARY_4 = 'primary_4', PRIMARY_5 = 'primary_5', PRIMARY_6 = 'primary_6',
  JUNIOR_1 = 'junior_1', JUNIOR_2 = 'junior_2', JUNIOR_3 = 'junior_3',
  SENIOR_1 = 'senior_1', SENIOR_2 = 'senior_2', SENIOR_3 = 'senior_3',
  COLLEGE_1 = 'college_1', COLLEGE_2 = 'college_2', COLLEGE_3 = 'college_3', COLLEGE_4 = 'college_4',
  MASTER_1 = 'master_1', MASTER_2 = 'master_2',
  PHD_1 = 'phd_1', PHD_2 = 'phd_2', PHD_3 = 'phd_3',
}

export enum ActivitySlot { MORNING = 'morning', AFTERNOON = 'afternoon', EVENING = 'evening' }
export enum ActivityType { STUDY = 'study', SPORTS = 'sports', ART = 'art', SOCIAL = 'social', INTEREST = 'interest', REST = 'rest', EVENT = 'event' }
export enum StatType { ACADEMIC = 'academic', SPORTS = 'sports', ART = 'art', SOCIAL = 'social', INTEREST = 'interest' }

export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string; energy: number; stats: Partial<Record<StatType, number>> }> = {
  [ActivityType.STUDY]:   { label: '学习', icon: '📚', energy: -15, stats: { [StatType.ACADEMIC]: 4 } },
  [ActivityType.SPORTS]:  { label: '运动', icon: '⚽', energy: -20, stats: { [StatType.SPORTS]: 4 } },
  [ActivityType.ART]:     { label: '艺术', icon: '🎨', energy: -10, stats: { [StatType.ART]: 4 } },
  [ActivityType.SOCIAL]:  { label: '社交', icon: '💬', energy: -10, stats: { [StatType.SOCIAL]: 4 } },
  [ActivityType.INTEREST]:{ label: '兴趣', icon: '🎮', energy: -10, stats: { [StatType.INTEREST]: 4 } },
  [ActivityType.REST]:    { label: '休息', icon: '😴', energy: 30,  stats: {} },
  [ActivityType.EVENT]:   { label: '特殊', icon: '🔀', energy: 0,   stats: {} },
};

export const PHASE_CONFIG: Record<SchoolPhase, { name: string; weeks: number; prevPhase: SchoolPhase | null; nextPhase: SchoolPhase | null }> = {
  [SchoolPhase.KINDERGARTEN]: { name: '幼儿园', weeks: 4,  prevPhase: null,             nextPhase: SchoolPhase.PRIMARY_1 },
  [SchoolPhase.PRIMARY_1]:    { name: '小学一年级', weeks: 8,  prevPhase: SchoolPhase.KINDERGARTEN, nextPhase: SchoolPhase.PRIMARY_2 },
  [SchoolPhase.PRIMARY_2]:    { name: '小学二年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_1,    nextPhase: SchoolPhase.PRIMARY_3 },
  [SchoolPhase.PRIMARY_3]:    { name: '小学三年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_2,    nextPhase: SchoolPhase.PRIMARY_4 },
  [SchoolPhase.PRIMARY_4]:    { name: '小学四年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_3,    nextPhase: SchoolPhase.PRIMARY_5 },
  [SchoolPhase.PRIMARY_5]:    { name: '小学五年级', weeks: 8,  prevPhase: SchoolPhase.PRIMARY_4,    nextPhase: SchoolPhase.PRIMARY_6 },
  [SchoolPhase.PRIMARY_6]:    { name: '小学六年级', weeks: 10, prevPhase: SchoolPhase.PRIMARY_5,    nextPhase: SchoolPhase.JUNIOR_1 },
  [SchoolPhase.JUNIOR_1]:     { name: '初中一年级', weeks: 10, prevPhase: SchoolPhase.PRIMARY_6,    nextPhase: SchoolPhase.JUNIOR_2 },
  [SchoolPhase.JUNIOR_2]:     { name: '初中二年级', weeks: 10, prevPhase: SchoolPhase.JUNIOR_1,     nextPhase: SchoolPhase.JUNIOR_3 },
  [SchoolPhase.JUNIOR_3]:     { name: '初中三年级', weeks: 12, prevPhase: SchoolPhase.JUNIOR_2,     nextPhase: SchoolPhase.SENIOR_1 },
  [SchoolPhase.SENIOR_1]:     { name: '高中一年级', weeks: 12, prevPhase: SchoolPhase.JUNIOR_3,     nextPhase: SchoolPhase.SENIOR_2 },
  [SchoolPhase.SENIOR_2]:     { name: '高中二年级', weeks: 12, prevPhase: SchoolPhase.SENIOR_1,     nextPhase: SchoolPhase.SENIOR_3 },
  [SchoolPhase.SENIOR_3]:     { name: '高中三年级', weeks: 14, prevPhase: SchoolPhase.SENIOR_2,     nextPhase: SchoolPhase.COLLEGE_1 },
  [SchoolPhase.COLLEGE_1]:    { name: '大学一年级', weeks: 14, prevPhase: SchoolPhase.SENIOR_3,     nextPhase: SchoolPhase.COLLEGE_2 },
  [SchoolPhase.COLLEGE_2]:    { name: '大学二年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_1,    nextPhase: SchoolPhase.COLLEGE_3 },
  [SchoolPhase.COLLEGE_3]:    { name: '大学三年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_2,    nextPhase: SchoolPhase.COLLEGE_4 },
  [SchoolPhase.COLLEGE_4]:    { name: '大学四年级', weeks: 16, prevPhase: SchoolPhase.COLLEGE_3,    nextPhase: SchoolPhase.MASTER_1 },
  [SchoolPhase.MASTER_1]:     { name: '硕士一年级', weeks: 14, prevPhase: SchoolPhase.COLLEGE_4,    nextPhase: SchoolPhase.MASTER_2 },
  [SchoolPhase.MASTER_2]:     { name: '硕士二年级', weeks: 16, prevPhase: SchoolPhase.MASTER_1,     nextPhase: SchoolPhase.PHD_1 },
  [SchoolPhase.PHD_1]:        { name: '博士一年级', weeks: 14, prevPhase: SchoolPhase.MASTER_2,     nextPhase: SchoolPhase.PHD_2 },
  [SchoolPhase.PHD_2]:        { name: '博士二年级', weeks: 16, prevPhase: SchoolPhase.PHD_1,        nextPhase: SchoolPhase.PHD_3 },
  [SchoolPhase.PHD_3]:        { name: '博士三年级', weeks: 18, prevPhase: SchoolPhase.PHD_2,        nextPhase: null },
};

export const AFFECTION_LEVELS = [
  { min: 0,  max: 19, label: '陌生人',  unlock: 'basic' },
  { min: 20, max: 39, label: '相识',    unlock: 'chat' },
  { min: 40, max: 59, label: '朋友',    unlock: 'weekend' },
  { min: 60, max: 79, label: '好友',    unlock: 'personal_story' },
  { min: 80, max: 100,label: '挚友/恋人', unlock: 'ending' },
];

export const MAX_ENERGY = 100;
export const LOW_ENERGY_THRESHOLD = 30;
export const WEEKDAY_SLOTS = [ActivitySlot.MORNING, ActivitySlot.AFTERNOON, ActivitySlot.EVENING];
export const WEEKEND_SLOTS = [ActivitySlot.AFTERNOON, ActivitySlot.EVENING];
