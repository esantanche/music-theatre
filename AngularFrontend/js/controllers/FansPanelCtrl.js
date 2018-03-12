/**
 * @ngdoc overview
 * @name FansPanelCtrl
 * @description This is the controller associated to the fans section in
 * video_and_audio_info_panel.html
 *
 * It's used for partners as well.
 *
 * What happens here?
 * * When the controller is initialised, we load the fans of the programme currently
 * selected and whose node id is provided by the tag view controller via the
 * variable $scope.programmefanstabinfo.nid
 * * The user can become a fan or stop being one via the function become_a_fan_or_stop_being_one
 */

'use strict';

/**
 * @ngdoc controller
 * @name FansPanelCtrl.controller:FansPanelCtrl
 * @description Controller for the fans section in video_and_audio_info_panel.html and in
 * partners_info_panel.html
 */
angular.module('MusicTheatreApp.controllers').
    controller('FansPanelCtrl', ['$scope',
                                 'Votehelper',
                                 'Clientexceptionhelper',
                                 'Dialoghelper',
                                 'Permalinkhelper',
                                 '$timeout',
                                 '$window',
        function ($scope,
                  Votehelper,
                  Clientexceptionhelper,
                  Dialoghelper,
                  Permalinkhelper,
                  $timeout,
                  $window) {

            $scope.controller_init = function() {

                // This controller is initialised only when the user clicks on the Fans button
                // in the infopanel. It's because we use ng-if to build the fans section on the fly

                console.info('@FansPanelCtrl::controller_init');
                //console.debug('    (fans-init) user.uid: ' + $scope.user.uid);
                //console.debug('    (fans-init) programmefanstabinfo: ');
                //console.debug($scope.programmefanstabinfo);

                // Loading the fans. Tag View Controller takes care to initialise $scope.programmefanstabinfo.nid
                $scope.load_fans_of_programme($scope.programmefanstabinfo.nid);

            };

            /**
             * @ngdoc method
             * @name load_fans_of_programme
             * @methodOf FansPanelCtrl.controller:FansPanelCtrl
             * @description Loading the fans of the programme whose node id is given.
             * No paging.
             * @param {int} nid Node id of the programme whose fans we want
             */
            $scope.load_fans_of_programme = function (nid) {

                Votehelper.load_fans_of_node(nid).then(
                    function(votes) {

                        //console.debug('DBG-nuijhgg load_fans_of_node');
                        //console.debug(votes);

                        $scope.programmefanstabinfo.fanslist = votes;

                        $scope.programmefanstabinfo.number_of_fans = votes.length;

                        // Adding user profile permalink to fans
                        // These are the links that will go to the profiles of the fans
                        for (var fan_iter = 0;
                             fan_iter < $scope.programmefanstabinfo.fanslist.length;
                             fan_iter++) {

                            $scope.programmefanstabinfo.fanslist[fan_iter].user_profile_permalink =
                                Permalinkhelper.make_user_profile_permalink($scope.programmefanstabinfo.fanslist[fan_iter].uid,
                                    $scope.programmefanstabinfo.fanslist[fan_iter].name);

                        }

                        $timeout($scope.refresh_scrollbar);

                        //console.debug('DBG-11111 load_fans_of_node');
                        //console.debug($scope.programmefanstabinfo.fanslist);

                    },
                    function(reason) {

                        // @todo exception handling waiting for things to settle down

                        console.error('W3Exxx ies7ahbie9 load_fans_of_node. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx ies7ahbie9 load_fans_of_node. Reason ' +
                            reason);
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );
            };


            /**
             * @ngdoc method
             * @name become_a_fan_or_stop_being_one
             * @methodOf FansPanelCtrl.controller:FansPanelCtrl
             * @description With this function we make the user whose user id is uid a fan
             * of the programme whose node id is nid
             * @param {int} uid Fan's user id
             * @param {int} nid Node id of the programme the user wants to be a fan of
             * @param {bool} be_a_fan True if the user wants to be a fan, false if they want to stop being a fan
             */
            $scope.become_a_fan_or_stop_being_one = function (uid, nid, be_a_fan) {

                //console.debug('@FansPanelCtrl::become_a_fan_or_stop_being_one uid:' + uid + ' nid: ' + nid + ' be_a_fan: ' + be_a_fan );

                // Let's imagine that this function gets called just after a login
                // We may not have uid and nid properly initialised

                // Let's try and set them if we can

                if (!uid)
                    uid = $scope.user.uid;

                if (!nid)
                    nid = $scope.programme.nid;

                // Safety checks
                // uid should be non-zero and the same for nid
                // vote_0_to_100 should be between 0 and 100

                if (!uid) {
                    // The user is not logged-in

                    // We throw exception because the partial should not even show the "become a fan" button

                    console.error('W3Exxx ahTh4shish user not logged in when becoming a fan of programme');
                    Clientexceptionhelper.send_client_exception('W3Exxx ahTh4shish user not logged in when becoming a fan of programme');

                    return;
                }

                if (!nid) {
                    // How can it be that we are asked to become a fan of node zero?

                    // @todo fix excpt

                    console.error('fe3gaxaiwaibaiw How can it be that we are asked to become a fan of node zero?');
                    Clientexceptionhelper.send_client_exception('fe3gaxaiwaibaiw How can it be that we ' +
                        'are asked to become a fan of node zero?');

                    return;
                }

                // We represent the idea that the user is a fan by registering a 100% vote for the programme
                var vote_0_to_100 = be_a_fan ? 100 : 0;

                //console.debug('DBG-7654 rate_programme');
                //console.debug('uid, nid, vote_0_to_100: ' + uid + "," + nid + "," + vote_0_to_100);

                // These variables are used in /partials/programme_vote_panel.html
                // We updated them for the panel to reflect the new vote

                $scope.programmefanstabinfo.user_vote.value = vote_0_to_100;
                $scope.programmefanstabinfo.user_vote.value_type = 'percent';

                // Calling vote_a_node so that the vote the user gave can be stored in the server
                Votehelper.vote_a_node(nid, uid, 'percent', vote_0_to_100, 'fan').then(
                    function(response) {

                        $scope.load_fans_of_programme(nid);

                        $timeout($scope.refresh_scrollbar);

                        //console.debug('DBG-11111 load_fans_of_node');
                        //console.debug($scope.programmefanstabinfo.fanslist);

                    },
                    function(reason) {

                        // @todo excpt hndglng here!

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

            $scope.controller_init();

        }]);

