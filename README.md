# US Border Crossings

This package is for calling the API used by the [U.S. Customs and Border Protection (CBP) "Advisories and Wait Times"][Advisories and Wait Times] website.

## Web Worker (`CrossingsWorker.ts`)

This file defines a [Web Worker][Using Web Workers] that will call the API periodically.

```typescript
/**
 * Web worker that calls the US Border Crossing times API
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers}
 * @module
 */
/// <reference lib="webworker"/>

import getCrossings from "crossings/index.mjs";

// This will control how often the data from the service is refreshed.
const intervalInMilliseconds = 5 * 60 * 1_000;

// API URL
const url = "https://bwt.cbp.gov/api/bwtnew"

// Initialize a counter to track how many times the API has been called.
let counter = 0;

/**
 * Calls the Border Crossings API and posts a message with the returned
 * data for consumption by the client.
 */
async function callGetCrossings() {
    counter ++;
    try {
        // The function actually will default to this URL if this parameter
        // is omitted. Including in this example to show how it could be
        // overridden if necessary.
        const crossings = await getCrossings(url);
        // Filter to only return the Canadian border crossings
        // as WA only shares a border with Canada and not Mexico.
        const canadianCrossings = crossings.filter(c => c.border === "Canadian Border");
        // Post a message with the Canadian border crossings.
        postMessage({callCount: counter, crossings: canadianCrossings});
    } catch (err) {
        // Post an error message so the client knows an error occurred.
        postMessage({ type: "Crossing Error", err });
    }
}

// Make the initial call to the API.
callGetCrossings();

// Setup to refresh at the interval defined by the 
// intervalInMilliseconds parameter.
setInterval(async () => {
    await callGetCrossings();
}, intervalInMilliseconds);
```

## Script calling worker

Sample code for calling the above [web worker][Using Web Workers].

```typescript
import { BorderCrossing } from "crossings/types.mjs";

//#region Setup border web worker
const borderWorker = new Worker(new URL("./CrossingsWorker.ts", import.meta.url));

type CrossingEvent = {
    callCount: number;
    crossings: BorderCrossing[];
};

borderWorker.addEventListener("message", (ev: MessageEvent<CrossingEvent>) => {
    // Do something useful with the Border crossing data.
    console.log("got border crossings from web worker", ev.data);
});
borderWorker.addEventListener("error", (errorEvent) => {
    console.error("border crossings worker: error", errorEvent);
})
//#endregion
```

[U.S. Customs and Border Protection]:https://www.cbp.gov
[Advisories and Wait Times]:https://www.cbp.gov/travel/advisories-wait-times
[Using Web Workers]:https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
