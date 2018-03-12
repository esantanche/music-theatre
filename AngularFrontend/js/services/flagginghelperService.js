/**
 * @ngdoc overview
 * @name Flagginghelper
 * @description This service helps with operating on flaggings.
 * We are talking about flaggings created by using the Flag Drupal module. A flagging is the action of attaching
 * a flag to an entity. For example it can be the action of attaching the flag 'abusive_comment' to a specific comment
 */

var flagginghelperServices =
    angular.module('flagginghelperServices', ['flaggingServices']);

/**
 * @ngdoc service
 * @name Flagginghelper.service:Flagginghelper
 * @description Helper service for flaggings. Through this service, controllers
 * can create flaggings.
 * @requires Flagging.service:Flagging
 */
flagginghelperServices.service('Flagginghelper', [ '$q', 'Flagging', 'Clientexceptionhelper',
    function($q, Flagging, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name create_flagging
         * @description This method creates a flagging by using the Flagging
         * service, which calls a REST api
         * @methodOf Flagginghelper.service:Flagginghelper
         * @param {int} entity_id Id of the entity we want to apply a flag to
         * @param {string} flag_name Name of the flag we have to apply to the entity
         * @returns {promise} See Angular promise/deferred implementation ($q service)
         */
        this.create_flagging = function(flag_name, entity_id) {
            var deferred = $q.defer();

            // No safety checks here. The REST api checks that the entity of id entity_id exists,
            // that the flag of name flag_name exists and that the entity is of the type expected by the flag
            // definition

            //console.debug('DBG- ');

            Flagging.create({ flag_name: flag_name, entity_id: entity_id },
                function(response) {

                    // Maybe the REST api returns the id of the newly created flagging, but we don't care about it

                    deferred.resolve('Flagging successfully created');

                },
                function(err) {

                    console.error('W3E237 Flagging not created. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E237 Flagging not created. Reason: ' + err.status);
                    deferred.reject('W3E237 Flagging not created. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        //console.debug('DBG-8SDE flagginghelperServices');

    }]);
