/**
 * @todo this service is going to be abandoned
 *
 * @file FIXME
 *
 * @brief Standard resource that calls the FIXME musth_restws_programme rest api
 *
 * @see FIXME musth_restws.programme.ctrl.inc
 *
 * @ingroup ngservices
 */

var searchtermServices = angular.module('searchtermServices', ['ngResource']);

searchtermServices.factory('SearchTerm', ['$resource',
    function($resource){

        return $resource('/musth_restws_search_term?type=:searchtermType&media_type=:mediaType',
            {},
            {
                query: { method: 'GET',
                         params: { searchtermType: '', mediaType: '' },
                         isArray: false,
                         withCredentials: false,
                         responseType: 'json' }
            });

    }]);
