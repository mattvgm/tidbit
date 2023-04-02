import { Transform } from "node:stream";
import { processWhere } from "../../find/processWhere";
import { Pagination } from "../collection";

export const findStream = (
  whereStatement: object | undefined,
  pagination?: Pagination
) => {
  let matchesFound = 0;
  let matchesSkipped = 0;

  return new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
      let json = chunk.value;

      // check if the object matches the whereStatement
      if (whereStatement && !processWhere(whereStatement, json)) {
        cb(null);
        return;
      }

      // check if we have reached the skip limit
      if (
        pagination &&
        pagination.skip !== undefined &&
        matchesSkipped < pagination.skip
      ) {
        matchesSkipped++;
        cb(null);
        return;
      }

      // check if we have reached the limit
      if (
        pagination &&
        pagination.limit !== undefined &&
        matchesFound >= pagination.limit
      ) {
        cb(null);
        return;
      }

      matchesFound++;

      const result = { value: json };

      cb(null, result);
    },
  });
};
