# IPv6 Decimal Dot Notation (IPv6-DDN) Converter

A lightweight, zero-dependency Rust library to convert IPv6 addresses between the standard Hexadecimal format and the experimental Decimal Dot Notation (IPv6-DDN).

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=4 orderedList=false} -->

<!-- code_chunk_output -->

- [What is IPv6-DDN?](#what-is-ipv6-ddn)
- [Features](#features)
- [Installation](#installation)
- [Usage Example](#usage-example)
- [API Reference](#api-reference)
  - [`from_standard_str(standard_ip: &str) -> Result<String, String>`](#from_standard_strstandard_ip-str---resultstring-string)
  - [`to_standard_str(ddn_ip: &str) -> Result<String, String>`](#to_standard_strddn_ip-str---resultstring-string)
  - [`get_type(ipaddr_text: &str) -> AddressType`](#get_typeipaddr_text-str---addresstype)
  - [`is_ddn(ipaddr_text: &str) -> bool`](#is_ddnipaddr_text-str---bool)
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
- Zero Dependencies: Uses only the Rust standard library (`std::net`).

## Installation

Add this to your `Cargo.toml`.

```toml
[dependencies]
ipv6_ddn = "0.1.0"
```

## Usage Example

```rust
use ipv6_ddn::{from_standard_str, to_standard_str, get_type, AddressType};

fn main() {
    // 1. Convert Standard IPv6 to DDN
    let ddn = from_standard_str("2001:db8::1").unwrap();
    println!("DDN: {}", ddn); // Output: "8193.3512..1"

    // 2. Convert DDN to Standard IPv6
    let std = to_standard_str("8193.3512..1").unwrap();
    println!("Standard: {}", std); // Output: "2001:db8::1"

    // 3. Detect Type
    let ip_type = get_type("8193.3512..1");
    match ip_type {
        AddressType::IPv6DDN => println!("Detected IPv6-DDN address!"),
        AddressType::IPv6 => println!("Detected Standard IPv6 address!"),
        AddressType::IPv4 => println!("Detected IPv4 address!"),
        AddressType::Unknown => println!("Unknown format"),
    }
}
```

## API Reference

### `from_standard_str(standard_ip: &str) -> Result<String, String>`

Converts a Standard IPv6 string (Hex:Colon) to Decimal Dot Notation.

- standard_ip: The standard IPv6 address (e.g., `2001:db8::1`).
- Returns: `Ok(String)` containing the canonical IPv6-DDN string.
- Errors: Returns `Err` if the input format is invalid.

### `to_standard_str(ddn_ip: &str) -> Result<String, String>`

Converts an IPv6-DDN string (Decimal.Dot) to Standard IPv6 notation.

- ddn_ip: The IPv6-DDN address (e.g., `8193.3512..1`).
- Returns: `Ok(String)` containing the canonical Standard IPv6 string.
- Errors: Returns `Err` if the input format is invalid, contains invalid characters, or segments exceed 65535.

### `get_type(ipaddr_text: &str) -> AddressType`

Detects the format of a given IP address string.

- ipaddr_text: The IP string to analyze.
- Returns: An `AddressType` enum variant:
  - `AddressType::IPv4`
  - `AddressType::IPv6`
  - `AddressType::IPv6DDN`
  - `AddressType::Unknown`

### `is_ddn(ipaddr_text: &str) -> bool`

Checks if a string is a valid IPv6-DDN address.

- ipaddr_text: The text to check.
- Returns: `true` if valid, `false` otherwise.

## Examples

| Function            | Input | Output |
| ------------------- | ----- | ------ |
| `from_standard_str` | `::1` | `..1`  |
| `from_standard_str` | `2001:db8:0:0:1:0:0:1` | `8193.3512.0.0.1..1` |
| `to_standard_str`   | `..`          | `::`   |
| `to_standard_str`   | `0010..1`     | `a::1` |
| `get_type`          | `192.168.1.1` | `AddressType::IPv4` |

## Running Tests

This library includes a comprehensive unit test suite covering edge cases, compression rules, and error handling.

```bash
cargo test
```

## Specification

[Specification v1.0.0](https://github.com/hemashushu/ipv6ddn)

## License

This project is licensed under the Mozilla Public License 2.0 (MPL 2.0) and additional terms.

For more details, see the [LICENSE](./LICENSE) and [LICENSE.additional](./LICENSE.additional) files.
