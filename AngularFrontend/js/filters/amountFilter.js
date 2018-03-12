/**
 * @ngdoc overview
 * @name amount
 * @description @todo This filter formats a number as currency by using the standard
 * Angular currency filter, but if the price is zero, it returns the string 'Free'
 */


// @todo maybe we don't use this

'use strict';

/**
 * @ngdoc filter
 * @name @todo doc price.filter:price
 * @description This filter formats a number as currency by using the standard
 * Angular currency filter, but if the price is zero, it returns the string 'Free'
 * @attention Now supporting pounds only, in the future many other currencies
 */
angular.module('MusicTheatreApp.filters').filter('amount', [ '$filter',
    function($filter) {
        return function(amount_in_hundredths) {

            // @todo testing here, price is in pence
            // @todo fix documentation

            // If the given price is null, we show nothing at all

            if (amount_in_hundredths == null)
                return "";
            else if (amount_in_hundredths == 0)
                return "Free";
            else
                return $filter('currency')(amount_in_hundredths / 100, "£ ");
        };
    }]);
