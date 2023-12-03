import { Collection, RelationOptions } from "../collections/collection";

export async function queryRelations(
  relationCollection: Collection,
  sourceValue: any,
  relationOptions?: RelationOptions
): Promise<object> {
  let result: object[] = [];
  if (relationOptions) {
    let value = sourceValue;
    if (relationOptions.mutateSourceValue) {
      value = relationOptions.mutateSourceValue(value);
    }
    result = await relationCollection
      .find({
        [relationOptions.foreignField]: value,
      })
      .toArray();
  }
  return result[0];
}
