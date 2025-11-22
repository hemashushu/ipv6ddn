# IPv6 Decimal Dot Notation (IPv6-DDN) Converter

A lightweight, zero-dependency JavaScript library to convert IPv6 addresses between the standard Hexadecimal format and the experimental Decimal Dot Notation (IPv6-DDN).

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=4 orderedList=false} -->

<!-- code_chunk_output -->

- [What is IPv6-DDN?](#what-is-ipv6-ddn)
- [Features](#features)
- [Usage](#usage)
  - [Node.js](#nodejs)
  - [Browser](#browser)
- [API Reference](#api-reference)
  - [`fromStandard(standardIP)`](#fromstandardstandardip)
  - [`toStandard(ddnIP)`](#tostandardddnip)
  - [`getType(ipaddrText)`](#gettypeipaddrtext)
  - [`isDDN(ipaddrText)`](#isddnipaddrtext)
- [Examples](#examples)
- [Running Tests](#running-tests)
- [Specification](#specification)
- [License](#license)

<!-- /code_chunk_output -->

## What is IPv6-DDN?

IPv6 Decimal Dot Notation (IPv6-DDN) is a proposed format designed to make IPv6 addresses more readable for humans familiar with IPv4.

Instead of using hexadecimal blocks separated by colons (e.g., `2001:db8::1`), IPv6-DDN represents the 128-bit address as 8 segments of 16-bit decimal integers (0-65535) separated by dots (`.`).

| Format        | Example        |
| ------------- | -------------- |
| Standard IPv6 | `2001:db8::1`  |
| IPv6-DDN      | `8193.3512..1` |

It supports zero-compression using double dots (`..`) similar to the double colon (`::`) in standard IPv6.

## Features

- Bi-directional Conversion: Standard Hex to/from Decimal Dot.
- Canonicalization: Implements RFC 5952 style rules (longest run of zeros, leftmost preference) for both formats.
- Type Detection: Identify whether a string is IPv4, IPv6 (Standard), or IPv6-DDN.
- Universal Support: Works in Node.js (CommonJS), Browsers (Global), and AMD environments.

## Usage

### Node.js

```javascript
const IPv6DDN = require('./ipv6_ddn.js');

// Convert Standard to DDN
const ddn = IPv6DDN.fromStandard("2001:db8::1");
console.log(ddn); // Output: "8193.3512..1"

// Convert DDN to Standard
const std = IPv6DDN.toStandard("8193.3512..1");
console.log(std); // Output: "2001:db8::1"
```

### Browser

```html
<script src="ipv6_ddn.js"></script>
<script>
    const type = IPv6DDN.getType("8193.3512..1");
    if (type === "ipv6_ddn") {
        console.log("Valid DDN Address detected!");
    }
</script>
```

## API Reference

### `fromStandard(standardIP)`

Converts a Standard IPv6 string (Hex:Colon) to Decimal Dot Notation.

- standardIP `(String)`: The standard IPv6 address (e.g., `2001:db8::1`).
- Returns `(String)`: The canonical IPv6-DDN string.
- Throws: Error if the input format is invalid.

### `toStandard(ddnIP)`

Converts an IPv6-DDN string (Decimal.Dot) to Standard IPv6 notation.

- ddnIP `(String)`: The IPv6-DDN address (e.g., `8193.3512..1`).
- Returns `(String)`: The canonical Standard IPv6 string.
- Throws: Error if the input format is invalid or segments exceed 65535.

### `getType(ipaddrText)`

Detects the format of a given IP address string.

- ipaddrText `(String)`: The IP string to analyze.
- Returns `(String)`:
  - `"ipv4"`: Valid standard IPv4.
  - `"ipv6"`: Valid standard IPv6.
  - `"ipv6_ddn"`: Valid IPv6 Decimal Dot Notation.
  - `"unknown"`: Invalid or unrecognized format.

### `isDDN(ipaddrText)`

Checks if a string is a valid IPv6-DDN address.

- ipaddrText `(String)`: The text to check.
- Returns `(Boolean)`: `true` if valid, `false` otherwise.

## Examples

| Function       | Input | Output |
| -------------- | ----- | ------ |
| `fromStandard` | `::1` | `..1`  |
| `fromStandard` | `2001:db8:0:0:1:0:0:1` | `8193.3512.0.0.1..1` |
| `toStandard`   | `..`          | `::`   |
| `toStandard`   | `0010..1`     | `a::1` |
| `getType`      | `192.168.1.1` | `ipv4` |

## Running Tests

This library includes a comprehensive unit test suite covering edge cases, compression rules, and error handling.

```bash
npm run test
```

## Specification

[Specification v1.0.0](https://github.com/hemashushu/ipv6ddn)

## License

This project is licensed under the Mozilla Public License 2.0 (MPL 2.0) additional terms.

For more details, see the [LICENSE](./LICENSE) and [LICENSE.additional](./LICENSE.additional) files.
