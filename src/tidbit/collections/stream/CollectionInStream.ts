import { Transform, Writable, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import StreamArray, { streamArray } from "stream-json/streamers/StreamArray";
import fs from "fs";
import { pick } from "stream-json/filters/Pick";
import { parser } from "stream-json/Parser";
import { Collection, CollectionMetadata } from "../collection";
import { findStream } from "./findStream";
import { projectStream } from "./projectStream";
import { JsonArrayWrapper } from "./JsonArrayWrapper";

const StreamConcat = require("stream-concat");

export class CollectionInStream extends Collection {
  constructor(collection?: CollectionMetadata) {
    super(collection);
  }

  public static fromStream(stream: Readable) {
    const newClass = new CollectionInStream();
    newClass.stream = stream;
    return newClass;
  }

  public async toWritableStream(writableStream: Writable) {
    if (this.collection?.loadInMemory) {
      throw new Error("Loaded in memory collections are not allowed");
    }

    return await this.exec(writableStream, true);
  }

  public async toArray(): Promise<object[]> {
    let results: object[] = [];

    const writableStream = new Writable({
      objectMode: true,
      write({ _, value }, encoding, callback) {
        results.push(value);
        callback();
      },
    });

    await this.exec(writableStream, false);

    return results;
  }

  public async exec(writableStream: Writable, wrapWithBrackets: boolean) {
    let combinedStream = undefined;
    if (this.collection && this.collection.files) {
      let fileIndex = 0;
      const nextStreamAsync = () => {
        return new Promise((res) => {
          if (fileIndex === this.collection!.files.length) {
            return res(null);
          }
          return res(fs.createReadStream(this.collection!.files[fileIndex++]));
        });
      };
      combinedStream = new StreamConcat(nextStreamAsync, {});
    } else if (this.stream) {
      combinedStream = this.stream;
    } else {
      throw new Error(
        "Please provide either a collection or a readable stream"
      );
    }

    await pipeline(
      combinedStream,
      parser({ jsonStreaming: true }),
      pick({ filter: this.searchOptions.path ?? "" }),
      new StreamArray({}),
      findStream(this.searchOptions.where, this.searchOptions.pagination),
      projectStream(
        this.searchOptions.project,
        this.searchOptions.relationOptions
      ),
      new JsonArrayWrapper(wrapWithBrackets),
      writableStream
    );
  }
}
