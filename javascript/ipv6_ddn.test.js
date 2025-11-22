// Copyright (c) 2025 Hemashushu <hippospark@gmail.com>, All rights reserved.
//
// This Source Code Form is subject to the terms of
// the Mozilla Public License version 2.0 and additional exceptions.
// For more details, see the LICENSE, LICENSE.additional, and CONTRIBUTING files.

const converter = require("./ipv6_ddn.js");

/**
 * Simple Test Runner
 */
function assertEq(name, actual, expected) {
    const pass = actual === expected;
    if (pass) {
        console.log(`PASS: ${name}`);
    } else {
        console.error(`FAIL: ${name}`);
        console.error(`    Expected: ${expected}`);
        console.error(`    Actual:   ${actual}`);
    }
    return pass;
}

function runSuite() {
    console.log("Starting IPv6 DDN Tests\n");
    let passed = 0;
    let total = 0;

    // --- 1. Standard to DDN ---

    total++;
    passed += assertEq(
        "Standard: Loopback (::1)",
        converter.fromStandard("::1"),
        "..1"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "Standard: Unspecified (::)",
        converter.fromStandard("::"),
        ".."
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "Standard: Normal (2001:db8::1)",
        converter.fromStandard("2001:db8::1"),
        "8193.3512..1"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "Standard: Complex Compression (Longest run in middle)",
        converter.fromStandard("2001:0:0:1::1"),
        "8193.0.0.1..1"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "Standard: Max Values (ffff:ffff...)",
        converter.fromStandard("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"),
        "65535.65535.65535.65535.65535.65535.65535.65535"
    )
        ? 1
        : 0;

    // --- 2. DDN to Standard ---

    total++;
    passed += assertEq(
        "DDN: Loopback (..1)",
        converter.toStandard("..1"),
        "::1"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "DDN: Normal (8193.3512..1)",
        converter.toStandard("8193.3512..1"),
        "2001:db8::1"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "DDN: Leading zeros in segments (normalization)",
        converter.toStandard("0010..1"),
        "a::1"
    )
        ? 1
        : 0;

    // --- 3. Error Handling ---

    total++;
    try {
        converter.toStandard("65536..1"); // Out of range
        assertEq("Error Check: Out of Range", "No Error", "Error Thrown");
    } catch (e) {
        assertEq("Error Check: Out of Range", "Error Thrown", "Error Thrown");
        passed++;
    }

    total++;
    try {
        converter.fromStandard("2001::db8::1"); // Double compression
        assertEq("Error Check: Bad Hex", "No Error", "Error Thrown");
    } catch (e) {
        assertEq("Error Check: Bad Hex", "Error Thrown", "Error Thrown");
        passed++;
    }

    // --- 4. Type Detection & Validation (New Features) ---

    total++;
    passed += assertEq(
        "getType: IPv4 (Standard)",
        converter.getType("192.168.1.1"),
        "ipv4"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "getType: IPv6 Standard",
        converter.getType("2001:db8::1"),
        "ipv6"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "getType: IPv6 DDN",
        converter.getType("8193.3512..1"),
        "ipv6_ddn"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "getType: Invalid/Unknown (Garbage)",
        converter.getType("not.an.ip.address"),
        "unknown"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "getType: Ambiguous Dots (IPv4 vs DDN)",
        // 0.0.0.0 is valid IPv4. It is NOT valid DDN (needs 8 segments or ..)
        converter.getType("0.0.0.0"),
        "ipv4"
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "isDDN: Valid DDN",
        converter.isDDN("1.2.3.4.5.6.7.8"),
        true
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "isDDN: Invalid DDN (Segment > 65535)",
        converter.isDDN("70000.0..1"),
        false
    )
        ? 1
        : 0;

    total++;
    passed += assertEq(
        "isDDN: IPv4 is not DDN",
        converter.isDDN("192.168.1.1"),
        false
    )
        ? 1
        : 0;

    console.log(`\nTest Summary: ${passed}/${total} Passed`);
}

runSuite();
