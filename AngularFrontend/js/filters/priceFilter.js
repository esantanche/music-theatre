/**
 * @ngdoc overview
 * @name price
 * @description This filter formats a number as currency by using the standard
 * Angular currency filter, but if the price is zero, it returns the string 'Free'
 */

'use strict';

/**
 * @ngdoc filter
 * @name price.filter:price
 * @description This filter formats a number as currency by using the standard
 * Angular currency filter, but if the price is zero, it returns the string 'Free'
 * @attention Now supporting pounds only, in the future many other currencies
 */
angular.module('MusicTheatreApp.filters').filter('price', [ '$filter',
    function($filter) {
        return function(price_in_hundredths) {

            // @todo testing here, price is in pence
            // @todo fix documentation

            // If the given price is null, we show nothing at all

            if (price_in_hundredths == null)
                return "";
            else if (price_in_hundredths == 0)
                return "Free";
            else
                return $filter('currency')(price_in_hundredths / 100, "£ ");
        };
    }]);
