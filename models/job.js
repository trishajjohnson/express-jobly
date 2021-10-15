"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create({ title, salary, equity, companyHandle }) {
    
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filterQueries={}) {
    // create base DB query string
    let query =   `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                   FROM jobs`;
    
    let whereValues = [];
    let filterValues = [];

    // desctructure filters into their own variables
    const { title, minSalary, hasEquity } = filterQueries;

    // If title filter is passed into findAll() function, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(title !== undefined) {
      filterValues.push(`%${title}%`);
      whereValues.push(`title ILIKE $${filterValues.length}`);
    }

    // If minSalary filter is passed into findAll() function, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(minSalary !== undefined) {
      filterValues.push(minSalary);
      whereValues.push(`salary >= $${filterValues.length}`);
    }

    // If hasEquity filter is passed into findAll() function and set to true, push its value into values array 
    // Also, push string for WHERE query line into whereValues array
    if(hasEquity === true) {
      whereValues.push(`equity > 0`);
    }

    
    // Checking to see if there are any values in whereValues array
    // If so, add WHERE statement to end of query string by joining the values found in whereValues array
    if(whereValues.length > 0) {
      query = `${query} 
               WHERE ${whereValues.join(" AND ")}`;
    }

    // Add ORDER BY to end of query string, to order result rows by company name
    // query += " ORDER BY name";

    // Send db query with query string passed as well as the filterValues array
    const jobsRes = await db.query(query, filterValues);

    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;

