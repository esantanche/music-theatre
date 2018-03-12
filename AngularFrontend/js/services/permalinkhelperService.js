/**
 * @ngdoc overview
 * @name @todo
 * @description @todo To play programmes we need the url of the video as
 * stored in the CDN. The url will be signed and the server will check
 * if the user is authorised to play the programme.
 */

var permalinkhelperServices = angular.module('permalinkhelperServices', []);

/**
 * @ngdoc service
 * @name @todo fixme Urlskithelper.service:Urlskithelper
 * @description This service helps with everything we need to do about
 * retrieving the urls of the media we have to stream
 * @requires URLsKit.service:URLsKit
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
permalinkhelperServices.service('Permalinkhelper', [ 'Clientexceptionhelper',
    function(Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name @todo load_urlskit
         * @description @todo doc
         * We are given the system title of a programme.
         * We use it to call the REST api `musth_restws_urls_kit` via the service
         * URLsKit and get the urls we need to play the programme
         * @methodOf Urlskithelper.service:Urlskithelper
         * @param {int} nid
         * @param {string} system_title The system title of the programme
         * we want to play
         * @param {string} display_title
         * @returns {string} fixme This method returns the urlskit object with is a kit
         * of urls we need to play the given programme.
         * The method returns a promise, actually, whose payload will be the urlskit .
         */
        this.make_programme_permalink = function(nid, system_title, display_title) {

            // @todo comments to fix

            // Our new url is composed by:
            // * language (for now 'en' only)
            // * content type ('v' for video, 'a' for audio, 'l' for library)
            // * programme's node id
            // * cleaned display title

            // Replacing . _ ~ : / ? # [ ] @ ! $ & ' ( ) * + , ; = with -
            // Replacing whitespace characters like tab, carriage return, new line, form feed with -
            var cleaned_display_title = display_title.replace(/[\s\._~:\/\?#\[\]@!\$&\'\(\)\*\+,;=]/g, "-");

            // Replacing one or more instances of - with a single -
            cleaned_display_title = cleaned_display_title.replace(/-+/g, "-");

            // Trimming away any trailing '-'
            cleaned_display_title = cleaned_display_title.replace(/-$/, "");

            // Our new url is composed by:
            // * language (for now 'en' only)
            // * content type ('v' for video, 'a' for audio, 'l' for library)
            // * programme's node id
            // * cleaned display title

            //console.debug('DBG-mppmppmppmppmpp ' + permalink);

            return '/en/' + system_title.substring(0,1).toLowerCase() + '/'  +
                nid + '/' + cleaned_display_title;
        };


        /**
         * @ngdoc method
         * @name @todo
         * @description @todo doc
         * We are given the system title of a programme.
         * We use it to call the REST api `musth_restws_urls_kit` via the service
         * URLsKit and get the urls we need to play the programme
         * @methodOf Urlskithelper.service:Urlskithelper
         * @param {int} nid
         * @param {string} system_title The system title of the programme
         * we want to play
         * @param {string} display_title
         * @returns {string} fixme This method returns the urlskit object with is a kit
         * of urls we need to play the given programme.
         * The method returns a promise, actually, whose payload will be the urlskit .
         */
        this.make_user_profile_permalink = function(uid, name) {

            // @todo comments to fix

            var permalink = '/profile/en/' + uid;

            // @todo don't use first name etc, use name because now it's composed on the server

            // First name, middle names and family name become a string with spaces replaced by '-'

            if (name)
                permalink += '/' + name.replace(/\s/g, '-');

            return permalink;
        };



    }]);
