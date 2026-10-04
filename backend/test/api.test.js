require("./helpers");
const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { createApp } = require("../app");
const User = require("../models/User");

let server;
let base;

test.before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const token = (sub = "507f1f77bcf86cd799439011") =>
  jwt.sign({ sub }, process.env.JWT_SECRET, { algorithm: "HS256" });

const call = (path, { method = "GET", body, auth } = {}) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test("health check", async () => {
  const res = await call("/api/health");
  assert.equal(res.status, 200);
});

test("unknown route returns 404 JSON", async () => {
  const res = await call("/api/nope");
  assert.equal(res.status, 404);
});

test("malformed JSON returns 400, not 500", async () => {
  const res = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ bad json",
  });
  assert.equal(res.status, 400);
});

test("register rejects weak/invalid input before touching the database", async () => {
  for (const body of [
    {},
    { username: "ab", email: "a@b.co", password: "longenough1" },
    { username: "valid_name", email: "not-an-email", password: "longenough1" },
    { username: "valid_name", email: "a@b.co", password: "short" },
    { username: "bad name!", email: "a@b.co", password: "longenough1" },
  ]) {
    const res = await call("/api/auth/register", { method: "POST", body });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
});

test("NoSQL operator injection in login/register is rejected", async () => {
  const login = await call("/api/auth/login", {
    method: "POST",
    body: { email: { $ne: null }, password: { $ne: null } },
  });
  assert.equal(login.status, 400);

  const reg = await call("/api/auth/register", {
    method: "POST",
    body: { username: { $ne: "x" }, email: "a@b.co", password: "longenough1" },
  });
  assert.equal(reg.status, 400);
});

test("protected routes require a valid token", async () => {
  assert.equal((await call("/api/submissions")).status, 401);
  assert.equal((await call("/api/auth/me", { auth: "garbage" })).status, 401);
});

test("tokens signed with a different algorithm/secret are rejected", async () => {
  const forged = jwt.sign({ sub: "507f1f77bcf86cd799439011" }, "some-other-secret-some-other-secret");
  assert.equal((await call("/api/auth/me", { auth: forged })).status, 401);
});

test("submissions validate language and code length", async () => {
  const bad = await call("/api/submissions", {
    method: "POST",
    auth: token(),
    body: { problemSlug: "two-sum", language: "brainfuck", code: "+" },
  });
  assert.equal(bad.status, 400);

  const huge = await call("/api/submissions", {
    method: "POST",
    auth: token(),
    body: { problemSlug: "two-sum", language: "python", code: "x".repeat(20001) },
  });
  assert.equal(huge.status, 400);
});

test("creating a problem requires the admin role", async () => {
  const original = User.findById;
  try {
    User.findById = () => ({ select: async () => ({ role: "user" }) });
    const res = await call("/api/problems", { method: "POST", auth: token(), body: {} });
    assert.equal(res.status, 403);

    User.findById = () => ({ select: async () => ({ role: "admin" }) });
    const adminRes = await call("/api/problems", { method: "POST", auth: token(), body: {} });
    assert.equal(adminRes.status, 400); // passed the role check, failed body validation
  } finally {
    User.findById = original;
  }
});

test("admin problem input is validated and whitelisted", () => {
  const { parseProblemInput } = require("../utils/validate");
  const good = parseProblemInput({
    title: "T", slug: "t-1", description: "d", difficulty: "Easy",
    testCases: [{ input: "[1]", expectedOutput: "1", isHidden: true }],
    _id: "should-be-dropped", role: "admin",
  });
  assert.ok(good.value);
  assert.equal(good.value._id, undefined);
  assert.equal(good.value.testCases[0].isHidden, true);
  assert.ok(parseProblemInput({ ...good.value, slug: "Bad Slug" }).error);
  assert.ok(parseProblemInput({ ...good.value, testCases: [] }).error);
});
