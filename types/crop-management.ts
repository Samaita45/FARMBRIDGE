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

export const TASK_TYPE_META: Record<
  TaskType,
  { icon: string; label: string }
> = {
  plant: { icon: '🌱', label: 'Plant' },
  water: { icon: '💧', label: 'Water' },
  fertilize: { icon: '🌿', label: 'Fertilize' },
  prune: { icon: '✂️', label: 'Prune' },
  harvest: { icon: '🌾', label: 'Harvest' },
  treat: { icon: '💊', label: 'Treat' },
  other: { icon: '📋', label: 'Other' },
};
