/**
 * This module is for calling the API used by the U.S. Customs and Border Protection (CBP) "Advisories and Wait Times" website.
 * @see [US Customs and Border Protection (CBP), "Advisories and Wait Times"](https://www.cbp.gov/travel/advisories-wait-times)
 * @see [US Customs and Border Protection (CBP)](https://www.cbp.gov)
 * @packageDocumentation
 */

import FormatError from "./FormatError.mjs";
import { BorderCrossing } from "./types.mjs";
export { getCanadaBorderInfo, parseCanadaBorderInfo } from "./Canada.mjs"
export type { FlowValue as CanadaFlowValue, TimeZone as CanadaTimeZone } from "./Canada.mjs"


export { FormatError };

export const defaultBwtWebsiteUrl = "https://bwt.cbp.gov";
export const defaultApiUrl = `${defaultBwtWebsiteUrl}/api`;
export const defaultUrl = `${defaultApiUrl}/bwtnew`;

/** Crossing type string */
export type CrossingType = "POV" | "COV" | "PED";

/** 
 * An enumeration of valid {@link CrossingType} values 
 */
export const CrossingTypes = {
  Passenger: "POV",
  Commercial: "COV",
  Pedestrian: "PED"
} as const;

/** Known WA ports */
export const waPorts = [3010, 3005, 3004, 3014, 3023, 2905, 3019, 3001, 3009, 3002];
/** A regular expression that matches a string containing a {@link waPorts} value. */
export const waPortsRe = new RegExp(`(?<prefix>\\d{2})(?<poe>${waPorts.map(p => `(?:${p})`).join("|")
  })(?<suffix>\\d{2})`);


/** 
 * An array of three values that are the parts of a full ID string 
 */
export type IdParts<T extends string | number> = [prefix: T, portOfEntryId: T, suffix: T];
/** An array of three strings that are the parts of a full ID string */
type IdPartStrings = IdParts<string>;
/** An array of three integers that are the parts of a full ID string */
type IdPartIntegers = IdParts<number>;

/**
 * Verifies that the input ID consists of between seven and eight digits.
 * @param id - A Border Crossings Wait-times (BWT) ID.
 * @param assumeWaIfTooShort - If the input string is only six digits long,
 * if this value is true then the WA prefix of "02" will be added to the 
 * beginning of the input string.
 * @returns Returns the input string, 
 * padded to eight digits if the input only had seven.
 * @throws {@link FormatError} Thrown if the input string:
 * - !assumeWaIfTooShort: does not consist between seven and eight digits.
 * - assumeWaIfTooShort: does not consist of between six and eight digits.
 */
function verifyStringInput(id: string, assumeWaIfTooShort?: boolean): string {
  let expectedFormat = /^\d{6,8}$/; // /^\d{7,8}$/;
  if (!expectedFormat.test(id)) {
    throw new FormatError(id, expectedFormat);
  }
  // If we know it's WA and the prefix isn't there, add it.
  if (id.length === 6 && assumeWaIfTooShort) {
    id = `02${id}`;
  }
  // Set expected format to be 7 or 8 digits.
  expectedFormat = /^\d{7,8}$/;
  if (!expectedFormat) {
    throw new FormatError(id, expectedFormat);
  }
  // Pad to eight digits if necessary.
  if (id.length === 7) {
    id = `0${id}`;
  }
  return id;
}

type IdPartsOutputType = "string" | "number";
export function getIdParts(bwtId: string, outputType?: "string", assumeWaIfTooShort?: boolean): IdParts<string>
export function getIdParts(bwtId: number, outputType?: "number", assumeWaIfTooShort?: boolean): IdParts<number>
export function getIdParts(bwtId: string, outputType: "number", assumeWaIfTooShort?: boolean): IdParts<number>
export function getIdParts(bwtId: number, outputType: "string", assumeWaIfTooShort?: boolean): IdParts<string>
/**
 * Splits an ID into its three component parts.
 * @param bwtId - Full border wait times ID as either a string or integer
 * @param outputType - Optionally specify output type.
 * @param assumeWaIfTooShort - If the bwId is too short, assume that it is an ID for WA.
 * If omitted, the output will be an array of values of the same type as the input.
 * @returns An array of three elements: either all string or all number type.
 * @throws {@link FormatError} Thrown if the input string does not
 * consist between seven and eight digits.
 */
export function getIdParts(bwtId: string | number, outputType?: IdPartsOutputType, assumeWaIfTooShort?: boolean): IdParts<string | number> {

  if (typeof bwtId === "string") {
    bwtId = verifyStringInput(bwtId, assumeWaIfTooShort);
    const prefix = bwtId.substring(0, 2);
    const portOfEntryId = bwtId.substring(2, 6);
    const suffix = bwtId.substring(6);
    const parts = [prefix, portOfEntryId, suffix];
    return outputType === "number" ?
      parts.map(part => {
        return parseInt(part.replace(/^0{1,}/, ""), 10);
      }) as IdPartIntegers
      : parts as [string, string, string] as IdPartStrings;
  }
  else if (typeof bwtId === "number") {
    const suffix = bwtId % 100;
    const portOfEntryId = ((bwtId - suffix) / 100) % 10_000;
    const prefix = (((bwtId - suffix) / 100) - portOfEntryId) / 10_000;
    if (outputType !== "string") {
      return [prefix, portOfEntryId, suffix];
    } else {
      const sPrefix = prefix.toLocaleString("en-US", { minimumFractionDigits: 2 });
      const sPortOfEntryId = portOfEntryId.toLocaleString("en-US", { minimumFractionDigits: 4 });
      const sSuffix = suffix.toLocaleString("en-US", { minimumIntegerDigits: 2 });
      return [sPrefix, sPortOfEntryId, sSuffix];
    }
  }
  else {
    throw new TypeError("Unsupported input");
  }
}

/**
 * Generates a Border Wait Times page URL for the given Port of Entry and Crossing Type webpage.
 * @param portOfEntryId - Identifier for a Port of Entry.
 * @param crossingType - Specifies a crossing type. (Pedestrian is not used in WA.)
 * @param bwtWebsiteUrl - Override the base URL of https://bwt.cbp.gov.
 * @returns A URL for a Border Wait Times page.
 */
export function createWaitTimesPageUrl(portOfEntryId: string, crossingType: CrossingType, bwtWebsiteUrl: string = defaultBwtWebsiteUrl) {
  // Remove trailing slash from bwtWebsiteUrl if present, then join parts sparated by /.
  return [bwtWebsiteUrl.replace(/\/$/g, ""), "details", portOfEntryId, crossingType].join("/");
}

/**
 * Parses a string into a date
 * @param dateString - A string representing a date in m/d/y format. (E.g., "6/29/2022")
 * @param timeString - A string representing a time, with hours, minutes, and seconds separated by ":".
 * @returns A Date object.
 */
function getDateFromString(dateString: string, timeString?: string): Date {
  // Split the date string into month, day, and year.
  // Month needs to be changed to zero-based because
  // JavaScript expects that for the month value and
  // ONLY the month value. JavaScript is stupid.
  const [month, date, year] = dateString.split("/").map((n, i) => i === 0 ? parseInt(n) - 1 : parseInt(n)) as [month: number, date: number, year: number];
  const dateParts: [number, number, number] = [year, month, date];
  const timeParts = timeString ? timeString.split(":").map(value => parseInt(value)) as [hours: number, minutes: number, seconds: number] : [undefined, undefined, undefined];
  return new Date(Date.UTC(...dateParts, ...timeParts));
}

/**
 * This function is used by JSON.parse to customize JSON parsing.
 * @param this - The current object being deserialized by JSON parser.
 * @param key - The name of the current property
 * @param value - The current value
 * @returns Returns the converted version of value param
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function customizeBorderCrossingJson(this: any, key: string, value: any): any {
  if (typeof value === "string") {
    if (value === "") {
      return null;
    }
    // Parse date and time into new property.
    if (key === "date" && "time" in this) {
      const date = getDateFromString(value, this.time);
      return date;
    } else if (key === "time") {
      return;
    }
    // Parse boolean value
    if ((key === "automation" || key === "automation_enabled") && value in ["0", "1"]) {
      return new Boolean(parseInt(value));
    }
    if (key === "delay_minutes" || key === "lanes_open") {
      return value.length ? parseInt(value) : null;
    }
    if (key === "maximum_lanes") {
      return value === "N/A" ? null : parseInt(value);
    }
  }
  return value;
}

/**
 * Gets US border crossing info
 * @param url - Override default URL for US Government border crossings.
 * @returns An array of border crossing objects.
 */
export async function getCurrentBorderCrossingInfo(url = defaultUrl) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "text/json");

  const requestOptions = {
    method: 'GET',
    headers: myHeaders
  };
  const response = await fetch(url, requestOptions);
  const jsonText = await response.text();
  const output: BorderCrossing[] = JSON.parse(jsonText, customizeBorderCrossingJson)

  return output;
}

/**
 * Enumerates through a collection of BorderCrossings, 
 * optionally filtering out non-WA items.
 * @param crossings - A collection of {@link BorderCrossing} objects.
 * @param waOnly - Set to true to omit non-WA items.
 */
export function* enumerateBorderCrossingInfos(crossings: Iterable<BorderCrossing>, waOnly = true) {
  for (const crossing of crossings) {
    if (!waOnly || crossing.port_number.startsWith("30")) {
      yield crossing;
    }
  }
}