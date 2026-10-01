import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/** Normalizes user input to E.164 (e.g. +15551234567), or returns null if invalid. */
export function normalizePhone(input: string, defaultCountry: CountryCode = "US"): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry);
  return parsed?.isValid() ? parsed.number : null;
}
