/**
 * @ngdoc overview
 * @name CommentsFormCtrl
 * @description This is the controller associated to the comment section in
 * video_and_audio_info_panel.html
 *
 * It's not used in the social view.
 *
 * Here you find the functions that the directive ngPost calls, at least in the infopanel.
 *
 * Many things happen here:
 *
 * * First, the $scope.commentsforminfo object is initialised. It contains all variables we need in this controller
 * and in the ngPost directive. Actually some variables in $scope.commentsforminfo are initialised
 * in the TagView controller.
 * * The refresh system for comments is defined and started. It's started when the controller is initialised
 * * Comments are loaded. Precisely only a page of comments is loaded
 * * Comments are posted, deleted, marked as abusive and replied to
 */

'use strict';

/**
 * @ngdoc controller
 * @name CommentsFormCtrl.controller:CommentsFormCtrl
 * @description Controller for the comment section in video_and_audio_info_panel.html
 */
angular.module('MusicTheatreApp.controllers').
    controller('CommentsFormCtrl', ['$scope',
                                    'Commenthelper',
                                    'Flagginghelper',
                                    'Settings',
                                    'Dialoghelper',
                                    'Permalinkhelper',
                                    'Clientexceptionhelper',
                                    '$interval',
                                    '$window', // Used to do downloads, refresh scrollbars, do redirects
                                    '$timeout',
        function ($scope,
                  Commenthelper,
                  Flagginghelper,
                  Settings,
                  Dialoghelper,
                  Permalinkhelper,
                  Clientexceptionhelper,
                  $interval,
                  $window,
                  $timeout) {

            // This controller is initialised every time the user clicks on "Comments" because the
            // comments' section is rebuilt every time. It's because we use ng-if to remove/recreate
            // the section.

            console.debug('@CommentsFormCtrl initialisation');

            // Let's restart from page 0 when this controller is initialised
            $scope.commentsforminfo.page = 0;
            $scope.commentsforminfo.more_pages_available = false;
            // Comment fields get focused when changed to edit mode (most of the times)
            $scope.commentsforminfo.movefocustopostfield = false;
            // We have to suspend comments refreshing if the user is editing otherwise the comment they are editing
            // would exit edit mode
            $scope.commentsforminfo.suspend_refresh = false;
            $scope.commentsforminfo.comments = [];
            // newcomment is used by the comment field that is always in edit mode and that is used to create
            // new comments
            $scope.commentsforminfo.newcomment = {
                body: '',
                cid: 0,
                name: '',
                nid: $scope.commentsforminfo.nid, // The Tag View controller sets the node id of the programme
                subject: '',
                uid: $scope.user.uid
            };

            //console.debug('DBG-6stf CommentsFormCtrl nid: ' + $scope.commentsforminfo.nid);

            // $scope.commentsforminfo.suspend_refresh is set to true by the directive
            // ngPost when the user clicks on 'Edit' and reset to false when the same
            // directive calls the post method in this controller (see below)

            var refresh_interval; // Used below

            /**
             * @ngdoc method
             * @name start_refresh_interval
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description This function refreshes comments periodically. It's started when this controller
             * is initialised. See below. Then it calls itself when the refreshing period expires.
             * We refresh comments only if page zero is displayed, comments
             * are actually shown and there is no comment being edited
             */
            $scope.start_refresh_interval = function () {

                // If the Angular $interval object called refresh_interval has already been created,
                // don't create it again
                if (angular.isDefined(refresh_interval)) return;

                // This Angular $interval instance will call the given function periodically
                // The period is (Settings.refresh_interval_for_comments_in_seconds * 1000) milliseconds
                refresh_interval = $interval(function() {

                    //console.debug('DBG-ujmnh refresh_interval ' + $filter('date')(currentdate, 'medium'));

                    // We refresh comments only if we are on page zero and no suspension has been requested
                    // The variable $scope.commentsforminfo.do_refresh makes sure that we refresh comments only when
                    // they are actually shown
                    if ($scope.commentsforminfo.page == 0 &&
                        !$scope.commentsforminfo.suspend_refresh &&
                        $scope.commentsforminfo.do_refresh) {

                        // Doing the refresh by reloading page zero
                        $scope.load_comments(0);

                        //console.debug('DBG-5r5r refresh_interval interval function actually doing the refresh');
                    }

                }, Settings.refresh_interval_for_comments_in_seconds * 1000);

                // We have to destroy this machinery when the application or the controller are closed otherwise
                // we would have this refreshing function called forever
                $scope.$on('$destroy', function() {

                    // Making sure that the interval is destroyed too
                    $interval.cancel(refresh_interval);

                    refresh_interval = undefined;
                });

            };

            /**
             * @ngdoc method
             * @name load_comments
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description Loading comments for the node whose node id is $scope.commentsforminfo.nid
             * The Tag View controller sets $scope.commentsforminfo.nid. The page to be loaded is specified
             * as parameter. Page length is set on the server.
             * @param {int} page Page to load
             */
            $scope.load_comments = function (page) {

                //console.debug('DBG-7dse load_comments page: ' + page);
                //console.debug(nid);

                // Silently returning if the node whose comments we should load is not set
                if ($scope.commentsforminfo.nid == 0)
                    return;

                Commenthelper.load_comments($scope.commentsforminfo.nid, page).then(
                    function(comments) {

                        $scope.commentsforminfo.comments = comments;

                        //console.debug('DBG-77dyyd load_comments comments just loaded page: ' + page);
                        //console.debug(comments);

                        $scope.commentsforminfo.page = page;

                        $scope.commentsforminfo.more_pages_available = Commenthelper.more_pages_available();

                        // Adding user profile permalink to comments
                        // These are the links to the profile of the comment's author
                        for (var comment_iter = 0;
                             comment_iter < $scope.commentsforminfo.comments.length;
                             comment_iter++) {

                            $scope.commentsforminfo.comments[comment_iter].user_profile_permalink =
                                Permalinkhelper.make_user_profile_permalink($scope.commentsforminfo.comments[comment_iter].uid,
                                                                            $scope.commentsforminfo.comments[comment_iter].name);

                        }

                        // We create the scrollbar only now because only now the scrollbar can be found in the DOM
                        // It's because we create the comments section just-in-time when the ng-if that wraps it
                        // is triggered

                        var create_comments_scrollbar = function () {

                            if (typeof $window.ssb != "undefined") {

                                $window.ssb.scrollbar('scrollable-comments');
                                $window.ssb.refresh();

                            }

                            //console.debug('DBG-77777 Done! create_comments_scrollbar');

                        };

                        $timeout(create_comments_scrollbar);

                        //console.debug('DBG-huhu commentsforminfo ');
                        //console.debug($scope.commentsforminfo);

                    },
                    function(reason) {
                        console.error('W3E254 Comments not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E254 Comments not loaded. Reason: ' + reason);

                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);
                    }
                );

            };

            /**
             * @ngdoc method
             * @name post
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description Function called by the ngPost directive to post a new comment to the server.
             * It's used to post edited comments as well for the server to store the changes.
             * If a comment is held for moderation, we tell the user.
             * @param {object} comment Comment to post
             */
            $scope.post = function (comment) {

                console.debug('@CommentsFormCtrl::post');
                console.debug(comment);

                // Remember that we are not allowing for html markup in comments

                if (comment.cid == 0) {

                    // In this case we have a brand new comment to create

                    //console.debug('DBG-98r78 post this is a new comment');

                    Commenthelper.create_comment(comment).then(
                        function(new_comment_cid) {

                            // Checking if the comment we just created has been held for moderation

                            if (typeof new_comment_cid == "string" &&
                                new_comment_cid == "COMMENT_HELD_FOR_MODERATION") {

                                Dialoghelper.standard_dialog_for_message('COMMENT_HELD');

                            }

                            //console.debug('DBG-3h7j post create_comment new_comment_cid; ' + new_comment_cid);
                            //console.debug(comments);

                            // Reloading comments, after the new one created, to refresh the comments list
                            $scope.load_comments(0);

                        },
                        function(reason) {

                            console.error('W3E255 Comment not created. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E255 Comment not created. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                    // I clean the always-on-edit field where the user can create comments.
                    // It has to be clean for the next comment

                    $scope.commentsforminfo.newcomment = {
                        body: '',
                        cid: 0,
                        name: '',
                        nid: $scope.commentsforminfo.nid,
                        subject: '',
                        uid: $scope.user.uid
                    };

                } else {

                    // Here we update the comment. The comment has already been created since we have cid != 0

                    Commenthelper.update_comment(comment).then(
                        function(response) {

                            // Checking if the comment we just updated has been held for moderation

                            if (typeof response == "string" && response == "COMMENT_HELD_FOR_MODERATION") {
                                Dialoghelper.standard_dialog_for_message('COMMENT_HELD');
                            }

                            //console.debug('DBG-89ss post update_comment response: ' + response);
                            //console.debug(comments);

                            // Reloading comments after the update to refresh the comments list
                            // We reload page zero because the updated comment will be there
                            // This because comments are displayed in order of last change beginning with
                            // the newest
                            $scope.load_comments(0);

                        },
                        function(reason) {

                            console.error('W3E256 Comment not updated. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E256 Comment not updated. Reason: '
                                                                        + reason);
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }

            };

            /**
             * @ngdoc method
             * @name delete
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description Function called by the ngPost directive to delete a comment on the server.
             * @param {object} comment Comment to delete
             */
            $scope.delete = function (comment) {

                //console.debug('DBG-623hdfwefwe delete of comment:');
                //console.debug(comment);

                if (comment.cid == 0) {

                    console.error('W3E257 comment.cid cant be zero when deleting a comment');
                    Clientexceptionhelper.send_client_exception('W3E257 comment.cid cant be zero when deleting a comment');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_COMMENT_DELETE',
                                                                      comment.body).then(
                    function(value) {

                        //console.debug('deleting the comment');

                        Commenthelper.delete_comment(comment).then(
                            function(response) {

                                //console.debug('DBG- ');
                                //console.debug(comments);

                                // We load page zero instead of the page where the deleted comment was because
                                // now that page may be empty.
                                // Imagine that the deleted comment was the only one left in its page.
                                // When we delete the comment, the page is empty.
                                // So, we load page zero where there should be something. Maybe even page zero
                                // is empty but of course we can't do anything more in that case.

                                $scope.load_comments(0);

                            },
                            function(reason) {

                                console.error('W3E258 Comment not deleted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E258 Comment not deleted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);


                            }
                        );

                    },
                    function(value) {

                        //console.debug('not deleting the comment');

                    }
                );


            };

            /**
             * @ngdoc method
             * @name abuse
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description Function called by the ngPost directive to mark a comment as abusive
             * on the server.
             * @param {object} comment Comment to mark as abusive
             */
            $scope.abuse = function (comment) {

                //console.debug('DBG-623hdfwefwe abuse of comment:');
                //console.debug(comment);

                if (comment.cid == 0) {

                    console.error('W3E259 cid cant be zero when flagging a comment as abusive');
                    Clientexceptionhelper.send_client_exception('W3E259 cid cant be zero when flagging a comment as abusive');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_COMMENT_FLAGGING',
                    comment.body).then(
                    function(value) {

                        //console.debug('flagging the comment');

                        Flagginghelper.create_flagging('abusive_comment', comment.cid).then(
                            function(response) {

                                //console.debug('DBG-ewuhuff abuse create_flagging response: ' + response);

                                // I don't have to refresh any page of comments after the flagging done

                                Dialoghelper.standard_dialog_for_message('COMMENT_FLAGGED');

                            },
                            function(reason) {

                                console.error('W3E260 Comment not marked as abusive. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E260 Comment not marked as abusive. Reason: ' + reason);
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );


                    },
                    function(value) {

                        //console.debug('not flagging the comment');

                    }
                );

            };

            /**
             * @ngdoc method
             * @name reply
             * @methodOf CommentsFormCtrl.controller:CommentsFormCtrl
             * @description Function called by the ngPost directive to reply to a comment.
             * With replying to a comment we mean that the name of the author of the comment is
             * copied to the field where new comments are created. That field is also given focus.
             * @param {object} comment Comment to reply to
             */
            $scope.reply = function (comment) {

                //console.debug('DBG-623hdfwefwe reply of comment:');
                //console.debug(comment);

                // Copying the name of the author of the comment to the new-comment field
                $scope.commentsforminfo.newcomment.body += '@' + comment.name + ' ';

                // Giving focus to the new-comment field
                $scope.commentsforminfo.movefocustopostfield = true;

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

            // At initialisation time, we load comments and start the refresh mechanism
            $scope.load_comments(0);
            // @todo comments refreshing disabled for now $scope.start_refresh_interval();

        }]);
