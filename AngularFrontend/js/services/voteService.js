/**
 * @ngdoc overview
 * @name Vote
 * @description Standard resource that calls the `musth_restws_vote` rest api
 * @see musth_restws.vote.ctrl.inc
 */

var voteServices = angular.module('voteServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Vote.service:Vote
 * @description Querying Votes, which are the resource
 * provided by the REST api `musth_restws_vote`.
 * We query all votes ever given by a user.
 * We can also create votes. Votes about the same node and given by the same user replace previous ones.
 */
voteServices.factory('Vote', ['$resource',
    function($resource){

        return $resource('/musth_restws_vote', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Vote.service:Vote
             * @description Query method used to fetch the votes given by a user.
             * The uid parameter is needed to specify the user whose votes we want.
             * There is no persmission check because votes are public
             * @returns {object} list of all votes ever given by the user whose id is uid
             */
            query: { method: 'GET',
                     url: '/musth_restws_vote?uid=:uid',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Vote.service:Vote
             * @description Create method used to create a new vote
             * To create a new vote we need:
             *
             * * nid: node id of the voted node
             * * uid: voter's user id
             * * value_type: 'points' or 'percent'
             * * value: actual vote, 1/-1 or 0 to 100
             * * tag: tag to be used to fetch votes aggregates about all tracks in a programme or
             * similar cases
             *
             * These parameters are in the POST message body
             * @returns {int} Now only a dummy id is returned because Angular is not interested in the actual id
             * of the newly created vote
             */
            create: { method: 'POST',
                url: '/musth_restws_vote',
                isArray: false,
                withCredentials: false,
                responseType: 'json' }
        });
    }]);
