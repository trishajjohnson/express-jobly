const { sqlForPartialUpdate } = require("./sql");

describe("Tests sqlForPartialUpdate function on company", function() {
    test("works with data passed to function", function() {
        let dataToUpdate = {description: "new data"};
        let jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url"
        };

        expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual({
            setCols: "\"description\"=$1",
            values: ["new data"],
        });
    });

    test("returns error when no data is provided to function to update", function() {
        let dataToUpdate = {};
        let jsToSql = {
            numEmployees: "num_employees",
            logoUrl: "logo_url"
        };

        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(`No data`);
    });
});