import assert from "node:assert/strict";
import test from "node:test";
import { getConfig } from "../src/env.js";

test("getConfig defaults to tbdavid2019 when no target environment is set", () => {
  const names = ["TARGET_LOGIN", "GITHUB_REPOSITORY_OWNER", "GITHUB_REPOSITORY"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));

  try {
    for (const name of names) delete process.env[name];
    assert.equal(getConfig().targetLogin, "tbdavid2019");
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
