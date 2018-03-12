/**
 * @ngdoc overview
 * @name Votehelper
 * @description Service that helps with creating votes and loading and querying them.
 * Controllers can ask this service about the vote a user gave to a node.
 * This service keeps all votes even given by a user in an Angular value service
 * (sort of a cache)
 */

var votehelperServices = angular.module('votehelperServices', ['voteServices']);

/**
 * @ngdoc service
 * @name Votehelper.service:Votehelper
 * @description Helper service for votes
 * @requires Vote.service:Vote
 */
votehelperServices.service('Votehelper', [ '$q', 'Vote', 'Votevalue', 'Clientexceptionhelper',
    function($q, Vote, Votevalue, Clientexceptionhelper) {

        // We have to use this variable to refer to the service itself when
        // we are inside the callback part of a REST api call
        // In that case 'this' wouldn't work whilst 'self' does
        var self = this;

        //console.debug('DBG-9N9N lineitemhelperServices');

        /**
         * @ngdoc method
         * @name load_votes
         * @description This method is called by the Userhelper service when it collects all details about the
         * logged-in user just after the login done.
         * The votes are stored in a value service and, when controllers want to know the vote the user
         * gave to a node, they will call the vote_user_gave_to_node method in this same service
         * @methodOf Votehelper.service:Votehelper
         * @param {int} uid Id of the user whose votes we have to fetch
         * @returns {promise} The returned object is a string. It will be 'VOTES_SUCCESSFULLY_RETRIEVED'
         * if everything when fine, or an error message otherwise.
         * The method returns a promise, actually, whose payload will be that string.
         * No, the actual votes are not returned, they are stored in the Votevalue value service.
         */
        this.load_votes = function(uid) {
            var deferred = $q.defer();

            //console.debug('DBG-93jf6v-1 load_votes uid: ' + uid);

            // We call the method 'query' of the Vote service, which performs
            // the actual REST api call
            Vote.query({ uid: uid },
                function(votes) {

                    if (votes) {

                        // votes.list is an array like this:
                        // [0] => { id:"96", nid:"30", uid:"105", value:"1",  value_type:"points" }
                        // [1] => { id:"94", nid:"34", uid:"105", value:"-1", value_type:"points" }
                        // ...

                        // We want an array where the primary key is nid so that we can get the vote given to
                        // a node very easily.

                        // @todo fix doc here, we are dealing with tags now!!!

                        // Here we assume that for a user and a node there is one vote only.
                        // There could be a 'percent' vote and a 'points' vote for the same node given by
                        // the same user.
                        // We will get only one of them
                        // Tags are not supported so we can't give separate votes for example to costumes and lighting
                        // for the same node

                        //console.debug('DBG-before cycle in load_votes');
                        //console.debug(votes.list);

                        // Votevalue is the value service where we keep the votes
                        Votevalue.voter_user_id = uid;
                        Votevalue.votes = {};

                        if (typeof(votes.list) != 'undefined') {

                            for (var vote_iter = 0; vote_iter < votes.list.length; vote_iter++) {

                                //console.debug('DBG-uhuh load_votes');
                                //console.debug(Votevalue.votes);
                                //console.debug(vote_iter);

                                if (typeof Votevalue.votes[votes.list[vote_iter].nid] == 'undefined')
                                    Votevalue.votes[votes.list[vote_iter].nid] = {};

                                Votevalue.votes[votes.list[vote_iter].nid][votes.list[vote_iter].tag] = {
                                    value: votes.list[vote_iter].value,
                                    value_type: votes.list[vote_iter].value_type,
                                    system_title: votes.list[vote_iter].system_title,
                                    display_title: votes.list[vote_iter].display_title
                                };

                            }

                        }

                        //console.debug('DBG-uhuh load_votes frontends/angular/app/js/services/votehelperService.js:97');
                        //console.debug(Votevalue.votes);

                        deferred.resolve('VOTES_SUCCESSFULLY_RETRIEVED');

                    } else {

                        // In this case the response is empty and there is not even an empty list
                        // of votes in it, it would be something

                        console.error('W3E248 Empty response when fetching votes uid: ' + uid);
                        Clientexceptionhelper.send_client_exception('W3E248 Empty response when fetching votes uid: ' + uid);
                        deferred.reject('W3E248 Empty response when fetching votes uid: ' + uid);
                    }

                },
                function(err) {

                    Clientexceptionhelper.send_client_exception('W3E249 Votes not loaded. Status code: ' + err.status);
                    console.error('W3E249 Votes not loaded. Status code: ' + err.status);
                    deferred.reject('W3E249 Votes not loaded. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name @todo doc to do load_votes
         * @description fixme This method is called by the Userhelper service when it collects all details about the
         * logged-in user just after the login done.
         * The votes are stored in a value service and, when controllers want to know the vote the user
         * gave to a node, they will call the vote_user_gave_to_node method in this same service
         * @methodOf Votehelper.service:Votehelper
         * @param {int} uid Id of the user whose votes we have to fetch
         * @returns {promise} The returned object is a string. It will be 'VOTES_SUCCESSFULLY_RETRIEVED'
         * if everything when fine, or an error message otherwise.
         * The method returns a promise, actually, whose payload will be that string.
         * No, the actual votes are not returned, they are stored in the Votevalue value service.
         */
        this.load_fans_of_node = function(nid) {
            var deferred = $q.defer();

            //console.debug('DBG-9lvc46btc5 load_fans_of_node nid: ' + nid);

            // We call the method 'query' of the Vote service, which performs
            // the actual REST api call
            Vote.query({ nid: nid, tag: 'fan' },
                function(votes) {

                    if (votes) {

                        // votes.list is an array like this:
                        // [0] => { id:"96", nid:"30", uid:"105", value:"1",  value_type:"points" }
                        // [1] => { id:"94", nid:"34", uid:"105", value:"-1", value_type:"points" }
                        // ...

                        // We want an array where the primary key is nid so that we can get the vote given to
                        // a node very easily.

                        // @todo fix doc here, we are dealing with tags now!!!

                        // Here we assume that for a user and a node there is one vote only.
                        // There could be a 'percent' vote and a 'points' vote for the same node given by
                        // the same user.
                        // We will get only one of them
                        // Tags are not supported so we can't give separate votes for example to costumes and lighting
                        // for the same node

                        //console.debug('DBG-before cycle in load_fans_of_node');
                        //console.debug(votes.list);

                        // Votevalue is the value service where we keep the votes
                        //Votevalue.voter_user_id = uid;
                        //Votevalue.votes = {};
                        //
                        //if (typeof(votes.list) != 'undefined') {
                        //
                        //    for (var vote_iter = 0; vote_iter < votes.list.length; vote_iter++) {
                        //
                        //        //console.debug('DBG-uhuh load_votes');
                        //        //console.debug(Votevalue.votes);
                        //        //console.debug(vote_iter);
                        //
                        //        if (typeof Votevalue.votes[votes.list[vote_iter].nid] == 'undefined')
                        //            Votevalue.votes[votes.list[vote_iter].nid] = {};
                        //
                        //        Votevalue.votes[votes.list[vote_iter].nid][votes.list[vote_iter].tag] = {
                        //            value: votes.list[vote_iter].value,
                        //            value_type: votes.list[vote_iter].value_type
                        //        };
                        //
                        //    }
                        //
                        //}

                        //console.debug('DBG-uhuh load_votes');
                        //console.debug(Votevalue.votes);

                        deferred.resolve(votes.list);

                    } else {

                        // In this case the response is empty and there is not even an empty list
                        // of votes in it, it would be something

                        console.error('W3E248xxx yahm3aig4AiTiM9 Empty response when fetching votes uid: ' + uid);
                        Clientexceptionhelper.send_client_exception('W3E248 Empty response when fetching votes uid: ' + uid);
                        deferred.reject('W3E248xxx yahm3aig4AiTiM9 Empty response when fetching votes uid: ' + uid);
                    }

                },
                function(err) {

                    Clientexceptionhelper.send_client_exception('W3E249 xxx yahm3aig4AiTiM9 Votes not loaded. Status code: ' + err.status);
                    console.error('W3E249 xxx yahm3aig4AiTiM9 Votes not loaded. Status code: ' + err.status);
                    deferred.reject('W3E249 xxx yahm3aig4AiTiM9 Votes not loaded. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name vote_user_gave_to_node
         * @description This function is used by controllers or other service to know the vote a user gave
         * to a node provided that the user actually gave a vote, the user is logged in and the Userhelper
         * service loaded the votes by using the method load_votes you find in this same service
         * @todo fix doc, dealing with tags!!!
         * @methodOf Votehelper.service:Votehelper
         * @param {int} uid User id of the voter. Used to do a safety check
         * @param {int} nid Node we want the vote about
         * @returns {object} Object containing the requested vote. It has two members: value and value_type. The first
         * is the actual vote, the second is the type, 'points' or 'percent'
         * @param {string} tag Tag given to the vote we want. If undefined, the tag 'vote' will be used
         */
        this.vote_user_gave_to_node = function(uid, nid, tag) {

            // @todo here we have to fix for track votes

            // The idea is that all votes are loaded when the user logs in
            // If Votevalue.voter_user_id == 0, it means that votes have not been
            // loaded yet and this function should not be called

            if (Votevalue.voter_user_id == 0) {

                // @attention this can happen when the user reloads the page
                // In such a case it happens that votes are requested when the Userhelper service has still
                // to load them
                // The TagView controller will fix this problem by using an empty vote
                // Not so nice, but let's not make things too complicated for now
                // The same problem happens when the user visits this sort of urls directly:
                // http://musictheatre-production/en/v/25/Verdi-s-Nabucco-at-Piacenza

                //console.error('W3E??? Votes not loaded yet (vote_user_gave_to_node)');
                //Clientexceptionhelper.send_client_exception('W3E??? Votes not loaded yet (vote_user_gave_to_node)');

                return null;
            }

            // This is another bug. We return only votes given by the logged-in user

            if (Votevalue.voter_user_id != uid) {

                // @todo exception handling to do

                console.error('W3E??? Now only votes given by the logged in user are loaded (vote_user_gave_to_node)');
                Clientexceptionhelper.send_client_exception('W3E??? Now only votes given by the logged in user are loaded (vote_user_gave_to_node)');

                return null;
            }

            var tag_to_use_when_attempting_finding_vote;

            // If no tag is given, we try 'vote' first
            // If a tag is given we try it
            if (typeof tag == "undefined")
                tag_to_use_when_attempting_finding_vote = 'vote';
            else
                tag_to_use_when_attempting_finding_vote = tag;

            if (typeof Votevalue.votes[nid] != "undefined") {

                //console.debug('DBG-090909 vote_user_gave_to_node');
                //console.debug(Votevalue.votes[nid]);
                //console.debug(Votevalue.votes[nid]);

                if (typeof Votevalue.votes[nid][tag_to_use_when_attempting_finding_vote] != "undefined") {

                    return Votevalue.votes[nid][tag_to_use_when_attempting_finding_vote];

                } else if (typeof tag == "undefined") {

                    // If no vote was present for the given tag or for the tag 'vote',
                    // we try to get the first tag we find.
                    // When no tag is given and there is no vote with tag 'vote', it means
                    // that we have to return the first (and only) tag that is present for the
                    // given node (nid)

                    // Trick to get the first tag used to vote the node whose node id is nid
                    // and return the full vote object

                    for (var tag_of_first_vote_object_for_this_node in Votevalue.votes[nid]) {

                        // We don't want fan votes. The tag 'fan' has to be given explicitly
                        if (tag_of_first_vote_object_for_this_node == 'fan') continue;

                        //console.debug(Votevalue.votes[nid][tag_of_first_vote_object_for_this_node]);

                        if (Votevalue.votes[nid].hasOwnProperty(tag_of_first_vote_object_for_this_node))
                            return Votevalue.votes[nid][tag_of_first_vote_object_for_this_node];

                    }

                }

            }

            return null;
        };

        /**
         * @ngdoc method
         * @name @todo fix here
         * @description This function is used by controllers or other service to know the vote a user gave
         * to a node provided that the user actually gave a vote, the user is logged in and the Userhelper
         * service loaded the votes by using the method load_votes you find in this same service
         * @todo fix doc, dealing with tags!!!
         * @methodOf Votehelper.service:Votehelper
         * @param {int} uid User id of the voter. Used to do a safety check
         * @param {int} nid Node we want the vote about
         * @returns {object} Object containing the requested vote. It has two members: value and value_type. The first
         * is the actual vote, the second is the type, 'points' or 'percent'
         * @param {string} tag Tag given to the vote we want. If undefined, the tag 'vote' will be used
         */
        this.votes_user_gave_that_are_tagged_with_given_tag = function(uid, tag) {

            // The idea is that all votes are loaded when the user logs in
            // If Votevalue.voter_user_id == 0, it means that votes have not been
            // loaded yet and this function should not be called

            if (Votevalue.voter_user_id == 0) {

                // @attention this can happen when the user reloads the page
                // In such a case it happens that votes are requested when the Userhelper service has still
                // to load them
                // The TagView controller will fix this problem by using an empty vote
                // Not so nice, but let's not make things too complicated for now
                // The same problem happens when the user visits this sort of urls directly:
                // http://musictheatre-production/en/v/25/Verdi-s-Nabucco-at-Piacenza

                //console.error('W3E??? Votes not loaded yet (vote_user_gave_to_node)');
                //Clientexceptionhelper.send_client_exception('W3E??? Votes not loaded yet (vote_user_gave_to_node)');

                return null;
            }

            // This is another bug. We return only votes given by the logged-in user

            if (Votevalue.voter_user_id != uid) {

                // @todo exception handling to do

                console.error('W3E??? Now only votes given by the logged in user are loaded (vote_user_gave_to_node)');
                Clientexceptionhelper.send_client_exception('W3E??? Now only votes given by the logged in user are loaded (vote_user_gave_to_node)');

                return null;
            }

            if (typeof tag == "undefined")
                tag = 'vote';

            // @todo but is this function about any tag or only 'fan' tag?

            var list_of_items_user_is_fan_of = [];

            for (var node_id in Votevalue.votes) {
                if (Votevalue.votes.hasOwnProperty(node_id)) {

                    var votes_for_a_single_node = Votevalue.votes[node_id];

                    //console.debug('DBG-kikikikikik votes_for_a_single_node');
                    //console.debug(votes_for_a_single_node);

                    if (votes_for_a_single_node.hasOwnProperty('fan')) {

                        //console.debug('user ' + uid + ' is fan of ' + node_id);
                        list_of_items_user_is_fan_of.push({ nid: node_id,
                            display_title: votes_for_a_single_node['fan']['display_title'],
                            system_title: votes_for_a_single_node['fan']['system_title'] });
                    }

                }
            }

            // @todo to do here
            // The top level iteration is on nodes. At each cycle we get all
            // votes the user gave for a given node, whatever the tag
            //for (var node_iter = 0; node_iter < Votevalue.votes.length; node_iter++) {
            //
            //    //var votes_for_a_single_node = Votevalue.votes[node_iter];
            //
            //
            //
            //    console.debug('DBG-kikikikikik votes_for_a_single_node');
            //    console.debug(votes_for_a_single_node);
            //    //console.debug(vote_iter);
            //
            //    //if (typeof Votevalue.votes[votes.list[vote_iter].nid] == 'undefined')
            //    //    Votevalue.votes[votes.list[vote_iter].nid] = {};
            //    //
            //    //Votevalue.votes[votes.list[vote_iter].nid][votes.list[vote_iter].tag] = {
            //    //    value: votes.list[vote_iter].value,
            //    //    value_type: votes.list[vote_iter].value_type
            //    //};
            //
            //}

            //console.debug('DBG-vvvvvv votes_user_gave_that_are_tagged_with_given_tag list_of_items_user_is_fan_of');
            //console.debug(Votevalue.votes);
            //console.debug(list_of_items_user_is_fan_of);
            //console.debug(Votevalue.votes.length);
            //Votevalue.votes.length

            //if (typeof Votevalue.votes[nid] != "undefined") {
            //
            //    if (typeof Votevalue.votes[nid][tag] != "undefinded")
            //        return Votevalue.votes[nid][tag];
            //
            //}

            return list_of_items_user_is_fan_of;
        };

        /**
         * @ngdoc method
         * @name forget_votes
         * @description Function called when loggin out to forget the votes given by the logged-in user
         * @methodOf Votehelper.service:Votehelper
         */
        this.forget_votes = function() {

            Votevalue.voter_user_id = 0;
            Votevalue.votes = {};

        };

        /**
         * @ngdoc method
         * @name register_vote_user_gave_to_node
         * @description After the user gave a vote to a node, we use this method to keep that vote and avoid to recall
         * the rest api to fetch all votes for the logged-in user
         * @todo say that here we are not interested in tags
         * @methodOf Votehelper.service:Votehelper
         * @param {int} uid Voter user id
         * @param {int} nid Node id of the voted node
         * @param {string} value_type 'points' or 'percent'
         * @param {int} value Actual vote, 1/-1 or 0 to 100
         * @returns {bool} true on success
         * @param {string} tag Tag given to the vote we want. If undefined, the tag 'vote' will be used
         */
        this.register_vote_user_gave_to_node = function(uid, nid, value_type, value, tag) {

            // This function is internal to this service and shouldn't be used from other services or from controllers

            if (uid == 0) {

                // @todo exception handling to do

                console.error('It cant be that you allowed an anonymous user to vote! ' +
                              '(register_vote_user_gave_to_node)');

                return false;
            }

            if (nid == 0) {

                // @todo exception handling to do

                console.error('I cant believe that you accepted a vote on node zero! ' +
                              'Such a precise person! (register_vote_user_gave_to_node)');

                return false;
            }

            if (value_type != 'points' && value_type != 'percent') {

                // @todo exception handling to do

                console.error('What sort of vote do you want me to register? I know only about ' +
                              'points and percent. (register_vote_user_gave_to_node)');

                return false;
            }

            if ((value != 1 && value != -1 && value_type == 'points') ||
                ((value < 0 || value > 100) && value_type == 'percent') ) {

                // @todo exception handling to do

                console.error('Votes can be only 1 or -1 if points and between 0 and 100 ' +
                              'if percent (register_vote_user_gave_to_node)');

                return false;
            }

            if (typeof tag == "undefined")
                tag = 'vote';

            if (typeof Votevalue.votes[nid] == "undefined")
                Votevalue.votes[nid] = {};

            Votevalue.votes[nid][tag] = { value: value, value_type: value_type };

            return true;
        };

        /**
         * @ngdoc method
         * @name vote_a_node
         * @description This is to create a new vote on a node by calling the Vote REST api
         * @methodOf Votehelper.service:Votehelper
         * @param {int} nid Id of the node being voted
         * @param {int} uid Id of the voter
         * @param {string} value_type 'points' or 'percent'
         * @param {int} value Actual vote, 1/-1 or 0 to 100
         * @param {string} tag Optional tag to be associated to the vote
         * @returns {promise} The returned object is a string. It will be 'Vote created successfully'
         * if everything when fine, or an error message otherwise.
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.vote_a_node = function(nid, uid, value_type, value, tag) {
            var deferred = $q.defer();

            if (!nid) {

                console.error('phu9jaPaiP nid cant be zero when voting a node');
                Clientexceptionhelper.send_client_exception('phu9jaPaiP nid cant be zero when voting a node');

                deferred.reject('phu9jaPaiP nid cant be zero when voting a node');
                return deferred.promise;
            }

            if (!uid) {

                console.error('Baa9eeThie uid cant be zero when voting a node');
                Clientexceptionhelper.send_client_exception('Baa9eeThie uid cant be zero when voting a node');

                deferred.reject('Baa9eeThie uid cant be zero when voting a node');
                return deferred.promise;
            }

            if (typeof tag == "undefined")
                tag = 'vote';

            Vote.create({ nid: nid, uid: uid, value_type: value_type, value: value, tag: tag },
                function(vote_creation_object) {

                    if (vote_creation_object) {

                        // We register the freshly created vote in our internal Votevalue value service
                        // to keep it in sync with the current situation
                        // We are not interested in tags when registering votes in our internal value service

                        self.register_vote_user_gave_to_node(uid, nid, value_type, value, tag);

                        // console.debug('DBG-1h36d7 vote_creation_object.id ' + vote_creation_object.id);

                        deferred.resolve('Vote created successfully');

                    } else {

                        console.error('W3E250 Empty response when creating a vote');
                        Clientexceptionhelper.send_client_exception('W3E250 Empty response when creating a vote');
                        deferred.reject('W3E250 Empty response when creating a vote');

                    }

                },
                function(err) {

                    console.error('W3E251 Votes not created. Status code: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E251 Votes not created. Status code: ' + err.status);
                    deferred.reject('W3E251 Votes not created. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Votehelper.service:Votevalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about the votes we created by using the method
 * vote_a_node and retrieved by using the method load_votes
 *
 * It stores the id of the user (logged-in) whose votes we manage with this servire and the actual
 * votes, all of them.
 *
 * Only the Votehelper service should use this service.
 */
var votevalueServices = angular.module('votevalueServices', [ ]);

votevalueServices.value('Votevalue', {
    voter_user_id: 0,
    votes: {} });

