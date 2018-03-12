/**
 * @ngdoc overview
 * @name FooterPanelCtrl
 *
 * @description FIXME This is the controller associated to the form loginForm
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

// @todo do I need all these modules?
// @todo do I need URLsKit?

// @todo the name of this file has to be refactored to ShoppingOrderPanelCtrl.js
// @todo or maybe not, let's see

angular.module('MusicTheatreApp.controllers').
  controller('FooterPanelCtrl', ['$scope', 'Programme', 'URLsKit',
                             'Programmehelper', 'Urlskithelper',
                             'Clientexceptionhelper', 'SearchTermhelper',
                             'Userhelper', 'Orderhelper', 'LineItemhelper',
                             'Tagringhelper', 'Dialoghelper', 'Settings', 'Messagehelper',
                             'CustomerProfilehelper', 'PaymentTransactionhelper',
                             '$routeParams', '$timeout', '$window',
        function($scope, Programme, URLsKit,
                 Programmehelper, Urlskithelper,
                 Clientexceptionhelper, SearchTermhelper,
                 Userhelper, Orderhelper, LineItemhelper,
                 Tagringhelper, Dialoghelper, Settings, Messagehelper,
                 CustomerProfilehelper, PaymentTransactionhelper,
                 $routeParams, $timeout, $window) {

            // @todo we will have to reload the user profile by calling
            // Userhelper.reload_user_details() after an order's checkout completed
            // to refresh the licenses. Or maybe we call Userhelper.fetch_user_details

            // @todo fix this comment By using ng-if for the shopping panel we have that this controller is initialised
            // every time it's shown
            $scope.controller_init = function () {

                console.info('@FooterPanelCtrl::controller_init');

                $scope.controller_name = 'FooterPanelCtrl';

                $scope.text_validation_regex_pattern = Settings.regex_for_text_validation;

                //console.debug('DBG-sopc 1BHG shoppingorderinfo.section_to_show ' +
                //    $scope.shoppingorderinfo.section_to_show);
                //
                //console.debug('DBG-sopc 8DER shoppingorderinfo.show ' +
                //    $scope.shoppingorderinfo.show);

                // @todo in some cases there is no fragment to display, like when it's about the contact me
                // form

                $scope.footerinfo.path_of_content_fragment_to_display =
                    '/includes/content_fragments/' + $scope.footerinfo.section_to_show + '.html';

                // @todo this controller won't control a separate view any more
                // @todo so no need for setting user infos, the tag view controller
                // @todo will do it

                // FIXME fix this comment
                // These definitions may seem strange but they are needed because
                // the child controller LoginFormCtrl wouldn't be able to
                // set user.uid and the others if they were individual variables
                // instead of members of an object

                //console.debug('DBG-UHGT $routeParams');
                //console.info($routeParams);


                var create_footer_panel_scrollbar = function () {

                    if (typeof $window.ssb != "undefined") {

                        $window.ssb.scrollbar('scrollable-footer-panel');
                        $window.ssb.refresh();

                    }

                    //console.debug('DBG-77777 Done! create_comments_scrollbar');

                };

                // @todo we should do this, don't we? $timeout(create_comments_scrollbar);
                $timeout(create_footer_panel_scrollbar);

                $timeout($scope.refresh_scrollbar);

            };

            /**
             * @ngdoc method
             * @name @todo
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function refreshes the scrollbar.
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
            $scope.send_message = function () {

                // @todo here there is no excpt hnglng

                Messagehelper.send_message($scope.footerinfo.name_line,
                                           $scope.footerinfo.email,
                                           $scope.footerinfo.body);

                $scope.footerinfo.show_footer_panel = false;

                Dialoghelper.standard_dialog_for_message('MESSAGE_SENT');

                $scope.footerinfo.name_line = '';
                $scope.footerinfo.email = '';
                $scope.footerinfo.body = '';

            };

            /**
             * @ngdoc method
             * @name refresh_scrollbar
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function refreshes the scrollbar.
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

                //console.debug('@FooterPanelCtrl::refresh_scrollbar');

                // Why are we using $timeout?
                // If we call $window.ssb.refresh without using $timeout, it may be called
                // when the scrollbar is still invisible.
                // $timeout calls $window.ssb.refresh after the event that makes the scrollbar
                // visible has been processed.
                // Doing so we are sure that the scrollbar is visible

                var create_footer_panel_scrollbar = function () {

                    if (typeof $window.ssb != "undefined") {

                        $window.ssb.scrollbar('scrollable-footer-panel');
                        $window.ssb.refresh();

                    }

                    //console.debug('DBG-77777 Done! create_comments_scrollbar');

                };

                if (typeof $window.ssb != "undefined") {

                    //console.debug('    now refreshing');

                    $timeout(create_footer_panel_scrollbar);

                    $timeout($window.ssb.refresh);
                }

            };

            $scope.controller_init();

}]); // end of controller ShoppingOrderPanelCtrl
