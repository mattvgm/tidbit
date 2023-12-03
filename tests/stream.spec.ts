import { beforeAll, describe, expect, test, it, jest } from "@jest/globals";
import { Tidbit } from "../src/tidbit/";
import path from "node:path";
import { Writable } from "node:stream";
import fs from "fs";
import { gt, lt, not } from "../src/tidbit/comparators";

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
  loadInMemory: false,
  files: [
    path.resolve(__dirname, "mock", "simple", "users.json"),
    path.resolve(__dirname, "mock", "simple", "users2.json"),
  ],
};

const complexInMemoryCollectionMetadata = {
  name: "complex",
  loadInMemory: false,
  files: [path.resolve(__dirname, "mock", "recursive", "bag.json")],
};

const relationsEmployeesInMemoryCollectionMetadata = {
  name: "employees",
  loadInMemory: false,
  files: [
    path.resolve(__dirname, "mock", "relations", "employees.json"),
    path.resolve(__dirname, "mock", "relations", "employees2.json"),
  ],
};

const departmentsInMemoryCollectionMetadata = {
  name: "departments",
  loadInMemory: false,
  files: [path.resolve(__dirname, "mock", "relations", "departments.json")],
};

const responseInMemoryCollectionMetadata = {
  name: "response",
  loadInMemory: false,
  files: [path.resolve(__dirname, "mock", "recursive", "response.json")],
};

const simpleInMemoryCollectionMetadataWithCustomParser = {
  name: "simpleWithCustomParser",
  loadInMemory: false,
  files: [
    path.resolve(__dirname, "mock", "simple", "users3.json"),
    {
      files: [
        path.resolve(__dirname, "mock", "simple", "users.json"),
        path.resolve(__dirname, "mock", "simple", "users2.json"),
      ],
      parser: (file: string) => fs.createReadStream(file),
    },
  ],
};

describe("TidBit Streams - toArray", () => {
  let tidbit: Tidbit;
  beforeAll(() => {
    tidbit = new Tidbit({
      collections: [
        simpleInMemoryCollectionMetadata,
        complexInMemoryCollectionMetadata,
        relationsEmployeesInMemoryCollectionMetadata,
        departmentsInMemoryCollectionMetadata,
        responseInMemoryCollectionMetadata,
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

describe("TidBit Streams - toWritableStream", () => {
  let tidbit: Tidbit;
  beforeAll(() => {
    tidbit = new Tidbit({
      collections: [
        simpleInMemoryCollectionMetadata,
        complexInMemoryCollectionMetadata,
        relationsEmployeesInMemoryCollectionMetadata,
        departmentsInMemoryCollectionMetadata,
        responseInMemoryCollectionMetadata,
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

  it("From Stream - should be able to filter by name 'john' and surname 'doe'", async () => {
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
    const read = fs.createReadStream(
      path.resolve(__dirname, "mock", "simple", "users.json"),
      { encoding: "utf8" }
    );

    const results = await tidbit.fromStream(read).find(query).toArray();

    //Assert
    expect(results).toStrictEqual(expected);
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

  it("toWritableStream - should be able to filter by name 'john'", async () => {
    //Arrange
    let results: string = "";

    const wrt = new Writable({
      objectMode: true,
      write(value, encoding, callback) {
        results = `${results}${value}`;
        callback();
      },
    });
    const query = { name: "john", age: lt(22) };
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
    await tidbit.collection("simple").find(query).toWritableStream(wrt);

    //Assert
    expect(results).toStrictEqual(JSON.stringify(expected));
  });

  it("toWritableStream - should not be able to filter by name 'rufus'", async () => {
    //Arrange
    let results: string = "";

    const wrt = new Writable({
      objectMode: true,
      write(value, encoding, callback) {
        results = `${results}${value}`;
        callback();
      },
    });
    const query = { name: "rufus" };
    const expected: object[] = [];
    //Act
    await tidbit.collection("simple").find(query).toWritableStream(wrt);

    //Assert
    expect(results).toStrictEqual(JSON.stringify(expected));
  });
});
