/**
 * @ngdoc overview
 * @name Reviewhelper
 * @description Service that helps with creating reviews and with loading, updating, submitting
 * and deleting them.
 * Let's remember that a review is created as 'draft' and can be viewed and edited by its author only.
 * The the author submits it and they can't edit it any more. Editors, on the server side, will moderate
 * the review and publish it (or ask the author to make changes)
 */

var reviewhelperServices = angular.module('reviewhelperServices', ['reviewServices']);

/**
 * @ngdoc service
 * @name Reviewhelper.service:Reviewhelper
 * @description Helper service for reviews
 * @requires Review.service:Review
 *
 */
reviewhelperServices.service('Reviewhelper', [ '$q', 'Review', 'Reviewvalue', 'Clientexceptionhelper',
    function($q, Review, Reviewvalue, Clientexceptionhelper) {

        //console.debug('DBG-9N9N lineitemhelperServices');

        /**
         * @ngdoc method
         * @name load_reviews
         * @description This method loads all reviews associated to a programme or those created by a given
         * user. In the case of reviews created by a user, the same user has to be logged in otherwise an
         * exception is thrown.
         * When we fetch all review for a programme, only the published ones will be returned. When we do the same
         * for the reviews created by an user, all of them will be returned: drafts, submitted and published.
         * The reviews for a programme will be sorted by date and time of last change beginning with the most recent.
         * The ones created by an user will be sorted by status. First the drafts, than the submitted, then the
         * published. They will be additionally sorted by date and time of last change.
         * @methodOf Reviewhelper.service:Reviewhelper
         * @param {int} uid User id of the review author
         * @param {int} nid The id of the node (programme) whose reviews we have to return
         * @param {int} page Number of page to return. Defaults to zero.
         * @param {int} limit Page length
         * @returns {promise} The returned object is an array of review objects.
         * The method returns a promise, actually, whose payload will be that array.
         */
        this.load_reviews = function(uid, nid, page, limit) {
            var deferred = $q.defer();

            //console.debug('DBG-ju677s load_reviews nid: ' + nid + ' page: ' + page);

            if (typeof(page) === 'undefined') page = 0;

            // If limit is undefined because not explicitly given, the server will use
            // a default

            // We call the method 'query' of the service Review, which performs
            // the actual REST api call
            Review.query({ uid: uid, nid: nid, page: page, limit: limit },
                function(reviews) {

                    if (reviews) {

                        //console.debug('DBG-  not empty nid: ' + nid + ' page: ' + page);
                        //console.debug();

                        // We are doing paging in this case and we want to know if the page we just loaded
                        // is the last one or not
                        Reviewvalue.more_pages_available = ! (typeof(reviews.next) === 'undefined');

                        // If the reviews response object is not empty, we return
                        // it as it is. Precisely we return the list of reviews,
                        // which may be empty
                        deferred.resolve(reviews.list);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of reviews in it, it would be something

                        console.error('W3E239 Empty response when fetching reviews');
                        Clientexceptionhelper.send_client_exception('W3E239 Empty response when fetching reviews');
                        deferred.reject('W3E239 Empty response when fetching reviews');
                    }

                },
                function(err) {

                    // We have to transform a 404 error (nothing found) into a non-error response because
                    // the REST api calls the count method first and, if nothing is found it throws a 404
                    // instead of returning an empty list

                    if (err.status == 404) {
                        Reviewvalue.more_pages_available = false;
                        deferred.resolve([]);
                    } else {
                        Clientexceptionhelper.send_client_exception('W3E238 Reviews not loaded. Reason: ' + err.status);
                        console.error('W3E238 Reviews not loaded. Reason: ' + err.status);
                        deferred.reject('W3E238 Reviews not loaded. Status code: ' + err.status);
                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name more_pages_available
         * @description Function that tells if there are more pages to load when loading reviews
         * This information is acquired when a page of reviews is loaded by calling the method load_reviews
         * If a controller calls this method before calling the method load_reviews, it gets a 'false', which is
         * the starting value. So, it makes no sense to call this method before calling load_reviews
         * @methodOf Commenthelper.service:Commenthelper
         * @returns {bool} True if there are more pages to load
         */
        this.more_pages_available = function() {

            return Reviewvalue.more_pages_available;
        };

        /**
         * @ngdoc method
         * @name create_review
         * @description This function calls the create method of the Review REST api to create a review
         *
         * We have to send:
         *
         * * uid: id of the author
         * * nid: id of the programme the review is about
         * * title: review title
         * * body: review body
         *
         * The review author has to be logged in otherwise we get an exception
         *
         * @methodOf Reviewhelper.service:Reviewhelper
         * @param {object} review Review as entered by the user
         * @returns {promise} The returned object is the id of the new review
         * The method returns a promise, actually, whose payload will be that id.
         */
        this.create_review = function(review) {
            var deferred = $q.defer();

            console.debug('DBG-u8u8 create_review reviewhelperService.js');
            console.debug(review);

            Review.create({ uid: review.uid, nid: review.nid, title: review.title, body: review.body },
                function(review_creation_object) {

                    if (review_creation_object) {

                        //console.debug('DBG-3877rfg76 review_creation_object.id ' + review_creation_object.id);

                        // Returning the id of the new comment
                        deferred.resolve(review_creation_object.id);

                    } else {

                        console.error('W3E240 Empty response when creating a review');
                        Clientexceptionhelper.send_client_exception('W3E240 Empty response when creating a review');
                        deferred.reject('W3E240 Empty response when creating a review');

                    }

                },
                function(err) {

                    console.error('W3E241 Reviews not created. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E241 Reviews not created. Reason: ' + err.status);
                    deferred.reject('W3E241 Reviews not created. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name update_review
         * @description This function calls the update method of the Review REST api to update a review
         *
         * We have to send:
         *
         * * title: updated review title
         * * body: updated review body
         *
         * The review author has to be logged in otherwise we get an exception. We don't send the uid of the
         * author because the review has already been created and has an author
         *
         * Let's remember that reviews are plain text for now, no html markup is allowed
         *
         * @methodOf Reviewhelper.service:Reviewhelper
         * @param {object} review Review as updated by the user
         * @returns {promise} The returned object is the string 'REVIEW_UPDATED' on success, or an
         * error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.update_review = function(review) {
            var deferred = $q.defer();

            //console.debug('DBG-76fsef5 comment to update');
            //console.debug(comment);

            var id_of_review_to_update = parseInt(review.id);

            if (id_of_review_to_update == 0) {

                console.error('W3E242 The review id of the review to update cant be zero');
                Clientexceptionhelper.send_client_exception('W3E242 The review id of the review to update cant be zero');

                deferred.reject('W3E242 The review id of the review to update cant be zero');
                return deferred.promise;

            }

            Review.update({ id: id_of_review_to_update },
                          { title: review.title, body: review.body },
                function(response) {

                    // Everything fine, the update was successful

                    deferred.resolve('REVIEW_UPDATED');

                },
                function(err) {

                    console.error('W3E243 Review not updated. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E243 Review not updated. Reason: ' + err.status);
                    deferred.reject('W3E243 Review not updated. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name submit_review
         * @description This function calls the update method of the Review REST api to submit a review
         *
         * We have to send status == 'submitted' and the review will be marked as submitted.
         *
         * The author won't be able to change the review any more. Editors will check it and decide if to
         * publish it or not. They may want to mark the review as not submitted again and ask the author
         * to make changes
         *
         * The review author has to be logged in otherwise we get an exception. We don't send the uid of the
         * author because the review has already been created and has an author
         *
         * @methodOf Reviewhelper.service:Reviewhelper
         * @param {object} review Review as updated (submitted) by the user
         * @returns {promise} The returned object is the string 'REVIEW_SUBMITTED' on success, or an
         * error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.submit_review = function(review) {
            var deferred = $q.defer();

            //console.debug('DBG-76fsef5 comment to update');
            //console.debug(comment);

            var id_of_review_to_update = parseInt(review.id);

            if (id_of_review_to_update == 0) {

                console.error('W3E242 The review id of the review to update cant be zero (actually submitting here)');
                Clientexceptionhelper.send_client_exception('W3E242 The review id of the review to update cant be zero (actually submitting here)');

                deferred.reject('W3E242 The review id of the review to update cant be zero (actually submitting here)');
                return deferred.promise;

            }

            Review.update({ id: id_of_review_to_update },
                { status: 'submitted' },
                function(response) {

                    // Everything fine, the update was successful

                    deferred.resolve('REVIEW_SUBMITTED');

                },
                function(err) {

                    console.error('W3E244 Review not submitted. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E244 Review not submitted. Reason: ' + err.status);
                    deferred.reject('W3E244 Review not submitted. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name delete_review
         * @description This function calls the delete method of the Review REST api to delete a review
         *
         * The review author has to be logged in otherwise we get an exception. We don't send the uid of the
         * author because the review has already been created and has an author
         *
         * @methodOf Reviewhelper.service:Reviewhelper
         * @param {object} review Review to delete
         * @returns {promise} The returned object is the string 'Review successfully deleted' on success, or an
         * error message if something went wrong
         * The method returns a promise, actually, whose payload will be that string.
         */
        this.delete_review = function(review) {
            var deferred = $q.defer();

            //console.debug('DBG-7tt555 review to delete');
            //console.debug(review);

            // @attention We are not checking that the review is neither submitted nor published
            // The rest api will do this check and throw an exception. We may want to do the check
            // here before even calling the rest api

            var id_of_review_to_delete = parseInt(review.id);

            if (id_of_review_to_delete == 0) {

                console.error('W3E245 The review id of the review to delete cant be zero');
                Clientexceptionhelper.send_client_exception('W3E245 The review id of the review to delete cant be zero');

                deferred.reject('W3E245 The review id of the review to delete cant be zero');
                return deferred.promise;

            }

            Review.delete({ id: id_of_review_to_delete },
                function(response) {

                    // Everything fine, the delete was successful

                    deferred.resolve('Review successfully deleted');

                },
                function(err) {

                    console.error('W3E246 Review not deleted. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E246 Review not deleted. Reason: ' + err.status);
                    deferred.reject('W3E246 Review not deleted. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name Reviewhelper.service:Reviewvalue
 *
 * @description This is an Angular value service. It's similar to a cache.
 *
 * It stores the information about reviews we got when loading reviews.
 * It remembers if there are more pages of reviews to load or not.
 * Only the Reviewhelper service should use this service.
 */
var reviewvalueServices = angular.module('reviewvalueServices', [ ]);

reviewvalueServices.value('Reviewvalue', { more_pages_available: false });
