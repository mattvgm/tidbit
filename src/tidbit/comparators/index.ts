import { createComparator } from "./createComparator";

export const gte = createComparator((comparison: any, value: number) => {
  return value >= comparison;
});

export const gt = createComparator((comparison: any, value: number) => {
  return value > comparison;
});

export const between = createComparator(
  (comparison: any, greaterThan: number, lessThan: number) => {
    return comparison > greaterThan && comparison < lessThan;
  }
);

export const lt = createComparator((comparison: any, value: number) => {
  return value < comparison;
});

export const lte = createComparator((comparison: any, lessThan: number) => {
  return comparison <= lessThan;
});

export const not = createComparator((comparison: any, value: any) => {
  return value != comparison;
});

export const includes = createComparator((comparison: any, value: any) => {
  return value.includes(comparison);
});

export const notIncludes = createComparator((comparison: any, value: any) => {
  return !value.includes(comparison);
});

export { createComparator };
