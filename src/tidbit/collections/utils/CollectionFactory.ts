import { CollectionMetadata } from "../collection";
import { CollectionInMemory } from "../memory/CollectionInMemory";
import { CollectionInStream } from "../stream/CollectionInStream";

export function CollectionFactory(
  collectionMetadata: CollectionMetadata,
  InMemory: boolean
) {
  return InMemory
    ? new CollectionInMemory(collectionMetadata)
    : new CollectionInStream(collectionMetadata);
}
