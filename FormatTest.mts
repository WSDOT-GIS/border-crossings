import portCrossings from "./samples/portCrossings.json" assert { type: "json" };
import { FormatError, getIdParts, waPortsRe } from "./index.mjs";
import assert from "assert/strict";

const ids = ["02300401", "02300402", "02300403", "02300901", "02302301"];

ids.forEach((id) => {
  assert.match(id, waPortsRe);
});

function* enumeratePortNumbers() {
  for (const item of portCrossings.portCrossings) {
    yield item.bwtId;
  }
}

type Range = [min: number, max: number];

function testNumberParts(portNumber: string) {
  console.group(`test number parts for ${portNumber}`);
  try {
    const parts = getIdParts(portNumber, "number");
    console.log("parts", parts);

    const expectedMap = new Map<number, Range>([
      [0, [0, 99]],
      [1, [0, 9999]],
      [2, [0, 99]],
    ]);
    parts.forEach((part, i) => {
      assert.equal(typeof part, "number");
      assert(!isNaN(part), `part ${i} should not be NaN`);
      const minMax = expectedMap.get(i);
      assert(minMax && Array.isArray(minMax));
      assert.equal(minMax.length, 2);
      minMax.forEach((minOrMax) =>
        assert(minOrMax != null && !isNaN(minOrMax))
      );
      const [min, max] = minMax;
      assert(
        part >= min && part <= max,
        `Value ${part} is not between ${min} & ${max}`
      );
    });
  } catch (error) {
    console.groupEnd();
    throw error;
  }
  console.groupEnd();
}

function testPortNumberSplitting(portNumber: string) {
  console.group(`Current port #: ${portNumber}`);
  try {
    testStringParts(portNumber);
    testNumberParts(portNumber);
  } catch (error) {
    if (error instanceof FormatError) {
      console.error(error.message);
    } else {
      console.groupEnd();
      throw error;
    }
  }
  console.groupEnd();
}

for (const portNumber of enumeratePortNumbers()) {
  testPortNumberSplitting(portNumber);
}
function testStringParts(portNumber: string) {
  const parts = getIdParts(portNumber);
  const expectedLengthsMap = new Map<number, number>([
    [0, 2],
    [1, 4],
    [2, 2],
  ]);
  parts.forEach((part, i) => {
    assert.equal(
      typeof part,
      "string",
      `Expected part ${i} to be a string. Actually was ${typeof part}`
    );
    assert(part, `part #${i} should not be null, undefined, or zero-length.`);
    const expectedLength = expectedLengthsMap.get(i);
    assert.equal(
      part.length,
      expectedLength,
      `Expected part ${i} to have ${expectedLength} characters but instead had ${part.length}`
    );
  });
}
