/**
 * @ngdoc overview
 * @name Message
 *
 * @description Standard resource that calls the `musth_restws_message` rest api
 *
 * @see musth_restws.message.ctrl.inc
 */

var messageServices = angular.module('messageServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Message.service:Message
 *
 * @description fixme REST api we call to send an error message to the Drupal server which will
 * convert it into a watchdog
 */
clientexceptionServices.factory('Message', [ '$resource',
    function($resource){

        return $resource('/musth_restws_message?sender_name=:sender_name&sender_email=:sender_email&body=:body', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Message.service:Message
             * @description Query method used to send the exception message
             *
             * @param {string} message Error message to be sent
             */
            query: { method: 'GET',
                     params: { sender_name: '', sender_email: '', body: '' },
                     isArray: false,
                     withCredentials: true,
                     responseType: 'json' }
        });

    }]);

