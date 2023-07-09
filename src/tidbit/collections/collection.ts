import { Writable, Readable } from "node:stream";

import { ProjectFunction } from "./stream/ProjectStream";

export type SearchOptions = {
  where?: object | undefined;
  project?: ProjectFunction | undefined;
  path?: any | undefined;
  relationOptions?: RelationOptions | undefined;
  pagination: Pagination | undefined;
};

export type Pagination = {
  limit?: number | undefined;
  skip?: number | undefined;
};

export type ParserFunction = (file: string) => any;

export type FilesWithCustomParser = {
  files: string[];
  parser: ParserFunction;
};

export type FileWithParser = {
  file: string;
  parser: ParserFunction;
};

export function isFilesWithCustomParser(
  arg: any
): arg is FilesWithCustomParser {
  return arg.files !== undefined && arg.parser !== undefined;
}

export type CollectionMetadata = {
  name: string;
  files: Array<string | FilesWithCustomParser>; // | object[] | Function[] |;
  loadInMemory: boolean;
};

export type RelationOptions = {
  collection: CollectionMetadata;
  sourceField: string;
  foreignField: string;
};
export interface Collection {
  /**
   * Query the files and pipes to an WritableStream.
   *
   * @async
   * @function toWritableStream
   * @param {Writable} writableStream - A writable stream to redirect the result of the query
   * @return {Promise<Array<any>>} The query result.
   */
  toWritableStream?(writableStream: Writable): Promise<any>;
}

export abstract class Collection {
  protected searchOptions: SearchOptions = {
    pagination: {},
  };

  protected collection: CollectionMetadata | undefined;
  protected stream: Readable | undefined;

  constructor(collection?: CollectionMetadata) {
    if (collection) {
      this.collection = collection;
    }
  }

  //Builder Helper Functions
  /**
   * The criteria to match the results.
   * @param {object} where - An object representing the matching criteria
   *
   * @example
   * Simple matching
   * ```javascript
   * .find({name:'john',surname:'doe'})
   *    ```
   *
   * A more complex example with multiple conditions
   * ```javascript
   * .find({ AND: [ OR:[ {name:'john'},{name:'bill'} ] , {age:40} ]})
   *    ```
   */
  public find(where: object) {
    this.searchOptions.where = where;
    return this;
  }

  /**
   * Receives a function to format the results.
   * @param {function} callback - The function to manipulate each results
   *
   * @example
   * When no relation is made the first argument represents each matching result
   * ```javascript
   * .project((result) => {
   *    return {
   *      name: `${res.name} ${res.surname}`,
   *    };
   *  })
   *   ```
   *
   * When a relation is made the first argument represents each matching result, the second represents the results in the relation
   * ```javascript
   * .project((result,relation) => {
   *    return {
   *      name: `${res.name} ${res.surname}`,
   *      department: relation.name
   *    };
   *  })
   *   ```
   */
  public project(callback: ProjectFunction) {
    this.searchOptions.project = callback;
    return this;
  }

  public relation(relationOptions: RelationOptions) {
    this.searchOptions.relationOptions = relationOptions;
    return this;
  }

  /**
   * Extracts a JSON Array from a non array json
   * @param {string} path - Where to look in the json file
   * @example
   * Considering the following json if we wanted to get the array insided of `results`
   * 
   * ```json
   * {
      "data": {
        "results": [
          {
            "name": "john doe",
          },
        ]
      }
    }

   *    ```
   * It should be done using
   * ```javascript
   * .path("data.results")
   *    ```
   */
  public path(path: string) {
    this.searchOptions.path = path;
    return this;
  }

  /**
   * Limits the maximum number of matching results that is going to be returned.
   * @param {number} limit - The maximum number of matching results
   */
  public limit(limit: number) {
    this.searchOptions.pagination!.limit = limit;
    return this;
  }

  /**
   * Skip the first `n` matching results.
   * @param {number} skip - The number of matching results that should be skipped
   */
  public skip(skip: number) {
    this.searchOptions.pagination!.skip = skip;
    return this;
  }

  /**
   * Query the files and store them in an array before returning the result.
   *
   * @async
   * @function toArray
   * @return {Promise<Array<any>>} The query result.
   */
  public abstract toArray(): Promise<any>;

  //End of Builder Helper Functions

  //protected abstract exec(): unknown;
  protected abstract exec(
    writableStream: Writable,
    wrapWithBrackets: boolean
  ): any;
}
