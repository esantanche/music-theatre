/**
 * @ngdoc overview
 * @name UserViewCtrl
 * @description This is the controller associated to the view /partials/userprofileview.html
 * It's where we show the logged-in user profile.
 */

'use strict';

/**
 * @ngdoc controller
 * @name UserViewCtrl.controller:UserViewCtrl
 * @description This is the controller associated to the user profile view
 *
 * What happens here?
 *
 * * The user profile view is initialised when there is a view change
 * * All user orders are loaded when the user asks for them
 * * All line items belonging to a given order are loaded when the user asks for them
 * * A downloadable is downloaded when the user asks for it. Typically it's an audio file
 * * The user real name is updated if the user edited it
 * * A 'cart' order becomes the current shopping cart if the user wants to
 */
angular.module('MusicTheatreApp.controllers').
  controller('UserViewCtrl', ['$scope', 'Settings', '$timeout',
                              '$window', 'Userhelper', 'Downloadableurlhelper',
                              'Orderhelper', 'LineItemhelper', 'Clientexceptionhelper',
                              'Votehelper', 'Dialoghelper', 'Permalinkhelper',
                              'Tagringhelper',
                              '$routeParams', '$rootScope', '$location', '$route',
        function($scope, Settings, $timeout,
                 $window, Userhelper, Downloadableurlhelper,
                 Orderhelper, LineItemhelper, Clientexceptionhelper,
                 Votehelper, Dialoghelper, Permalinkhelper,
                 Tagringhelper,
                 $routeParams, $rootScope, $location, $route) {

            /**
             * @ngdoc method
             * @name controller_init
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description Initialisation of variables and change of url if needed.
             * In this case, if the controller is initialised more than once because of the
             * url change, there is no problem.
             *
             * Where is this function called? See at the bottom of this file.
             * It happens when the controller is initialised.
             *
             * @attention for now we support the logged-in user profile. We will have public
             * profiles accessible by any user, even anonymous ones.
             */
            $scope.controller_init = function () {

                console.info('@UserViewCtrl::controller_init');
                console.info('   $routeParams');
                console.info($routeParams);

                // Every controller should set this variable
                // The login form (LoginFormCtrl.js) uses it to know which controller
                // is currently working and changes its behaviour accordingly

                $scope.controller_name = 'UserViewCtrl';

                // On the user profile view there is no tagring
                $rootScope.show_tagring = false;

                // @todo does this work?
                $scope.loginpanelinfo = { show: false,
                    section_to_show: '' };

                $scope.tabs_horizontal_menu_info = {
                    menu_to_show: '',
                    active_item: '',
                    group_link: ''
                };

                // @todo this has to go where the info is ready for the tabs to be shown
                $scope.tabs_horizontal_menu_info.menu_to_show = 'userprofile';

                // We show the logged-in user's reviews on the user view
                // The controller ReviewsFormCtrl will control the review section in
                // the partial /partials/userprofileview.html

                $scope.reviewsforminfo = { nid: 0,
                    page: 0, // Let's restart from page 0 when this controller is initialised
                    showing_user_reviews: true,
                    more_pages_available: false,
                    reviews: [] };

                // We may have the user id in the url. The url will be something like /profile/en/{uid}
                // This variable will keep the {uid} part of the url, that is the id of the user
                // whose profile we have to show
                // This is more for future developments: we will have to show users' public profile
                // @todo rawavatar and croppedavatar to fix
                $scope.userviewinfo = {
                    current_function: 'view',
                    section_to_show: 'mydetails',
                    showing_a_public_profile: true,   // @todo need this?
                    user_profile_to_show: {
                        uid: 0,
                        rawavatar: '',
                        croppedavatar: ''
                    },
                    list_of_items_user_is_fan_of: {}
                };

                // @todo this is just a test, but it's about avatar cropping so it's useful
                // https://github.com/alexk111/ngImgCrop

                var associate_handler = function() {

                    var handleFileSelect = function(evt) {
                        var file = evt.currentTarget.files[0];
                        var reader = new FileReader();
                        reader.onload = function (evt) {
                            $scope.$apply(function($scope){
                                $scope.userviewinfo.user_profile_to_show.rawavatar = evt.target.result;
                            });
                        };
                        reader.readAsDataURL(file);
                    };

                    angular.element(document.querySelector('#fileInput')).on('change', handleFileSelect);

                };

                $timeout(associate_handler);
                // @todo end test

                $scope.date_time_format_for_userview = Settings.default_date_time_format;

                //console.debug('DBG-upci AKSJ UserPanelCtrl init');

                // Used to validate text entry fields in realnameForm (/partials/userprofileview.html)
                $scope.text_validation_regex_pattern = Settings.regex_for_text_validation;

                // Sure we need the logged-in user's details

                // @todo this part is copied and pasted from TagViewCtrl.js, is it possible to make a shared
                // function of it? The problem is that here we have to take into account the public profile
                // story. So, let's wait until that story settles down

                $scope.user = {  };

                // @todo first thing, let's determine if we are displaying a private or public profile

                Userhelper.fetch_user_details().then(
                    function(user) {

                        $scope.user.uid = user.uid;
                        $scope.user.name = user.name;
                        $scope.user.mail = user.mail;
                        $scope.user.language = user.language;
                        $scope.user.licenses = user.licenses;
                        $scope.user.groups = user.groups;
                        $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                        $scope.user.first_name = user.first_name;
                        $scope.user.middle_names = user.middle_names;
                        $scope.user.family_name = user.family_name;
                        $scope.user.avatar = user.avatar;

                        //console.debug('@UserViewCtrl::controller_init fetch_user_details user');
                        //console.debug($scope.user);

                        // @todo if we come up with no profile at all because the user is not logged in,
                        // what do we show stuff for here?
                        // @todo you can put a condition in the partial

                        // @todo ok?
                        //$scope.userviewinfo.showing_a_public_profile = false;

                        if (typeof $routeParams.uid !== "undefined") {

                            // @todo fix all

                            // The url provides us with a user id
                            // We are supposed to show the public user profile of that user if they
                            // are not logged in, or the private profile if they are logged in

                            // @todo consider that user_whose_profile_to_show is not yet used
                            // it's to implement public profiles
                            $scope.userviewinfo.user_profile_to_show.uid = $routeParams.uid;

                            if ($scope.userviewinfo.user_profile_to_show.uid == user.uid) {

                                //console.debug('DBG-8888 [loading logged in user] fetch_user_details in controller_init in TagViewCtrl');
                                //console.debug(user);
                                // The user is logged-in, let's display their private profile

                                $scope.userviewinfo.user_profile_to_show.uid = user.uid;
                                $scope.userviewinfo.user_profile_to_show.name = user.name;
                                $scope.userviewinfo.user_profile_to_show.mail = user.mail;
                                $scope.userviewinfo.user_profile_to_show.language = user.language;
                                $scope.userviewinfo.user_profile_to_show.licenses = user.licenses;
                                $scope.userviewinfo.user_profile_to_show.groups = user.groups;
                                $scope.userviewinfo.user_profile_to_show.subscriber = Userhelper.is_user_a_subscriber();
                                $scope.userviewinfo.user_profile_to_show.first_name = user.first_name;
                                $scope.userviewinfo.user_profile_to_show.middle_names = user.middle_names;
                                $scope.userviewinfo.user_profile_to_show.family_name = user.family_name;
                                $scope.userviewinfo.user_profile_to_show.avatar = user.avatar;

                                $scope.userviewinfo.showing_a_public_profile = false;

                                // @todo add permalink to programmes licenses are about

                                var url_changed = $scope.set_url_for_current_user_profile(user.uid,
                                                                                          user.name);

                                // This controller is about to be initialised again, let's not waste more time
                                if (url_changed) return;

                                Votehelper.load_votes(user.uid);

                            } else {

                                // @todo fix comments Actually we want the public profile of $scope.userviewinfo.user_whose_profile_to_show
                                // We have to fetch it

                                // @todo what if  $scope.userviewinfo.user_whose_profile_to_show is actually
                                // the logged in user? we have to show the private profile
                                //                            $scope.userviewinfo.user_profile_to_show.uid
                                Userhelper.fetch_user_details($scope.userviewinfo.user_profile_to_show.uid).then(
                                    function(user) {

                                        //console.debug('DBG-8888 [loading public profile] fetch_user_details in controller_init in TagViewCtrl');
                                        //console.debug(user);

                                        $scope.userviewinfo.showing_a_public_profile = true;

                                        $scope.userviewinfo.user_profile_to_show.uid = user.uid;
                                        $scope.userviewinfo.user_profile_to_show.name = user.name;
                                        $scope.userviewinfo.user_profile_to_show.mail = user.mail;
                                        $scope.userviewinfo.user_profile_to_show.groups = user.groups;
                                        $scope.userviewinfo.user_profile_to_show.first_name = user.first_name;
                                        $scope.userviewinfo.user_profile_to_show.middle_names = user.middle_names;
                                        $scope.userviewinfo.user_profile_to_show.family_name = user.family_name;
                                        $scope.userviewinfo.user_profile_to_show.avatar = user.avatar;

                                        // Remember that, if this function changes url, this controller (UserViewCtrl)
                                        // will be reinitialised
                                        $scope.set_url_for_current_user_profile(user.uid,
                                                                                user.name);

                                    },
                                    function(reason) {

                                        // @todo I copied and pasted this exception from TagViewCtrl.js
                                        // maybe we want to change the error number

                                        console.error('W3E273 x5tft User details not fetched. Reason: ' + reason);
                                        Clientexceptionhelper.send_client_exception('W3E273 x5tft User details not fetched. Reason: ' + reason);
                                        // @todo What do we say to the user?
                                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                                    }
                                );

                            }

                        }

                    },
                    function(reason) {

                        // @todo I copied and pasted this exception from TagViewCtrl.js
                        // maybe we want to change the error number

                        console.error('W3E273 x5tft User details not fetched. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E273 x5tft User details not fetched. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

                // Got to tell Tagringhelper that we have no tagring here so that it will
                // initialise the tagring when the user goes to another view (tagview typically)
                Tagringhelper.initialise_tagring('notagring');

            };


            /**
             * @ngdoc method
             * @name @todo fix here
             * @todo fix
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description fixme
             * @returns {bool} True if the url changed
             * @param function_name
             */
            $scope.change_current_function_from_tabs_menu = function(function_name) {

                //console.debug('@UserViewCtrl::change_current_function_from_tabs_menu');
                //console.debug('    function_name: ' + function_name);

                // function_name is 'view' or 'edit'

                $scope.userviewinfo.current_function = function_name;

                if (function_name == 'edit') {

                    $scope.userviewinfo.section_to_show = 'editdetails';

                }

                if (function_name == 'view') {

                    $scope.userviewinfo.section_to_show = 'mydetails';

                    $timeout($route.reload);

                }

                $timeout($scope.refresh_scrollbar);

            };

            /**
             * @ngdoc method
             * @name set_url_for_current_user_profile
             * @todo fix
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description fixme
             * @param {int} uid
             * @param {string} name
             * @returns {bool} True if the url changed
             */
            $scope.set_url_for_current_user_profile = function(uid, name) {

                var new_path = Permalinkhelper.make_user_profile_permalink(uid, name);

                var current_path = $location.path();

                // We change the url only if it's actually different from the current one so that
                // we force a reinitialisation of this controller only if really necessary
                if (current_path != new_path) {

                    console.info('   About to change url');
                    console.info('   current_path: ' + current_path);
                    console.info('   new_path: ' + new_path);

                    $location.replace();
                    $location.path(new_path);

                    return true;
                } else {

                    return false;
                }

            };

            /**
             * @todo remove
             * @ngdoc method
             * @name compose_real_name_for_url @todo remove
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description From first name, middle names and family name we make a string
             * with spaces replaced by '-'
             * @param {string} first_name
             * @param {string} middle_names
             * @param {string} family_name
             * @return {string} Composed real name ('first-name-middle-names-family-name')
             */
            //$scope.compose_real_name_for_url = function(first_name, middle_names, family_name) {
            //
            //    var composed_real_name_for_url = '';
            //
            //    if (first_name)
            //        composed_real_name_for_url += first_name;
            //
            //    if (middle_names)
            //        if (composed_real_name_for_url)
            //            composed_real_name_for_url += ' ' + middle_names;
            //        else
            //            composed_real_name_for_url = middle_names;
            //
            //    if (family_name)
            //        if (composed_real_name_for_url)
            //            composed_real_name_for_url += ' ' + family_name;
            //        else
            //            composed_real_name_for_url = family_name;
            //
            //    return composed_real_name_for_url.replace(/\s/g, '-');
            //};

            /**
             * @ngdoc method
             * @name load_orders_for_the_current_user
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description Loading all orders for the logged-in user.
             */
            $scope.load_orders_for_the_current_user = function() {

                if (!$scope.user.uid) {

                    // We can't load orders for anonymous users
                    // This is a bug because this function shouldn't have been called with $scope.user.uid == 0

                    // @todo exception here, there should be no loading orders for non-logged-in users

                    console.error('673gdy7vgb477 load_orders_for_the_current_user user not logged in');
                    Clientexceptionhelper.send_client_exception('673gdy7vgb477 load_orders_for_the_current_user ' +
                        'user not logged in');

                    return;
                }

                $scope.user.user_orders_list = [];

                Userhelper.prepare_for_call_with_credentials();

                Orderhelper.load_users_orders().then(
                    function(orders) {

                        if (orders.length) {

                            $scope.user.user_orders_list = orders;

                            $timeout($scope.refresh_scrollbar);

                        } else {
                            // We have to tell the user that no orders have been found

                            //Dialoghelper.standard_dialog_for_message('NO_ORDERS');

                        }

                        //console.debug('DBG-9187tgfr user_orders_list');
                        //console.debug($scope.user.user_orders_list);

                    },
                    function (reason) {

                        // @todo exception handling

                        console.error('chahp9Osha User orders not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('chahp9Osha User orders not loaded. ' +
                            'Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name get_line_items_and_add_them_to_order
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description We don't get a order's line items together with the order. We get
             * them later, when the user wants them, and we do this with this function.
             * @param {object} order The order whose line items we have to get.
             */
            $scope.get_line_items_and_add_them_to_order = function(order) {

                //console.debug('@get_line_items_and_add_them_to_order');

                LineItemhelper.load_line_items(order.order_id).then(
                    function(line_items) {

                        //console.debug('DBG-9187tgfr user_orders_list');
                        //console.debug($scope.user.user_orders_list);
                        //console.debug('DBG-7sw3 get_line_items_and_add_them_to_order line_items');
                        //console.debug(line_items);
                        //console.debug(line_items.length);

                        // Attaching the line items to the order

                        if (typeof line_items === "undefined") {
                            line_items = [];
                        }

                        order.line_items = line_items;

                        $timeout($scope.refresh_scrollbar);

                    },
                    function (reason) {

                        // @todo exception handling

                        console.error('nb476c5g64f Line items not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('nb476c5g64f Line items not loaded. ' +
                            'Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name download_a_downloadable_from_user_panel
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description From the user panel, the user may want to download a downloadable file they
             * bought. We get the signed url we need to download the file.
             * @param {string} sku SKU we got from the license the user owns to download the file
             */
            $scope.download_a_downloadable_from_user_panel = function(sku) {

                //console.debug('DBG-3H6Q download_a_downloadable_from_user_panel sku: ' + sku);

                if (!sku) {

                    // @todo exception handling

                    console.error('c7g46rgf6gbv5v Empty sku in download_a_downloadable_from_user_panel');
                    Clientexceptionhelper.send_client_exception('c7g46rgf6gbv5v Empty sku in ' +
                        'download_a_downloadable_from_user_panel');

                    return;
                }

                if (sku.substring(0,1) != 'A') {

                    // @todo exception

                    console.error('vf55d5v6gg6yvv Only audio download supported' +
                        ' in download_a_downloadable_from_user_panel');
                    Clientexceptionhelper.send_client_exception('vf55d5v6gg6yvv Only audio download supported' +
                        ' in download_a_downloadable_from_user_panel');

                    return;
                }

                if ($scope.user.uid)
                    Userhelper.prepare_for_call_with_credentials();

                var downloadable_catalogue_no = sku.substring(0, 9);

                Downloadableurlhelper.load_downloadableurl(downloadable_catalogue_no).then(
                    function(downloadableurl) {

                        //console.debug('DBG-19UHY load_downloadableurl');
                        //console.debug(downloadableurl);

                        if (downloadableurl.url) {

                            // We got the url and proceed with the download

                            // We start the download
                            // See script /lib/downloadfile/downloadfile.js
                            $window.downloadFile(downloadableurl.url);

                        } else {

                            // Bug here. If we are in this function downloading a downloadable, it's because the
                            // user owns an active license for it.
                            // Why aren't we getting permission to download?

                            // @todo exception handling

                            console.error('pei7die9muGhiec Not getting permission to ' +
                                'download when we should have it');
                            Clientexceptionhelper.send_client_exception('pei7die9muGhiec Not getting permission ' +
                                'to download when we should have it');

                        }

                    },
                    function(reason) {

                        // @todo exception handling

                        console.error('tikaijai7Yie4ze Downloadableurl not received. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('tikaijai7Yie4ze Downloadableurl not received.' +
                            ' Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name update_user_details
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description From the user profile, the user can change their real name.
             * @param {object} user Object with user details. We use first_name, middle_names and family_name
             */
            $scope.update_user_details = function(user) {

                //console.debug('DBG-1OAN update_user_details');
                //console.debug(user);

                // @todo here we may want to add some excpt handling!!

                Userhelper.user_update(user.first_name, user.middle_names, user.family_name);

                Dialoghelper.standard_dialog_for_message('USER_DETAILS_UPDATED');

            };

            /**
             * @ngdoc method
             * @name @todo fix everythign update_user_details
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description From the user profile, the user can change their real name.
             * @param {object} user Object with user details. We use first_name, middle_names and family_name
             */
            $scope.testing_avatar = function(croppedavatar) {

                //console.debug('DBG-8iju testing_avatar');
                //console.debug(croppedavatar);

                // @todo any excpt handling here?

                Userhelper.just_a_test_of_avatar_upload(croppedavatar);

                Dialoghelper.standard_dialog_for_message('AVATAR_UPLOADED');

            };

            /**
             * @ngdoc method
             * @name use_this_order_as_cart
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description @todo doc this function is working in progress
             * @param {object} order Order the user wants to use as current shopping cart
             */
            $scope.use_this_order_as_cart = function(order) {

                // @todo this function is working in progress because maybe we don't want the
                // user to choose any 'cart' order as shopping cart

                //console.debug('DBG-8TGRF use_this_order_as_cart');
                //console.debug(order);

                // @todo any exception handling?

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_USE_ORDER_AS_CART',
                    'Order n. ' + order.order_id).then(
                    function(value) {

                        //console.debug('submitting the review');

                        // @todo Here we are not using the 'then' part!!
                        // what if there is an error in doing set_the_given_order_as_shopping_order??

                        Orderhelper.set_the_given_order_as_shopping_order(order);

                        $scope.load_orders_for_the_current_user();

                        // @todo what about telling the user about what happened?

                    },
                    function(value) {

                        //console.debug('not submitting the review');

                    }
                );

            };

            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf UserViewCtrl.controller:UserViewCtrl
             * @description fixme
             */
            $scope.load_items_user_is_fan_of = function() {

                //this.votes_user_gave_that_are_tagged_with_given_tag = function(uid, tag)

                // @todo for now this list of items the user is fan of is available
                // for the logged-in user only

                //console.debug('DBG-liuifo load_items_user_is_fan_of');

                $scope.userviewinfo.list_of_items_user_is_fan_of =
                    Votehelper.votes_user_gave_that_are_tagged_with_given_tag($scope.user.uid, 'fan');

                // @todo maybe here we add urls to $scope.userviewinfo.list_of_items_user_is_fan_of
                //console.debug('DBG-liuifo load_items_user_is_fan_of');
                //console.debug($scope.userviewinfo.list_of_items_user_is_fan_of);

                for (var item_iter = 0; item_iter < $scope.userviewinfo.list_of_items_user_is_fan_of.length; item_iter++) {

                    //var votes_for_a_single_node = Votevalue.votes[node_iter];


                    //console.debug('DBG-liuifo $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]');
                    //console.debug($scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]);

                    $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['permalink'] =
                        Permalinkhelper.make_programme_permalink(
                            $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['nid'],
                            $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['system_title'],
                            $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['display_title']);


                    //        this.vote_user_gave_to_node = function(uid, nid, tag) {

                    // Example of vote_user_gave_to_current_item:
                    // Object {value: "60", value_type: "percent", system_title: "P00000001", display_title: "Adam Walker"}

                    $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['user_vote'] =
                        Votehelper.vote_user_gave_to_node($scope.user.uid,
                            $scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['nid']);

                    //console.debug($scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]);

                    //$scope.userviewinfo.list_of_items_user_is_fan_of[item_iter]['user_vote'] =
                    //    vote_user_gave_to_current_item;

                    //if (typeof Votevalue.votes[votes.list[vote_iter].nid] == 'undefined')
                    //    Votevalue.votes[votes.list[vote_iter].nid] = {};
                    //
                    //Votevalue.votes[votes.list[vote_iter].nid][votes.list[vote_iter].tag] = {
                    //    value: votes.list[vote_iter].value,
                    //    value_type: votes.list[vote_iter].value_type
                    //};

                }

                //console.debug('DBG-9i9i HERE!!');
                //console.debug($scope.userviewinfo.list_of_items_user_is_fan_of);

                $timeout($scope.refresh_scrollbar);

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


            /**
             * @todo doc to do
             * @ngdoc method
             * @name go_to_url
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
            $scope.go_to_url = function (path) {

                $location.path(path);

            };

            /**
             * Filter function for licenses. It filters video licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.licenseVideoPredicateFunction = function(license) {

                return license.sku.match(/^V/);
            };

            /**
             * Filter function for licenses. It filters audio licenses for downloadable audio files.
             * Used in /partials/userprofileview.html
             */
            $scope.licenseAudioDownloadsPredicateFunction = function(license) {

                return license.sku.match(/^A.*-D/);
            };

            /**
             * Filter function for licenses. It filters subscription licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.licenseSubscriptionsPredicateFunction = function(license) {

                return license.sku.match(/^S/);
            };

            /**
             * @todo Filter function for licenses. It filters video licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.fanVideoPredicateFunction = function(item) {

                return item.system_title.match(/^V/);
            };

            /**
             * @todo Filter function for licenses. It filters video licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.fanAudioPredicateFunction = function(item) {

                return item.system_title.match(/^A/);
            };

            /**
             * @todo Filter function for licenses. It filters video licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.fanPartnerPredicateFunction = function(item) {

                return item.system_title.match(/^P/);
            };

            /**
             * @todo Filter function for licenses. It filters video licenses.
             * Used in /partials/userprofileview.html
             */
            $scope.orderCartOrCheckoutPredicateFunction = function(order) {

                return order.status.match(/(cart|checkout)/);
            };

            $scope.controller_init();

}]); // end of controller UserViewCtrl
