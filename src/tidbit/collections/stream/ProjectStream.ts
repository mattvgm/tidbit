import { Transform } from "node:stream";
import { queryRelations } from "../../find/queryRelations";
import { RelationOptions } from "../collection";
import { TransformCallback } from "stream";
import { CollectionFactory } from "../utils/CollectionFactory";
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
        const colMeta = this.relationOptions.collection;
        const relationCollection = CollectionFactory(
          colMeta,
          colMeta.loadInMemory
        );
        const relationResult = await queryRelations(
          relationCollection,
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
