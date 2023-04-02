import { CreateComparator } from "./CreateComparator";

export const gte = CreateComparator((comparison: any, value: number) => {
  return value >= comparison;
});

export const gt = CreateComparator((comparison: any, value: number) => {
  return value > comparison;
});

export const between = CreateComparator(
  (comparison: any, greaterThan: number, lessThan: number) => {
    return comparison > greaterThan && comparison < lessThan;
  }
);

export const lt = CreateComparator((comparison: any, value: number) => {
  return value < comparison;
});

export const lte = CreateComparator((comparison: any, lessThan: number) => {
  return comparison <= lessThan;
});

export const not = CreateComparator((comparison: any, value: any) => {
  return value != comparison;
});

export const includes = CreateComparator((comparison: any, value: any) => {
  return value.includes(comparison);
});

export const notIncludes = CreateComparator((comparison: any, value: any) => {
  return !value.includes(comparison);
});
