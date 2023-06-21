import { FileWithParser } from "../collection";
// Explode files to a single array

// this array
// files: [
//   "./data/users.json",
//   "./data/users2.json",
//   {
//     files: ["./data/users.csv", "./data/users2.csv"],
//     parser: (file) => parseCSVStreamFile(file),
//   },
// ],

// will become :

// const arrayFinal = [
//   { file: "./data/users.json", parser: (file) => json(file) },
//   { file: "./data/users2.json", parser: (file) => json(file) },
//   { file: "./data/users2.csv", parser: (file) => csv(file) },
//   { file: "./data/users1.csv", parser: (file) => csv(file) },
//   { file: "./data/users3.csv", parser: (file) => csv(file) },
// ];
export function explodeArray(files: any): FileWithParser[] {
  return files.flatMap((eachFile: any) =>
    Array.isArray(eachFile?.files)
      ? eachFile?.files.map((f: any) => ({
          file: f,
          parser: eachFile.parser,
        }))
      : { file: eachFile, parser: null }
  );
}
