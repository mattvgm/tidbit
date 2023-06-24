import fs from "fs";
import path from "path";
import {
  FileWithParser,
  isFilesWithCustomParser,
  ParserFunction,
} from "../collections/collection";

export function extractJSONFromFile<T>(file: string) {
  const fileRead = fs.readFileSync(path.resolve(file));
  const parsedJson = JSON.parse(fileRead.toString());

  return parsedJson as T;
}

export function extractPath(content: any, path: string) {
  const obj = content;
  const props = path.split(".");
  const result = props.reduce((acc, prop) => acc[prop], obj);
  return result;
}

export function concatJsonArray(
  fileList: FileWithParser[],
  objectPath?: string
) {
  let finalFile: unknown[] = [];
  fileList.forEach((currentFile: FileWithParser) => {
    let fileContent: object[] = [];

    if (!currentFile.parser) {
      currentFile.parser = extractJSONFromFile;
    }
    fileContent = currentFile.parser(currentFile.file);

    //If we need to pick an array inside of the json using dot notation
    if (objectPath) {
      fileContent = extractPath(fileContent, objectPath);
    }

    finalFile = [...finalFile, ...fileContent];
  });
  return finalFile;
}
