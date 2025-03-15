export type LimitFunction = {
  <T>(firstTask: () => Promise<T>): Promise<T>;
  <T>(
    firstTask: () => Promise<T>,
    ...otherTasks: Array<() => Promise<T>>
  ): Promise<T[]>;
};

export type PLimit = (maxRunning: number) => Promise<LimitFunction>
