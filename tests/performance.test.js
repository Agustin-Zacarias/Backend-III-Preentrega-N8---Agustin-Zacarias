import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { DELIVERY_STATUS } from "../src/constants/index.js";
import { validUser, validOrder, expectError } from "./helpers.js";

const createUser = async (role = "USER") => {
  const response = await request(app).post("/api/users").send(validUser({ role })).expect(201);
  return response.body.payload._id;
};

const createOrder = async (userId) => {
  const response = await request(app).post("/api/orders").send(validOrder(userId)).expect(201);
  return response.body.payload._id;
};

describe("Performance, paginación y health check", function () {
  it("GET /api/health devuelve estado, entorno, uptime y timestamp sin secretos", async function () {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body.status).to.equal("success");
    expect(response.body.payload).to.include.keys("status", "environment", "uptimeSeconds", "timestamp");
    expect(response.body.payload.status).to.equal("ok");
    expect(response.body.payload.environment).to.equal("test");
    expect(response.body.payload.uptimeSeconds).to.be.a("number");
    expect(new Date(response.body.payload.timestamp).toISOString()).to.equal(response.body.payload.timestamp);
    expect(JSON.stringify(response.body)).not.to.include("mongodb");
    expect(JSON.stringify(response.body)).not.to.include("password");
  });

  it("GET /api/users pagina el listado y devuelve metadatos", async function () {
    await Promise.all([createUser(), createUser(), createUser()]);
    const response = await request(app).get("/api/users?page=1&limit=2").expect(200);
    expect(response.body.payload).to.have.length(2);
    expect(response.body.pagination).to.include({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true });
    expect(response.body.payload[0]).not.to.have.property("documents");
  });

  it("GET /api/users rechaza un límite superior al máximo", async function () {
    const response = await request(app).get("/api/users?limit=101");
    expectError(expect, response, 400, "VALIDATION_ERROR");
  });

  it("GET /api/orders pagina y aplica filtros", async function () {
    const userId = await createUser();
    await Promise.all([createOrder(userId), createOrder(userId), createOrder(userId)]);
    const response = await request(app)
      .get(`/api/orders?page=2&limit=2&userId=${userId}&status=PENDING`)
      .expect(200);
    expect(response.body.payload).to.have.length(1);
    expect(response.body.pagination).to.include({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(response.body.payload[0].user).to.equal(userId);
  });

  it("GET /api/deliveries pagina y permite filtrar por repartidor", async function () {
    const userId = await createUser("USER");
    const driverId = await createUser("DRIVER");
    const orderIds = await Promise.all([createOrder(userId), createOrder(userId), createOrder(userId)]);
    await DeliveryModel.insertMany(orderIds.map((order) => ({
      order,
      driver: driverId,
      status: DELIVERY_STATUS.ASSIGNED,
      assignedAt: new Date(),
    })));

    const response = await request(app)
      .get(`/api/deliveries?page=1&limit=2&driverId=${driverId}`)
      .expect(200);
    expect(response.body.payload).to.have.length(2);
    expect(response.body.pagination).to.include({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true });
    expect(response.body.payload.every((delivery) => delivery.driver === driverId)).to.equal(true);
    expect(response.body.payload[0]).not.to.have.property("receipt");
  });

  it("GET /api/products pagina los resultados", async function () {
    await Promise.all([
      { name: "Producto A", price: 10, stock: 2 },
      { name: "Producto B", price: 20, stock: 3 },
      { name: "Producto C", price: 30, stock: 4 },
    ].map((product) => request(app).post("/api/products").send(product).expect(201)));

    const response = await request(app).get("/api/products?page=2&limit=2&status=AVAILABLE").expect(200);
    expect(response.body.payload).to.have.length(1);
    expect(response.body.pagination.total).to.equal(3);
  });

  it("POST /api/users rechaza bodies JSON mayores a 256 KB con error centralizado", async function () {
    const response = await request(app).post("/api/users").send({ data: "x".repeat(300_000) });
    expectError(expect, response, 413, "REQUEST_BODY_TOO_LARGE");
  });

  it("en producción oculta mocks y logger-test, pero mantiene health y Swagger", async function () {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const mocks = await request(app).get("/api/mocks/users");
      expectError(expect, mocks, 404, "ROUTE_NOT_FOUND");

      const logger = await request(app).get("/api/logger-test");
      expectError(expect, logger, 404, "ROUTE_NOT_FOUND");

      await request(app).get("/api/health").expect(200);
      await request(app).get("/api/docs/openapi.json").expect(200);
    } finally {
      process.env.NODE_ENV = previousEnvironment;
    }
  });
});
