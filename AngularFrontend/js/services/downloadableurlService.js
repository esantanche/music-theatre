/**
* @ngdoc overview
* @name DownloadableUrl
* @description Standard resource that calls the `musth_restws_downloadable_url` rest api
* @see musth_restws.downloadableurl.ctrl.inc
*/

var downloadableurlServices = angular.module('downloadableurlServices', ['ngResource']);

/**
 * @ngdoc service
 * @name DownloadableUrl.service:DownloadableUrl
 * @description Querying a downloadable url, a url needed to download a downloadable
 * (audio track, audio cd, pdf, anything we have to download)
 * We give the catalogue no of the item we want to download and we get back
 * the url we download that item from.
 * Catalogue nos are 9 digits ones, like A16510000
 */
urlskitServices.factory('DownloadableUrl', [ '$resource',
    function($resource){

        return $resource('/musth_restws_downloadable_url?catalogue_no=:catalogue_no', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf DownloadableUrl.service:DownloadableUrl
             * @description Query method used to fetch the url of a downloadable.
             * Authorisations will be checked unless it's a free download.
             * @param {string} catalogue_no Catalogue no of the item we want to download
             * @returns {object} DownloadableUrl The downloadableurl resource we asked for
             * containing the url we download our downloadable from
             */
            query: { method: 'GET',
                     params: { catalogue_no: '' },
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' }
        });

    }]);

/*
DownloadableUrl properties for reference

return array(
    'catalogue_no' => array( // 9 digits catalogue no, like A12340101, V23450304
    'type' => 'text',
    'label' => t('Catalogue no'),
),
'url' => array( // signed url where the downloadable can be found
    'type' => 'text',
    'label' => t('Url'),
),
);
*/