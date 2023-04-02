# Tidbit
A pseudo query package to easily query text files and treat their data


## 🌄 Motivation

One day I caught up myself with a a bunch of separated JSON files and I needed a quick way to filter information within it, I didn't want to use a full NoSQL database for just that . All the embedded solutions worked great but most of the time, for being able to work with multiple different files, it would require an extra effort or pre-process the data before. I thought that would be good to create something to act like a 'pseudo-database' to query information within multiple files and still be reusable and customizable. The name `tidbit` is actually related to its functionality of getting a small piece of information inside a big chunk of files.

## 💾 Instalation

To install it should not be hard and it supports Javascript and Typescript

```bash
npm install tidbit
   ```
   
## 🪄 Quickstart

A better documentation is in progress in the Wiki. But this quickstart should be a good starting point. In general we have too ways of parsing files `memory` or `streams` . The API is the same for both. However `streams` have an extra output method called `toWritableStream()` that is not available to memory


### Memory

In memory is generally faster than streams, but it also uses more memory too. For multiple big files, NodeJS might crash.

```javascript

import { Tidbit } from "../src/tidbit/";

//Instantiate the tidbit and map the 'collections' for it

const tidbit = new Tidbit({
  collections: [
    {
      name: "bags", // The collection name for reference
      files: ["./data/bag.json"], // An array of the files location to be queried
      loadInMemory: true, // Flag telling to either load in memory(faster) or use streams(memory effective)
    },
    {
      name: "users",
      files: [
        "./data/users2.json", // It accepts multiple files
        "./data/users.json",
      ],
      loadInMemory: true,
    },
  ],
});


//Query files into an array in memory
const results = await tidbit.collection("users") // Collection argument expects the name of the collection
                  .find({name:'john',surname:'doe'}) // Find expects an object to query the json file. In this case, we know the json has items with 'name' and 'surname'. Then we expect to filter the results where name equals 'john' and surname equals 'doe'
                  .toArray(); // toArray is an async function that will return the results to an array

const results = await tidbit.collection("users")
                  .find({name:'john',surname:'doe'}) 
                  .skip(2) // Skip tells to skip the first n matches, in this case skip the first 2 matches
                  .limit(10) // Limit tells the maximum of results you want, even if there are many other results, in this case it will only return the first 10
                  .toArray(); 


// It is also possible to write some more complex where statements.
// In this case we want to filter where 
// departmentId is not null
// AND
// age is greater than 20
// AND
// departmentId equals 2 OR departmentId equals 3
const where = {
    AND: [ // AND expects an array of conditions that should be ALL matched
      {
        OR: [ // OR expects an array of conditions, where at least one should be matched
              { departmentId: 2 },
              { departmentId: 3 }
          ],
      },
      {
        age: gt(20),
      },
      {
        departmentId: not(null),
      },
    ],
};

const results = await tidbit.collection("users")
                  .find(where) 
                  .toArray(); 

//Query files into an array in memory and change the output format
const results = await tidbit.collection("users")
                  .find({name:'john',surname:'doe'}) 
                  .project((res) => { 
                    return {
                      fullName : `${res.name} ${res.surname}`
                    }
                  }) // project will receive a callback with the first argument being each filtered result. You can modify the result here
                  .toArray();   
                  
                  
//Query files into an array in memory with complex comparations
const results = await tidbit.collection("users")
                  .find({name:'john',age:gt(20)})  // Here we use 'gt(20)' to specify that 'age' needs to be greater than '20' we call it a comparator, that is a curried function. Tidbit provides a set of builtin, but you can also create your own without effort.
                  .toArray();     


// Query files and co-relates a value to another file
const relationMetadata = {
  collection: {
    name: "departments",
    files: ["./data/department.json"],
    loadInMemory: false,
  }, // The external collection used to match the relation results
  sourceField: "departmentID", // Name of the field in the 'users' collection
  foreignField: "id", // Name of the field in the 'departments' collection
};


// Relation allows you to co-relate that within another file
// With relations, the `project` receives a second argument with the relation results(It can be undefined if nothing was found)
const results = await tidbit
  .collection("users")
  .find({})
  .relation(relationMetadata)
  .project((result, relation) => {
    return {
      fullName: `${res.name} ${res.surname}`,
      department: relation.name,
    };
  })
  .toArray();                   

// If you don't want to query an array instead of a set of files you can do it using `.fromArray()` instead of `.collection()`
await tidbit.fromArray([{name:'john',age:20},{name:'bill',age:30}]).find({age:30}).toArray();

   ```

### Streams

Streams are generally slower than in memory, but it uses less memory as it breaks in chunks for procession. For multiple big files, NodeJS will not crash.

```javascript

//Instantiate the tidbit and map the 'collections' for it

const tidbit = new Tidbit({
  collections: [
    {
      name: "users",
      files: [
        "./data/users2.json", // It accepts multiple files
        "./data/users.json",
      ],
      loadInMemory: false, // Set it to false to use streams
    },
    {
      name: "bags",
      files: ["./data/bag.json"],
      loadInMemory: true, // You can have some collections using memory and some other using streams
    },
  ],
});



// 'toArray' exists for streams too, but if you expect to return a lot of results, it might not be too memory safe and could use a lot of memory too. It returns the result to a javascript array. Which is convenient
// A good way to save memory here is pair it with `limit()`
await tidbit.collection("users") 
                  .find({name:'john',surname:'doe'}) 
                  .toArray(); 

//'toWritableStream' is only available to stream collections. It is the most effective way to filter the data and still don't flood memory. It should receive an argument that is a writable stream. In the following example, we save it to an external file. But you can use any writable stream you want
await tidbit.collection("users") 
                  .find({name:'john',surname:'doe'}) 
                  .toWritableStream(createWriteStream("./json1.json")); 
                  

//If you want to use the Readable Streams instead of collection you can do it
await tidbit.fromStream(fs.createReadStream('./file.json')).find(query).toArray();

   ```


  ## ❗ Limitations

  It is not as powerful as a proper database solution, it doesn't have indexes and for now, it is a readonly solution.

  I believe the best usage for the package is to filter and manipulate data from multiple files to a single file with the necessary information. CLI and ETL solutions might benefit from it too.

  I have plans to improve this package to best efficience, reliability and functionality.