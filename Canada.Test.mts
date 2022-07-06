import { getCanadaBorderInfo } from "./Canada.mjs";
import assert from "assert/strict";

const borderInfos = await getCanadaBorderInfo();
assert(borderInfos, "There should be at least one border info object returned.");