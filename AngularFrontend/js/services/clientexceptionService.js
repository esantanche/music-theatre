/**
 * @ngdoc overview
 * @name ClientException
 *
 * @description Standard resource that calls the `musth_restws_client_exception` rest api
 *
 * @see musth_restws.clientexception.ctrl.inc
 */

var clientexceptionServices = angular.module('clientexceptionServices', ['ngResource']);

/**
 * @ngdoc service
 * @name ClientException.service:ClientException
 *
 * @description REST api we call to send an error message to the Drupal server which will
 * convert it into a watchdog
 */
clientexceptionServices.factory('ClientException', [ '$resource',
    function($resource){

        return $resource('/musth_restws_client_exception?message=:message', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf ClientException.service:ClientException
             * @description Query method used to send the exception message
             *
             * @param {string} message Error message to be sent
             */
            query: { method: 'GET',
                     params: { message: '' },
                     isArray: false,
                     withCredentials: true,
                     responseType: 'json' }
        });

    }]);

