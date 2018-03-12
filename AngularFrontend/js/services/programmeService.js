/**
 * @ngdoc overview
 * @name Programme
 * @description Standard resource that calls the `musth_restws_programme` rest api
 * @see musth_restws.programme.ctrl.inc
 */

var programmeServices = angular.module('programmeServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Programme.service:Programme
 * @description We retrieve a programme here
 */
programmeServices.factory('Programme', ['$resource',
    function($resource){

        return $resource('/musth_restws_programme' +
            '?nid=:programmeNid', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Programme.service:Programme
             * @description Query method used to fetch a programme given the id
             * @param {int} programmeNid Id of the programme to fetch
             * @returns {object} programme
             */
            query: { method: 'GET',
                     params: { programmeNid: 0 },
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' }
        });

    }]);
