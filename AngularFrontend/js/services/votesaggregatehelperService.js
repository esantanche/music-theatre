/**
 * @ngdoc overview
 * @name Votesaggregatehelper
 * @description Service that helps with fetching votes aggregates. A VotesAggregate is the aggregated
 * result of votes given by users to a node.
 * We only fetch them. They are results of voting and are calculated on votes. They can't be created,
 * updated or deleted.
 */

var votesaggregatehelperServices = angular.module('votesaggregatehelperServices', ['votesaggregateServices']);

/**
 * @ngdoc service
 * @name Votesaggregatehelper.service:Votesaggregatehelper
 * @description Helper service for votes aggregates. It just fetches them
 * @todo here there is about to be a change. We are going to fetch votes aggregates by tag
 * @requires Votesaggregate.service:Votesaggregate
 */
votesaggregatehelperServices.service('Votesaggregatehelper', [ '$q', 'Votesaggregate', 'Clientexceptionhelper',
    function($q, Votesaggregate, Clientexceptionhelper) {

        //console.debug('DBG-');

        /**
         * @ngdoc method
         * @name load_votes_aggregate
         * @description This method loads the votes aggregate for a node.
         * If the given node is a programme, we will have the average vote given and
         * the number of votes.
         * @todo tags to be added here!
         * @methodOf Votesaggregatehelper.service:Votesaggregatehelper
         * @param {int} nid The id of the node being voted and for which we want the votes aggregate
         * @returns {promise} The returned object is a votes aggregate object
         * The method returns a promise, actually, whose payload will be that object.
         * @param {string} tag The tag we want aggregates for, if different from 'vote', which is the default
         */
        this.load_votes_aggregate = function(nid, tag) {
            var deferred = $q.defer();

            //console.debug('DBG-8ujj7756-1 load_votes_aggregate nid: ' + nid);
            var query_parameters = { nid: nid };

            if (typeof tag != "undefined")
                query_parameters['tag'] = tag;

            //console.debug(query_parameters);

            // We call the method 'query' of the Votesaggregate service, which performs
            // the actual REST api call
            Votesaggregate.query(query_parameters,
                function(votesaggregate) {

                    if (votesaggregate) {

                        //console.debug('DBG-0ajkjj load_votes_aggregate');
                        //console.debug(votesaggregate);

                        // In the rest call response, votesaggregate, there will be one VotesAggregate
                        // only, but we find still a list in it.
                        // The element zero is the VotesAggregate object we need
                        // Maybe the given node has never been voted. In this case there will be
                        // no list of votesaggregates or the list will be empty. We return null.

                        var votesaggregate_for_the_given_node = null;

                        if (typeof votesaggregate.list != "undefined") {
                            if (votesaggregate.list.length > 0)
                                votesaggregate_for_the_given_node = votesaggregate.list[0];
                        }

                        deferred.resolve(votesaggregate_for_the_given_node);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of votes aggregates in it, it would be something

                        console.error('W3E252 Empty response when fetching a votes aggregate nid: ' + nid);
                        Clientexceptionhelper.send_client_exception('W3E252 Empty response when ' +
                                                                    'fetching a votes aggregate nid: ' + nid);
                        deferred.reject('W3E252 Empty response when fetching a votes aggregate nid: ' + nid);
                    }

                },
                function(err) {

                    Clientexceptionhelper.send_client_exception('W3E253 Votes aggregate not loaded. Status code: '
                                                                + err.status);
                    console.error('W3E253 Votes aggregate not loaded. Status code: ' + err.status);
                    deferred.reject('W3E253 Votes aggregate not loaded. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @todo function to do
         * @ngdoc method
         * @name load_votes_aggregates_by_tag
         * @description @todo
         *
         * @methodOf Votesaggregatehelper.service:Votesaggregatehelper
         * @param {string} tag @todo The id of the node being voted and for which we want the votes aggregate
         * @returns {promise} The returned object is a votes aggregate object
         * The method returns a promise, actually, whose payload will be that object.
         */
        this.load_votes_aggregates_by_tag = function(tag) {
            var deferred = $q.defer();

            // @todo everything to do here

            if (!tag) {

                // @todo tag can't be empty

                console.error('ahvee3kieM tag cant be empty');
                Clientexceptionhelper.send_client_exception('ahvee3kieM tag cant be empty');
                deferred.reject('ahvee3kieM tag cant be empty');

                return deferred.promise;
            }

            // We are tag agnostic. We perform the rest call whatever the tag
            // This function's caller has to provide a proper tag

            //console.debug('DBG-8ujj7756-1 load_votes_aggregate nid: ' + nid);

            // We call the method 'query' of the Votesaggregate service, which performs
            // the actual REST api call
            Votesaggregate.query({ tag: tag },
                function(votesaggregate) {

                    if (votesaggregate) {

                        // In the rest call response, votesaggregate, there will be all VotesAggregates
                        // for the given tag.

                        //console.debug('DBG-0ajkjj load_votes_aggregate');
                        //console.debug(votesaggregate);

                        // We want an array keyed on the voted node id. It makes easier to
                        // find the votesaggregate about a given voted node

                        var votesaggregates_by_voted_node_id = {};

                        if (typeof(votesaggregate.list) != 'undefined') {

                            for (var votesaggregate_iter = 0;
                                 votesaggregate_iter < votesaggregate.list.length;
                                 votesaggregate_iter++) {

                                votesaggregates_by_voted_node_id[votesaggregate.list[votesaggregate_iter].nid] = {
                                    average: votesaggregate.list[votesaggregate_iter].average,
                                    count: votesaggregate.list[votesaggregate_iter].count
                                };

                            }

                        }

                        deferred.resolve(votesaggregates_by_voted_node_id);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of votes aggregates in it, it would be something

                        // @todo exception to do

                        console.error('ohf3Ohqu4a Empty response when fetching votes aggregates tag: ' + tag);
                        Clientexceptionhelper.send_client_exception('ohf3Ohqu4a Empty response when ' +
                            'fetching votes aggregates tag: ' + tag);
                        deferred.reject('ohf3Ohqu4a Empty response when fetching votes aggregates tag: ' + tag);
                    }

                },
                function(err) {

                    // @todo exception to do

                    Clientexceptionhelper.send_client_exception('phuo4iPh9a Votes aggregate not loaded. Status code: '
                        + err.status);
                    console.error('phuo4iPh9a Votes aggregate not loaded. Status code: ' + err.status);
                    deferred.reject('phuo4iPh9a Votes aggregate not loaded. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };
    }]);
