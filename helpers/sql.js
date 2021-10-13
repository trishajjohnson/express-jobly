const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

// helper function used to build sql queries for updating DB tables

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Takes data passed as objects from update inputs on frontend (req.body), strips keys from objects,
  // uses them to build a string and injects it into db.query to update DB; used to update users and companies alike.

  // EXAMPLE QUERY:

  // UPDATE companies 
  // SET ${setCols} <<< keys stripped from dataToUpdate using Object.keys(), injected into string (ie "'key name' = $1") and spread into array(lines 27-28), then joined into string and saved to setCols (line 33)
  // WHERE handle = ${handleVarIdx} <<< the last value in the key value objects passed as dataToUpdate (injected in update function found in company class)
  // RETURNING handle, 
  //           name, 
  //           description, 
  //           num_employees AS "numEmployees", 
  //           logo_url AS "logoUrl"`,
  // [...values, handle] <<< values (values from key value objects in dataToUpdate) spread in array(line 34), with handle(passed as first arg into update function in company class) added in at end of array(line 34)
  // console.log("dataToUpdate", dataToUpdate);
  // console.log("jsToSql", jsToSql);
  const keys = Object.keys(dataToUpdate);
  // console.log("keys", keys);
  // if no data is passed via req.body into dataToUpdate, app throws error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // the first step in formulating setCols string to be injected into query string (line in query beginning with SET)
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  // console.log("cols", cols);
  // console.log("cols.join", cols.join(", "));
  // returns object with key setCols set to value of cols array joined together to form a string for query string
  // and key values set to the value of an array of the values from the object dataToUpdate
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}


module.exports = { sqlForPartialUpdate };
