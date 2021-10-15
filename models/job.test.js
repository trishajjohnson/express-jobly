"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { update } = require("./company.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create new Job", function () {

  const newJob = {
    title: "newJob",
    salary: 50000,
    equity: "0.0",
    companyHandle: "c1"
  };

  const missingDataJob = {
    title: "newer",
    salary: 1000
  }

  test("works", async function () {
    let job = await Job.create(newJob);
    
    expect(job).toEqual({
        ...newJob,
        id: expect.any(Number)
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "job1",
            salary: 10000,
            equity: "0.0",
            companyHandle: "c1"
        },
        {
            id: expect.any(Number),
            title: "job2",
            salary: 20000,
            equity: "0.0",
            companyHandle: "c2",
        },
        {
            id: expect.any(Number),
            title: "job3",
            salary: 80000,
            equity: "0.1",
            companyHandle: "c3"
        },
        {
            id: expect.any(Number),
            title: "job4",
            salary: 100000,
            equity: "1.0",
            companyHandle: "c1"
        }
    ]);
  });

  test("works: with title = '4' filter", async function () {
    let jobs = await Job.findAll({title: "4"});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "job4",
            salary: 100000,
            equity: "1.0",
            companyHandle: "c1"
        }
    ]);
  });

  test("works: with minSalary = 80000 filter", async function () {
    let jobs = await Job.findAll({minSalary: 80000});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "job3",
            salary: 80000,
            equity: "0.1",
            companyHandle: "c3"
        },
        {
            id: expect.any(Number),
            title: "job4",
            salary: 100000,
            equity: "1.0",
            companyHandle: "c1"
        }
    ]);
  });
  test("works: with hasEquity = false filter", async function () {
    let jobs = await Job.findAll({hasEquity: false});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "job1",
            salary: 10000,
            equity: "0.0",
            companyHandle: "c1"
        },
        {
            id: expect.any(Number),
            title: "job2",
            salary: 20000,
            equity: "0.0",
            companyHandle: "c2",
        },
        {
            id: expect.any(Number),
            title: "job3",
            salary: 80000,
            equity: "0.1",
            companyHandle: "c3"
        },
        {
            id: expect.any(Number),
            title: "job4",
            salary: 100000,
            equity: "1.0",
            companyHandle: "c1"
        }
    ]);
  });
  test("works: with minSalary = 50000 and hasEquity = true filters", async function () {
    let jobs = await Job.findAll({minSalary: 50000, hasEquity: true});
    expect(jobs).toEqual([
        {
            id: expect.any(Number),
            title: "job3",
            salary: 80000,
            equity: "0.1",
            companyHandle: "c3"
        },
        {
            id: expect.any(Number),
            title: "job4",
            salary: 100000,
            equity: "1.0",
            companyHandle: "c1"
        }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(jobIds[0]);
    expect(job).toEqual({
        id: jobIds[0],
        title: "job1",
        salary: 10000,
        equity: "0.0",
        companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
    } catch (err) {
        console.log("err", err)
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewJobTitle",
    salary: 20000,
    equity: "1.0"
  };

  test("works", async function () {
    let job = await Job.update(jobIds[0], updateData);
    expect(job).toEqual({
      id: jobIds[0],
      ...updateData,
      companyHandle: "c1"

    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${jobIds[0]}`);
    expect(result.rows).toEqual([{
        id: jobIds[0],
        title: "NewJobTitle",
        salary: 20000,
        equity: "1.0",
        company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      salary: null,
      equity: null
    };

    let job = await Job.update(jobIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: jobIds[0],
      title: "job1",
      ...updateDataSetNulls,
      companyHandle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${jobIds[0]}`);
    expect(result.rows).toEqual([{
      id: jobIds[0],
      title: "job1",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobIds[0], {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds[0]);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${jobIds[0]}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
