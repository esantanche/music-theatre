/**
 * @ngdoc overview
 * @name Downloadableurlhelper
 * @description To download any downloadable, audio cd, audio track, pdf, we need a signed url
 * pointing to the CDN where the downloadable is stored.
 * The url is provided if the user owns a license for the downloadable or if the downloadable is free.
 */

var downloadableurlhelperServices = angular.module('downloadableurlhelperServices', ['downloadableurlServices']);

/**
 * @ngdoc service
 * @name Downloadableurlhelper.service:Downloadableurlhelper
 * @description This service helps with everything we need to do about
 * retrieving downloadables' urls
 * @requires DownloadableUrl.service:DownloadableUrl
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
downloadableurlhelperServices.service('Downloadableurlhelper', [ '$q', 'DownloadableUrl', 'Clientexceptionhelper',
    function($q, DownloadableUrl, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_downloadableurl
         * @description We are given the catalogue no of an item.
         * We use it to call the REST api `musth_restws_downloadable_url` via the service
         * DownloadableUrl and get the url we need to download the item
         * @methodOf Downloadableurlhelper.service:Downloadableurlhelper
         * @param {string} catalogue_no The catalogue no of the item
         * we want to download
         * @returns {promise} This method returns the downloadableurl object that contains
         * of url we need to download the downloadable.
         * The method returns a promise, actually, whose payload will be the downloadableurl.
         */
        this.load_downloadableurl = function(catalogue_no) {
            var deferred = $q.defer();

            DownloadableUrl.get({ catalogue_no: catalogue_no },
                function(downloadableurls) {

                    if (downloadableurls) {

                        // As usual, we get a list of downloadableurls even if
                        // there is only one of them
                        // We just get the first element of the list

                        var returned_downloadableurl = downloadableurls.list[0];

                        //console.debug('urlskit ' + returned_urlskit.system_title + ' got from restws');

                        deferred.resolve(returned_downloadableurl);

                    } else {

                        console.error('W3E157 Error in fetching a DownloadableUrl, empty response');
                        Clientexceptionhelper.send_client_exception('W3E157 Error in fetching a DownloadableUrl, empty response');
                        deferred.reject('Error in fetching a DownloadableUrl, empty response');

                    }

                },
                function(err) {

                    console.error('W3E158 Error in fetching a DownloadableUrl. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E158 Error in fetching a DownloadableUrl. Reason: ' + err.status);
                    deferred.reject('W3E158 Error in fetching a DownloadableUrl. Reason: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);
