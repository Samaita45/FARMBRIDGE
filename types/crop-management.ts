import type { IconName } from './icons';

export type TaskType = 'plant' | 'water' | 'fertilize' | 'prune' | 'harvest' | 'treat' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type PlanStatus = 'active' | 'harvested' | 'cancelled';

export interface CropPlan {
  id: string;
  userId: string;
  cropId: string;
  cropName: string;
  plantDate: string;
  harvestDate: string;
  hectares: number;
  expectedYieldKg: number;
  expectedRevenueUSD: number;
  status: PlanStatus;
  createdAt: string;
}

export interface FarmTask {
  id: string;
  cropPlanId: string;
  cropName: string;
  taskType: TaskType;
  title: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  notificationId: string | null;
  /** SMS reminder queued or sent (Phase 10) */
  smsScheduled?: boolean;
}

/**
 * Icon and tone per task type. Icons are Ionicons names, not emoji — emoji
 * render inconsistently across Android OEM fonts and cannot be recoloured.
 * `tone` selects a `DS.semantic` role so the badge colour carries meaning.
 */
export const TASK_TYPE_META: Record<
  TaskType,
  { icon: IconName; label: string; tone: 'success' | 'info' | 'warning' | 'neutral' }
> = {
  plant: { icon: 'leaf-outline', label: 'Plant', tone: 'success' },
  water: { icon: 'water-outline', label: 'Water', tone: 'info' },
  fertilize: { icon: 'nutrition-outline', label: 'Fertilize', tone: 'success' },
  prune: { icon: 'cut-outline', label: 'Prune', tone: 'neutral' },
  harvest: { icon: 'basket-outline', label: 'Harvest', tone: 'warning' },
  treat: { icon: 'medkit-outline', label: 'Treat', tone: 'warning' },
  other: { icon: 'ellipsis-horizontal-circle-outline', label: 'Other', tone: 'neutral' },
};
