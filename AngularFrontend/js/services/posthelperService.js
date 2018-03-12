/**
 * @ngdoc overview
 * @name Posthelper
 * @description Service that helps with creating posts and with loading, updating and deleting them
 */

var posthelperServices = angular.module('posthelperServices', ['postServices']);

/**
 * @ngdoc service
 * @name Posthelper.service:Posthelper
 * @description Helper service for posts. Let's recall that posts don't support html for now
 * @requires Post.service:Post
 */
posthelperServices.service('Posthelper', [ '$q', 'Post', 'Postvalue', 'Clientexceptionhelper',
    function($q, Post, Postvalue, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_posts
         * @description This method loads the posts that have been created for a group
         * @methodOf Posthelper.service:Posthelper
         * @param {int} gid The id of the group whose posts we have to return
         * @param {int} page Number of page to return. Defaults to zero.
         * @returns {promise} The returned object is an array of post objects.
         * The method returns a promise, actually, whose payload will be that array.
         */
        this.load_posts = function(gid, page) {
            var deferred = $q.defer();

            // console.debug('DBG-7DERF load_comments nid: ' + nid + ' page: ' + page);

            if (typeof(page) === 'undefined') page = 0;

            if (!gid) {

                // gid can't be zero, it's a bug in the function that called this one

                console.error('W3E356 When loading posts we got zero as group id');
                Clientexceptionhelper.send_client_exception('W3E356 When loading posts we got zero as group id');

                deferred.reject('W3E356 When loading posts we got zero as group id');
                return deferred.promise;
            }

            // @attention Here we are assuming that, if gid != 0, it refers to an existing group
            // If the group of node id gid doesn't exist we show no posts but we don't
            // complain about the group not existing at all

            // We call the method 'query' of the service Post, which performs
            // the actual REST api call
            Post.query({ gid: gid, page: page },
                function(posts) {

                    if (posts) {

                        //console.debug('DBG-13131 load_posts posts not empty gid: ' + gid + ' page: ' + page);
                        //console.debug(posts);

                        // We are doing paging in this case and we want to know if the page we just loaded
                        // is the last one or not
                        Postvalue.more_pages_available = ! (typeof(posts.next) === 'undefined');

                        // If the posts response object is not empty, we return
                        // it as it is. Precisely we return the list of posts,
                        // which may be empty even if the posts object isn't
                        deferred.resolve(posts.list);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of posts in it, it would be something

                        console.error('W3E357 Empty response when fetching posts');
                        Clientexceptionhelper.send_client_exception('W3E357 Empty response when fetching posts');
                        deferred.reject('W3E357 Empty response when fetching posts');

                    }

                },
                function(err) {

                    // We have to transform a 404 error (nothing found) into a non-error response because
                    // the REST api calls the count method first and, if nothing is found it throws a 404
                    // instead of returning an empty list

                    if (err.status == 404) {

                        Postvalue.more_pages_available = false;
                        deferred.resolve([]);

                    } else {

                        Clientexceptionhelper.send_client_exception('W3E358 Posts not loaded. Reason: ' + err.status);
                        console.error('W3E358 Posts not loaded. Reason: ' + err.status);
                        deferred.reject('W3E358 Posts not loaded. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name load_post
         * @description @todo fix This method loads the posts that have been created for a group
         * @methodOf Posthelper.service:Posthelper
         * @param {int} gid The id of the group whose posts we have to return
         * @param {int} page Number of page to return. Defaults to zero.
         * @returns {promise} The returned object is an array of post objects.
         * The method returns a promise, actually, whose payload will be that array.
         */
        this.load_post = function(nid) {
            var deferred = $q.defer();

            // console.debug('DBG-7DERF load_comments nid: ' + nid + ' page: ' + page);

            if (!nid) {

                // nid can't be zero, it's a bug in the function that called this one

                console.error('W3Exxx356 When loading a post we got zero as node id');
                Clientexceptionhelper.send_client_exception('W3Exxx356 When loading a post we got zero as node id');

                deferred.reject('W3Exxx356 When loading a post we got zero as node id');
                return deferred.promise;
            }

            // @attention Here we are assuming that, if gid != 0, it refers to an existing group
            // If the group of node id gid doesn't exist we show no posts but we don't
            // complain about the group not existing at all

            // We call the method 'query' of the service Post, which performs
            // the actual REST api call
            Post.query({ nid: nid },
                function(posts) {

                    if (posts) {

                        //console.debug('DBG-13131 load_posts posts not empty gid: ' + gid + ' page: ' + page);
                        //console.debug(posts);

                        // We are doing paging in this case and we want to know if the page we just loaded
                        // is the last one or not
                        Postvalue.more_pages_available = false;

                        // If the posts response object is not empty, we return
                        // it as it is. Precisely we return the list of posts,
                        // which may be empty even if the posts object isn't
                        deferred.resolve(posts.list[0]);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of posts in it, it would be something

                        // @todo fix here

                        console.error('W3Exxx357 Empty response when fetching a post');
                        Clientexceptionhelper.send_client_exception('W3Exxx357 Empty response when fetching a post');
                        deferred.reject('W3Exxx357 Empty response when fetching a post');

                    }

                },
                function(err) {

                    // We have to transform a 404 error (nothing found) into a non-error response because
                    // the REST api calls the count method first and, if nothing is found it throws a 404
                    // instead of returning an empty list

                    // @todo fix here

                    Clientexceptionhelper.send_client_exception('W3Exxx358 Post not loaded. Reason: ' + err.status);
                    console.error('W3Exxx358 Post not loaded. Reason: ' + err.status);
                    deferred.reject('W3Exxx358 Post not loaded. Status code: ' + err.status);

                    //if (err.status == 404) {
                    //
                    //    Postvalue.more_pages_available = false;
                    //    deferred.resolve([]);
                    //
                    //} else {
                    //
                    //    Clientexceptionhelper.send_client_exception('W3E358 Posts not loaded. Reason: ' + err.status);
                    //    console.error('W3E358 Posts not loaded. Reason: ' + err.status);
                    //    deferred.reject('W3E358 Posts not loaded. Status code: ' + err.status);
                    //
                    //}

                }
            );

            return deferred.promise;
        };



        /**
         * @ngdoc method
         * @name more_pages_available
         * @description Function that tells if there are more pages to load when loading posts
         * This information is acquired when a page of posts is loaded by calling the method load_posts
         * If a controller calls this method before calling the method load_posts, it gets a 'false', which is
         * the starting value. So, it makes no sense to call this method before calling load_posts
         * @methodOf Posthelper.service:Posthelper
         * @returns {bool} True if there are more pages to load
         */
        this.more_pages_available = function() {

            return Postvalue.more_pages_available;
        };

        /**
         * @ngdoc method
         * @name create_post
         * @description This function calls the create method of the Post REST api to create a post
         * The node id of the group the post is about and the post body are required to create a post.
         * The uid of the post author has to be explicitly specified as well.
         * @methodOf Posthelper.service:Posthelper
         * @param {object} post Post entered by the user and that we have to send to the REST api for it to
         * store the post in the database
         * @returns {promise} The returned object is an object that contains the id of the newly created post.
         * The method returns a promise, actually, whose payload will be that object.
         */
        this.create_post = function (post) {
            var deferred = $q.defer();

            // @attention We are not checking permissions here
            // The REST api will do it and we suppose that the controllers using this method
            // did their homework and made sure that the user has the needed permissions

            // The permissions needed to create a post are:
            // 1) the user has to be logged in
            // 2) the logged-in user has to be member of the group (of group id gid)

            // gid (node id of the group the post is about)
            // uid (user id of the post author)
            // body (the body of the post as plain text, no html is recognized)

            Post.create({gid: post.gid, uid: post.uid, body: post.body},
                function (post_creation_object) {

                    if (post_creation_object) {

                        //console.debug('DBG-hujhujhuj post_creation_object.id ' + post_creation_object.id);

                        // Returning the id of the new post
                        deferred.resolve(post_creation_object.id);

                    } else {

                        console.error('W3E359 Empty response when creating a post');
                        Clientexceptionhelper.send_client_exception('W3E359 Empty response when creating a post');
                        deferred.reject('Empty response when creating a post');

                    }

                },
                function (err) {

                    // We may have a 406 response if the post has been created but held for moderation
                    // We need to catch this error so that the controller can notify the user
                    if (err.status == 406)
                        deferred.resolve('POST_HELD_FOR_MODERATION');
                    else {

                        console.error('W3E360 Post not created. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E360 Post not created. Reason: ' + err.status);
                        deferred.reject('Error when creating a post. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name update_post
         * @description This function calls the update method of the Post REST api to update a post
         * The post id of the post to update and the updated post body are required to update a post.
         * If a post is found spammy, it is held for moderation.
         * @methodOf Posthelper.service:Posthelper
         * @param {object} post Post updated by the user and that we have to send to the REST api for it to
         * apply the changes to the same post as stored in the database
         * @returns {promise} The returned object is just a string. It's 'POST_UPDATED' if everything is OK or
         * 'POST_HELD_FOR_MODERATION' if the post has been created but held for moderation. It may be an
         * error message if something went wrong.
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.update_post = function(post) {
            var deferred = $q.defer();

            // @attention We are not checking permissions here
            // The REST api will do it and we suppose that the controllers using this method
            // did their homework and made sure that the user has the needed permissions

            // The permissions needed to update a post are:
            // 1) the user has to be logged in
            // 2) the logged-in user is the author of the post or they are admins or moderators
            //    of the group the post belongs to

            // If an admin or a moderator updates a post, they don't become authors of it

            //console.debug('DBG-76fsef5 comment to update');
            //console.debug(comment);

            var nid_of_post_to_update = parseInt(post.nid);

            if (nid_of_post_to_update == 0) {

                console.error('W3E361 The node id of the post to update cant be zero');
                Clientexceptionhelper.send_client_exception('W3E361 The node id of the post to update cant be zero');

                deferred.reject('W3E361 The node id of the post to update cant be zero');
                return deferred.promise;

            }

            Post.update({ nid: nid_of_post_to_update },
                        { body: post.body },
                function(response) {

                    // Everything fine, the update was successful

                    deferred.resolve('POST_UPDATED');

                },
                function(err) {

                    // We may have a 406 response if the post has been updated but held for moderation
                    // We need to catch this error so that the controller can notice the user
                    if (err.status == 406)
                        deferred.resolve('POST_HELD_FOR_MODERATION');
                    else {

                        console.error('W3E362 Post not updated. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E362 Post not updated. Reason: ' + err.status);
                        deferred.reject('W3E362 Post not updated. Status code: ' + err.status);

                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name delete_post
         * @description This function calls the delete method of the Post REST api to delete a post
         * The post id of the post to delete is required to delete it
         * @methodOf Posthelper.service:Posthelper
         * @param {object} post the user wants deleted
         * @returns {promise} The returned object is just a string. It's 'Post successfully deleted' if everything
         * was fine. It may be an error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.delete_post = function(post) {
            var deferred = $q.defer();

            //console.debug('DBG-iuiui comment to delete');
            //console.debug(comment);

            var nid_of_post_to_delete = parseInt(post.nid);

            if (nid_of_post_to_delete == 0) {

                console.error('W3E363 The post id of the post to delete cant be zero');
                Clientexceptionhelper.send_client_exception('W3E363 The post id of the post to delete cant be zero');

                deferred.reject('W3E363 The post id of the post to delete cant be zero');
                return deferred.promise;

            }

            Post.delete({ nid: nid_of_post_to_delete },
                function(response) {

                    // Everything fine, the delete was successful

                    deferred.resolve('Post successfully deleted');

                },
                function(err) {

                    console.error('W3E364 Post not deleted. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E364 Post not deleted. Reason: ' + err.status);
                    deferred.reject('W3E364 Post not deleted. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Posthelper.service:Postvalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about posts we got when loading them.
 * It remembers if there are more pages of posts to load or not.
 * Only the Posthelper service should use this service.
 */
var postvalueServices = angular.module('postvalueServices', [ ]);

postvalueServices.value('Postvalue', { more_pages_available: false });
