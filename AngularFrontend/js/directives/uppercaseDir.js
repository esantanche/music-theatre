/**
 * @ngdoc overview
 * @name uppercaseDir
 *
 * @description Directive to make a text field all uppercase as the user types.
 */

var uppercaseDir = angular.module('uppercaseDir', []);

/**
 * @ngdoc directive
 * @name uppercaseDir.directive:uppercase
 *
 * @description This directive makes a text field all uppercase. It's used
 * in the view shoppingorderpanel.html to make the field postal_code all
 * uppercase so that the user doesn't have to use the Shift or the Caps lock keys.
 * @example
 *    <pre>
 *    <input type="text" ng-model="name" uppercase>
 *    </pre>
 */
uppercaseDir.directive('uppercase', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, modelCtrl) {

            var uppercase = function(inputValue) {

                var uppercased = '';

                if (typeof inputValue !== "undefined") {

                    uppercased = inputValue.toUpperCase();
                    if (uppercased !== inputValue) {
                        modelCtrl.$setViewValue(uppercased);
                        modelCtrl.$render();
                    }

                }

                return uppercased;
            };

            modelCtrl.$parsers.push(uppercase);

            uppercase(scope[attrs.ngModel]);  // capitalize initial value
        }
    };
});