/**
 * This module is for retrieving Canadian border crossing times
 * (Canada into US) from the
 * {@link https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html | Canada Border Services Agency (CBSA) website, "Border wait times: United States to Canada"}.
 * @see {@link https://www.cbsa-asfc.gc.ca/menu-eng.html | Canada Border Services Agency (CBSA)}
 * @packageDocumentation
 */

import type { AnyNode, CheerioOptions, CheerioAPI } from "cheerio";

type CheerioLoadFunction = (
  content: string | AnyNode | AnyNode[] | Buffer,
  options?: CheerioOptions | null | undefined,
  isDocument?: boolean
) => CheerioAPI;

let load: undefined | CheerioLoadFunction;

// Load "cheerio" module only if DOMParser is not present.
if (typeof DOMParser === "undefined") {
  // import { load } from "cheerio";
  load = (await import("cheerio")).load;
}

import type { DataNode } from "domhandler";

/**
 * Default URL for Canadian border wait times website.
 */
export const defaultUrl = new URL(
  "https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html"
);

/** Digits where type unit will be plural (e.g., `"minutes"`). */
export type PluralDigit = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
/** Digits that are not `"0"`. */
export type NonZeroDigit = "1" | PluralDigit;
/** Any digit, 0 through 9 */
export type Digit = "0" | NonZeroDigit;

/** Double digits */
export type DoubleDigit = `${NonZeroDigit}${Digit}`;

/**
 * Flow values
 * * `"Not Applicable"`
 * * `"No Delay"`
 * * X `minute`(`s`). Matches regex
 * ```typescript
 * /^\d{1,2} ((minute)|(hour))s?$/
 * ```
 */
export type FlowValue =
  | "Not Applicable"
  | "No Delay"
  | `1 ${"hour" | "minute"}`
  | `${PluralDigit | DoubleDigit} ${"minutes" | "hours"}`;

/**
 * Canada border crossing times
 */
interface CanadaBorderCrossingTimes {
  /** Canada Border Services Agency (CBSA) office */
  CbsaOffice: string;
  /** Commercial Flow */
  CommercialFlow: string;
  /**
   * Travellers Flow
   * Node: The name of this property uses the Canadian spelling.
   * The double "l"s are intentional.
   */
  TravellersFlow: string;
  Updated: Date;
}

export type { CanadaBorderCrossingTimes };

/** A time zone string */
export type TimeZone = `${"A" | "C" | "E" | "M" | "P"}${"D" | "S"}T`;

/**
 * Extracts the time zone portion of a date time string.
 * @param dateTime - A date/time string extracted from HTML table.
 */
function getTimeZone(dateTime: string) {
  const timeZoneRe = /[ACEMP][DS]T/gi;
  const match = dateTime.match(timeZoneRe);
  return (match?.at(0)?.toUpperCase() as TimeZone) || null;
}

/**
 * A tuple array containing the following:
 *
 * 0. date: {@link Date}
 * 1. timeZone: {@link TimeZone} or {@link null}
 */
export type DateAndTimeZoneTuple = [date: Date, timeZone: TimeZone | null];

/**
 * Extracts data from a table cell.
 * @param cell - HTML table cell
 * @param cellId - The index of the cell in relation to its siblings.
 * @returns One of the following:
 * * A {@link string}
 * * An array: {@link DateAndTimeZoneTuple}
 * * null
 */
function extractDataFromCell(cell: HTMLTableCellElement, cellId: number) {
  if (cellId === 0) {
    return (
      Array.from(cell.children, (element) => element.textContent).filter(
        (e) => e !== null
      ) as string[]
    ).join("\n");
  }
  if (cellId === 3) {
    const timeElement = cell.querySelector("time");
    const timeString = timeElement?.textContent;
    const timeZone = timeString ? getTimeZone(timeString) : null;

    return timeElement
      ? ([new Date(timeElement?.dateTime), timeZone] as DateAndTimeZoneTuple)
      : null;
  }
  return cell.textContent as FlowValue;
}

/**
 * Finds the table and extracts its rows into objects.
 * @param markup - HTML markup string.
 * @returns An array of Canada Border Crossing Time objects.
 */
function convertTableToObjects(markup: string | Document | HTMLTableElement) {
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

      const [cbsaOffice, commercialFlow, travellersFlow, updated, timeZone] =
        Array.from(row.cells, extractDataFromCell).flat() as ValueArray;

      // skip all rows that are not in the Pacific time zone.
      if (!timeZone || timeZone[0] !== "P" || !updated) {
        continue;
      }

      const crossingTime: CanadaBorderCrossingTimes = {
        CbsaOffice: cbsaOffice,
        CommercialFlow: commercialFlow,
        TravellersFlow: travellersFlow,
        Updated: updated,
      };

      output.push(crossingTime);
    }
  }

  return output;
}

/**
 * Finds the table and extracts its rows into objects using the
 * cherrio package.
 *
 * @remarks Use this when {@link DOMParser} is not available.
 * Developed for use with Postman tool.
 *
 * @param markup - HTML markup string.
 * @returns An array of Canada Border Crossing Time objects.
 */
function convertTableToObjectsCheerio(
  markup: string
): CanadaBorderCrossingTimes[] {
  if (!load) {
    throw new ReferenceError(
      "The cheerio.load function is not defined. Have you imported the optional 'cheerio' module?"
    );
  }
  const document = load(markup, undefined, true);
  const rows = document("body > main > table#bwttaf > tbody > tr");

  const output = new Array<CanadaBorderCrossingTimes>();
  const intRe = /^\d+$/;
  for (const rowProp in rows) {
    if (!intRe.test(rowProp)) continue;
    // console.log(`row ${rowProp}`);
    const row = rows[rowProp];
    // console.log("row", row);
    const cellValues = new Array<string | [Date, string]>();
    for (const cellProp in row.children) {
      if (!intRe.test(cellProp)) continue;
      const cellId = parseInt(cellProp);
      const cell = row.children[cellProp];
      // console.log(cellProp, cell);
      if ("children" in cell) {
        if (cellId === 3) {
          const timeElement = cell.children[0] as unknown as Element;
          // Date/time text
          const dateTimeText = (timeElement.children[0] as unknown as DataNode)
            .data;
          const timeZone = getTimeZone(dateTimeText);
          // Parse the date
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dtString = (timeElement as any).attribs.datetime;
          const date = dtString ? new Date(dtString) : new Date(0);
          cellValues.push([date, timeZone]);
        } else {
          const cellText = cell.children
            .filter((c) => c.type === "text")
            .map((c) => (c as DataNode).data)
            .join("\n");
          cellValues.push(cellText);
        }
      }
    }

    const [cbsaOffice, commercialFlow, travellersFlow, dtArray] =
      cellValues as [string, string, string, [Date, string]];
    if (dtArray[1][0] !== "P") {
      continue;
    }
    const value: CanadaBorderCrossingTimes = {
      CbsaOffice: cbsaOffice,
      CommercialFlow: commercialFlow,
      TravellersFlow: travellersFlow,
      Updated: dtArray[0],
    };

    output.push(value);
  }
  return output;
}

/**
 * Finds the table and extracts its rows into objects.
 * @param markup - HTML markup string.
 * @returns An array of Canada Border Crossing Time objects.
 */
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
  const canPageResponse = await fetch(defaultUrl);
  const markup = await canPageResponse.text();
  return parseCanadaBorderInfo(markup);
}

export default getCanadaBorderInfo;
