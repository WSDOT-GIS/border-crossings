/**
 * This module is for retrieving Canadian border crossing times 
 * (Canada into US) from the Canadian government website.
 * @module
 */

const url = new URL("https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html");

type NonZeroDigit = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Digit = "0" | NonZeroDigit;

type DoubleDigit = `${NonZeroDigit}${Digit}`;

type FlowValue = "Not Applicable" | "No Delay" | `${NonZeroDigit | DoubleDigit} minutes`;

interface CanadaBorderCrossingTimes {
    CbsaOffice: string;
    CommercialFlow: string;
    TravellersFlow: string;
    Updated: Date;
}

type TimeZone = `${"A" | "C" | "E" | "M" | "P"}${"D" | "S"}T`;

function getTimeZone(dateTime: string) {
    const timeZoneRe = /[ACEMP][DS]T/ig;
    const match = dateTime.match(timeZoneRe);
    return match?.at(0)?.toUpperCase() as TimeZone || null;
}

function convertTableToObjects(markup: string) {
    const parser = new DOMParser();
    const document = parser.parseFromString(markup, "text/html");
    const table = document.querySelector<HTMLTableElement>("#bwttaf");
    if (!table) {
        throw Error("Could not find table in page");
    }

    const output = Array<CanadaBorderCrossingTimes>();
    for (const tBody of table.tBodies) {
        for (const row of tBody.rows) {
            type ValueArray = [
                cbsaOffice: string,
                commercialFlow: FlowValue,
                travellersFlow: FlowValue,
                updated: Date | null,
                timeZone: TimeZone | null
            ];

            const [
                cbsaOffice, commercialFlow, travellersFlow, updated, timeZone
            ] = Array.from(row.cells, (cell, cellId) => {
                if (cellId === 0) {
                    return (Array.from(cell.children, (element) => element.textContent).filter(e => e !== null) as string[]).join("\n");
                }
                if (cellId === 3) {
                    const timeElement = cell.querySelector("time");
                    const timeString = timeElement?.textContent;
                    const timeZone = timeString ? getTimeZone(timeString) : null;
                    return timeElement ? [new Date(timeElement?.dateTime), timeZone] : null;
                }
                return cell.textContent as FlowValue;
            }).flat() as ValueArray;

            // skip all rows that are not in the Pacific time zone.
            if (!timeZone || timeZone[0] !== "P" || !updated) {
                continue;
            }

            const crossingTime: CanadaBorderCrossingTimes = {
                CbsaOffice: cbsaOffice,
                CommercialFlow: commercialFlow,
                TravellersFlow: travellersFlow,
                Updated: updated
            }

            output.push(crossingTime);
        }
    }

    return output;
}

/**
 * Gets Canadian Border Crossing Times from Canadan government website.
 * @returns Returns an array of Canadian Border Crossing 
 * Times for the Pacific time zone.
 */
export async function getCanadaBorderInfo() {
    const canPageResponse = await fetch(url);
    const markup = await canPageResponse.text();
    return convertTableToObjects(markup);
}

export default getCanadaBorderInfo;