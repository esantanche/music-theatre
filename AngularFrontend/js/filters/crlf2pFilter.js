/**
 * @todo This filter is experimental. It shouldn't stay here for long
 * Created by www-data on 07/04/14.
 */

'use strict';

// @todo this filter is experimental and it's just to make text easier to read
// whilst we wait for the html markup to be properly added by editors
angular.module('MusicTheatreApp.filters').filter('crlf2p', function() {
    return function(textfield) {

        // @todo if textfield is undefined here I get an error

        var output = "";

        if (typeof textfield !== "undefined")
            output = textfield.replace(/\r\n/g, '<br><p>');

        //var output = textfield.replace(/\r\n\r\n/g, '<p>');

        return output;
    };
});
