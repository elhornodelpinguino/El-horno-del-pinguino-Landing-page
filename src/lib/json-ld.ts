/**
 * Serializes an object for safe embedding inside a
 * `<script type="application/ld+json">` block.
 *
 * `JSON.stringify` alone is NOT safe here: it does not escape `<`, so a string
 * value containing `</scr` + `ipt>` closes the block and any following markup is
 * parsed as live HTML — a stored-XSS vector when the JSON carries backend data
 * (product names/descriptions) not guaranteed to be free of `<`/`>`.
 *
 * Transparent: the bytes change, but `JSON.parse` of the output yields the
 * original value, and search engines read the same structured data.
 *
 *  - `<` `>` `&` are escaped so they never form `</scr`+`ipt` or HTML entities.
 *  - U+2028 / U+2029 are escaped: valid inside JSON strings but illegal as raw
 *    bytes in a browser script context.
 */
const HTML_SENSITIVE = /[<>&\u2028\u2029]/g;

function escapeChar(char: string): string {
  switch (char.charCodeAt(0)) {
    case 0x3c:
      return "\\u003c";
    case 0x3e:
      return "\\u003e";
    case 0x26:
      return "\\u0026";
    case 0x2028:
      return "\\u2028";
    case 0x2029:
      return "\\u2029";
    default:
      return char;
  }
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(HTML_SENSITIVE, escapeChar);
}
