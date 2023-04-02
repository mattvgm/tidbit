/**
 * Processes a query object to check if a given row matches the query.
 * @param {Object} where - The query object.
 * @param {Object} row - The row to match.
 * @returns {boolean} - Returns `true` if the row matches the query, `false` otherwise.
 */
export function processWhere(where: any, row: any): boolean {
  try {
    let match = true;
    // If no where is provided just confirm it's a valid result
    if (!where) {
      return match;
    }
    if ("OR" in where) {
      // If the query object contains an "OR" property, the row must match at least one of the conditions in the array of conditions specified by the "OR" property.
      match = false;
      where.OR.forEach((orWhere: any) => {
        match = match || processWhere(orWhere, row);
      });
    } else if ("AND" in where) {
      // If the query object contains an "AND" property, the row must match all of the conditions in the array of conditions specified by the "AND" property.
      where.AND.forEach((andWhere: any) => {
        match = match && processWhere(andWhere, row);
      });
    } else {
      // If the query object contains neither an "OR" nor an "AND" property, it is assumed that all of the conditions in the object must be met.
      for (const [key, value] of Object.entries(where)) {
        if (value instanceof Function) {
          // If the value of a condition is a function, the function is called with the corresponding value of the row as its argument. The result of the function is then used as the value to compare against.
          match = match && value(row[key]);
        } else if (typeof value === "object" && value !== null) {
          if (Object.keys(value).length === 0 && value.constructor === Object) {
            // If the value of a condition is an empty object, it is assumed that the corresponding property of the row must also be an empty object.
            match = match && Object.keys(row[key]).length === 0;
          } else {
            // If the value of a condition is an object (that is not an empty object), the corresponding property of the row must match the object using recursion.
            match = match && processWhere(value, row[key]);
          }
        } else {
          // If the value of a condition is not an object or a function, it is assumed that the corresponding property of the row must match the value exactly.
          match = match && row[key] === value;
        }
      }
    }
    return match;
  } catch (error) {
    //TODO: Check if it is better to thrown an error instead
    return false;
  }
}
