// Cache Intl.DateTimeFormat instances so schedule expansion and field calculations
// do not rebuild identical timezone formatters thousands of times per request.
// Intl.DateTimeFormat instances are stateless for format/formatToParts and safe to reuse.
const NativeDateTimeFormat = Intl.DateTimeFormat;
const cache = new Map();

function stableOptions(options) {
  if (!options) return '';
  return Object.keys(options)
    .sort()
    .map((key) => `${key}:${String(options[key])}`)
    .join('|');
}

function CachedDateTimeFormat(locales, options) {
  const localeKey = Array.isArray(locales) ? locales.join(',') : String(locales || '');
  const key = `${localeKey}::${stableOptions(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new NativeDateTimeFormat(locales, options);
    cache.set(key, formatter);
  }
  return formatter;
}

CachedDateTimeFormat.prototype = NativeDateTimeFormat.prototype;
Object.setPrototypeOf(CachedDateTimeFormat, NativeDateTimeFormat);
Intl.DateTimeFormat = CachedDateTimeFormat;
