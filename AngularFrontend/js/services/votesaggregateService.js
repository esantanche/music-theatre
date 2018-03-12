/**
 * @ngdoc overview
 * @name Votesaggregate
 * @description Standard resource that calls the `musth_restws_votesaggregate` rest api
 * @see musth_restws.votesaggregate.ctrl.inc
 */

var votesaggregateServices = angular.module('votesaggregateServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Votesaggregate.service:Votesaggregate
 * @description Querying VotesAggregates, which are the resource provided by the REST
 * api `musth_restws_votesaggregate`.
 * There are two modalities: query of a single VotesAggregate for a node, and query of
 * VotesAggregates for a collection of nodes where votes share the same tag
 */
votesaggregateServices.factory('Votesaggregate', ['$resource',
    function($resource){

        return $resource('/musth_restws_votesaggregate', {}, {
            /**
             * @ngdoc method
             * @name query
             * @description We fetch a single VotesAggregate. It will contain the results of the
             * voting done about a single node. We fetch as well all VotesAggregate objects we can find
             * that are associated to a tag. This second query is used, for example, to fetch, in one go,
             * VotesAggregate objects about all tracks in a programme.
             * @methodOf Votesaggregate.service:Votesaggregate
             * @returns {object} list of the queried votes aggregates. It's always a list, even when we query
             * a single votes aggregate.
             */
            query: { method: 'GET',
                     url: '/musth_restws_votesaggregate?nid=:nid&tag=:tag',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' }
        });
    }]);
