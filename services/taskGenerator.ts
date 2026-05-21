import type { Crop } from '@/types';
import type { CropPlan, FarmTask, TaskPriority, TaskType } from '@/types/crop-management';

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeTask(
  plan: CropPlan,
  taskType: TaskType,
  title: string,
  dueDate: string,
  priority: TaskPriority = 'medium'
): FarmTask {
  return {
    id: `task_${plan.id}_${taskType}_${dueDate}_${Math.random().toString(36).slice(2, 7)}`,
    cropPlanId: plan.id,
    cropName: plan.cropName,
    taskType,
    title,
    dueDate,
    status: 'pending',
    priority,
    notificationId: null,
  };
}

export function generateTasksForPlan(plan: CropPlan, crop: Crop): FarmTask[] {
  const tasks: FarmTask[] = [];
  const plant = plan.plantDate;
  const harvest = plan.harvestDate;

  tasks.push(makeTask(plan, 'plant', `Plant ${plan.cropName}`, plant, 'high'));

  const waterInterval = crop.waterRequirements === 'high' ? 2 : crop.waterRequirements === 'medium' ? 4 : 7;
  for (let d = waterInterval; d < crop.harvestDays; d += waterInterval) {
    const date = addDays(plant, d);
    if (date >= harvest) break;
    tasks.push(makeTask(plan, 'water', `Water ${plan.cropName}`, date, 'medium'));
  }

  tasks.push(makeTask(plan, 'fertilize', `Fertilize ${plan.cropName} — first application`, addDays(plant, 14), 'high'));
  tasks.push(makeTask(plan, 'fertilize', `Fertilize ${plan.cropName} — topdress`, addDays(plant, 45), 'medium'));
  tasks.push(makeTask(plan, 'treat', `Scout ${plan.cropName} for pests & disease`, addDays(plant, 30), 'medium'));
  tasks.push(makeTask(plan, 'harvest', `Harvest ${plan.cropName}`, harvest, 'high'));

  return tasks;
}

export function estimateYieldKg(hectares: number, crop: Crop): number {
  const yieldPerHa: Record<string, number> = {
    maize: 3500,
    tomatoes: 25000,
    tobacco: 2200,
    onions: 18000,
    potatoes: 20000,
    beans: 1200,
    groundnuts: 1500,
  };
  const base = yieldPerHa[crop.id] ?? 5000;
  return Math.round(hectares * base);
}

export function estimateRevenueUSD(yieldKg: number, pricePerKg: number): number {
  return Math.round(yieldKg * pricePerKg * 100) / 100;
}

export function getRotationSuggestion(lastCropId: string | null): string | null {
  const rotations: Record<string, string> = {
    maize: 'Plant beans or cowpeas next to restore nitrogen.',
    tomatoes: 'Follow with onions or cabbage after 3-month break.',
    tobacco: 'Rotate with maize or legumes; avoid continuous tobacco.',
    potatoes: 'Plant beans or maize next season.',
    cabbage: 'Follow with tomatoes or peppers.',
  };
  return lastCropId ? rotations[lastCropId] ?? 'Consider a legume crop to improve soil fertility.' : null;
}
