/**
 * @ngdoc overview
 * @name FIXME @todo is this controller used any more?
 *
 * @todo I don't think that this controller is used any more
 *
 * @description FIXME This is the controller associated to the form loginForm
 *
 * @todo is this controller used any more?
 *
 * @todo attention, this controller will control a div inside the tagview
 * @todo it won't control a separate view, maybe we want to rename it
 * @todo we have to wait to be sure
 *
 * @todo where is corresponding partial? I guess we use a separate file that
 * we include in the tagview, just not to make the tag view too long
 *
 * What happens here?
 * - First time, the ??? is initialised
 */

'use strict';

// @todo if this controller doesn't do so much, maybe we get rid of it
// @todo remove CustomerProfilehelper, it was for a test
// @todo remove all services that are not used

angular.module('MusicTheatreApp.controllers').
  controller('RegisterPanelCtrl', ['$scope', 'Settings', '$timeout', '$window',
             'Userhelper', 'Clientexceptionhelper', 'Downloadableurlhelper', 'Orderhelper',
             'LineItemhelper', 'CustomerProfilehelper',
        function($scope, Settings, $timeout, $window,
                 Userhelper, Clientexceptionhelper,
                 Downloadableurlhelper, Orderhelper,
                 LineItemhelper, CustomerProfilehelper) {

            // @todo fix this comment By using ng-if for the user panel we have that this controller is initialised
            // every time it's shown (really? are we actually using ng-if?)
            $scope.controller_init = function () {

                //console.debug('DBG-71yhg UserPanelCtrl controller_init');

                // @todo this is test:
                //$scope.path_of_file_to_download = "http://hwcdn.net/c6j4u5n4/cds/audio/test.mp3";
                // frontends/angular/app/js/services/userhelperService.js

                //$scope.date_time_format_for_userpanel = Settings.default_date_time_format;

                //console.debug('DBG-rpci 8GRF RegisterPanelCtrl init');

                $scope.controller_name = 'RegisterPanelCtrl';

                //console.debug('DBG-upci 1KNB userviewinfo.section_to_show ' +
                //    $scope.userviewinfo.section_to_show);

                //console.debug('DBG-upci 0FDE userviewinfo.show ' +
                //    $scope.userviewinfo.show);

                $scope.text_validation_regex_pattern = Settings.regex_for_text_validation;

                $scope.registerpanelinfo.section_to_show = 'register_form';
                $scope.registerpanelinfo.email = '';
                $scope.registerpanelinfo.password = '';
                $scope.registerpanelinfo.first_name = '';
                $scope.registerpanelinfo.middle_names = '';
                $scope.registerpanelinfo.family_name = '';

                if ($scope.user.uid != 0) {
                    // @todo send message to Drupal
                    console.error('This controller and its panel shouldnt be brought up if the user is logged in, its a bug');
                    Clientexceptionhelper.send_client_exception('W3E??? BUG in angular RegisterPanelCtrl 67dgysdbct6');
                }

            };

            /**
             * @todo
             */
            $scope.register_new_user = function () {

                console.error('This method is no longer used, is it?');
                Clientexceptionhelper.send_client_exception('This method is no longer used 4376vcgbvvbhgyvc');

                return;

                //console.debug('DBG-q9ku register_new_user');
                //console.debug($scope.registerpanelinfo);

                Userhelper.create_new_user_account($scope.registerpanelinfo.email,
                                                   $scope.registerpanelinfo.first_name,
                                                   $scope.registerpanelinfo.middle_names,
                                                   $scope.registerpanelinfo.family_name,
                                                   $scope.registerpanelinfo.password).then(
                    function(new_user_id) {

                        console.debug('DBG-62fttg register_new_user' + new_user_id);

                        // @todo what to do here?

                        $scope.registerpanelinfo.section_to_show = 'message_section';
                        $scope.registerpanelinfo.registration_outcome = 'registration_successful';

                    },
                    function(reason) {
                        // @todo exception

                        console.debug('DBG-65656 register_new_user ERROR ' + reason);

                        if (reason == 'ERR_DUPLICATE_EMAIL') {
                            console.debug('DBG-67767n ERR_DUPLICATE_EMAIL here');
                            $scope.registerpanelinfo.section_to_show = 'message_section';
                            $scope.registerpanelinfo.registration_outcome = 'err_duplicate_email';
                        } else {
                            $scope.registerpanelinfo.section_to_show = 'message_section';
                            $scope.registerpanelinfo.registration_outcome = 'error';
                        }

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

}]); // end of controller ShoppingOrderPanelCtrl
