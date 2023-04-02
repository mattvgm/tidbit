import { Transform } from "node:stream";
import { queryRelations } from "../../find/queryRelations";
import { RelationOptions } from "../collection";
export type ProjectFunction = (result: object, relation?: object) => object;

export const projectStream = (
  projectFunction?: ProjectFunction,
  relationOptions?: RelationOptions
) =>
  new Transform({
    objectMode: true,
    async transform(chunk, enc, cb) {
      let json = chunk.value;

      let result;
      if (typeof projectFunction === "function") {
        if (relationOptions) {
          const relationResult = await queryRelations(
            json[relationOptions.sourceField],
            relationOptions
          );

          result = { value: projectFunction(json, relationResult) };
        } else {
          result = { value: projectFunction(json) };
        }
      } else {
        result = { value: json };
      }

      cb(null, result);
    },
  });
