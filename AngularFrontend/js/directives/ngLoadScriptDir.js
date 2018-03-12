/**
 * @ngdoc overview
 * @name ngLoadScriptDir
 *
 * @description Directive that replaces the script tag to perform a lazy
 * load of a script
 */

'use strict';

var ngLoadScriptDir = angular.module('ngLoadScriptDir', []);

/**
 * @ngdoc directive
 * @name ngLoadScriptDir.directive:script
 * @restrict E
 * @description This directive lazy-loads a script.
 * Scripts defined in a script tag are executed on page load.
 * We used some scripts that refer to DOM elements that are
 * created when an Angular view is loaded.
 * This happens after the page has been loaded.
 * So, our scripts didn't work.
 * Using this directive, a script is loaded after the view
 * it belongs to is loaded.
 * This directive runs every time a script tag is used that
 * has the attribute type set to "text/javascript-lazy"
 * @example
 *    <pre>
 *    <script type="text/javascript-lazy" src="/lib/scrollbar/scrollbar.js"></script>
 *    </pre>
 */
ngLoadScriptDir.directive('script', function() {
    return {
        restrict: 'E',
        scope: false,
        link: function(scope, elem, attr) {
            //console.debug('DBG-lsd871yh attr.src ' + attr.src);

            if (attr.type === 'text/javascript-lazy') {
                var js = document.createElement("script");
                js.type = "text/javascript";
                js.src = attr.src;

                document.body.appendChild(js);
            }
        }
    };
});