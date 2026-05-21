import { useCallback, useEffect, useState } from 'react';

import { CROPS } from '@/constants/zimbabwe-data';
import {
  deleteCropPlan,
  getCropPlans,
  insertCropPlan,
  insertTasks,
} from '@/services/database';
import {
  cancelTaskNotification,
  scheduleTaskNotification,
} from '@/services/notificationService';
import {
  estimateRevenueUSD,
  estimateYieldKg,
  generateTasksForPlan,
} from '@/services/taskGenerator';
import { useAuthStore } from '@/stores/authStore';
import type { CropPlan } from '@/types/crop-management';

export function useCropPlans() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? 'guest';
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getCropPlans(userId, 'active');
    setPlans(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addPlan = useCallback(
    async (input: {
      cropId: string;
      plantDate: string;
      hectares: number;
    }) => {
      const crop = CROPS.find((c) => c.id === input.cropId);
      if (!crop) throw new Error('Crop not found');

      const harvestDate = new Date(input.plantDate);
      harvestDate.setDate(harvestDate.getDate() + crop.harvestDays);

      const expectedYieldKg = estimateYieldKg(input.hectares, crop);
      const expectedRevenueUSD = estimateRevenueUSD(
        expectedYieldKg,
        crop.currentPriceUSD
      );

      const plan: CropPlan = {
        id: `plan_${Date.now()}`,
        userId,
        cropId: crop.id,
        cropName: crop.name,
        plantDate: input.plantDate,
        harvestDate: harvestDate.toISOString().slice(0, 10),
        hectares: input.hectares,
        expectedYieldKg,
        expectedRevenueUSD,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await insertCropPlan(plan);
      const tasks = generateTasksForPlan(plan, crop);

      for (const task of tasks) {
        const notificationId = await scheduleTaskNotification(task);
        task.notificationId = notificationId;
      }
      await insertTasks(tasks);
      await refresh();
      return plan;
    },
    [userId, refresh]
  );

  const removePlan = useCallback(
    async (planId: string) => {
      await deleteCropPlan(planId);
      await refresh();
    },
    [refresh]
  );

  return { plans, loading, refresh, addPlan, removePlan };
}
