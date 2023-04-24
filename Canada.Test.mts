import { parseCanadaBorderInfo } from "./Canada.mjs";
import assert from "assert/strict";
import { readFile } from "fs/promises";
import { constants } from "fs";

const htmlFile = "./samples/menu-eng.html";

const markup = await readFile(htmlFile, {
  encoding: "utf-8",
  flag: constants.O_RDONLY,
});

const borderInfos = parseCanadaBorderInfo(markup);
assert(
  borderInfos,
  "There should be at least one border info object returned."
);
for (const bi of borderInfos) {
  assert.ok(bi.CbsaOffice, "CBSA office value provided");
  assert.ok(bi.CommercialFlow, "Commercial Flow value provided");
  assert.ok(bi.TravellersFlow, "Travelers flow provided");
  assert.ok(bi.Updated);
  assert(bi.Updated instanceof Date);
  assert(bi.Updated > new Date(2000, 1, 1));
}
