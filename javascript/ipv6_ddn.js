// Copyright (c) 2025 Hemashushu <hippospark@gmail.com>, All rights reserved.
//
// This Source Code Form is subject to the terms of
// the Mozilla Public License version 2.0 and additional exceptions.
// For more details, see the LICENSE, LICENSE.additional, and CONTRIBUTING files.

/**
 * IPv6 Decimal Dot Notation (IPv6-DDN) Converter
 * Specification Version: 1.0
 *
 * Universal Module Definition (UMD) Pattern
 * Supports: Node.js (CommonJS), AMD, and Browser Globals.
 */

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        // Node.js / CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.IPv6DDN = factory();
    }
})(typeof self !== "undefined" ? self : this, function () {
    class IPv6DDN {
        constructor() {
            this.BLOCKS_COUNT = 8;
        }

        /**
         * Detects the type of IP address format.
         * @param {string} ipaddr_text
         * @returns {"ipv4"|"ipv6"|"ipv6_ddn"|"unknown"}
         */
        get_type(ipaddr_text) {
            if (!ipaddr_text || typeof ipaddr_text !== "string")
                return "unknown";

            // 1. Check for IPv6 Standard (Must contain colon)
            if (ipaddr_text.includes(":")) {
                try {
                    this.fromStandard(ipaddr_text);
                    return "ipv6";
                } catch (e) {
                    return "unknown";
                }
            }

            // 2. Check for IPv6 DDN (Must pass DDN validation)
            if (this.is_ddn(ipaddr_text)) {
                return "ipv6_ddn";
            }

            // 3. Check for IPv4 (4 octets, 0-255)
            if (this._isIPv4(ipaddr_text)) {
                return "ipv4";
            }

            return "unknown";
        }

        /**
         * Checks if the text is a valid IPv6 DDN string.
         * @param {string} ipaddr_text
         * @returns {boolean}
         */
        is_ddn(ipaddr_text) {
            try {
                this.toStandard(ipaddr_text);
                return true;
            } catch (e) {
                return false;
            }
        }

        /**
         * Converts Standard IPv6 (Hex:Colon) to DDN (Decimal.Dot)
         * @param {string} standardIP
         * @returns {string}
         */
        fromStandard(standardIP) {
            try {
                // 1. Expand :: to full 8 hex blocks
                const hexBlocks = this._expand(standardIP, ":");

                // 2. Convert hex blocks to decimal integers
                const decimalBlocks = hexBlocks.map((hex) => {
                    const val = parseInt(hex, 16);
                    if (isNaN(val)) throw new Error("Invalid Hex");
                    return val;
                });

                // 3. Compress using .. logic and join
                return this._compress(decimalBlocks, ".", "..");
            } catch (e) {
                throw new Error(`Invalid Standard IPv6 address: ${standardIP}`);
            }
        }

        /**
         * Converts DDN (Decimal.Dot) to Standard IPv6 (Hex:Colon)
         * @param {string} ddnIP
         * @returns {string}
         */
        toStandard(ddnIP) {
            try {
                // 1. Expand .. to full 8 decimal blocks
                const decimalBlocks = this._expand(ddnIP, ".");

                // 2. Validate and convert to Hex strings
                const hexBlocks = decimalBlocks.map((dec) => {
                    const val = parseInt(dec, 10);
                    if (isNaN(val) || val < 0 || val > 65535) {
                        throw new Error(
                            `Segment out of range (0-65535): ${dec}`
                        );
                    }
                    return val.toString(16).toLowerCase();
                });

                // 3. Compress using :: logic and join
                return this._compress(
                    hexBlocks.map((h) => parseInt(h, 16)),
                    ":",
                    "::",
                    true
                );
            } catch (e) {
                throw new Error(
                    `Invalid IPv6-DDN address: ${ddnIP} - ${e.message}`
                );
            }
        }

        /**
         * Simple strict IPv4 validator (0-255, 4 parts, no leading zeros)
         */
        _isIPv4(ipStr) {
            if (!ipStr) {
                return false;
            }

            const parts = ipStr.split(".");

            if (parts.length !== 4) {
                return false;
            }

            return parts.every((part) => {
                // Check for digits only and no leading zeros unless "0"
                if (!/^\d+$/.test(part)) {
                    return false;
                }

                if (part.length > 1 && part.startsWith("0")) {
                    return false;
                }

                const num = parseInt(part, 10);
                return num >= 0 && num <= 255;
            });
        }

        /**
         * Expands a compressed address string into an array of 8 strings
         */
        _expand(ipStr, separator) {
            const doubleSep = separator + separator;

            // Handle empty string or pure separator edge cases
            if (!ipStr) {
                throw new Error("Empty string");
            }

            if (ipStr === doubleSep) {
                return new Array(8).fill("0");
            }

            let blocks = [];

            if (ipStr.includes(doubleSep)) {
                const split = ipStr.split(doubleSep);
                if (split.length > 2) {
                    throw new Error("Multiple compression separators found");
                }

                const left = split[0] ? split[0].split(separator) : [];
                const right = split[1] ? split[1].split(separator) : [];
                const missing =
                    this.BLOCKS_COUNT - (left.length + right.length);

                if (missing < 0) {
                    throw new Error("Too many segments");
                }

                const zeros = new Array(missing).fill("0");
                blocks = [...left, ...zeros, ...right];
            } else {
                blocks = ipStr.split(separator);
            }

            if (blocks.length !== this.BLOCKS_COUNT) {
                throw new Error(
                    `Incorrect number of segments. Expected 8, got ${blocks.length}`
                );
            }

            // Validate strict formatting (e.g., no empty segments like 1.2..3.4)
            if (blocks.some((b) => b === "")) {
                throw new Error("Empty segment detected");
            }

            return blocks;
        }

        /**
         * Compresses an array of numbers into a string representation
         * @param {number[]} numberBlocks - Array of actual numbers (for 0 comparison)
         * @param {string} separator - '.' or ':'
         * @param {string} doubleSep - '..' or '::'
         * @param {boolean} toHex - If true, converts output numbers to hex string
         */
        _compress(numberBlocks, separator, doubleSep, toHex = false) {
            // Find longest run of zeros
            let maxLen = 0;
            let maxStart = -1;
            let currLen = 0;
            let currStart = -1;

            for (let i = 0; i < this.BLOCKS_COUNT; i++) {
                if (numberBlocks[i] === 0) {
                    if (currLen === 0) {
                        currStart = i;
                    }
                    currLen++;
                } else {
                    if (currLen > maxLen) {
                        maxLen = currLen;
                        maxStart = currStart;
                    }
                    currLen = 0;
                }
            }

            // Check end
            if (currLen > maxLen) {
                maxLen = currLen;
                maxStart = currStart;
            }

            // Helper to format a single block
            const fmt = (n) =>
                toHex ? n.toString(16).toLowerCase() : n.toString(10);

            // RFC 5952 Recommendation: Only compress if 2 or more blocks
            if (maxLen > 1) {
                const left = numberBlocks
                    .slice(0, maxStart)
                    .map(fmt)
                    .join(separator);
                const right = numberBlocks
                    .slice(maxStart + maxLen)
                    .map(fmt)
                    .join(separator);
                return `${left}${doubleSep}${right}`;
            }

            return numberBlocks.map(fmt).join(separator);
        }
    }

    return new IPv6DDN();
});
