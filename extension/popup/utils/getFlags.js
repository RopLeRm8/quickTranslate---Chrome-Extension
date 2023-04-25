import { getCountryFlag } from "./getCountryFlag.js";

export default async function getFlags(languages) {
  const flagURLs = await Promise.all(
    languages.map(async (lang) => getCountryFlag(lang.language))
  );
  return flagURLs;
}
