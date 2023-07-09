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
import { FindStream } from "./FindStream";
import { ProjectStream } from "./ProjectStream";
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
    let combinedStream: Readable;

    if (this.collection && this.collection.files) {
      const filesToParse = explodeArray(this.collection?.files);
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

    //Streams
    const findStreamInstance = new FindStream(
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

    const projStream = new ProjectStream(
      this.searchOptions.project,
      this.searchOptions.relationOptions
    );

    // Stop reading from the first stream when the flag is set
    combinedStream.on("data", (chunk: any) => {
      if (findStreamInstance.stopReading) {
        combinedStream.destroy();
        jsonArrayWrapper.end();
        writableStream.end();
      }
    });

    await pipeline(
      combinedStream,
      parser,
      pickStep,
      streamArray,
      findStreamInstance,
      projStream,
      jsonArrayWrapper,
      writableStream
    ).catch((e) => {
      //If we destroyed the read manually because of the flag 'stopReading' then we can skip this error
      if (
        findStreamInstance.stopReading === true &&
        e.code !== "ERR_STREAM_PREMATURE_CLOSE"
      ) {
        throw e;
      }
    });
  }
}
