import { processWhere } from "../../find/processWhere";
import { concatJsonArray } from "../../utils";
import { Collection, CollectionMetadata } from "../collection";
import path from "path";
import { CollectionFactory } from "../utils/CollectionFactory";
import { queryRelations } from "../../find/queryRelations";
import { explodeArray } from "../utils/exploreArrayType";

export class CollectionInMemory extends Collection {
  protected arrayData: any[] = [];
  constructor(collection?: CollectionMetadata) {
    super();
    this.collection = collection;
  }

  public static fromArray(array: any[]) {
    const newClass = new CollectionInMemory();
    newClass.arrayData = array;
    return newClass;
  }

  public async toWritableStream() {
    throw new Error(
      "Writable streams are not allowed in loaded in memory collections"
    );
  }

  load() {
    if (this.collection) {
      const files = explodeArray(this.collection.files);
      return concatJsonArray(files, this.searchOptions.path);
    } else if (this.arrayData.length >= 1) {
      return this.arrayData;
    } else {
      return [];
    }
  }

  public async toArray(): Promise<object[]> {
    return await this.exec();
  }

  protected async exec(): Promise<object[]> {
    let results = this.load();

    let limit = this.searchOptions.pagination?.limit;
    let skip = this.searchOptions.pagination?.skip;

    let matchesFound = 0;
    let matchesSkipped = 0;

    results = results.filter((row: unknown) => {
      const matches = processWhere(this.searchOptions.where, row);

      // check if we have reached the skip limit
      if (this.searchOptions.pagination && matches) {
        if (skip !== undefined && matchesSkipped < skip && matches) {
          matchesSkipped++;
          return;
        }

        // check if we have reached the limit
        if (limit !== undefined && matchesFound >= limit && matches) {
          return;
        }

        matchesFound++;
      }

      return matches;
    }) as any;

    if (this.searchOptions.project) {
      results = await Promise.all(
        results.map(async (result: any) => {
          if (this.searchOptions.relationOptions) {
            const relationResult = await queryRelations(
              result[this.searchOptions.relationOptions.sourceField],
              this.searchOptions.relationOptions
            );
            return this.searchOptions.project!(result, relationResult);
          } else {
            return this.searchOptions.project!(result);
          }
        })
      );
    }

    //TODO: CHECK A FIX
    return results as object[];
  }
}
