import { beforeAll, describe, expect, test, it, jest } from "@jest/globals";
import { Tidbit } from "../src/tidbit/";
import { Writable } from "node:stream";
import path from "node:path";
import fs from "node:fs";
import { gt, includes, lt, not } from "../src/tidbit/comparators";

const mockedList = [
  { name: "john", surname: "doe", age: 12 },
  { name: "john", surname: "clark", age: 21 },
  { name: "john", surname: "junior", age: 40 },
  { name: "john", surname: "zack", age: 35 },
  { name: "julienne", surname: "santoni", age: 30 },
  { name: "mary", surname: "doe", age: 26 },
  { name: "hugh", surname: "john", age: 21 },
  { name: "elise", surname: "santoni", age: 25 },
  { name: "anne", surname: "santoni", age: 16 },
];

const simpleInMemoryCollectionMetadata = {
  name: "simple",
  loadInMemory: true,
  files: [
    path.resolve(__dirname, "mock", "simple", "users.json"),
    path.resolve(__dirname, "mock", "simple", "users2.json"),
  ],
};

const complexInMemoryCollectionMetadata = {
  name: "complex",
  loadInMemory: true,
  files: [path.resolve(__dirname, "mock", "recursive", "bag.json")],
};

const complex2InMemoryCollectionMetadata = {
  name: "complex2",
  loadInMemory: true,
  files: [path.resolve(__dirname, "mock", "recursive", "bags2.json")],
};

const responseInMemoryCollectionMetadata = {
  name: "response",
  loadInMemory: true,
  files: [path.resolve(__dirname, "mock", "recursive", "response.json")],
};

const relationsEmployeesInMemoryCollectionMetadata = {
  name: "employees",
  loadInMemory: true,
  files: [
    path.resolve(__dirname, "mock", "relations", "employees.json"),
    path.resolve(__dirname, "mock", "relations", "employees2.json"),
  ],
};

const departmentsInMemoryCollectionMetadata = {
  name: "departments",
  loadInMemory: true,
  files: [path.resolve(__dirname, "mock", "relations", "departments.json")],
};

const simpleInMemoryCollectionMetadataWithCustomParser = {
  name: "simpleWithCustomParser",
  loadInMemory: true,
  files: [
    path.resolve(__dirname, "mock", "simple", "users3.json").toString(),
    {
      files: [
        path.resolve(__dirname, "mock", "simple", "users.json"),
        path.resolve(__dirname, "mock", "simple", "users2.json"),
      ],
      parser: (file: string) => JSON.parse(fs.readFileSync(file).toString()),
    },
  ],
};

describe("TidBit Memory", () => {
  let tidbit: Tidbit;
  beforeAll(() => {
    tidbit = new Tidbit({
      collections: [
        simpleInMemoryCollectionMetadata,
        complexInMemoryCollectionMetadata,
        relationsEmployeesInMemoryCollectionMetadata,
        departmentsInMemoryCollectionMetadata,
        responseInMemoryCollectionMetadata,
        complex2InMemoryCollectionMetadata,
        simpleInMemoryCollectionMetadataWithCustomParser,
      ],
    });
  });

  it("should be able to filter by name 'john' and surname 'doe'", async () => {
    //Arrange
    const query = { name: "john", surname: "doe" };
    const expected = [
      {
        name: "john",
        surname: "doe",
        age: 12,
      },
    ];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should not be able to filter by name 'rufus'", async () => {
    //Arrange
    const query = { name: "rufus" };
    const expected: object[] = [];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should not be able to filter by a non-existant deep field", async () => {
    //Arrange
    const query = { fullName: { surname: "doe" } };
    const expected: object[] = [];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should not be able to filter a non-existant collection", async () => {
    //Assert
    await expect(async () =>
      tidbit.collection("dont_exist").toArray()
    ).rejects.toThrow("This collection does not exists");
  });

  it("should not be able to use toWritableStream() in memory collections", async () => {
    const wrt = new Writable({
      objectMode: true,
      write(value, encoding, callback) {
        callback();
      },
    });
    //Assert
    await expect(async () =>
      tidbit.collection("simple").toWritableStream(wrt)
    ).rejects.toThrow(
      "Writable streams are not allowed in loaded in memory collections"
    );
  });

  it("should be able to list all the items", async () => {
    //Arrange
    const query = {};
    const expected = mockedList;
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();
    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' and surname 'doe' and project to different names", async () => {
    //Arrange
    const query = { name: "john", surname: "doe" };
    const expected = [
      {
        nome: "john doe",
        idade: 12,
      },
    ];
    //Act
    const results = await tidbit
      .collection("simple")
      .find(query)
      .project((res: any) => {
        return {
          nome: `${res.name} ${res.surname}`,
          idade: res.age,
        };
      })
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' AND the age less than '20'", async () => {
    //Arrange
    const query = { AND: [{ name: "john" }, { age: lt(20) }] };
    const expected = [
      {
        name: "john",
        surname: "doe",
        age: 12,
      },
    ];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to extract a part of the json file", async () => {
    //Arrange
    const query = {};
    const expected = [
      {
        name: "john doe",
        departmentID: 1,
      },
      {
        name: "billy doe",
        departmentID: 3,
      },
      {
        name: "ana doe",
        departmentID: 2,
      },
    ];
    //Act
    const results = await tidbit
      .collection("response")
      .path("data.results")
      .find(query)
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' AND the age less than '26' and greater than '12'", async () => {
    //Arrange
    const query = {
      AND: [
        { name: not("john"), age: gt(12) },
        { name: not("john"), age: lt(26) },
      ],
    };
    const expected = [
      { name: "hugh", surname: "john", age: 21 },
      { name: "elise", surname: "santoni", age: 25 },
      { name: "anne", surname: "santoni", age: 16 },
    ];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' OR age less than '20'", async () => {
    //Arrange
    const query = { OR: [{ name: "john" }, { age: lt(19) }] };
    const expected = [
      { name: "john", surname: "doe", age: 12 },
      { name: "john", surname: "clark", age: 21 },
      { name: "john", surname: "junior", age: 40 },
      { name: "john", surname: "zack", age: 35 },
      { name: "anne", surname: "santoni", age: 16 },
    ];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by Either name 'john' with age less than '20' OR surname 'santoni' and age greater than '20'", async () => {
    //Arrange
    const query = {
      OR: [
        {
          AND: [{ name: "john" }, { age: lt(20) }],
        },
        { AND: [{ surname: "santoni" }, { age: gt(20) }] },
      ],
    };

    const expected = [
      { name: "john", surname: "doe", age: 12 },
      { name: "julienne", surname: "santoni", age: 30 },
      { name: "elise", surname: "santoni", age: 25 },
    ];
    //Act
    const results = await tidbit.collection("simple").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("Complex - should be able to filter by an empty 'pocket2'", async () => {
    //Arrange
    const query = { contents: { pocket2: {} } };
    const expected = [
      {
        name: "bag3",
        size: 30,
        contents: {
          pocket1: {
            brand: "brand_b",
          },
          pocket2: {},
          main: {},
        },
      },
    ];
    //Act
    const results = await tidbit.collection("complex").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("Complex - should be able to filter by 'brand_c' inside 'pocket1' of 'contents'", async () => {
    //Arrange
    const query = { contents: { pocket1: { brand: "brand_c" } } };
    const expected = [
      {
        name: "bag2",
        size: 20,
        contents: {
          pocket1: {
            brand: "brand_c",
          },
          pocket2: {
            brand2: "brand_d",
          },
          main: {},
        },
      },
    ];
    //Act
    const results = await tidbit.collection("complex").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("Complex - should be able to filter by bags that includes an 'passport'", async () => {
    //Arrange
    const query = { contents: { pocket1: { interior: includes("passport") } } };
    const expected = [
      {
        name: "bag3",
        size: 30,

        contents: {
          pocket1: {
            interior: ["wallet", "money", "passport"],
            brand: "brand_b",
          },
          pocket2: {},
          main: {},
        },
      },
    ];
    //Act
    const results = await tidbit.collection("complex2").find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("Relations - should be able to create a relation to get department name", async () => {
    //Arrange
    const query = {};
    const expected = [
      { name: "john doe", department: "Human Resources" },
      { name: "billy doe", department: "Financial office" },
      { name: "ana doe", department: "Information Technology" },
      { name: "mary", department: "Information Technology" },
      { name: "william", department: "Human Resources" },
      { name: "ana doe", department: "Information Technology" },
    ];
    //Act
    const results = await tidbit
      .collection("employees")
      .find(query)
      .relation({
        collection: departmentsInMemoryCollectionMetadata,
        sourceField: "departmentID",
        foreignField: "Id",
      })
      .project((res: any, rel: any) => {
        return {
          name: res.name,
          department: rel.name,
        };
      })
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("From Array - should be able to filter by name 'john' and surname 'doe'", async () => {
    //Arrange
    const query = { name: "john", surname: "doe" };
    const expected = [
      {
        name: "john",
        surname: "doe",
        age: 12,
      },
    ];
    //Act
    const results = await tidbit.fromArray(mockedList).find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("From Array - should be able to pass an empty array", async () => {
    //Act
    const results = await tidbit.fromArray([]).find({}).toArray();

    //Assert
    expect(results).toStrictEqual([]);
  });

  it("should be able to filter by name 'john' limit 2 results", async () => {
    //Arrange
    const query = { name: "john" };
    const expected = [
      {
        name: "john",
        surname: "doe",
        age: 12,
      },
      {
        name: "john",
        surname: "clark",
        age: 21,
      },
    ];
    //Act
    const results = await tidbit
      .collection("simple")
      .find(query)
      .limit(2)
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' skip 2 results", async () => {
    //Arrange
    const query = { name: "john" };
    const expected = [
      {
        name: "john",
        surname: "junior",
        age: 40,
      },
      {
        name: "john",
        surname: "zack",
        age: 35,
      },
    ];
    //Act
    const results = await tidbit
      .collection("simple")
      .find(query)
      .skip(2)
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });

  it("should be able to filter by name 'john' with custom parser", async () => {
    //Arrange
    const query = { name: "john" };
    const expected = [
      { name: "john", surname: "tree", age: 30 },
      { name: "john", surname: "doe", age: 12 },
      { name: "john", surname: "clark", age: 21 },
      { name: "john", surname: "junior", age: 40 },
      { name: "john", surname: "zack", age: 35 },
    ];
    //Act
    const results = await tidbit
      .collection("simpleWithCustomParser")
      .find(query)
      .toArray();

    //Assert
    expect(results).toStrictEqual(expected);
  });
});
