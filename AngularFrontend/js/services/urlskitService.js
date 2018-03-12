/**
* @ngdoc overview
* @name URLsKit
* @description Standard resource that calls the `musth_restws_urls_kit` rest api
* @see musth_restws.urlskit.ctrl.inc
*/

var urlskitServices = angular.module('urlskitServices', ['ngResource']);

/**
 * @ngdoc service
 * @name URLsKit.service:URLsKit
 * @description Querying an urlskit, a kit of urls needed to play programmes
 * We give the system title of the programme we want to play and we get back
 * the urls we need to play it
 */
urlskitServices.factory('URLsKit', [ '$resource',
    function($resource){

        return $resource('/musth_restws_urls_kit?system_title=:system_title', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf URLsKit.service:URLsKit
             * @description Query method used to fetch the urlskit containing the urls
             * we need to play a programme. Authorisations will be checked.
             * @param {string} system_title System title of the programme we want to play
             * @param {int} segment_no Segment no of the individual track we want to play
             * @param {int} track_no Track no of the individual track we want to play
             * @returns {object} urlskit
             */
            query: { method: 'GET',
                     params: { system_title: '', segment_no: 0, track_no: 0 },
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' }
        });

    }]);

/**
 * URLsKit properties for reference (from musth_restws.urlskit.ctrl.inc)
 'system_title' => array(
 'type' => 'text',
 'label' => t('System title'),
 ),
 'movie_url' => array(
 'type' => 'text',
 'label' => t('Movie url'),
 ),
 'subtitles_url' => array(
 'type' => 'text',
 'label' => t('Subtitles url'),
 ),
 'preview_url' => array(
 'type' => 'text',
 'label' => t('Preview url'),
 ),
 'preview_subtitles_url' => array(
 'type' => 'text',
 'label' => t('Preview subtitles url'),
 ),
 */