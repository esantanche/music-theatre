/**
 * @ngdoc overview
 * @name duration
 * @description This filter converts a duration in milliseconds to
 * a string in the format h:mm:ss
 */

'use strict';

/**
 * @ngdoc filter
 * @name duration.filter:duration
 * @description This filter converts a duration in milliseconds to
 * a string in the format h:mm:ss
 */
angular.module('MusicTheatreApp.filters').filter('duration', function() {
    return function(duration_in_msec) {

        var seconds = Math.floor(duration_in_msec / 1000);
        var hours = Math.floor(seconds / 3600); // Whole hours
        seconds %= 3600; // The remaining seconds after taking away the whole hours
        var minutes = Math.floor(seconds / 60); // Whole minutes
        seconds %= 60; // The remaining seconds after taking away the whole minutes

        // We shouldn't be asked to format durations of more than 9 hours (and 59 min, 59 sec)
        if (hours >= 10) hours = 9;

        return hours + ":" + ( minutes < 10 ? "0" : "" ) + minutes
            + ":" + ( seconds < 10 ? "0" : "" ) + seconds;
    };
});
