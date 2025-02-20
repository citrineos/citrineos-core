import { expect, jest } from '@jest/globals';
import { Scheduler } from '../../src/module/Scheduler';

class PassthroughScheduler extends Scheduler {
  schedule(key: string, task: () => void, intervalSeconds: number) {
    super.schedule(key, task, intervalSeconds);
  }

  unschedule(key: string) {
    super.unschedule(key);
  }
}

describe('Scheduler', () => {
  let scheduler: PassthroughScheduler;

  beforeEach(() => {
    jest.useFakeTimers();
    scheduler = new PassthroughScheduler();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('schedule', () => {
    it('should periodically execute task', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = jest.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);

      expect(task).toHaveBeenCalledTimes(0);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(3);
    });

    it('should periodically execute multiple tasks', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = jest.fn();

      const anotherTaskInterval = 0.5;
      const anotherTaskKey = `CostUpdated:001:a8a86116`;
      const anotherTask = jest.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);
      scheduler.schedule(anotherTaskKey, () => anotherTask(), anotherTaskInterval);

      expect(task).toHaveBeenCalledTimes(0);
      expect(anotherTask).toHaveBeenCalledTimes(0);

      await jest.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(0);
      expect(anotherTask).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(3);

      await jest.advanceTimersByTimeAsync(anotherTaskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
      expect(anotherTask).toHaveBeenCalledTimes(4);
    });

    it('should stop executing unscheduled tasks', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = jest.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);

      expect(task).toHaveBeenCalledTimes(0);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      scheduler.unschedule(taskKey);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate schedules for the same key', async () => {
      const taskInterval = 1;
      const taskKey = `CostUpdated:001:716e8cd7`;
      const task = jest.fn();

      const anotherTaskInterval = 0.5;
      const anotherTask = jest.fn();

      scheduler.schedule(taskKey, () => task(), taskInterval);
      scheduler.schedule(taskKey, () => anotherTask(), anotherTaskInterval);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(1);
      expect(anotherTask).toHaveBeenCalledTimes(0);

      await jest.advanceTimersByTimeAsync(taskInterval * 1000);
      expect(task).toHaveBeenCalledTimes(2);
      expect(anotherTask).toHaveBeenCalledTimes(0);
    });
  });
});
