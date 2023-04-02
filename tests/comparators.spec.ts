import {
  between,
  gt,
  gte,
  lt,
  lte,
  not,
  includes,
  notIncludes,
} from "../src/tidbit/comparators";

describe("Comparators", () => {
  it("greater than ", () => {
    //is 10 greater than 5?
    const result = gt(5)(10);

    expect(result).toBe(true);
  });
  it("greater than or equal", () => {
    //is 10 greater or equal than 5?
    const result = gte(5)(5);

    expect(result).toBe(true);
  });
  it("less than", () => {
    //is 10 less than 5?
    const result = lt(5)(10);

    expect(result).toBe(false);
  });
  it("less than or equal", () => {
    //is 10 less than 5?
    const result = lte(5)(5);

    expect(result).toBe(true);
  });
  it("between", () => {
    //is 10 less than 5?
    const result = between(5)(2)(10);

    expect(result).toBe(true);
  });

  it("not", () => {
    //is 10 less than 5?
    const result = not(1)(undefined);

    expect(result).toBe(true);
  });

  it("includes", () => {
    //is 10 less than 5?
    const result = includes(2)([3, 2, 4, 5]);

    expect(result).toBe(true);
  });

  it("not includes", () => {
    //is 10 less than 5?
    const result = notIncludes(22)([3, 2, 4, 5]);

    expect(result).toBe(true);
  });
});
