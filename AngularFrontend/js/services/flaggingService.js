/**
 * @ngdoc overview
 * @name Flagging
 *
 * @description Standard resource that calls the `musth_restws_flagging` rest api
 *
 * @see musth_restws.flagging.ctrl.inc
 */

var flaggingServices = angular.module('flaggingServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Flagging.service:Flagging
 * @description Standard resource that calls the `musth_restws_flagging` rest api
 * to create flaggings.
 * Used to flag comments as abusive.
 */
flaggingServices.factory('Flagging', ['$resource',
    function($resource){

        return $resource('/musth_restws_flagging', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Flagging.service:Flagging
             * @description Not currently used
             * @param {int} flagging_id Id of the flagging to get
             * @returns {object} flagging
             */
            //query: { method: 'GET',
            //         url: '/musth_restws_flagging' +
            //              '?flagging_id=:flagging_id',
            //         isArray: false,
            //         withCredentials: false,
            //         responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Flagging.service:Flagging
             * @description Creates a flagging by calling the REST api musth_restws_flagging
             * The information to be used to create the flagging is in the POST query body.
             * To create a flagging we have to send flag_name, the name of the flag to apply to an entity, and
             * entity_id, the id of the entity to apply the flag to
             * @returns {int} Id of the new flagging. We ignore it
             */
            create: { method: 'POST',
                url: '/musth_restws_flagging',
                isArray: false,
                withCredentials: false,
                responseType: 'json' }
        });

    }]);
