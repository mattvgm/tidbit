import { Transform, Writable, Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import StreamArray, { streamArray } from "stream-json/streamers/StreamArray";
import fs from "fs";
import { pick } from "stream-json/filters/Pick";
import Parser from "stream-json/Parser";
import {
  Collection,
  CollectionMetadata,
  FileWithParser,
  isFilesWithCustomParser,
} from "../collection";
import { findStream } from "./findStream";
import { projectStream } from "./projectStream";
import { JsonArrayWrapper } from "./JsonArrayWrapper";
import { explodeArray } from "../utils/exploreArrayType";
const StreamConcat = require("stream-concat");

const Verifier = require("stream-json/utils/Verifier");

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
    let fileContent = undefined;
    let combinedStream = undefined;

    const filesToParse = explodeArray(this.collection?.files);
    if (this.collection && this.collection.files) {
      let fileIndex = 0;
      const nextStreamAsync = () => {
        return new Promise((res) => {
          if (fileIndex === filesToParse.length) {
            return res(null);
          }
          ///
          const currentFile = filesToParse[fileIndex++];

          //If no parser was provided assume the builtin one
          if (!currentFile.parser) {
            currentFile.parser = fs.createReadStream;
          }

          return res(currentFile.parser(currentFile.file));
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
    const findStreamInstance = findStream(
      this.searchOptions.where,
      this.searchOptions.pagination
    );
    const jsonArrayWrapper = new JsonArrayWrapper(wrapWithBrackets);

    const parser = new Parser({
      jsonStreaming: true,
      objectMode: true,
      autoDestroy: true,
    });

    const pickStep = pick({ filter: this.searchOptions.path ?? "" });
    const streamArray = new StreamArray({});

    const projStream = projectStream(
      this.searchOptions.project,
      this.searchOptions.relationOptions
    );

    await pipeline(
      combinedStream,
      parser,
      pickStep,
      streamArray,
      findStreamInstance,
      projStream,
      jsonArrayWrapper,
      writableStream
    );
  }
}
