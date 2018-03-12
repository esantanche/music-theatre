/**
 * @ngdoc overview
 * @name ReviewsFormCtrl
 * @description This is the controller associated to the review section in
 * frontends/angular/app/partials/video_and_audio_info_panel.html.
 * It's also associated to the reviews section in
 * frontends/angular/app/partials/userprofileview.html where all reviews the logged-in user
 * created are displayed
 *
 * Here you find the functions that the directive ngReview calls.
 *
 * What happens here?
 * * First time, the controller is initialised and the object $scope.reviewsforminfo is initialised as well.
 * It contains all variables we need in this controller and in the ngReview directive.
 * Actually some variables in $scope.reviewsforminfo are initialised
 * in the TagView controller.
 * * Reviews are loaded. Precisely only a page of reviews is loaded
 * * Reviews are saved, deleted, submitted and rated
 */

'use strict';

// @todo do you need $filter, $routeParams, $location?

/**
 * @ngdoc controller
 * @name ReviewsFormCtrl.controller:ReviewsFormCtrl
 * @description Controller for the review section in video_and_audio_info_panel.html
 */
angular.module('MusicTheatreApp.controllers').
    controller('ReviewsFormCtrl', ['$scope',
                                   'Reviewhelper',
                                   'Votehelper',
                                   'Clientexceptionhelper',
                                   'Dialoghelper',
                                   'Permalinkhelper',
                                   '$routeParams',
                                   '$location',
                                   '$filter',
                                   '$timeout',
                                   '$window',
        function ($scope,
                  Reviewhelper,
                  Votehelper,
                  Clientexceptionhelper,
                  Dialoghelper,
                  Permalinkhelper,
                  $routeParams,
                  $location,
                  $filter,
                  $timeout,
                  $window) {

            // @attention Now this controller is initialised only when the user clicks on the Review button
            // in the infopanel. It may now work if initialised earlier

            console.info('@ReviewsFormCtrl::controller_init');
            console.info('    $location.path: ' + $location.path());
            //console.debug('    (rvw-init) user.uid: ' + $scope.user.uid);
            //console.debug('    (rvw-init) reviewsforminfo.nid: ' + $scope.reviewsforminfo.nid);

            //console.debug($routeParams);

            // Let's restart from page 0 when this controller is initialised
            $scope.reviewsforminfo.page = 0;
            $scope.reviewsforminfo.more_pages_available = false;
            $scope.reviewsforminfo.single_review = {};
            $scope.reviewsforminfo.show_new_review_panel = false;
            $scope.reviewsforminfo.section_to_display_in_new_review_panel = 'guidelines';
            // newreview is used by the review field that is always in edit mode and that is used to create
            // new reviews
            // Our parent controller provides us with the node id of the programme the review will be about
            // It's in $scope.reviewsforminfo.nid
            // If, actually, our parent controller didn't provide $scope.reviewsforminfo.nid because this
            // controller initialised first, we will get $scope.reviewsforminfo.nid later
            // The same for $scope.user.uid
            $scope.reviewsforminfo.newreview = {
                id: 0,
                nid: $scope.reviewsforminfo.nid,
                uid: $scope.user.uid,
                name: '',
                title: '',
                body: '',
                status: 'draft'
            };

            //console.debug('DBG-juhy ReviewsFormCtrl $scope.reviewsforminfo');
            //console.debug($scope.reviewsforminfo);

            /**
             * @ngdoc method
             * @name load_reviews
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Loading reviews for the node whose node id is $scope.reviewsforminfo.nid
             * The Tag View controller sets $scope.reviewsforminfo.nid. The page to be loaded is specified
             * as parameter. Page length is set on the server.
             * This happens when displaying reviews in the infopanel.
             *
             * This are different when we display reviews in the user profile.
             *
             * In this case $scope.reviewsforminfo.showing_user_reviews is true and we use our local page
             * length instead of the server's default.
             *
             * @param {int} page Page to load
             */
            $scope.load_reviews = function (page, id_of_review_to_show) {

                console.debug('@ReviewsFormCtrl::load_reviews nid: ' + $scope.reviewsforminfo.nid +
                              ' page: ' + page + ' user: ' + $scope.user.uid);

                if ($scope.reviewsforminfo.showing_user_reviews && $scope.user.uid == 0) {
                    // We can't get the reviews belonging to a user if they are not logged in
                    // It shouldn't happen, so it's a bug

                    console.error('W3E263 User id is zero when displaying reviews on the user profile');
                    Clientexceptionhelper.send_client_exception('W3E263 User id is zero when displaying' +
                                                                ' reviews on the user profile');

                    return;
                }

                //console.debug('    (load_reviews) nid: ' + $scope.reviewsforminfo.nid);

                var nid_of_the_programme_to_ask_reviews_about;
                var user_we_want_all_reviews_of;
                var page_length;

                // If $scope.reviewsforminfo.showing_user_reviews is true, the user is logged in.
                // Why? Because we checked this just above

                if ($scope.reviewsforminfo.showing_user_reviews) {
                    // In this case we are in the user profile and want to show all reviews by
                    // the logged-in user

                    // Not interested, here, in a particular programme
                    nid_of_the_programme_to_ask_reviews_about = 0;

                    // This is the user whose reviews we want to display
                    user_we_want_all_reviews_of = $scope.user.uid;

                    // As page length we use the following
                    page_length = 10;

                } else {
                    // In this case we are in the info panel showing all published reviews for a programme

                    // @attention Now we have that $scope.reviewsforminfo.nid is always set because
                    // this ReviewsFormCtrl is initialised only when the user clicks on the Reviews
                    // button in the infopanel. We may want to change this

                    // We want all reviews for the programme whose nid is $scope.reviewsforminfo.nid
                    nid_of_the_programme_to_ask_reviews_about = $scope.reviewsforminfo.nid;

                    // We are displaying all reviews for a programme, whoever the author
                    user_we_want_all_reviews_of = 0;

                    // As page length we use the server's default
                    page_length = 0;

                }

                // If nid_of_the_programme_to_ask_reviews_about != 0,
                // we are getting the reviews for the programme of node id nid

                // If nid_of_the_programme_to_ask_reviews_about == 0,
                // we are getting the reviews for the logged in user

                Reviewhelper.load_reviews(user_we_want_all_reviews_of,
                                          nid_of_the_programme_to_ask_reviews_about,
                                          page,
                                          page_length).then(
                    function(reviews) {

                        $scope.reviewsforminfo.reviews = reviews;

                        // @todo what if there are no reviews? is this ok?
                        if (reviews.length == 0) return;

                        // @attention For now we show the first page of results only. We leave these
                        // statements about pagination because they may be useful later

                        $scope.reviewsforminfo.page = page;

                        $scope.reviewsforminfo.more_pages_available = Reviewhelper.more_pages_available();

                        //console.debug('    (load_reviews) before fetching vote user.uid: ' + $scope.user.uid);

                        //var vote_object;

                        var review_iter;

                        // Adding user profile permalink to reviews
                        // There are the links that will go to the profiles of the review's author
                        for (review_iter = 0;
                             review_iter < $scope.reviewsforminfo.reviews.length;
                             review_iter++) {

                            $scope.reviewsforminfo.reviews[review_iter].user_profile_permalink =
                                Permalinkhelper.make_user_profile_permalink($scope.reviewsforminfo.reviews[review_iter].uid,
                                                                            $scope.reviewsforminfo.reviews[review_iter].name);

                        }

                        // @attention Again we assume that this controller is initialised
                        // only when the user clicks on the Reviews button in the infopanel.
                        // So, $scope.user.uid is properly set

                        // Going to add votes to reviews. If the user is logged in, their votes should have been
                        // loaded. We get them and add them to the reviews
                        // We have to load votes for all reviews because, even if one review only is shown,
                        // the user may select another one
                        // If we are showing all reviews the logged-in user created because we are in the
                        // user view, we don't show votes
                        if ($scope.user.uid && !$scope.reviewsforminfo.showing_user_reviews) {

                            for (review_iter = 0;
                                 review_iter < $scope.reviewsforminfo.reviews.length;
                                 review_iter++) {

                                $scope.reviewsforminfo.reviews[review_iter].vote_user_gave_to_review =
                                    { value: 0,
                                      value_type: 'points' };

                                //console.debug('DBG-uh666 frontends/angular/app/js/controllers/ReviewsFormCtrl.js:205');

                                // This is the vote, if any, that the logged-in user gave
                                // to the current review, $scope.reviewsforminfo.reviews[review_iter]
                                var vote_object =
                                    Votehelper.vote_user_gave_to_node($scope.user.uid,
                                                                      $scope.reviewsforminfo.reviews[review_iter].id);

                                //console.debug('DBG-uh666 frontends/angular/app/js/controllers/ReviewsFormCtrl.js:205');
                                //console.debug(vote_object);

                                if (typeof(vote_object) != 'undefined')
                                    if (vote_object != null)
                                        $scope.reviewsforminfo.reviews[review_iter].vote_user_gave_to_review =
                                               { value: vote_object.value,
                                                 value_type: vote_object.value_type };

                            }

                        }

                        if (typeof id_of_review_to_show !== "undefined") {

                            $scope.change_single_review_to_show(id_of_review_to_show);

                        } else {

                            $scope.change_single_review_to_show();

                        }

                        var create_reviews_scrollbar = function () {

                            if (typeof $window.ssb != "undefined") {

                                $window.ssb.scrollbar('scrollable-reviews');
                                $window.ssb.refresh();

                            }

                            //console.debug('DBG-77777 Done! create_comments_scrollbar');

                        };

                        // @todo we should do this, don't we? $timeout(create_comments_scrollbar);
                        $timeout(create_reviews_scrollbar);

                        //console.debug('    (load_reviews) reviews after loading and processing');
                        //console.debug($scope.reviewsforminfo.reviews);

                    },
                    function(reason) {

                        console.error('W3E264 Reviews not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E264 Reviews not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name load_reviews @todo fixme
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description @todo doc Loading reviews for the node whose node id is $scope.reviewsforminfo.nid
             * The Tag View controller sets $scope.reviewsforminfo.nid. The page to be loaded is specified
             * as parameter. Page length is set on the server.
             * This happens when displaying reviews in the infopanel.
             *
             * This are different when we display reviews in the user profile.
             *
             * In this case $scope.reviewsforminfo.showing_user_reviews is true and we use our local page
             * length instead of the server's default.
             *
             * @param {int} id_of_review_to_show FIXME
             */
            $scope.change_single_review_to_show = function (id_of_review_to_show) {

                // It doesn't make sense to call this function if there are no reviews
                if ($scope.reviewsforminfo.reviews.length == 0) {

                    console.error('W3Exxxx263 chu3po4piigh9Vu Cannot change to single review if no reviews');
                    Clientexceptionhelper.send_client_exception('W3Exxxx263 chu3po4piigh9Vu Cannot change to single review if no reviews');

                    return;
                }

                $scope.reviewsforminfo.single_review = $scope.reviewsforminfo.reviews[0];

                if (typeof id_of_review_to_show !== "undefined") {

                    var array_of_reviews_that_have_the_given_id = $filter('filter')($scope.reviewsforminfo.reviews,
                        { id:id_of_review_to_show });

                    if (array_of_reviews_that_have_the_given_id.length != 0) {

                        $scope.reviewsforminfo.single_review = array_of_reviews_that_have_the_given_id[0];

                    }

                }

            };

            /**
             * @ngdoc method
             * @name save
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} review Review to save
             */
            $scope.save = function (review) {

                //console.debug('DBG-us7788ds save');
                //console.debug(review);

                // No html markup is rendered in reviews, so no sanitization is needed

                // Maybe the review we are about to save or update didn't get the proper
                // uid or nid because the this controller was initialised when uid and nid were
                // not available yet
                // Let's fix this:

                if (review.nid == 0)
                    review.nid = $scope.reviewsforminfo.nid;

                if (review.uid == 0)
                    review.uid = $scope.user.uid;

                // Are nid or uid still zero? Let's throw an exception

                if (review.nid == 0 || review.uid == 0) {
                    // Exception here because we can't update or create a review
                    // if the programme it is about is not defined or the author
                    // is anonymous

                    console.error('W3E272 Cant save a review with no uid or nid');
                    Clientexceptionhelper.send_client_exception('W3E272 Cant save a review with no uid or nid');
                    // @todo What do we say to the user?
                    Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                }

                if (review.id == 0) {

                    // In this case we have a brand new review to save

                    //console.debug('DBG-98r78 post this is a new comment');

                    Reviewhelper.create_review(review).then(
                        function(new_review_id) {

                            // We are not interested in the id of the newly created review

                            Dialoghelper.standard_dialog_for_message('REVIEW_SAVED');

                        },
                        function(reason) {

                            console.error('W3E265 Review not created. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E265 Review not created.' +
                                                                        ' Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                    // I clean the always-on-edit field where the user can create reviews.
                    // It has to be clean for the next review

                    $scope.reviewsforminfo.newreview = {
                        id: 0,
                        nid: $scope.reviewsforminfo.nid,
                        uid: $scope.user.uid,
                        name: '',
                        title: '',
                        body: '',
                        status: 'draft'
                    };

                } else {

                    // Here we update an existing review

                    Reviewhelper.update_review(review).then(
                        function(response) {

                            // Reloading reviews after the update
                            // The review we just updated will be in page zero because reviews are sorted by
                            // date and time of last change beginning with the most recent ones

                            $scope.load_reviews(0);

                        },
                        function(reason) {

                            console.error('W3E266 Review not updated. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E266 Review not updated. ' +
                                                                        'Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }

            };

            /**
             * @ngdoc method
             * @name submit
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to submit a review
             * This means that we call the method submit_review of the service Reviewhelper and it will
             * update the review by giving it submitted status.
             * The user won't be able to edit the review any more and editors will moderate it.
             * @param {object} review Review to submit
             */
            $scope.submit = function (review) {

                //console.debug('DBG-us7788ds submit');
                //console.debug(review);

                if (review.id == 0) {

                    console.error('W3E267 We cant submit review zero');
                    Clientexceptionhelper.send_client_exception('W3E267 We cant submit review zero');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_REVIEW_SUBMIT',
                    review.title).then(
                    function(value) {

                        //console.debug('submitting the review');

                        Reviewhelper.submit_review(review).then(
                            function(response) {

                                // Reloading reviews after the submission
                                // The review we just submitted will be in page zero because reviews are sorted by
                                // date and time of last change beginning with the most recent ones

                                $scope.load_reviews(0);

                            },
                            function(reason) {

                                console.error('W3E268 Review not submitted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E268 Review not submitted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                    },
                    function(value) {

                        //console.debug('not submitting the review');

                    }
                );

            };

            /**
             * @ngdoc method
             * @name rate
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to rate a review
             * This means that we call the method vote_a_node of the service Votehelper and it will
             * create a vote associated to the given review
             * @param {object} review Review that has been voted
             */
            $scope.rate = function (review) {

                //console.debug('DBG-rate89jd ReviewsFormCtrl rate');
                //console.debug(review);

                if (review.id == 0) {

                    // @todo exception handling

                    console.error('Bug here, There is a bug, it shouldnt be possible to rate a review with id=0');
                    Clientexceptionhelper.send_client_exception('Bug here, There is a bug, it shouldnt be ' +
                                                                'possible to rate a review with id=0');

                    return;
                }

                // Safety check: a user can't rate a review if they are the authors,
                // and the user should be logged in to rate
                // This is a bug because the thumbs-up/down buttons shouldn't work at all
                // if the user is the review author or if they are not logged in

                if (review.uid == $scope.user.uid || $scope.user.uid == 0) {

                    // @todo exception handling

                    console.error('Bug here, the rate function in ReviewsFormCtrl, ' +
                                  'the user is not logged in or owns the review they want to rate');
                    Clientexceptionhelper.send_client_exception('Bug here, the rate function in ReviewsFormCtrl, ' +
                           'the user is not logged in or owns the review they want to rate');

                    return;
                }

                // You can rate a review only by giving thumbs-up or thumbs-down

                if (review.vote_user_gave_to_review.value != -1 && review.vote_user_gave_to_review.value != 1) {

                    // @todo exception handling

                    console.error('Wrong value for vote');
                    Clientexceptionhelper.send_client_exception('Bug here, the rate function in ReviewsFormCtrl, ' +
                                       'wrong value for vote');

                    return;
                }

                // 'points' is the vote type for thumbs-up/thumbs-down votes

                if (review.vote_user_gave_to_review.value_type != 'points') {

                    // @todo exception handling

                    console.error('Wrong value type, it should be points');
                    Clientexceptionhelper.send_client_exception('Bug here, the rate function in ReviewsFormCtrl, ' +
                                          'wrong value type, it should be points');

                    return;
                }

                Votehelper.vote_a_node(review.id,
                                       $scope.user.uid,
                                       review.vote_user_gave_to_review.value_type,
                                       review.vote_user_gave_to_review.value).then(
                    function(response) {

                        //console.debug('DBG- ');

                        // Reloading the page to show the updated voting results
                        $scope.load_reviews($scope.reviewsforminfo.page, review.id);

                    },
                    function(reason) {

                        console.error('W3E269 Review vote not saved. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E269 Review vote not saved. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name delete
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to delete a review
             * This means that we call the method delete_review of the service Reviewhelper and it will
             * delete the given review
             * @param {object} review Review to delete
             */
            $scope.delete = function (review) {

                console.debug('@ReviewsFormCtrl.controller:ReviewsFormCtrl.delete');

                // We can't delete review zero, there is no such a thing and this is a bug

                if (review.id == 0) {

                    // @todo exception handling

                    console.error('id cant be zero when deleting a review');
                    Clientexceptionhelper.send_client_exception('id cant be zero when deleting a review');

                    return;
                }

                // A review should be in status 'draft' if we want to delete it
                // This is a bug because the delete button shouldn't even show up if the review has been
                // submitted or published

                if (review.status != 'draft') {

                    // @todo exception handling

                    console.error('bug here! it shouldnt be possible to delete a review that is not in draft status');
                    Clientexceptionhelper.send_client_exception('bug here. it shouldnt be possible to delete' +
                            ' a review that is not in draft status');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_REVIEW_DELETE',
                                                                     review.title).then(
                    function(value) {

                        console.debug('deleting the review');

                        Reviewhelper.delete_review(review).then(
                            function(response) {

                                console.debug('DBG-hy677 delete response: ' + response);

                                // We load page zero instead of the page where the deleted review was because
                                // now that page may be empty.
                                // Imagine that the deleted review was the only one left in its page.
                                // When we delete the review, the page is empty.
                                // So, we load page zero where there should be something. Maybe even page zero
                                // is empty but of course we can't do anything more in that case.

                                $scope.load_reviews(0);

                            },
                            function(reason) {

                                console.error('W3E270 Review not deleted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E270 Review not deleted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                    },
                    function(value) {

                        //console.debug('not deleting the review');

                    }
                );

            };



            /**
             * @ngdoc method
             * @name refresh_scrollbar
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function refreshes the scrollbar.
             *
             * @todo doc to fix
             *
             * Why do we have to refresh it?
             *
             * The info panel has three scrollbars. One for the summary, one for the tracks and one for the
             * sleeve notes.
             *
             * The three scrollbars are created by the script scrollbar/scrollbar.js when the page is loaded.
             * At that time not all scrollbars are visible. This means that the script can't calculate elements'
             * sizes correctly.
             *
             * When a scrollbar becomes visible we have to refresh it for the script to recalculate elements'
             * sizes correctly.
             *
             * This function is called in the partial partials/tagview.html.
             */
            $scope.refresh_scrollbar = function () {

                //console.debug('@SocialViewCtrl::refresh_scrollbar');

                // Why are we using $timeout?
                // If we call $window.ssb.refresh without using $timeout, it may be called
                // when the scrollbar is still invisible.
                // $timeout calls $window.ssb.refresh after the event that makes the scrollbar
                // visible has been processed.
                // Doing so we are sure that the scrollbar is visible

                if (typeof $window.ssb != "undefined")
                    $timeout($window.ssb.refresh);

            };

            // At initialisation time, we load reviews
            //$scope.load_reviews(0);

            $scope.load_reviews(0);

        }]);
