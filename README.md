# US Border Crossings

## Web Worker (`CrossingsWorker.ts`)

```typescript
/**
 * Web worker that calls the US Border Crossing times API
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers}
 * @module
 */
/// <reference lib="webworker"/>

import getCrossings from "crossings/index.mjs";

let counter = 0;

const intervalInMilliseconds = 5 * 60 * 1_000;

async function callGetCrossings() {
    counter ++;
    try {
        const crossings = await getCrossings();
        const canadianCrossings = crossings.filter(c => c.border === "Canadian Border");
        postMessage({callCount: counter, crossings: canadianCrossings});
    } catch (err) {
        postMessage({ type: "Crossing Error", err });
    }
}

callGetCrossings();

setInterval(async () => {
    await callGetCrossings();

}, intervalInMilliseconds);
```

## Script calling worker

```typescript
import { BorderCrossing } from "crossings/types.mjs";

//#region Setup border web worker
const borderWorker = new Worker(new URL("./CrossingsWorker.ts", import.meta.url));

type CrossingEvent = {
    callCount: number;
    crossings: BorderCrossing[];
};

borderWorker.addEventListener("message", (ev: MessageEvent<CrossingEvent>) => {
    console.log("got border crossings from web worker", ev.data);
});
borderWorker.addEventListener("error", (errorEvent) => {
    console.error("border crossings worker: error", errorEvent);
})
//#endregion
```
