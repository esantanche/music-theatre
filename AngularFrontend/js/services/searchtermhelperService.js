/**
 * @todo this service is going to be abandoned
 *
 * @file FIXME
 *
 * @brief Service that calls the FIXME rest api to load a programme
 *
 * This service controls the FIXME cache as well.
 *
 * @ingroup ngservices
 */

    // @todo do we implement the cache here?

var searchtermhelperServices = angular.module('searchtermhelperServices', ['searchtermServices']);

searchtermhelperServices.service('SearchTermhelper', [ '$q',
    'SearchTerm', 'SearchTermCache',
    function($q, SearchTerm, SearchTermCache) {

        /**
         * Here the wanted programme is loaded
         *
         * @todo fix this doc
         *
         * @param nid Node id of the programme
         * @returns {promise} See Angular promise/deferred implementation ($q service)
         */
        this.load_search_terms = function(type, media_type) {
            var deferred = $q.defer();

            /*
            No cache for now
            var programme_from_cache = ProgrammeCache.get(nid);

            // If the programme is in cache we just return it
            if (programme_from_cache) {
                //console.debug(nid + ' is in cache');
                //console.debug(programme_from_cache);

                deferred.resolve(programme_from_cache);
                return deferred.promise;
            }
            */

            // searchtermType: '', mediaType: '' },

            // If not, we load it with the help of the service programmeServices
            SearchTerm.get({ searchtermType: type, mediaType: media_type },
                function(search_terms) {

                    if (search_terms) {

                        //var returned_programme = programmes.list[0];

                        //console.debug('programme ' + returned_programme.nid + ' got from restws');

                        // Put the programme in cache
                        //ProgrammeCache.put(returned_programme.nid, returned_programme);

                        // Return it
                        deferred.resolve(search_terms);

                    } else {

                        // @todo fix here

                        console.error('W3E??? FIXME Programme not found, empty response');

                        //Clientexceptionhelper.send_client_exception('W3E??? search term Programme not found, empty response');

                        deferred.reject('FIXME search trem Programme not found, empty response');
                    }

                },
                function(err) {

                    // @todo fix here

                    console.error('W3E??? search term Programme not loaded. Reason: ' + err.status);

                    //Clientexceptionhelper.send_client_exception('W3E??? search tenr Programme not loaded. Reason: ' + err.status);

                    // @todo fix everything
                    deferred.reject('Error when querying a FIXME search term. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @todo do we need this?
 * This cache is not in a separate file because it's used here and here only
 * It's the cache for programmes and it's used only in programmehelperServices
 */

var searchtermcacheServices = angular.module('searchtermcacheServices', [  ]);

searchtermcacheServices.factory('SearchTermCache', [ '$cacheFactory',
    function($cacheFactory) {
        return $cacheFactory('SearchTermCache');
    }]);

