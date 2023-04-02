import { Transform } from "node:stream";
export class JsonArrayWrapper extends Transform {
  // Keep track of whether we've written the opening bracket or not
  private firstChunk = true;

  constructor(private wrapWithBrackets: boolean) {
    // Set object mode to true so we can write objects to the stream
    super({ objectMode: true });
  }

  // Called for each chunk of data written to the stream
  // `chunk` is an object with a `value` property representing the JSON object being written
  _transform(chunk: any, encoding: string, callback: Function) {
    // If this is the first chunk we've written, write the opening bracket
    if (this.wrapWithBrackets) {
      if (this.firstChunk) {
        this.push("[");
        this.firstChunk = false;
      } else {
        // Otherwise, write a comma to separate the objects
        this.push(",");
      }

      // Write the JSON object
      this.push(JSON.stringify(chunk.value));
    } else {
      this.push(chunk);
    }

    // Call the callback to indicate we're done processing this chunk
    callback();
  }

  // Called when all data has been written to the stream
  _flush(callback: Function) {
    // Write the closing bracket
    if (this.wrapWithBrackets) {
      //In some cases if no value was found, the first '[' is never pushed, do this here to create a valid empty array
      if (this.firstChunk) {
        this.push("[");
      }
      this.push("]");
    }

    // Call the callback to indicate we're done processing data
    callback();
  }
}
