/**
 * @ngdoc overview
 * @name Comment
 * @description Standard resource that calls the `musth_restws_comment` rest api
 * @see musth_restws.comment.ctrl.inc
 */

var commentServices = angular.module('commentServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Comment.service:Comment
 * @description Query, create, update and delete are called for a comment, or many
 */
commentServices.factory('Comment', ['$resource',
    function($resource){

        return $resource('/musth_restws_comment', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Comment.service:Comment
             * @description Query method used to fetch all comments about a node whose id is given
             * @param {int} nid Id of the node we want comments about
             * @param {int} page Number of the page to fetch
             * @returns {object} comment(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_comment?nid=:nid&page=:page',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Comment.service:Comment
             * @description Create method used to create a comment
             * @param {object} Parameters The parameters used to create the comment are passed at call time
             * and are sent in the body of the POST message. They are the id of the node the comment is about (nid)
             * and the comment body (body)
             * @returns {int} Id of the new comment
             */
            create: { method: 'POST',
                      url: '/musth_restws_comment',
                      isArray: false,
                      withCredentials: false,
                      responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf Comment.service:Comment
             * @description Update method used to update a comment
             * @param {int} cid Id of the comment to update
             * @param {object} Parameters The parameters used to update the comment are passed at call time
             * and are sent in the body of the PUT message. It's possible to updated the body
             */
            update: { method: 'PUT',
                      // the comment id is got from the post message body (@cid)
                      url: '/musth_restws_comment/:cid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' }, // An update method return http status code only
            /**
             * @ngdoc method
             * @name delete
             * @methodOf Comment.service:Comment
             * @description Delete method used to delete a single comment
             * @param {int} cid Id of the comment to delete
             */
            delete: { method: 'DELETE',
                      url: '/musth_restws_comment/:cid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' } // A delete method returns http status code only
        });

    }]);
