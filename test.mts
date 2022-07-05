import { getCurrentBorderCrossingInfo, createWaitTimesPageUrl, CrossingTypes } from "./index.mjs";
import { strict as assert } from 'node:assert';

// Get border crossing info and check some of the response properties
// to make sure the JSON was parsed correctly and returning
// the expected types.
const crossingTestPromise = (async () => {
    console.debug("Testing getCurrentBorderCrossingInfo...");
    const crossings = await getCurrentBorderCrossingInfo();

    for (const crossing of crossings.filter(c => c.border === "Canadian Border")) {
        assert.equal(crossing.date instanceof Date, true, `Expected ${crossing.date} to be a ${Date}`);
        assert.match(crossing.port_number, /\d+/, "expected port number to be only digits");
    }
    console.debug("Finished testing getCurrentBorderCrossingInfo.");
})();

// Generate a wait times page URL, then fetch and ensure response is OK.
const waitTimesPagePromise = (async () => {
    console.debug("Testing wait times page URL generation...")
    const waitTimesUrl = createWaitTimesPageUrl("02300402", CrossingTypes.Passenger);
    const response = await fetch(waitTimesUrl);
    assert(response.ok);
    console.debug("Finished testing wait times page URL generation...")
})();

// Wait for all the test promises to complete.
await Promise.allSettled([crossingTestPromise, waitTimesPagePromise]);