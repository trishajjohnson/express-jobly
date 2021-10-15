"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJobTitle",
    salary: 25000,
    equity: "0.0",
    companyHandle: "c1"
  };

  const newJobBadData = {
    title: "newJobTitle",
    salary: 25000,
    equity: 0.0,
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: {
            id: expect.any(Number),
            title: newJob.title,
            salary: newJob.salary,
            equity: newJob.equity,
            companyHandle: newJob.companyHandle
        }
    });
  });

  test("unauth for non admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "newJob"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJobBadData)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid field", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          location: "Dallas, TX"
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance additionalProperty \"location\" exists in instance when not allowed"
        ],
        "status": 400
      }
    });
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
        jobs:
          [
            {   id: jobIds[0],
                title: "job1",
                salary: 10000,
                equity: "0.0",
                companyHandle: "c1"
            },  
            {
                id: jobIds[1],
                title: "job2",
                salary: 20000,
                equity: "0.0",
                companyHandle: "c2"
            },
            {
                id: jobIds[2],
                title: "job3",
                salary: 80000,
                equity: "0.1",
                companyHandle: "c3"
            },
            {
                id: jobIds[3],
                title: "job4",
                salary: 100000,
                equity: "1.0",
                companyHandle: "c1"
            }
        ]
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("works with/validates correct filters, set 1 filter minSalary", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({"minSalary": 80000});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: jobIds[2],
                title: "job3",
                salary: 80000,
                equity: "0.1",
                companyHandle: "c3"
            },
            {
                id: jobIds[3],
                title: "job4",
                salary: 100000,
                equity: "1.0",
                companyHandle: "c1"
            }
          ],
    });
  });

  test("works with/validates correct filters, set 1 filter hasEquity", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({"hasEquity": false});
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
          [
            {   id: jobIds[0],
                title: "job1",
                salary: 10000,
                equity: "0.0",
                companyHandle: "c1"
            },  
            {
                id: jobIds[1],
                title: "job2",
                salary: 20000,
                equity: "0.0",
                companyHandle: "c2"
            },
            {
                id: jobIds[2],
                title: "job3",
                salary: 80000,
                equity: "0.1",
                companyHandle: "c3"
            },
            {
                id: jobIds[3],
                title: "job4",
                salary: 100000,
                equity: "1.0",
                companyHandle: "c1"
            }
          ],
    });
  });

  test("works with/validates correct filters, set 2 filters minSalary and hasEquity", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({"minSalary": 20000, "hasEquity": true});
    console.log("resp.body", resp.body);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: jobIds[2],
                title: "job3",
                salary: 80000,
                equity: "0.1",
                companyHandle: "c3"
            },
            {
                id: jobIds[3],
                title: "job4",
                salary: 100000,
                equity: "1.0",
                companyHandle: "c1"
            }
          ],
    });
  });

  test("fails with invalid filter", async function () {
    const resp = await request(app)
        .get("/jobs")
        .query({"location": "Dallas"});
    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance additionalProperty \"location\" exists in instance when not allowed"
        ],
        "status": 400
      }
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobIds[0]}`);
    expect(resp.body).toEqual({
        job: {
            id: jobIds[0],
            title: "job1",
            salary: 10000,
            equity: "0.0",
            companyHandle: "c1"  
        }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "New Title",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
        job: {   
            id: jobIds[0],
            title: "New Title",
            salary: 10000,
            equity: "0.0",
            companyHandle: "c1"
        }
    });
  });

  test("unauth for non admin users", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "New Title",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          title: "New Title",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "New Title",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          id: 100,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on companyHandle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          companyHandle: "New Company Handle",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${jobIds[0]}`)
        .send({
          location: "Dallas",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${jobIds[0]}` });
  });

  test("unauth for non admin users", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${jobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
