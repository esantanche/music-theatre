/**
 * @ngdoc overview
 * @name Grouphelper
 * @description Service that helps with creating groups and with loading, updating and deleting them
 */

var grouphelperServices = angular.module('grouphelperServices', ['groupServices']);

// @todo ok all doc to review here

/**
 * @ngdoc service
 * @name Grouphelper.service:Grouphelper
 * @description Helper service for groups
 * @requires Group.service:Group
 */
grouphelperServices.service('Grouphelper', [ '$q', 'Group', 'Groupvalue', 'Clientexceptionhelper',
    function($q, Group, Groupvalue, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_groups
         * @description This method loads groups given their title, or part of it, or their node id.
         * If no parameters are given, all groups are returned
         * @attention The check that makes sure that the title is at least three characters long
         * doesn't work properly with Unicode (UTF-8) characters.
         * We will have to improve it. For now there is the risk that two unicode characters are counted
         * as three or more and pass the check. But in such a case the server would throw an exception.
         * @methodOf Grouphelper.service:Grouphelper
         * @param {int} nid The node id of group
         * @param {string} title The title of the group of part of it when we want many groups
         * @param {int} page Number of page to return. Defaults to zero.
         * @returns {promise} The returned object is an array of group objects.
         * The method returns a promise, actually, whose payload will be that array.
         */
        this.load_groups = function(nid, title, page) {
            var deferred = $q.defer();

            // console.debug('DBG-7DERF load_comments nid: ' + nid + ' page: ' + page);

            if (typeof(page) === 'undefined') page = 0;

            //console.error('title here ' + title.length + "|" + title + "|");

            // @attention This test doesn't work properly with Unicode (UTF-8) characters
            // We will have to improve it. For now there is the risk that two unicode characters are counted
            // as three or more and pass this test. But in such a case the server would throw an exception.
            // The solution seems to be to use the library https://github.com/bestiejs/punycode.js
            // @todo actually check with angular validation checks in input

            //if (typeof(title) != 'undefined') {

            if (title) {
                if (title.length > 0 && title.length < 3) {

                    console.error('W3E339 Title too short. Title: ' + title);
                    Clientexceptionhelper.send_client_exception('W3E339 Title too short. Title: ' + title);

                    deferred.reject('W3E339 Title too short');
                    return deferred.promise;
                }
            }

            // We call the method 'query' of the service Group, which performs
            // the actual REST api call
            Group.query({ nid: nid, title: title, page: page },
                function(groups) {

                    if (groups) {

                        //console.debug('DBG-97H1 load_comments comments not empty nid: ' + nid + ' page: ' + page);
                        //console.debug(comments);

                        // We are doing paging in this case and we want to know if the page we just loaded
                        // is the last one or not
                        Groupvalue.more_pages_available = ! (typeof(groups.next) === 'undefined');

                        // In this case the groups response object is not empty, we return
                        // it as it is. Precisely we return the list of groups,
                        // which may be empty even if the groups object isn't
                        deferred.resolve(groups.list);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of groups in it, it would be something

                        console.error('W3E340 Empty response when fetching groups');
                        Clientexceptionhelper.send_client_exception('W3E340 Empty response when fetching groups');
                        deferred.reject('W3E340 Empty response when fetching groups');
                    }

                },
                function(err) {

                    // We have to transform a 404 error (nothing found) into a non-error response because
                    // the REST api calls the count method first and, if nothing is found it throws a 404
                    // instead of returning an empty list

                    if (err.status == 404) {
                        Groupvalue.more_pages_available = false;
                        deferred.resolve([]);
                    }
                    else {
                        Clientexceptionhelper.send_client_exception('W3E341 Groups not loaded. Reason: ' + err.status);
                        console.error('W3E341 Groups not loaded. Reason: ' + err.status);
                        deferred.reject('W3E341 Groups not loaded. Status code: ' + err.status);
                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name more_pages_available
         * @description Function that tells if there are more pages to load when loading groups
         * This information is acquired when a page of groups is loaded by calling the method load_groups
         * If a controller calls this method before calling the method load_groups, it gets a 'false', which is
         * the starting value. So, it makes no sense to call this method before calling load_groups
         * @methodOf Grouphelper.service:Grouphelper
         * @returns {bool} True if there are more pages to load
         */
        this.more_pages_available = function() {

            return Groupvalue.more_pages_available;
        };

        /**
         * @ngdoc method
         * @name create_group
         * @description This function calls the create method of the Group REST api to create a group
         *
         * To create a group we need:
         *
         * * uid, the user id of the group creator. The server will check that it's the same as the
         * logged-in user
         * * title, at least three chars. Controllers have to make sure that the title is really minimum
         * three chars long
         * * description
         *
         * Groups are created unpublished. Editors will have to approve and publish them.
         *
         * @methodOf Grouphelper.service:Grouphelper
         * @param {object} group Group as entered by the user
         * @returns {promise} The returned object is an object that contains the id of the newly created group.
         * The method returns a promise, actually, whose payload will be that object.
         */
        this.create_group = function(group) {
            var deferred = $q.defer();

            Group.create({ uid: group.uid,
                           title: group.title,
                           description: group.description },
                function(group_creation_object) {

                    if (group_creation_object) {

                        //console.debug('DBG-999999 group_creation_object.id ' + group_creation_object.id);

                        // Returning the id of the new group
                        deferred.resolve(group_creation_object.id);

                    } else {

                        console.error('W3E342 Empty response when creating a group');
                        Clientexceptionhelper.send_client_exception('W3E342 Empty response when creating a group');
                        deferred.reject('Empty response when creating a group');

                    }

                },
                function(err) {

                    // We may have a 406 response if the group has been created but held for moderation
                    // We need to catch this error so that the controller can notice the user
                    if (err.status == 406)

                        deferred.resolve('GROUP_HELD_FOR_MODERATION');

                    else {

                        console.error('W3E343 Group not created. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E343 Group not created. Reason: ' + err.status);
                        deferred.reject('Error when creating a group. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name update_group
         * @description This function calls the update method of the Group REST api to update a group
         * The node id of the group to update and the updated group title and description are required
         * to update a group
         * Only the group creator can update a group. Controllers have to make sure that the logged-in user is
         * actually the group creator
         * @methodOf Grouphelper.service:Grouphelper
         * @param {object} group Group as updated by the user and that we have to send to the REST api for it to
         * apply the changes to the same group as stored in the database
         * @returns {promise} The returned object is just a string. It's 'GROUP_UPDATED' if everything is OK.
         * It may be an error message if something went wrong.
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.update_group = function(group) {
            var deferred = $q.defer();

            console.debug('DBG-nbggh group to update');
            console.debug(group);

            var nid_of_group_to_update = parseInt(group.nid);

            if (nid_of_group_to_update == 0) {

                console.error('W3E344 The node id of the group to update cant be zero');
                Clientexceptionhelper.send_client_exception('W3E344 The node id of the group to update cant be zero');

                deferred.reject('W3E344 The node id of the group to update cant be zero');
                return deferred.promise;

            }

            Group.update({ nid: nid_of_group_to_update },
                         { title: group.title, description: group.description },
                function(response) {

                    // Everything fine, the update was successful

                    deferred.resolve('GROUP_UPDATED');

                },
                function(err) {

                    // We may have a 406 response if the group has been updated but held for moderation
                    // We need to catch this error so that the controller can notice the user
                    if (err.status == 406)
                        deferred.resolve('GROUP_HELD_FOR_MODERATION');
                    else {

                        console.error('W3E345 Group not updated. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E345 Group not updated. Reason: ' + err.status);
                        deferred.reject('W3E345 Group not updated. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name delete_group
         * @description This function calls the delete method of the Group REST api to delete a group
         * The group id of the group to delete is required
         * @methodOf Grouphelper.service:Grouphelper
         * @param {object} group the user wants deleted
         * @returns {promise} The returned object is just a string. It's 'Group successfully deleted' if everything
         * was fine. It may be an error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.delete_group = function(group) {
            var deferred = $q.defer();

            //console.debug('DBG-iuiui comment to delete');
            //console.debug(comment);

            var nid_of_group_to_delete = parseInt(group.nid);

            if (nid_of_group_to_delete == 0) {

                console.error('W3E346 The node id of the group to delete cant be zero');
                Clientexceptionhelper.send_client_exception('W3E346 The node id of the group to delete cant be zero');

                deferred.reject('W3E346 The node id of the group to delete cant be zero');
                return deferred.promise;

            }

            Group.delete({ nid: nid_of_group_to_delete },
                function(response) {

                    // Everything fine, the delete was successful

                    deferred.resolve('Group successfully deleted');

                },
                function(err) {

                    console.error('W3E347 Group not deleted. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E347 Group not deleted. Reason: ' + err.status);
                    deferred.reject('W3E347 Group not deleted. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Grouphelper.service:Grouphelper
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about groups we got when loading them.
 * It remembers if there are more pages of groups to load or not.
 * Only the Grouphelper service should use this service.
 */
var groupvalueServices = angular.module('groupvalueServices', [ ]);

groupvalueServices.value('Groupvalue', { more_pages_available: false });
