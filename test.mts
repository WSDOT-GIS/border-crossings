import getCrossings from "./index.mjs";
import { strict as assert } from 'node:assert';

const crossings = await getCrossings();

for (const crossing of crossings.filter(c => c.border === "Canadian Border")) {
    assert.equal(crossing.date instanceof Date, true, `Expected ${crossing.date} to be a ${Date}`);
    assert.match(crossing.port_number, /\d+/, "expected port number to be only digits");
}
