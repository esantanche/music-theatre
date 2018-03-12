/**
 * @ngdoc overview
 * @name Commenthelper
 * @description Service that helps with creating comments and with loading, updating and deleting them
 */

var commenthelperServices = angular.module('commenthelperServices', ['commentServices']);

/**
 * @ngdoc service
 * @name Commenthelper.service:Commenthelper
 * @description Helper service for comments. Let's recall that comments don't support html for now
 * @requires Comment.service:Comment
 */
commenthelperServices.service('Commenthelper', [ '$q', 'Comment', 'Commentvalue', 'Clientexceptionhelper',
    function($q, Comment, Commentvalue, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_comments
         * @description This method loads the comments that have been created about a node
         * @methodOf Commenthelper.service:Commenthelper
         * @param {int} nid The id of the node whose comments we have to return
         * @param {int} page Number of page to return. Defaults to zero.
         * @returns {promise} The returned object is an array of comment objects.
         * The method returns a promise, actually, whose payload will be that list.
         */
        this.load_comments = function(nid, page) {
            var deferred = $q.defer();

            // console.debug('DBG-7DERF load_comments nid: ' + nid + ' page: ' + page);

            if (typeof(page) === 'undefined') page = 0;

            if (!nid) {
                // nid can't be zero, it's a bug in the function calling this one

                console.error('W3E228 When loading comments we got zero as node id');
                Clientexceptionhelper.send_client_exception('W3E228 When loading comments we got zero as node id');

                deferred.reject('W3E228 When loading comments we got zero as node id');
                return deferred.promise;
            }

            // @attention Here we are assuming that, if nid != 0, it refers to an existing node
            // If the node of node id nid doesn't exist, we show no comments but we don't
            // complain about it not existing at all

            // We call the method 'query' of the service Comment, which performs
            // the actual REST api call
            Comment.query({ nid: nid, page: page },
                function(comments) {

                    if (comments) {

                        //console.debug('DBG-97H1 load_comments comments not empty nid: ' + nid + ' page: ' + page);
                        //console.debug(comments);

                        // We are doing paging in this case and we want to know if the page we just loaded
                        // is the last one or not
                        Commentvalue.more_pages_available = ! (typeof(comments.next) === 'undefined');

                        // If the comments response object is not empty, we return
                        // it as it is. Precisely we return the list of comments,
                        // which may be empty even if the comments object isn't
                        deferred.resolve(comments.list);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of comments in it, it would be something

                        console.error('W3E229 Empty response when fetching comments');
                        Clientexceptionhelper.send_client_exception('W3E229 Empty response when fetching comments');
                        deferred.reject('W3E229 Empty response when fetching comments');
                    }

                },
                function(err) {

                    // We have to transform a 404 error (nothing found) into a non-error response because
                    // the REST api calls the count method first and, if nothing is found it throws a 404
                    // instead of returning an empty list

                    if (err.status == 404) {

                        Commentvalue.more_pages_available = false;
                        deferred.resolve([]);

                    } else {

                        Clientexceptionhelper.send_client_exception('W3E230 Comments not loaded. Reason: ' + err.status);
                        console.error('W3E230 Comments not loaded. Reason: ' + err.status);
                        deferred.reject('W3E230 Comments not loaded. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name more_pages_available
         * @description Function that tells if there are more pages to load when loading comments
         * This information is acquired when a page of comments is loaded by calling the method load_comments
         * If a controller calls this method before calling the method load_comments, it gets a 'false', which is
         * the starting value. So, it makes no sense to call this method before calling load_comments
         * @methodOf Commenthelper.service:Commenthelper
         * @returns {bool} True if there are more pages to load
         */
        this.more_pages_available = function() {

            return Commentvalue.more_pages_available;
        };

        /**
         * @ngdoc method
         * @name create_comment
         * @description This function calls the create method of the Comment REST api to create a comment
         * The node id of the node the comment is about and the comment body are required to create a comment
         * If the node the comment is about is a post, the logged-in user has to be member of the group
         * the post belongs to. We don't check this permission here.
         * @methodOf Commenthelper.service:Commenthelper
         * @param {object} comment entered by the user and that we have to send to the REST api for it to
         * store the comment in the database
         * @returns {promise} The returned object is an object that contains the id of the newly created comment.
         * The method returns a promise, actually, whose payload will be that object.
         */
        this.create_comment = function(comment) {
            var deferred = $q.defer();

            // If the node the comment is about is a post, the logged-in user has to be member of the group
            // the post belongs to. We don't check this permission here.
            // The controller calling this function has to make sure that the logged-in user has the
            // required permissions.

            Comment.create({ nid: comment.nid, body: comment.body },
                function(comment_creation_object) {

                    if (comment_creation_object) {

                        //console.debug('DBG-3877rfg76 comment_creation_object.id ' + comment_creation_object.id);

                        // Returning the id of the new comment
                        deferred.resolve(comment_creation_object.id);

                    } else {

                        console.error('W3E231 Empty response when creating a comment');
                        Clientexceptionhelper.send_client_exception('W3E231 Empty response when creating a comment');
                        deferred.reject('Empty response when creating a comment');

                    }

                },
                function(err) {

                    // We may have a 406 response if the comment has been created but held for moderation
                    // We need to catch this error so that the controller can notice the user
                    if (err.status == 406)
                        deferred.resolve('COMMENT_HELD_FOR_MODERATION');
                    else {

                        console.error('W3E232 Comment not created. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E232 Comment not created. Reason: ' + err.status);
                        deferred.reject('Error when creating a comment. Status code: ' + err.status);
                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name update_comment
         * @description This function calls the update method of the Comment REST api to update a comment
         * The comment id of the comment to update and the updated comment body are required to update a comment.
         * The comment author can update it. Admins and moderators of the group the comments belongs to can
         * update it too. This, of course, if the comment belongs to a group.
         * These permissions are not checked here. The calling controller has to care about them.
         * @methodOf Commenthelper.service:Commenthelper
         * @param {object} comment updated by the user and that we have to send to the REST api for it to
         * apply the changes to the same comment as stored in the database
         * @returns {promise} The returned object is just a string. It's 'COMMENT_UPDATED' if everything is OK or
         * 'COMMENT_HELD_FOR_MODERATION' if the comment has been created but held for moderation. It may be an
         * error message if something went wrong.
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.update_comment = function(comment) {
            var deferred = $q.defer();

            //console.debug('DBG-76fsef5 comment to update');
            //console.debug(comment);

            var cid_of_comment_to_update = parseInt(comment.cid);

            if (cid_of_comment_to_update == 0) {

                console.error('W3E233 The comment id of the comment to update cant be zero');
                Clientexceptionhelper.send_client_exception('W3E233 The comment id of the comment to update cant be zero');

                deferred.reject('W3E233 The comment id of the comment to update cant be zero');
                return deferred.promise;

            }

            Comment.update({ cid: cid_of_comment_to_update },
                           { body: comment.body },
                function(response) {

                    // Everything fine, the update was successful

                    deferred.resolve('COMMENT_UPDATED');

                },
                function(err) {

                    // We may have a 406 response if the comment has been updated but held for moderation
                    // We need to catch this error so that the controller can notice the user
                    if (err.status == 406)
                        deferred.resolve('COMMENT_HELD_FOR_MODERATION');
                    else {

                        console.error('W3E234 Comment not updated. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E234 Comment not updated. Reason: ' + err.status);
                        deferred.reject('W3E234 Comment not updated. Status code: ' + err.status);
                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name delete_comment
         * @description This function calls the delete method of the Comment REST api to delete a comment
         * The comment id of the comment to delete is required to delete a comment.
         * The comment author can delete it. Admins and moderators of the group the comments belongs to can
         * delete it too. This, of course, if the comment belongs to a group.
         * These permissions are not checked here. The calling controller has to care about them.
         * @methodOf Commenthelper.service:Commenthelper
         * @param {object} comment the user wants deleted
         * @returns {promise} The returned object is just a string. It's 'Comment successfully deleted' if everything
         * was fine. It may be an error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.delete_comment = function(comment) {
            var deferred = $q.defer();

            //console.debug('DBG-iuiui comment to delete');
            //console.debug(comment);

            var cid_of_comment_to_delete = parseInt(comment.cid);

            if (cid_of_comment_to_delete == 0) {

                console.error('W3E235 The comment id of the comment to delete cant be zero');
                Clientexceptionhelper.send_client_exception('W3E235 The comment id of the comment to delete cant be zero');

                deferred.reject('W3E235 The comment id of the comment to delete cant be zero');
                return deferred.promise;

            }

            Comment.delete({ cid: cid_of_comment_to_delete },
                function(response) {

                    // Everything fine, the delete was successful

                    deferred.resolve('Comment successfully deleted');

                },
                function(err) {

                    console.error('W3E236 Comment not deleted. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E236 Comment not deleted. Reason: ' + err.status);
                    deferred.reject('W3E236 Comment not deleted. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Commenthelper.service:Commentvalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about comments we got when loading comments.
 * It remembers if there are more pages of comments to load or not.
 * Only the Commenthelper service should use this service.
 */
var commentvalueServices = angular.module('commentvalueServices', [ ]);

commentvalueServices.value('Commentvalue', { more_pages_available: false });
