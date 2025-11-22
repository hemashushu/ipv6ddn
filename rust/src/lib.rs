// Copyright (c) 2025 Hemashushu <hippospark@gmail.com>, All rights reserved.
//
// This Source Code Form is subject to the terms of
// the Mozilla Public License version 2.0 and additional exceptions.
// For more details, see the LICENSE, LICENSE.additional, and CONTRIBUTING files.

use std::net::{Ipv4Addr, Ipv6Addr};
use std::str::FromStr;

/// Represents the detected type of an IP address string.
#[derive(Debug, PartialEq, Eq)]
pub enum AddressType {
    IPv4,
    IPv6,
    IPv6DDN,
    Unknown,
}

/// Detects the format of a given IP address string.
///
/// # Examples
/// ```
/// use ipv6_ddn::{get_type, AddressType};
///
/// assert_eq!(get_type("192.168.1.1"), AddressType::IPv4);
/// assert_eq!(get_type("2001:db8::1"), AddressType::IPv6);
/// assert_eq!(get_type("8193.3512..1"), AddressType::IPv6DDN);
/// ```
pub fn get_type(ipaddr_text: &str) -> AddressType {
    if ipaddr_text.is_empty() {
        return AddressType::Unknown;
    }

    // 1. Check for Standard IPv6 (Must contain colon)
    if ipaddr_text.contains(':') {
        if Ipv6Addr::from_str(ipaddr_text).is_ok() {
            return AddressType::IPv6;
        } else {
            return AddressType::Unknown;
        }
    }

    // 2. Check for IPv6 DDN
    if is_ddn(ipaddr_text) {
        return AddressType::IPv6DDN;
    }

    // 3. Check for IPv4
    if Ipv4Addr::from_str(ipaddr_text).is_ok() {
        // Extra check to ensure strict IPv4 (std allow some loose formats,
        // but we generally want strict 4 octets for simple classification)
        if ipaddr_text.chars().filter(|&c| c == '.').count() == 3 {
            return AddressType::IPv4;
        }
    }

    AddressType::Unknown
}

/// Checks if a string is a valid IPv6-DDN address.
pub fn is_ddn(ipaddr_text: &str) -> bool {
    to_standard_str(ipaddr_text).is_ok()
}

/// Converts a Standard IPv6 string (Hex:Colon) to Decimal Dot Notation.
///
/// # Arguments
/// * `standard_ip` - A string slice that holds the standard IPv6 address.
///
/// # Errors
/// Returns an error string if the input is not a valid IPv6 address.
pub fn from_standard_str(standard_ip: &str) -> Result<String, String> {
    // Parse using standard library to ensure validity
    let addr = Ipv6Addr::from_str(standard_ip)
        .map_err(|_| format!("Invalid Standard IPv6 address: {}", standard_ip))?;

    from_standard(&addr)
}

/// Converts a Standard IPv6 address to Decimal Dot Notation.
///
/// # Arguments
/// * `addr` - An Ipv6Addr instance representing the standard IPv6 address.
///
/// # Errors
/// Returns an error string if the input is not valid.
pub fn from_standard(addr: &Ipv6Addr) -> Result<String, String> {
    let segments = addr.segments();

    // Apply DDN specific compression (Decimal + Dots)
    Ok(compress_segments(&segments, ".", "..", false))
}

/// Converts an IPv6-DDN string (Decimal.Dot) to Standard IPv6 notation.
///
/// # Arguments
/// * `ddn_ip` - A string slice that holds the IPv6-DDN address.
///
/// # Errors
/// Returns an error string if the input format is invalid or segments are out of range.
pub fn to_standard_str(ddn_ip: &str) -> Result<String, String> {
    // Ipv6Addr::to_string() automatically applies canonical RFC 5952 compression
    to_standard(ddn_ip).map(|addr| addr.to_string())
}

pub fn to_standard(ddn_ip: &str) -> Result<Ipv6Addr, String> {
    let segments = expand_ddn(ddn_ip)?;

    // Construct Ipv6Addr from segments
    let addr = Ipv6Addr::new(
        segments[0],
        segments[1],
        segments[2],
        segments[3],
        segments[4],
        segments[5],
        segments[6],
        segments[7],
    );

    Ok(addr)
}

fn expand_ddn(ip_str: &str) -> Result<[u16; 8], String> {
    const SEPARATOR: char = '.';
    const DOUBLE_SEP: &str = "..";

    if ip_str.is_empty() {
        return Err("Empty string".to_string());
    }

    if ip_str == DOUBLE_SEP {
        return Ok([0; 8]);
    }

    let mut segments = vec![];

    if ip_str.contains(DOUBLE_SEP) {
        let parts: Vec<&str> = ip_str.split(DOUBLE_SEP).collect();
        if parts.len() > 2 {
            return Err("Multiple compression separators found".to_string());
        }

        let left_str = parts[0];
        let right_str = parts[1];

        let left: Vec<&str> = if left_str.is_empty() {
            vec![]
        } else {
            left_str.split(SEPARATOR).collect()
        };

        let right: Vec<&str> = if right_str.is_empty() {
            vec![]
        } else {
            right_str.split(SEPARATOR).collect()
        };

        let total_len = left.len() + right.len();
        if total_len > 8 {
            return Err("Too many segments".to_string());
        }

        let missing = 8 - total_len;

        // Parse Left
        for s in left {
            segments.push(parse_segment(s)?);
        }

        // Fill Zeros
        segments.append(&mut vec![0u16; missing]);

        // Parse Right
        for s in right {
            segments.push(parse_segment(s)?);
        }
    } else {
        // No compression
        let parts: Vec<&str> = ip_str.split(SEPARATOR).collect();
        if parts.len() != 8 {
            return Err(format!(
                "Incorrect number of segments. Expected 8, got {}",
                parts.len()
            ));
        }

        for s in parts {
            segments.push(parse_segment(s)?);
        }
    }

    // Convert Vec to Array
    segments
        .try_into()
        .map_err(|_| "Internal conversion error".to_string())
}

fn parse_segment(s: &str) -> Result<u16, String> {
    if s.is_empty() {
        return Err("Empty segment detected".to_string());
    }
    u16::from_str(s).map_err(|_| format!("Segment out of range or invalid: {}", s))
}

/// Implements RFC 5952 compression logic (Longest run, leftmost preference)
fn compress_segments(segments: &[u16; 8], sep: &str, double_sep: &str, hex: bool) -> String {
    let mut max_len = 0;
    let mut max_start = -1;
    let mut curr_len = 0;
    let mut curr_start = -1;

    for (i, item) in segments.iter().enumerate() {
        if *item == 0 {
            if curr_len == 0 {
                curr_start = i as i32;
            }
            curr_len += 1;
        } else {
            if curr_len > max_len {
                max_len = curr_len;
                max_start = curr_start;
            }
            curr_len = 0;
            curr_start = -1;
        }
    }

    // Check trailing zeros
    if curr_len > max_len {
        max_len = curr_len;
        max_start = curr_start;
    }

    // Format helper closure
    let fmt = |n: u16| -> String {
        if hex {
            format!("{:x}", n)
        } else {
            format!("{}", n)
        }
    };

    // Only compress if more than 1 segment (RFC 5952 recommendation)
    if max_len > 1 {
        let start = max_start as usize;
        let end = start + max_len;

        let left = segments[0..start]
            .iter()
            .map(|&n| fmt(n))
            .collect::<Vec<String>>()
            .join(sep);
        let right = segments[end..8]
            .iter()
            .map(|&n| fmt(n))
            .collect::<Vec<String>>()
            .join(sep);

        return format!("{}{}{}", left, double_sep, right);
    }

    segments
        .iter()
        .map(|&n| fmt(n))
        .collect::<Vec<String>>()
        .join(sep)
}

#[cfg(test)]
mod tests {
    use crate::{AddressType, from_standard_str, get_type, is_ddn, to_standard_str};

    #[test]
    fn test_from_standard_str() {
        // Loopback
        assert_eq!(from_standard_str("::1").unwrap(), "..1");
        // Unspecified
        assert_eq!(from_standard_str("::").unwrap(), "..");
        // Normal
        assert_eq!(from_standard_str("2001:db8::1").unwrap(), "8193.3512..1");
        // Complex Compression (Longest run in middle)
        // 2001:0:0:1::1 -> 8193.0.0.1..1
        assert_eq!(from_standard_str("2001:0:0:1::1").unwrap(), "8193.0.0.1..1");
        // Max Values
        assert_eq!(
            from_standard_str("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff").unwrap(),
            "65535.65535.65535.65535.65535.65535.65535.65535"
        );
    }

    #[test]
    fn test_to_standard_str() {
        // Loopback
        assert_eq!(to_standard_str("..1").unwrap(), "::1");
        // Normal
        assert_eq!(to_standard_str("8193.3512..1").unwrap(), "2001:db8::1");
        // Leading zeros in segments (normalization check)
        // 0010..1 -> 10..1 -> a::1
        assert_eq!(to_standard_str("0010..1").unwrap(), "a::1");
    }

    #[test]
    fn test_errors() {
        // Out of range
        assert!(to_standard_str("65536..1").is_err());
        // Double compression in Standard input
        assert!(from_standard_str("2001::db8::1").is_err());
        // Double compression in DDN input
        assert!(to_standard_str("1..2..3").is_err());
        // Invalid chars
        assert!(to_standard_str("xyz..1").is_err());
    }

    #[test]
    fn test_get_type() {
        assert_eq!(get_type("192.168.1.1"), AddressType::IPv4);
        assert_eq!(get_type("2001:db8::1"), AddressType::IPv6);
        assert_eq!(get_type("8193.3512..1"), AddressType::IPv6DDN);
        assert_eq!(get_type("not.an.ip"), AddressType::Unknown);
        assert_eq!(get_type("0.0.0.0"), AddressType::IPv4);
    }

    #[test]
    fn test_is_ddn() {
        assert!(is_ddn("1.2.3.4.5.6.7.8"));
        assert!(!is_ddn("70000.0..1")); // Out of range
        assert!(!is_ddn("192.168.1.1")); // IPv4 is not DDN
    }
}
