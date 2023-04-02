import fs from "fs";
import path from "path";

export function extractJSONFromFile<T>(file: string, objectPath?: string) {
  const fileRead = fs.readFileSync(path.resolve(file));
  const parsedJson = objectPath
    ? extractPath(JSON.parse(fileRead.toString()), objectPath)
    : JSON.parse(fileRead.toString());

  return parsedJson as T;
}

export function extractPath(content: any, path: string) {
  const obj = content;
  const props = path.split(".");
  const result = props.reduce((acc, prop) => acc[prop], obj);
  return result;
}

export function concatJsonArray(fileList: string[], objectPath?: string) {
  let finalFile: unknown[] = [];
  fileList.forEach((file) => {
    const fileContent: object[] = extractJSONFromFile(file, objectPath);
    finalFile = [...finalFile, ...fileContent];
  });
  return finalFile;
}
