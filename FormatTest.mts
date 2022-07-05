import currentBorderCrossings from "./samples/currentBorderCrossings.json"
import portCrossings from "./samples/portCrossings.json"

const portOfEntryId = /^02(\d{4})(\d{2})$/
const re = /(?<prefix>\d{2})(?<poe>(?:3010)|(?:3005)|(?:3004)|(?:3014)|(?:3023)|(?:2905)|(?:3019)|(?:3001)|(?:3009)|(?:3002))(?<suffix>\d{2})/i;

const portOfEntryIds = [
    "02300401",
    "02300402",
    "02300403",
    "02300901",
    "02302301",
]


const ids = [
    "02300401",
    "02300402",
    "02300403",
    "02300901",
    "02302301",
]



const matches = ids.map(id => id.match(re));

console.debug("matches", matches);

function* enumeratePortNumbers() {
    for (const item of currentBorderCrossings) {
        yield item.port_number
    }
}