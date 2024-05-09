import { isEqual } from "lodash";
export const areObjectsEqual = <T>(obj1: T, obj2: T): boolean => {
  return isEqual(obj1, obj2);
};
