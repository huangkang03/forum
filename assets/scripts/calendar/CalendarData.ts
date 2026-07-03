import { ActivityType, StatType, ActivitySlot } from '../data/GameConfig';

export interface DayPlan {
  morning: ActivityType;
  afternoon: ActivityType;
  evening: ActivityType;
}

export interface WeekPlan {
  weekNumber: number;
  days: [DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan, DayPlan];
}

export interface WeekResult {
  weekNumber: number;
  statChanges: Partial<Record<StatType, number>>;
  energyDelta: number;
  triggeredEvents: RandomEvent[];
  unlockedFlags: string[];
}

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  conditions: EventCondition[];
  choices?: EventChoice[];
  effects: EventEffect[];
}

export interface EventCondition {
  stat: StatType;
  min?: number;
  max?: number;
  flag?: string;
  weekDay?: number;
}

export interface EventChoice {
  text: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'statChange' | 'setFlag' | 'energyChange' | 'triggerStory';
  stat?: StatType;
  delta?: number;
  flag?: string;
  storyId?: string;
}

export interface CalendarState {
  phase: string;
  currentWeek: number;
  totalWeeks: number;
  weekPlan: WeekPlan | null;
  isSpecialWeek: boolean;
}
