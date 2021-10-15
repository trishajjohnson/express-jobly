"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filterQueries={}) {
    // create base DB query string
    let query =   `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                   FROM companies`;
    
    let whereValues = [];
    let filterValues = [];

    // desctructure filters into their own variables
    const { minEmployees, maxEmployees, name } = filterQueries;

    // Make sure minEmployees is not larger than maxEmployees; If so, throw error
    if(minEmployees > maxEmployees) {
      throw new BadRequestError("maxEmployees must be bigger than minEmployees");
    }

    // If minEmployees filter is passed into findAll() function, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(minEmployees !== undefined) {
      filterValues.push(minEmployees);
      whereValues.push(`num_employees >= $${filterValues.length}`);
    }

    // If maxEmployees filter is passed into findAll() function, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(maxEmployees !== undefined) {
      filterValues.push(maxEmployees);
      whereValues.push(`num_employees <= $${filterValues.length}`);
    }

    // If names filter is passed into findAll() function, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(name) {
      filterValues.push(`%${name}%`);
      whereValues.push(`name ILIKE $${filterValues.length}`);
    }
    
    // Checking to see if there are any values in whereValues array
    // If so, add WHERE statement to end of query string by joining the values found in whereValues array
    if(whereValues.length > 0) {
      query = `${query} 
               WHERE ${whereValues.join(" AND ")}`;
    }

    // Add ORDER BY to end of query string, to order result rows by company name
    query += " ORDER BY name";

    // Send db query with query string passed as well as the filterValues array
    const companiesRes = await db.query(query, filterValues);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];
    
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    
    const companyJobs = await db.query(`SELECT id, 
                                               title, 
                                               salary, 
                                               equity
                                        FROM jobs
                                        WHERE company_handle=$1`,
                                        [company.handle]
                                      );

    company.jobs = companyJobs.rows;
    

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;

