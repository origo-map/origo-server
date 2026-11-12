
/**
 * Normalizes a string for comparison: lower case, collapsed whitespace and trimmed.
 * @function
 * @name normalizeSearchString
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string.
 */
function normalizeSearchString(str) {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }
  return String(str).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Scores how well a name matches the search query. A lower score means a better match.
 * The names returned by the APIs are often prefixed with municipality or district, for example
 * "SUNDSVALL KVISSLE 1:1", which is why a match at the end of the name counts as an exact match.
 * @function
 * @name relevanceScore
 * @param {string} namn - The name of a search result.
 * @param {string} q - The search query string.
 * @returns {number} 0 for an exact match, higher values for weaker matches.
 */
function relevanceScore(namn, q) {
  const name = normalizeSearchString(namn);
  const query = normalizeSearchString(q);
  if (!query || !name) {
    return 5;
  }
  if (name === query) {
    return 0;
  }
  if (name.endsWith(` ${query}`)) {
    return 1;
  }
  if (name.startsWith(`${query} `)) {
    return 2;
  }
  if (name.includes(` ${query} `)) {
    return 3;
  }
  if (name.includes(query)) {
    return 4;
  }
  return 5;
}

/**
 * Compares two names by how well they match the search query. Used to make sure that an exact
 * match is placed first and therefore never is cut off by the limit of how many suggestions
 * that are shown.
 * @function
 * @name compareRelevance
 * @param {string} namnA - First name.
 * @param {string} namnB - Second name.
 * @param {string} q - The search query string.
 * @returns {number} Negative if a is a better match than b, positive if b is better, 0 if equal.
 */
export function compareRelevance(namnA, namnB, q) {
  return relevanceScore(namnA, q) - relevanceScore(namnB, q);
}

/**
 * Compares two names naturally, so that for example "KVISSLE 1:2" is sorted before "KVISSLE 1:10".
 * @function
 * @name compareNamesNaturally
 * @param {string} namnA - First name.
 * @param {string} namnB - Second name.
 * @returns {number} -1 if a < b, 1 if a > b, 0 if equal.
 */
export function compareNamesNaturally(namnA, namnB) {
  return String(namnA).localeCompare(String(namnB), 'sv', { numeric: true, sensitivity: 'base' });
}
