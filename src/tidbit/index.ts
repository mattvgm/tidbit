import { CollectionMetadata } from "./collections/collection";
import { CollectionInMemory } from "./collections/memory/CollectionInMemory";
import { CollectionInStream } from "./collections/stream/CollectionInStream";
import { CollectionFactory } from "./collections/utils/CollectionFactory";
import { Readable } from "node:stream";

type TidbitProps = {
  collections: CollectionMetadata[];
  options?: object;
};

export class Tidbit {
  /**
   * Creates a `Tidbit` instance that orquestrate the collections.
   * @constructor
   * @param {TidbitProps} collections - The collection name.
   */
  constructor(private collections: TidbitProps) {}

  /**
   * Creates a `collection` that is used to query the data.
   * @param {string} collection - The collection name.
   */
  public collection(collection: string) {
    const collectionMetadata = this.collections.collections.filter(
      (col: any) => col.name === collection
    )[0];

    if (!collectionMetadata) {
      throw new Error("This collection does not exists");
    }

    return CollectionFactory(
      collectionMetadata,
      collectionMetadata.loadInMemory
    );
  }

  /**
   * Load an readable stream from code instead of the collection.
   * @param {ReadableStream} readableStream - A readable stream
   *
   * @example
   * ```javascript
   * await tidbit.fromStream(fs.createReadStream('./file.json')).find({}).toWritableStream(fs.createWriteStream("./result.json"));
   *    ```
   */
  public fromStream(readableStream: Readable) {
    return CollectionInStream.fromStream(readableStream);
  }

  /**
   * Load an objects arrays from code instead of the collection.
   * @param {Array} array - An array with objects
   *
   * @example
   * ```javascript
   * await tidbit.fromArray([{name:'john',surname:'doe'},{name:'billy',surname:'doe'}]).find({}).toArray();
   *    ```
   *
   */
  public fromArray(array: any[]) {
    return CollectionInMemory.fromArray(array);
  }
}
