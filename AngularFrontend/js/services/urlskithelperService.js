/**
 * @ngdoc overview
 * @name Urlskithelper
 * @description To play programmes we need the url of the video as
 * stored in the CDN. The url will be signed and the server will check
 * if the user is authorised to play the programme.
 */

var urlskithelperServices = angular.module('urlskithelperServices', ['urlskitServices']);

/**
 * @ngdoc service
 * @name Urlskithelper.service:Urlskithelper
 * @description This service helps with everything we need to do about
 * retrieving the urls of the media we have to stream
 * @requires URLsKit.service:URLsKit
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
urlskithelperServices.service('Urlskithelper', [ '$q', 'URLsKit', 'Clientexceptionhelper',
    function($q, URLsKit, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_urlskit
         * @description We are given the system title of a programme.
         * We use it to call the REST api `musth_restws_urls_kit` via the service
         * URLsKit and get the urls we need to play the programme
         * @methodOf Urlskithelper.service:Urlskithelper
         * @param {string} system_title The system title of the programme
         * we want to play
         * @param {int} segment_no Segment no of the individual track we want to play
         * @param {int} track_no Track no of the individual track we want to play
         * @returns {promise} This method returns the urlskit object with is a kit
         * of urls we need to play the given programme.
         * The method returns a promise, actually, whose payload will be the urlskit .
         */
        this.load_urlskit = function(system_title, segment_no, track_no) {
            var deferred = $q.defer();

            URLsKit.get({ system_title: system_title,
                          segment_no: segment_no,
                          track_no: track_no },
                function(urlskits) {

                    if (urlskits) {

                        // As usual, we get a list of urlskits even if
                        // there is only one of them
                        // We just get the first element of the list

                        var returned_urlskit = urlskits.list[0];

                        //console.debug('urlskit ' + returned_urlskit.system_title + ' got from restws');

                        deferred.resolve(returned_urlskit);

                    } else {

                        console.error('W3E135 Empty response when getting an urlskit');
                        Clientexceptionhelper.send_client_exception('W3E135 Empty response when getting an urlskit');
                        deferred.reject('Empty response when getting an urlskit');

                    }

                },
                function(err) {

                    console.error('W3E136 Error when getting an urlskit. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E136 Error when getting an urlskit. Reason: ' + err.status);
                    deferred.reject('Error when getting an urlskit. Reason: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);
