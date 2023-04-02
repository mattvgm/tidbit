import { RelationOptions } from "../collections/collection";
import { CollectionFactory } from "../collections/utils/CollectionFactory";

export async function queryRelations(
  sourceValue: any,
  relationOptions?: RelationOptions
): Promise<object> {
  let result: object[] = [];
  if (relationOptions) {
    const colMeta = relationOptions.collection;
    const relationCollection = CollectionFactory(colMeta, colMeta.loadInMemory);
    result = await relationCollection
      .find({
        [relationOptions.foreignField]: sourceValue, //FIX:  it
      })
      .toArray();
  }
  return result[0];
}
