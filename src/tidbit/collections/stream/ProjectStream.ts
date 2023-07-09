import { Transform } from "node:stream";
import { queryRelations } from "../../find/queryRelations";
import { RelationOptions } from "../collection";
import { TransformCallback } from "stream";
export type ProjectFunction = (result: object, relation?: object) => object;

export class ProjectStream extends Transform {
  constructor(
    private projectFunction?: ProjectFunction,
    private relationOptions?: RelationOptions
  ) {
    super({ objectMode: true });
  }

  async _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    let json = chunk.value;

    let result;
    if (typeof this.projectFunction === "function") {
      if (this.relationOptions) {
        const relationResult = await queryRelations(
          json[this.relationOptions.sourceField],
          this.relationOptions
        );

        result = { value: this.projectFunction(json, relationResult) };
      } else {
        result = { value: this.projectFunction(json) };
      }
    } else {
      result = { value: json };
    }

    callback(null, result);
  }
}
