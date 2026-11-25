// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Scheduler } from '@modules/transactions/scheduler.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class PassthroughScheduler extends Scheduler {
  schedule(key: string, task: () => void, intervalSeconds: number) {
    super.schedule(key, task, intervalSeconds);
  }

  unschedule(key: string) {
    super.unschedule(key);
  }

  unscheduleAll() {
    super.unscheduleAll();
  }
}

describe('Scheduler', () => {
  let scheduler: PassthroughScheduler;

  beforeEach(() => {
    vi.useFakeTimers();
    scheduler = new PassthroughScheduler();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('schedule', () => {
    it('should periodically execute task', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = vi.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);

      expect(task).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(3);
    });

    it('should periodically execute multiple tasks', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = vi.fn();

      const anotherTaskInterval = 0.5;
      const anotherTaskKey = `CostUpdated:001:a8a86116`;
      const anotherTask = vi.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);
      scheduler.schedule(anotherTaskKey, () => anotherTask(), anotherTaskInterval);

      expect(task).toHaveBeenCalledTimes(0);
      expect(anotherTask).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(0);
      expect(anotherTask).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(3);

      await vi.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
      expect(anotherTask).toHaveBeenCalledTimes(4);
    });

    it('should stop executing unscheduled tasks', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = vi.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);

      expect(task).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      scheduler.unschedule(taskKey);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate schedules for the same key', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = vi.fn();

      const anotherTaskInterval = 0.5;
      const anotherTask = vi.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);
      scheduler.schedule(taskKey, () => anotherTask(), anotherTaskInterval);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
      expect(anotherTask).toHaveBeenCalledTimes(0);
    });

    it('unscheduleAll clears every registered interval and unrefs scheduled timers', async () => {
      const unrefSpy = vi.fn();
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
      setIntervalSpy.mockReturnValueOnce({ unref: unrefSpy } as unknown as NodeJS.Timeout);

      const unrefScheduler = new PassthroughScheduler();
      unrefScheduler.schedule('unref-key', vi.fn(), 1);
      expect(unrefSpy).toHaveBeenCalledOnce();
      setIntervalSpy.mockRestore();

      const t1 = vi.fn();
      const t2 = vi.fn();
      scheduler.schedule('k1', t1, 1);
      scheduler.schedule('k2', t2, 1);

      scheduler.unscheduleAll();
      await vi.advanceTimersByTimeAsync(2000);
      expect(t1).not.toHaveBeenCalled();
      expect(t2).not.toHaveBeenCalled();
    });
  });
});
