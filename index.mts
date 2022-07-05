/**
 * This module is for calling the API used by the U.S. Customs and Border Protection (CBP) "Advisories and Wait Times" website.
 * @module
 * @see {@link https://www.cbp.gov/travel/advisories-wait-times}
 * @see {@link https://www.cbp.gov}
 */

import { BorderCrossing } from "./types.mjs";

const defaultBwtWebsiteUrl = "https://bwt.cbp.gov";
const defaultApiUrl = `${defaultBwtWebsiteUrl}/api`;
const defaultUrl = `${defaultApiUrl}/bwtnew`;

type CrossingType = "POV" | "COV" | "PED";

export const CrossingTypes = {
  Passenger: "POV",
  Commercial: "COV",
  Pedestrian: "PED"
} as const;

/**
 * Generates a Border Wait Times page URL for the given Port of Entry and Crossing Type webpage.
 * @param portOfEntryId Identifier for a Port of Entry.
 * @param crossingType Specifies a crossing type. (Pedestrian is not used in WA.)
 * @param bwtWebsiteUrl Override the base URL of https://bwt.cbp.gov.
 * @returns A URL for a Border Wait Times page.
 */
export function createWaitTimesPageUrl(portOfEntryId: string, crossingType: CrossingType, bwtWebsiteUrl: string = defaultBwtWebsiteUrl) {
  // Remove trailing slash from bwtWebsiteUrl if present, then join parts sparated by /.
  return [bwtWebsiteUrl.replace(/\/$/g, ""), "details", portOfEntryId, crossingType].join("/");
}

/**
 * Parses a string into a date
 * @param dateString A string representing a date in m/d/y format. (E.g., "6/29/2022")
 * @param timeString A string representing a time, with hours, minutes, and seconds separated by ":".
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
 * This funciton is used by JSON.parse to customize JSON parsing.
 * @param this The current object being deserialized by JSON parser.
 * @param key The name of the current property
 * @param value The current value
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
 * @param url Override default URL for US Government border crossings.
 * @returns An array of border crossing objects.
 */
export async function getCurrentBorderCrossingInfo (url = defaultUrl) {
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