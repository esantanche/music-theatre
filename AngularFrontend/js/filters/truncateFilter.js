/**
 * @todo
 * the returned string is maximum length + ellipsis.length long
 * Created by www-data on 07/04/14.
 */

'use strict';

angular.module('MusicTheatreApp.filters').filter('truncate', function() {
    return function(text, length, ellipsis) {

        if (text !== undefined){

            if (isNaN(length)){
                length = 10;
            }

            if (ellipsis === undefined){
                ellipsis = "...";
            }

            if (text.length <= length + ellipsis.length) {

                return text;
            } else {

                return String(text).substring(0, length) + ellipsis;
            }
        }
    };
});
