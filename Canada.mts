/**
 * This module is for retrieving Canadian border crossing times 
 * (Canada into US) from the Canadian government website.
 * @module
 */

import { load } from "cheerio";
import type { DataNode } from "domhandler";

const url = new URL("https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html");

type PluralDigit = | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type NonZeroDigit = "1" | PluralDigit;
type Digit = "0" | NonZeroDigit;

type DoubleDigit = `${NonZeroDigit}${Digit}`;

type FlowValue = "Not Applicable" | "No Delay" | "1 minute" | `${PluralDigit | DoubleDigit} minutes`;

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

function extractDataFromCell(cell: HTMLTableCellElement, cellId: number) {
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
}

/**
 * Finds the table and extracts its rows into objects.
 * @param markup HTML markup string.
 * @returns 
 */
export function convertTableToObjects(markup: string | Document | HTMLTableElement) {
    let table: HTMLTableElement | null;
    if (markup instanceof HTMLTableElement) {
        table = markup;
    } else {
        let document: Document;
        if (typeof markup === "string") {
            const parser = new DOMParser();
            document = parser.parseFromString(markup, "text/html");
        } else {
            document = markup;
        }
        table = document.querySelector<HTMLTableElement>("#bwttaf");
    }
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
            ] = Array.from(row.cells, extractDataFromCell).flat() as ValueArray;

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
 * Finds the table and extracts its rows into objects.
 * @param markup HTML markup string.
 * @returns 
 */
export function convertTableToObjectsCheerio(markup: string): CanadaBorderCrossingTimes[] {
    const document = load(markup, undefined, true);
    const rows = document("body > main > table#bwttaf > tbody > tr");

    const output = new Array<CanadaBorderCrossingTimes>();
    const intRe = /^\d+$/;
    for (const rowProp in rows) {
        if (!intRe.test(rowProp)) continue;
        // console.log(`row ${rowProp}`);
        const row = rows[rowProp];
        // console.log("row", row);
        const cellValues = new Array<string | [Date, string]>;
        for (const cellProp in row.children) {
            if (!intRe.test(cellProp)) continue;
            const cellId = parseInt(cellProp);
            const cell = row.children[cellProp];
            // console.log(cellProp, cell);
            if ("children" in cell) {
                if (cellId === 3) {
                    const timeElement = cell.children[0] as unknown as Element;
                    // Date/time text
                    const dateTimeText = (timeElement.children[0] as unknown as DataNode).data;
                    const timeZone = getTimeZone(dateTimeText);
                    // Parse the date
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const dtString = (timeElement as any).attribs.datetime;
                    const date = dtString ? new Date(dtString) : new Date(0);
                    cellValues.push([date, timeZone]);

                } else {
                    const cellText = cell.children.filter(c => c.type === "text").map(c => (c as DataNode).data).join("\n");
                    cellValues.push(cellText);
                }
            }
        }

        const [cbsaOffice, commercialFlow, travellersFlow, dtArray] = cellValues as [string, string, string, [Date, string]];
        if (dtArray[1][0] !== "P") {
            continue;
        }
        const value: CanadaBorderCrossingTimes = {
            CbsaOffice: cbsaOffice,
            CommercialFlow: commercialFlow,
            TravellersFlow: travellersFlow,
            Updated: dtArray[0]
        }

        output.push(value);
    }
    return output;
}

export function parseCanadaBorderInfo(markup: string) {
    if (typeof DOMParser !== "undefined") {
        return convertTableToObjects(markup);
    } else {
        return convertTableToObjectsCheerio(markup);
    }
}


/**
 * Gets Canadian Border Crossing Times from Canadian government website.
 * @returns Returns an array of Canadian Border Crossing 
 * Times for the Pacific time zone.
 */
export async function getCanadaBorderInfo() {
    const canPageResponse = await fetch(url);
    const markup = await canPageResponse.text();
    return parseCanadaBorderInfo(markup);
}



export default getCanadaBorderInfo;