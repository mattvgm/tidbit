import { Transform } from "node:stream";
import { processWhere } from "../../find/processWhere";
import { Pagination } from "../collection";

export class FindStream extends Transform {
  private matchesFound = 0;
  private matchesSkipped = 0;
  public stopReading = false;

  constructor(
    private whereStatement?: object,
    private pagination?: Pagination
  ) {
    super({ objectMode: true });
  }

  _transform(chunk: any, encoding: string, callback: any) {
    let json = chunk.value;

    // check if the object matches the whereStatement
    if (this.whereStatement && !processWhere(this.whereStatement, json)) {
      callback(null);
      return;
    }

    // check if we have reached the skip limit
    if (
      this.pagination &&
      this.pagination.skip !== undefined &&
      this.matchesSkipped < this.pagination.skip
    ) {
      this.matchesSkipped++;
      callback(null);
      return;
    }

    // check if we have reached the limit
    if (
      this.pagination &&
      this.pagination.limit !== undefined &&
      this.matchesFound >= this.pagination.limit
    ) {
      this.stopReading = true;
      callback(null);
      return;
    }

    this.matchesFound++;

    const result = { value: json };

    callback(null, result);
  }

  _final(callback: any) {
    if (this.stopReading) {
      this.emit("end");
    }
    callback();
  }
}
