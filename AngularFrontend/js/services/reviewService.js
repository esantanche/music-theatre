/**
 * @ngdoc overview
 * @name Review
 * @description Standard resource that calls the `musth_restws_review` rest api
 * @see musth_restws.review.ctrl.inc
 */

var reviewServices = angular.module('reviewServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Review.service:Review
 * @description Query, create, update and delete are called for a review, or many
 */
reviewServices.factory('Review', ['$resource',
    function($resource){

        return $resource('/musth_restws_review', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Review.service:Review
             * @description Query method used to fetch all reviews about a given programme
             * The programme node id is required
             * @param {int} nid Id of the programme we want reviews about
             * @param {int} page Page number used to retrieve different pages of the result
             * @returns {object} review(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_review?nid=:nid&page=:page',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Review.service:Review
             * @description Create method used to create a single review
             * @param {object} Parameters The parameters used to create the review are passed at call time
             * and are sent in the body of the POST message.
             *
             * They are:
             *
             * * uid: review author
             * * nid: programme the review is about
             * * title: review title
             * * body: review body
             *
             * @returns {int} Id of the new review
             */
            create: { method: 'POST',
                      url: '/musth_restws_review',
                      isArray: false,
                      withCredentials: false,
                      responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf Review.service:Review
             * @description Used to update a review's title and body or to submit it
             * @param {int} id Id of the review to update
             * @param {object} Parameters The parameters used to update the review are passed at call time
             * and are sent in the body of the PUT message
             *
             * They are:
             *
             * * title: updated title
             * * body: updated body
             *
             * when updating title and body, and:
             *
             * * status: 'submitted'
             *
             * when submitting the review
             */
            update: { method: 'PUT',
                      // the review id is got from the post message body (@id)
                      url: '/musth_restws_review/:id',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' }, // the update method return http status code only
            /**
             * @ngdoc method
             * @name delete
             * @methodOf Review.service:Review
             * @description Delete method used to delete a single review
             * @param {int} id Id of the review to delete
             */
            delete: { method: 'DELETE',
                      url: '/musth_restws_review/:id',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' } // the delete method returns http status code only
        });

    }]);
