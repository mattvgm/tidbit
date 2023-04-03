/**
 * Returns a curried function that can be called with multiple arguments.
 * The curried function returns a new function until all arguments are received,
 * at which point the original callback function is called.
 *
 * @param {Function} cb - The callback function to be curried.
 * @returns {Function} A curried function that takes any number of arguments.
 */
export function createComparator(cb: any): Function {
  /**
   * The curried function returned by CreateCurriedFunction.
   *
   * @param {...*} args - The arguments passed to the curried function.
   * @returns {Function|*} A new curried function or the result of the original callback function.
   */
  return function curried(...args: any[]) {
    // If the number of arguments passed to the curried function
    // is equal to or greater than the number of parameters expected
    // by the callback function, call the callback function with the arguments.
    if (args.length >= cb.length) {
      return cb(...args);
    } else {
      // If the number of arguments passed is less than expected,
      // return a new curried function that combines the existing arguments
      // with any new arguments passed to it.
      return function (...nextArgs: any[]) {
        return curried(...args, ...nextArgs);
      };
    }
  };
}
