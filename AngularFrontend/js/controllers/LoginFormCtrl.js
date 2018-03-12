/**
 * @ngdoc overview
 * @name LoginFormCtrl
 *
 * @description This is the controller associated to the form loginForm
 *
 * You find the form loginForm in the header
 * @see includes/header.html
 *
 * What happens here?
 *
 * * First time, the form is initialised. Nothing important actually happens
 * * The function login is called by the function iframeCallback (app.js) after a login performed
 * in the iframe. The function calls the User REST api to retrieve the logged-in user's details
 * * The function logout s called by the function iframeCallback (app.js) after a logout performed
 * in the iframe. The function simply forgets any user detail and asks the Userhelper service to do
 * the same
 */

'use strict';

// @todo do you need $route?

/**
 * @ngdoc controller
 * @name LoginFormCtrl.controller:LoginFormCtrl
 * @description Controller for the form loginForm
 */
angular.module('MusicTheatreApp.controllers').
    controller('LoginFormCtrl', ['$scope', 'Userhelper', 'Votehelper', '$location', '$timeout',
                                 'Clientexceptionhelper', 'Dialoghelper', '$route', '$http',
        function ($scope, Userhelper, Votehelper, $location, $timeout,
                  Clientexceptionhelper, Dialoghelper, $route, $http) {

            //console.debug('DBG-lvc LoginFormCtrl initialisation');

            // First time initialisation (doing nothing for now)

            // Here you can't set $scope.controller_name because we want to know the name of the top level
            // controller. For example, this controller LoginFormCtrl may be used in the tag view (TagViewCtrl.js)
            // or in another view. If anywhere in the code we need to know which view we are in, we use
            // precisely $scope.controller_name. The latter has to be the name of the view controller, the topmost one,
            // the one associated to the view, otherwise we can't know the view we are in

            //console.debug('DBG-lvc01IJ text_validation_regex_pattern ' +
            //    $scope.text_validation_regex_pattern);

            /**
             * @ngdoc method
             * @name login
             * @methodOf LoginFormCtrl.controller:LoginFormCtrl
             * @description This function's name is a bit misleading. No login happens here.
             * The iframe loginandlogoutframe (header.html) does the job. Here we collect
             * the logged-in user details after the login done.
             * The function iframeCallback calls this one.
             */
            $scope.login = function () {

                console.debug('@LoginFormCtrl::login');
                //console.debug(logging_in_user);

                // Login and logout are performed in the iframe
                // The iframe is in header.html
                // This function is called only to retrieve the details of the logged-in user after
                // the login performed

                // Now calling the musth_restws_user api via the service Userhelper to
                // fetch user details
                Userhelper.fetch_user_details().then(function(user) {

                        $scope.user.uid = user.uid;
                        $scope.user.name = user.name;
                        $scope.user.language = user.language;
                        $scope.user.licenses = user.licenses;
                        $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                        $scope.user.first_name = user.first_name;
                        $scope.user.middle_names = user.middle_names;
                        $scope.user.family_name = user.family_name;
                        $scope.user.groups = user.groups;
                        $scope.user.avatar = user.avatar;

                        //console.debug('@LoginFormCtrl::login fetch_user_details');
                        //console.debug(user);

                        // If user.uid == 0, it means that no login has been performed in the iframe
                        // This is a bug or a problem anyway
                        if (user.uid == 0) {
                            // This shouldn't ever happen in our case because the login is done in the iframe
                            // and this function should be called only after the login has been done successfully

                            console.error('W3E261 How can uid be zero?');
                            Clientexceptionhelper.send_client_exception('W3E261 How can uid be zero?');

                            // @todo What do we say to the user? should we tell the user to log in again?

                            Dialoghelper.standard_dialog_for_message('LOGIN_AGAIN');

                        } else {
                            // Details correctly fetched
                            // Let's close the login panel

                            //console.debug('@LoginFormCtrl::login fetch_user_details before $scope.loginpanelinfo.show = false');

                            // Close the login panel only if there actually is a login panel to close

                            if (typeof $scope.loginpanelinfo != "undefined")
                                $scope.loginpanelinfo.show = false;

                            // @todo do I need this??
                            // @todo this may be useful to refresh the view with the details of the just logged-in user
                            //$route.reload();
                            $timeout($route.reload);

                        }

                    },
                    function(reason) {

                        console.error('W3E262 User details not fetched. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E262 User details not fetched. Reason: ' + reason);
                        // @todo What do we say to the user?

                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );
            };

            /**
             * @ngdoc method
             * @name logout
             * @methodOf LoginFormCtrl.controller:LoginFormCtrl
             * @description fix The iframe, the one used to do login and logout, actually performs the logout.
             * Here we just forget the user's details because we don't want them to show up in the frontend
             * since the user is no longer logged-in
             *
             * @todo doc to rewrite
             *
             * The function forget_user_details provided by the service Userhelper is called as well,
             * which means that the Userhelper service forgets the credentials.
             *
             * The parent controller (for example TagViewCtrl) will see the user information reset and will know
             * that a new login is needed.
             */
            $scope.logout = function () {

                //console.debug('@LoginFormCtrl::logout');
                //console.debug(logging_in_user);

                // when this function is called, the logout has already happened
                // so, what we have to do is just to reset all information about the logged-in user

                $http.get('/backend/user/logout').
                    success(function(data, status, headers, config) {

                        // We ask the Userhelper service to forget user details as it stores them
                        Userhelper.forget_user_details();

                        // The Votehelper service has to forget the votes the logged-in user gave
                        Votehelper.forget_votes();

                        $scope.user.uid = 0;
                        $scope.user.name = '';
                        $scope.user.language = 'en';
                        $scope.user.subscriber = false;
                        $scope.user.licenses = [];
                        $scope.user.user_orders_list = [];
                        $scope.user.first_name = '';
                        $scope.user.middle_names = '';
                        $scope.user.family_name = '';
                        $scope.user.groups = [];

                        // @todo any expt handling here? see frontends/angular/app/js/services/userhelperService.js:161

                        // This will do the logout in Drupal and remove the session cookie

                        // @todo to forget user details, is it ok?

                        $timeout($route.reload);

                    }).
                    error(function(data, status, headers, config) {

                        // Called asynchronously if an error occurs
                        // or server returns response with an error status.

                        // @todo fix excpt hndlg

                        console.error('W3Ejjudunhjncdjcndjcnd247 . Status: ' + status);
                        Clientexceptionhelper.send_client_exception('W3Ejjudunhjncdjcndjcnd247 fixme. Status: ' + status);
                        deferred.reject('W3Ejjudunhjncdjcndjcnd247 fixme');

                    });



                //$route.reload();

            };

            $scope.close_login_panel = function () {

                //console.debug('@LoginFormCtrl::close_login_panel');
                //console.debug(logging_in_user);

                var close_login_panel_on_timeout = function () {

                    if (typeof $scope.loginpanelinfo != "undefined") {
                        $scope.loginpanelinfo.show = false;

                        //console.debug('@LoginFormCtrl::close_login_panel just closed on timeout');

                    }

                    //console.debug('DBG-77777 Done! create_comments_scrollbar');

                };

                $timeout(close_login_panel_on_timeout);

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

        }]);
