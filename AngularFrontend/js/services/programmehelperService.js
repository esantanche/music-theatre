/**
 * @ngdoc overview
 * @name Programmehelper
 * @description Service that helps with loading programmes and caching them
 */

var programmehelperServices = angular.module('programmehelperServices', ['programmeServices']);

/**
 * @ngdoc service
 * @name Programmehelper.service:Programmehelper
 * @description First thing, here we load a programme. Other functions related to
 * programmes may come
 * @requires Programme.service:Programme
 * @requires Programmehelper.service:ProgrammeCache
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
programmehelperServices.service('Programmehelper', [ '$q',
    'Programme', 'ProgrammeCache', 'Clientexceptionhelper',
    function($q, Programme, ProgrammeCache, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_programme
         * @description We load the programme whose node id is given.
         * If it has already been loaded, we find it in cache, otherwise we
         * call the REST api.
         * @methodOf Programmehelper.service:Programmehelper
         * @param {int} nid Node id of the programme
         * @returns {promise} This method returns the programme object.
         * The method returns a promise, actually, whose payload will be that programme.
         * See Angular promise/deferred implementation ($q service)
         */
        this.load_programme = function(nid) {
            var deferred = $q.defer();

            var programme_from_cache = ProgrammeCache.get(nid);

            // If the programme is in cache we just return it
            if (programme_from_cache) {
                //console.debug(nid + ' is in cache');
                //console.debug(programme_from_cache);

                deferred.resolve(programme_from_cache);
                return deferred.promise;
            }

            // If not, we load it with the help of the service programmeServices
            Programme.get({ programmeNid: nid },
                function(programmes) {

                    if (programmes) {

                        //console.debug('DBG-98888sd ');
                        //console.debug(programmes);

                        // Even if we asked for a single programme, we get a list
                        // of which we extract the first item

                        var returned_programme = programmes.list[0];

                        //console.debug('programme ' + returned_programme.nid + ' got from restws');

                        if (typeof returned_programme === 'undefined') {

                            // @todo fix here

                            console.error('W3Exxx035 Raequek4ioj4eip Programme not found');
                            Clientexceptionhelper.send_client_exception('W3Exxx035 Raequek4ioj4eip Programme not found');
                            deferred.reject('Programme not found');

                            return;
                        }

                        // Put the programme in cache
                        ProgrammeCache.put(returned_programme.nid, returned_programme);

                        // Return it
                        deferred.resolve(returned_programme);

                    } else {

                        console.error('W3E035 Programme not found, empty response');
                        Clientexceptionhelper.send_client_exception('W3E035 Programme not found, empty response');
                        deferred.reject('Programme not found, empty response');
                    }

                },
                function(err) {

                    console.error('W3E036 Programme not loaded. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E036 Programme not loaded. Reason: ' + err.status);
                    deferred.reject('Error when querying a programme. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Programmehelper.service:ProgrammeCache
 * @description This is an Angular cache service.
 * It stores the programmes we load using the method load_programme.
 * When we store them in the cache, we associate them to their node id.
 * When we retrieve them from the cache, we use the node id to find them.
 * Only the Programmehelper service should use this service.
 */
var programmecacheServices = angular.module('programmecacheServices', [  ]);

programmecacheServices.factory('ProgrammeCache', [ '$cacheFactory',
    function($cacheFactory) {
        return $cacheFactory('ProgrammeCache');
    }]);