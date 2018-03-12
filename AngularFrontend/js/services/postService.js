/**
 * @ngdoc overview
 * @name Post
 * @description Standard resource that calls the `musth_restws_post` rest api
 * @see musth_restws.post.ctrl.inc
 */

var postServices = angular.module('postServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Post.service:Post
 * @description Query, create, update and delete are called for a post, or many
 */
postServices.factory('Post', ['$resource',
    function($resource){

        return $resource('/musth_restws_post', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Post.service:Post
             * @description Query method used to fetch all posts belonging to a group whose id is given
             * Sorting by date of creation, newest first.
             * @param {int} gid Id of the group we want posts about
             * @todo add nid
             * @param {int} page Number of the page to fetch
             * @returns {object} post(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_post?nid=:nid&gid=:gid&page=:page',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Post.service:Post
             * @description Create method used to create a post
             * @param {object} Parameters The parameters used to create the post are passed at call time
             * and are sent in the body of the POST message. They are the gid of the group the post
             * will belong to (gid), the user id of the post author (uid) and the post body (body)
             * @returns {int} Id of the new post
             */
            create: { method: 'POST',
                      url: '/musth_restws_post',
                      isArray: false,
                      withCredentials: false,
                      responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf Post.service:Post
             * @description Update method used to update a post
             * @param {int} nid Id of the post to update
             * @param {object} Parameters The parameters used to update the post are passed at call time
             * and are sent in the body of the PUT message. Only the post body can be updated.
             */
            update: { method: 'PUT',
                      // the post id is got from the post message body (@nid)
                      url: '/musth_restws_post/:nid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' }, // An update method return http status code only
            /**
             * @ngdoc method
             * @name delete
             * @methodOf Post.service:Post
             * @description Delete method used to delete a single post
             * @param {int} nid Id of the post to delete
             */
            delete: { method: 'DELETE',
                      url: '/musth_restws_post/:nid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' } // A delete method returns http status code only
        });

    }]);
