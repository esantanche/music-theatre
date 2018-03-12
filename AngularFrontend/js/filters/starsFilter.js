/**
 * @ngdoc overview
 * @name stars
 *
 * @description This filter shows as many hearths as the given rating
 *
 * What happens here?
 *
 * - The rating is given as input and transformed into hearts
 */

'use strict';

// @todo this filter is no longer in use, we may want to delete it

/**
 * @ngdoc filter
 * @name stars.filter:stars
 *
 * @description This filter shows hearths corresponding to a rating
 */
angular.module('MusicTheatreApp.filters').filter('stars', function() {
    return function(rating) {

        // The number of hearts is rounded to the nearest
        var num_of_stars = Math.round(rating / 20);

        var output = "";

        for (var i=0; i < num_of_stars; i++) {
            output += '<img src="/images/red-heart.png">';
        }

        for (var i=0; i < 5 - num_of_stars; i++) {
            output += '<img src="/images/white-heart.png">';
        }

        return output;
    };
});
