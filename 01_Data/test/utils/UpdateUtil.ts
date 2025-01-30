export type UpdateFunction<T> = (item: T) => void;

export const applyUpdateFunction = <T>(item: T, updateFunction?: UpdateFunction<T>): T => {
  if (updateFunction) {
    updateFunction(item);
  }
  return item;
};
