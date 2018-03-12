/**
 * @ngdoc overview
 * @name base64
 *
 * @description Module that provides the base64 service used to encode and decode
 * strings to and from base 64.
 *
 * Base 64 encoding is used when transmitting credentials to avoid strange characters
 * that could interfere with the transmission.
 */

'use strict';

/*
 * Encapsulation of Nick Galbreath's base64.js library for AngularJS
 * Original notice included below
 * https://github.com/ninjatronic/angular-base64/blob/master/angular-base64.js
 */

/*
 * Copyright (c) 2010 Nick Galbreath
 * http://code.google.com/p/stringencoders/source/browse/#svn/trunk/javascript
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * @ngdoc service
 * @name base64.service:base64
 *
 * @description This service encodes and decodes strings from and to base 64.
 * It's used to encode credentials.
 *
 * base64 is an encode/decode service compatible with window.btoa/atob
 *
 * We use this base64 service because window.btoa/atob are not available for
 * all browsers.
 *
 * window.atob/btoa are a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * They are also found in Safari and Chrome, but not in IE.
 *
 * If you want to use btoa/atob and fall back to base64 if they are not available,
 * you can use these statements:
 *
 * - `if (!window.btoa) window.btoa = base64.encode`
 * - `if (!window.atob) window.atob = base64.decode`
 *
 * The original spec's for atob/btoa are a bit lacking:
 *
 * - {@link https://developer.mozilla.org/en/DOM/window.atob}
 * - {@link https://developer.mozilla.org/en/DOM/window.btoa}
 *
 * window.btoa and base64.encode take a string where characters are in the
 * range [0,255] as they usually are.
 * If any character is not in that range, then an exception is thrown.
 *
 * window.atob and base64.decode take a base64-encoded string and return the
 * original string.
 * If the input length is not a multiple of 4, or contains invalid characters
 * then an exception is thrown.
 */
angular.module('base64', []).constant('$base64', (function() {

    var PADCHAR = '=';

    var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    function getbyte64(s,i) {
        var idx = ALPHA.indexOf(s.charAt(i));
        if (idx == -1) {
            throw "Cannot decode base64";
        }
        return idx;
    }

    function decode(s) {
        // convert to string
        s = "" + s;
        var pads, i, b10;
        var imax = s.length;
        if (imax == 0) {
            return s;
        }

        if (imax % 4 != 0) {
            throw "Cannot decode base64";
        }

        pads = 0;
        if (s.charAt(imax -1) == PADCHAR) {
            pads = 1;
            if (s.charAt(imax -2) == PADCHAR) {
                pads = 2;
            }
            // either way, we want to ignore this last block
            imax -= 4;
        }

        var x = [];
        for (i = 0; i < imax; i += 4) {
            b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
                (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
            x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
        }

        switch (pads) {
            case 1:
                b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);
                x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
                break;
            case 2:
                b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
                x.push(String.fromCharCode(b10 >> 16));
                break;
        }
        return x.join('');
    }

    function getbyte(s,i) {
        var x = s.charCodeAt(i);
        if (x > 255) {
            throw "INVALID_CHARACTER_ERR: DOM Exception 5";
        }
        return x;
    }

    function encode(s) {
        if (arguments.length != 1) {
            throw "SyntaxError: Not enough arguments";
        }

        var i, b10;
        var x = [];

        // convert to string
        s = "" + s;

        var imax = s.length - s.length % 3;

        if (s.length == 0) {
            return s;
        }
        for (i = 0; i < imax; i += 3) {
            b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
            x.push(ALPHA.charAt(b10 >> 18));
            x.push(ALPHA.charAt((b10 >> 12) & 0x3F));
            x.push(ALPHA.charAt((b10 >> 6) & 0x3f));
            x.push(ALPHA.charAt(b10 & 0x3f));
        }
        switch (s.length - imax) {
            case 1:
                b10 = getbyte(s,i) << 16;
                x.push(ALPHA.charAt(b10 >> 18) + ALPHA.charAt((b10 >> 12) & 0x3F) +
                    PADCHAR + PADCHAR);
                break;
            case 2:
                b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
                x.push(ALPHA.charAt(b10 >> 18) + ALPHA.charAt((b10 >> 12) & 0x3F) +
                    ALPHA.charAt((b10 >> 6) & 0x3f) + PADCHAR);
                break;
        }
        return x.join('');
    }

    return {
        encode: encode,
        decode: decode
    };
})());

