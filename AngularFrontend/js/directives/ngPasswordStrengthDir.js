/**
 * @ngdoc overview
 * @name ngPasswordStrengthDir
 *
 * @description Directive that calculates the strength of a password and returns it
 * in an html element whose template is given
 *
 * @see https://github.com/subarroca/ng-password-strength
 */

'use strict';

var ngPasswordStrengthDir = angular.module('ngPasswordStrengthDir', []);

/**
 * @ngdoc directive
 * @name ngPasswordStrengthDir.directive:ngPasswordStrength
 * @restrict A
 * @description This directive calculates the strength of a given password.
 * It classifies the password in weak, good and strong. Passwords are weak
 * if their strength is lower than 33, it's good if its strength is between 33
 * and 66, and it's strong if its strength is more than 66.
 * The highest strength is 100.
 * @example
 *   <pre>
 *   <span ng-password-strength="registerpanelinfo.password"></span>
 *   </pre>
 */
ngLoadScriptDir.directive('ngPasswordStrength', function() {
    return {
        template: '<span class="{{class}}">{{strength}}%</span>',
        restrict: 'A',
        scope: { // The password passed to the directive will be know in the code as 'pwd'
            pwd: '=ngPasswordStrength'
        },
        link: function(scope) {
            var measureStrength = function(password) {

                var matches = {
                        positive: {},
                        negative: {}
                    },
                    counts = {
                        positive: {},
                        negative: {
                            seqLetter: 0,
                            seqNumber: 0,
                            seqSymbol: 0
                        }
                    },
                    strength = 0,
                    letters = 'abcdefghijklmnopqrstuvwxyz',
                    numbers = '01234567890',
                    symbols = '\\!@#$%&/()=?¿',
                    back,
                    forth,
                    i,
                    requirements_index,
                    array_of_password_chars = {},
                    array_char_occurrences = {},
                    occurrences_of_current_char = 0,
                    current_char = '';

                if (password) {

                    // Benefits
                    // the match method returns an array of all matches
                    // the slice method applied to strings returns their char from a given position
                    // to another
                    matches.positive.lower = password.match(/[a-z]/g);
                    matches.positive.upper = password.match(/[A-Z]/g);
                    matches.positive.numbers = password.match(/\d/g);
                    matches.positive.symbols = password.match(/[$-/:-?{-~!^_`\[\]]/g);
                    // Here we match all numbers excluding a leading or trailing one
                    matches.positive.middleNumber = password.slice(1, -1).match(/\d/g);
                    // Here we match symbols excluding a leading or trailing one
                    matches.positive.middleSymbol = password.slice(1, -1).match(/[$-/:-?{-~!^_`\[\]]/g);

                    // We count the matches we found above
                    counts.positive.lower = matches.positive.lower ? matches.positive.lower.length : 0;
                    counts.positive.upper = matches.positive.upper ? matches.positive.upper.length : 0;
                    counts.positive.numbers = matches.positive.numbers ? matches.positive.numbers.length : 0;
                    counts.positive.symbols = matches.positive.symbols ? matches.positive.symbols.length : 0;

                    //console.debug('DBG-ps78278 before');
                    //console.debug(counts.positive);

                    requirements_index  = counts.positive.lower   > 0;
                    requirements_index += counts.positive.upper   > 0;
                    requirements_index += counts.positive.numbers > 0;
                    requirements_index += counts.positive.symbols > 0;

                    counts.positive.numChars = password.length;
                    requirements_index += (counts.positive.numChars >= 8) ? 1 : 0;
                    counts.positive.requirements = (requirements_index >= 3) ? requirements_index : 0;
                    counts.positive.middleNumber = matches.positive.middleNumber ? matches.positive.middleNumber.length : 0;
                    counts.positive.middleSymbol = matches.positive.middleSymbol ? matches.positive.middleSymbol.length : 0;

                    //console.debug('DBG-ps78278 after');
                    //console.debug(counts.positive);
                    //console.debug(requirements_index);

                    // Deductions

                    matches.negative.consecLower = password.match(/(?=([a-z]{2}))/g);
                    matches.negative.consecUpper = password.match(/(?=([A-Z]{2}))/g);
                    matches.negative.consecNumbers = password.match(/(?=(\d{2}))/g);
                    matches.negative.onlyNumbers = password.match(/^[0-9]*$/g);
                    matches.negative.onlyLetters = password.match(/^([a-z]|[A-Z])*$/g);

                    counts.negative.consecLower = matches.negative.consecLower ? matches.negative.consecLower.length : 0;
                    counts.negative.consecUpper = matches.negative.consecUpper ? matches.negative.consecUpper.length : 0;
                    counts.negative.consecNumbers = matches.negative.consecNumbers ? matches.negative.consecNumbers.length : 0;

                    // sequential letters (back and forth)
                    // If a password includes sequences of letters, it's a weaker password
                    // For example if in a password there is a sequence like 'abc', it's a weaker password
                    // The same if there are inverted sequences like 'cba' ('abc' inverted)
                    // Only sequences of three characters are examined

                    for (i = 0; i < letters.length - 2; i++) {
                        var lowercase_password = password.toLowerCase();
                        forth = letters.substring(i, parseInt(i + 3));
                        back = reversestr(forth);
                        if (lowercase_password.indexOf(forth) !== -1 || lowercase_password.indexOf(back) !== -1) {
                            counts.negative.seqLetter++;
                        }
                    }

                    // sequential numbers (back and forth)
                    // The same for sequences of numbers like '123' or '321'

                    for (i = 0; i < numbers.length - 2; i++) {
                        forth = numbers.substring(i, parseInt(i + 3));
                        back = reversestr(forth);
                        if (password.indexOf(forth) !== -1 || password.toLowerCase().indexOf(back) !== -1) {
                            counts.negative.seqNumber++;
                        }
                    }

                    // sequential symbols (back and forth)
                    // Even sequences of symbols are spot

                    for (i = 0; i < symbols.length - 2; i++) {
                        forth = symbols.substring(i, parseInt(i + 3));
                        back = reversestr(forth);
                        if (password.indexOf(forth) !== -1 || password.toLowerCase().indexOf(back) !== -1) {
                            counts.negative.seqSymbol++;
                        }
                    }

                    //console.debug('DBG-ps78278 negative');
                    //console.debug(counts.negative);

                    // Repeated chars
                    // Finding chars used more than once in the password

                    array_of_password_chars = password.toLowerCase().split('');

                    // In this loop we create an array, array_char_occurrences,
                    // that stores the number of occurrences of each character
                    // in the password
                    for (i = 0; i < array_of_password_chars.length; i++) {

                        current_char = array_of_password_chars[i];

                        if (hasOwnProperty.call(array_char_occurrences, current_char))
                            array_char_occurrences[current_char]++;
                        else
                            array_char_occurrences[current_char] = 1;

                    }

                    counts.negative.repeated = 0;

                    //console.debug('DBG-ps78278 repeated');
                    //console.debug(array_char_occurrences);

                    // Now we add the number of occurrences of repeated chars
                    // We ignore chars that occur only once
                    for (current_char in array_char_occurrences) {
                        if (array_char_occurrences.hasOwnProperty(current_char)) {
                            occurrences_of_current_char = array_char_occurrences[current_char];

                            if (occurrences_of_current_char > 1)
                                counts.negative.repeated += occurrences_of_current_char;
                        }
                    }

                    // Calculations

                    strength = counts.positive.numChars * 4;
                    if (counts.positive.upper) {
                        strength += (counts.positive.numChars - counts.positive.upper) * 2;
                    }
                    if (counts.positive.lower) {
                        strength += (counts.positive.numChars - counts.positive.lower) * 2;
                    }
                    if (counts.positive.upper || counts.positive.lower) {
                        strength += counts.positive.numbers * 4;
                    }
                    strength += counts.positive.symbols * 6;
                    strength += (counts.positive.middleSymbol + counts.positive.middleNumber) * 2;
                    strength += counts.positive.requirements * 2;
                    strength -= counts.negative.consecLower * 2;
                    strength -= counts.negative.consecUpper * 2;
                    strength -= counts.negative.consecNumbers * 2;
                    strength -= counts.negative.seqNumber * 3;
                    strength -= counts.negative.seqLetter * 3;
                    strength -= counts.negative.seqSymbol * 3;
                    if (matches.negative.onlyNumbers) {
                        strength -= counts.positive.numChars;
                    }
                    if (matches.negative.onlyLetters) {
                        strength -= counts.positive.numChars;
                    }
                    if (counts.negative.repeated) {
                        strength -= (counts.negative.repeated / counts.positive.numChars) * 10;
                    }
                }

                // Making sure that we return a strength between 0 and 100
                return Math.max(0, Math.min(100, Math.round(strength)));
            },
            getClass = function(strength) {

                // A password is weak if its strength is less than 33
                // It's good if its strength is between 33 and 66
                // It's strong if its strength is more than 66

                if (strength < 33)
                    return 'weak';
                else if (strength < 66)
                    return 'good';
                else
                    return 'strong';

            },
            reversestr = function(s) {
                return s.split('').reverse().join('');
            };
            scope.$watch('pwd', function() {
                // Every time the password passed to this directive changes
                // its strength is measured and it's classified in weak, good
                // or strong
                scope.strength = measureStrength(scope.pwd);
                scope.class = getClass(scope.strength);
            });
        }
    };
});