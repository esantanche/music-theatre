/**
 * @ngdoc overview
 * @name ShoppingOrderPanelCtrl
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
  controller('ShoppingOrderPanelCtrl', ['$scope', 'Programme', 'URLsKit',
                             'Programmehelper', 'Urlskithelper',
                             'Clientexceptionhelper', 'SearchTermhelper',
                             'Userhelper', 'Orderhelper', 'LineItemhelper',
                             'Tagringhelper', 'Dialoghelper',
                             'CustomerProfilehelper', 'PaymentTransactionhelper',
                             '$routeParams',
        function($scope, Programme, URLsKit,
                 Programmehelper, Urlskithelper,
                 Clientexceptionhelper, SearchTermhelper,
                 Userhelper, Orderhelper, LineItemhelper,
                 Tagringhelper, Dialoghelper,
                 CustomerProfilehelper, PaymentTransactionhelper,
                 $routeParams) {

            // @todo we will have to reload the user profile by calling
            // Userhelper.reload_user_details() after an order's checkout completed
            // to refresh the licenses. Or maybe we call Userhelper.fetch_user_details

            // @todo fix this comment By using ng-if for the shopping panel we have that this controller is initialised
            // every time it's shown
            $scope.controller_init = function () {

                //console.debug('DBG-sopc 98SD ShoppingOrderPanelCtrl init');

                $scope.controller_name = 'ShoppingOrderPanelCtrl';

                //console.debug('DBG-sopc 1BHG shoppingorderinfo.section_to_show ' +
                //    $scope.shoppingorderinfo.section_to_show);

                //console.debug('DBG-sopc 8DER shoppingorderinfo.show ' +
                //    $scope.shoppingorderinfo.show);

                // When the view is initialised, we load the cart
                // @todo please explain: if there is no cart? do we create it?
                $scope.load_shopping_order();

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

            };

            $scope.load_shopping_order = function () {

                // @todo this comment is not updated to the most recent changes
                // in the login process
                // The method get_shopping_order_id_or_create_it may
                // create a shopping order if one has not been created
                // yet. In this case, we want the newly created shopping
                // order to be associated to the logged in user, if any

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();
                else
                    Userhelper.prepare_for_anonymous_call();

                Orderhelper.get_shopping_order_id_or_create_it().then(
                    function (shopping_order_id) {
                        $scope.shopping_order_id = shopping_order_id;

                        Orderhelper.load_shopping_order(shopping_order_id).then(
                            function (order) {

                                //console.debug('DBG-7CXD order');
                                //console.debug(order);

                                $scope.shopping_order = order;

                                LineItemhelper.load_line_items(order.order_id).then(
                                    function (line_items) {

                                        if (typeof line_items === "undefined") {
                                            line_items = [];
                                        }

                                        //console.debug('DBG-yGVF order load_line_items');
                                        //console.debug(line_items);
                                        //console.debug(line_items.length);

                                        $scope.line_items = line_items;

                                    },
                                    function (reason) {
                                        // @todo excpt
                                    }
                                );

                            },
                            function (reason) {
                                // @todo excpt
                            }
                        );

                        //console.debug('DBG-1LAG ');
                        //console.debug(search_terms.list);

                    },
                    function (reason) {

                        console.error('W3E??? search term  not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E??? fixme Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            $scope.remove_line_item = function(line_item_id) {

                //console.debug('DBG-3456 remove_line_item: ' + line_item_id);

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();
                else
                    Userhelper.prepare_for_anonymous_call();

                LineItemhelper.remove_line_item(line_item_id).then(
                    function(response) {

                        $scope.load_shopping_order();

                    },
                    function(reason) {

                        // @todo fix everything
                        console.error('W3E??? fixme Programme not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E032 Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            // This function just updates the order to move it to the next status
            $scope.move_order_to_next_status_and_reload_shopping_order = function(email, customer_profile_id) {

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();
                else
                    Userhelper.prepare_for_anonymous_call();

                Orderhelper.go_to_next_order_status(email, customer_profile_id).then(
                    function(response) {

                        //console.debug('DBG-7GBX process_workflow_to_move_order_to_next_status');
                        //console.debug(order_id);

                        // @todo I have to reload the shopping order here

                        //deferred.resolve(order_id);
                        $scope.load_shopping_order();

                    },
                    function(reason) {

                        // @todo excpt handling

                        console.error('W3E?????? FIXME not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E031 Urlskit not loaded. Reason ' +
                        //    reason);
                        // @todo What do we say to the user?
                        //alert('Error in connecting to the server. Please, check your internet connection.');

                    }
                );

            };

            /**
             * @todo doc
             *
             * @todo needing info to create customer profile and email for the order
             *
             * Here all the order processing happens. We do all things we have to do to manage the
             * order process. We create customer profiles, payment transactions etc
             */
            $scope.process_workflow_to_move_order_to_next_status = function(info_for_customer_profile_and_email) {

                //console.debug('DBG-YUHY-a process_workflow_to_move_order_to_next_status');

                // @todo no checks to do here?

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();
                else
                    Userhelper.prepare_for_anonymous_call();

                //console.debug('DBG-YUHY-b $scope.shopping_order');
                //console.debug($scope.shopping_order);
                //
                //console.debug('DBG-YUHY-c info_for_customer_profile_and_email');
                //console.debug(info_for_customer_profile_and_email);

                //    $scope.checkout_checkout_info.email,
                //    $scope.checkout_checkout_info.name_line);

                // @todo here we will have to create the transaction as well

                // @todo maybe we have to update the transaction to change its status to successful?
                // it depends on the payment gateway

                var email_for_order = null;
                var customer_profile_creation_promise = null;
                var payment_transaction_creation_promise = null;

                if ($scope.shopping_order.status == 'checkout_checkout' && info_for_customer_profile_and_email) {

                    //console.debug('DBG-YUHY-c info_for_customer_profile_and_email in defined');

                    customer_profile_creation_promise =
                        CustomerProfilehelper.create_customer_profile(info_for_customer_profile_and_email);

                    email_for_order = info_for_customer_profile_and_email.email;

                }

                if ($scope.shopping_order.status == 'checkout_review') {

                    //console.debug('DBG-pwtmotns6262 order in checkout_review moving to payment');

                    //(order_id, amount, currency_code) {

                    payment_transaction_creation_promise =
                        PaymentTransactionhelper.create_transaction($scope.shopping_order.order_id,
                                                                    $scope.shopping_order.total_amount,
                                                                    $scope.shopping_order.total_currency);

                    //email_for_order = info_for_customer_profile_and_email.email;

                }

                if (customer_profile_creation_promise) {

                    customer_profile_creation_promise.then(
                        function(customer_profile_id) {
                            //customer_profile_id_response.id

                            //console.debug('DBG-pwtmotns9263 customer_profile_id = ' + customer_profile_id);

                            $scope.move_order_to_next_status_and_reload_shopping_order(email_for_order, customer_profile_id);

                        },
                        function(reason) {

                            // @todo excpt handling

                            console.error('W3E?????? FIXME dhbc67 not loaded. Reason: ' + reason);
                            //Clientexceptionhelper.send_client_exception('W3E031 Urlskit not loaded. Reason ' +
                            //    reason);
                            // @todo What do we say to the user?
                            //alert('Error in connecting to the server. Please, check your internet connection.');

                        }
                    );

                } else if (payment_transaction_creation_promise) {

                    payment_transaction_creation_promise.then(
                        function(payment_transaction_id) {
                            //customer_profile_id_response.id

                            //console.debug('DBG-pwtmotns6661 payment_transaction_id = ' + payment_transaction_id);

                            $scope.move_order_to_next_status_and_reload_shopping_order(null, null);

                        },
                        function(reason) {

                            // @todo excpt handling

                            console.error('W3E?????? FIXME 19f7hc not loaded. Reason: ' + reason);
                            //Clientexceptionhelper.send_client_exception('W3E031 Urlskit not loaded. Reason ' +
                            //    reason);
                            // @todo What do we say to the user?
                            //alert('Error in connecting to the server. Please, check your internet connection.');

                        }
                    );

                } else {

                    // No customer profile and no payment transaction to create, let's update the order
                    // and reload the shopping cart (which means reload the order

                    $scope.move_order_to_next_status_and_reload_shopping_order(null, null);

                }

                // @todo I can create a customer profile if the user is logged in and already has a customer profile
                // there will be many customer profiles and the user can choose between them

                // @todo attention! when we create the customer profile, we have to call the customer profile helper

                // @todo here we need promises because we can't reload the shopping cart if the update isn't finished yet

            }

            $scope.cancel_and_go_back_to_the_cart = function() {

                // @todo everything to do here

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();
                else
                    Userhelper.prepare_for_anonymous_call();

                Orderhelper.put_order_back_in_cart_status().then(
                    function(response) {

                        //console.debug('DBG-7GBX process_workflow_to_move_order_to_next_status');
                        //console.debug(order_id);

                        // @todo I have to reload the shopping order here

                        //deferred.resolve(order_id);
                        $scope.load_shopping_order();

                    },
                    function(reason) {

                        // @todo excpt handling

                        console.error('W3E?????? FIXME not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E031 Urlskit not loaded. Reason ' +
                        //    reason);
                        // @todo What do we say to the user?
                        //alert('Error in connecting to the server. Please, check your internet connection.');

                    }
                );

            };

            /**
             * @todo fix
             * @param programme
             * @param track
             * @param buy_for_shipping
             * @returns {boolean}
             * @todo delete this comment please buy_programme_or_track(programme, null, false)"
             */
            $scope.buy_programme_or_track = function(programme, track, buy_for_shipping) {
                //console.debug('DBG-bpor7281 buy_programme_or_track');
                //console.debug(programme);
                //console.debug(programme.system_title);

                //console.debug(track);
                //console.debug(track.segment_no);
                //console.debug(track.track_no);

                // info_about_current_shopping_order

                if (track && buy_for_shipping) {
                    // @todo exct handling

                    console.error('You cant buy a track for shipping');
                    // @todo any message to the server?

                    return false;
                }

                // safety forcing buy_for_shipping to false in case of bugs
                if (track)
                    buy_for_shipping = false;

                // We have to call put_order_back_in_cart_status only if there actually is a shopping order
                // because put_order_back_in_cart_status throws an exception if there is no shopping order
                // It's a safety check.

                var info_about_current_shopping_order = Orderhelper.info_about_current_shopping_order();

                if (info_about_current_shopping_order.shopping_order_id != 0 &&
                    info_about_current_shopping_order.status != 'cart') {

                    if ($scope.user.uid != 0)
                        Userhelper.prepare_for_call_with_credentials();
                    else
                        Userhelper.prepare_for_anonymous_call();

                    // @todo what if put_order_back_in_cart_status is unsuccessful?
                    Orderhelper.put_order_back_in_cart_status();
                }

                // The method add_programme_or_track_to_the_cart may
                // create a shopping order if one has not been created
                // yet. In this case, we want the newly created shopping
                // order to be associated to the logged in user, if any

                // @todo what if this function is unsuccessful?
                LineItemhelper.add_programme_or_track_to_the_cart(programme, track, buy_for_shipping);

                $scope.shoppingorderinfo.show = false;

                //frontends/angular/app/js/controllers/ShoppingOrderPanelCtrl.js:432

                //console.debug('@ShoppingOrderPanelCtrl adding line');

                Dialoghelper.standard_dialog_for_message('PRODUCT_ADDED');

                // After a product put in cart, we show a confirmation
                // @todo sure? does it work? $scope.shoppingorderinfo.section_to_show = 'confirmation';

                // @todo we are not checking for put_order_back_in_cart_status and
                // add_programme_or_track_to_the_cart to be successful
                return true;
            };

            /**
             * @todo fix everything
             * @todo delete this comment please buy_programme_or_track(programme, null, false)"
             * @param sku
             * @returns {boolean}
             */
            $scope.buy_product_by_sku = function(sku) {
                //console.debug('DBG-7vhyyy buy_product_by_sku');
                //console.debug(programme);
                //console.debug(programme.system_title);

                //console.debug(track);
                //console.debug(track.segment_no);
                //console.debug(track.track_no);

                // @todo safety checks?
                // @todo checking sku for empty?

                // info_about_current_shopping_order

                //if (track && buy_for_shipping) {
                //    // @todo exct handling
                //
                //    console.error('You cant buy a track for shipping');
                //    // @todo any message to the server?
                //
                //    return false;
                //}

                // safety forcing buy_for_shipping to false in case of bugs
                //if (track)
                //    buy_for_shipping = false;

                // @todo fix these comments!!
                // We have to call put_order_back_in_cart_status only if there actually is a shopping order
                // because put_order_back_in_cart_status throws an exception if there is no shopping order
                // It's a safety check.

                var info_about_current_shopping_order = Orderhelper.info_about_current_shopping_order();

                if (info_about_current_shopping_order.shopping_order_id != 0 &&
                    info_about_current_shopping_order.status != 'cart') {

                    if ($scope.user.uid != 0)
                        Userhelper.prepare_for_call_with_credentials();
                    else
                        Userhelper.prepare_for_anonymous_call();

                    // @todo what if put_order_back_in_cart_status is unsuccessful?
                    Orderhelper.put_order_back_in_cart_status();
                }

                // The method add_programme_or_track_to_the_cart may
                // create a shopping order if one has not been created
                // yet. In this case, we want the newly created shopping
                // order to be associated to the logged in user, if any

                // @todo what if this function is unsuccessful?
                LineItemhelper.add_product_by_sku_to_the_cart(sku);

                $scope.shoppingorderinfo.show = false;

                Dialoghelper.standard_dialog_for_message('PRODUCT_ADDED');

                // After a product put in cart, we show a confirmation
                // @todo ok? $scope.shoppingorderinfo.section_to_show = 'confirmation';

                // @todo we are not checking for put_order_back_in_cart_status and
                // add_product_by_sku_to_the_cart to be successful
                return true;
            };

            /**
             * @todo fix
             * @todo in the future there may be many subscriptions
             * So, we will perform a rest call to retrieve the list of all available subscriptions
             * it will be done by the producthelper service
             * @param sku @todo doc
             */
            $scope.buy_subscription = function(sku) {

                // We have to call put_order_back_in_cart_status only if there actually is a shopping order
                // because put_order_back_in_cart_status throws an exception if there is no shopping order
                // It's a safety check.

                var info_about_current_shopping_order = Orderhelper.info_about_current_shopping_order();

                if (info_about_current_shopping_order.shopping_order_id != 0 &&
                    info_about_current_shopping_order.status != 'cart') {

                    if ($scope.user.uid != 0)
                        Userhelper.prepare_for_call_with_credentials();
                    else
                        Userhelper.prepare_for_anonymous_call();

                    // @todo what if put_order_back_in_cart_status is unsuccessful?
                    Orderhelper.put_order_back_in_cart_status();
                }

                // The method add_product_by_sku_to_the_cart may
                // create a shopping order if one has not been created
                // yet. In this case, we want the newly created shopping
                // order to be associated to the logged in user, if any

                // @todo fix this
                LineItemhelper.add_product_by_sku_to_the_cart(sku);

                $scope.shoppingorderinfo.show = false;

                Dialoghelper.standard_dialog_for_message('PRODUCT_ADDED');

                // After a product put in cart, we show a confirmation
                // @todo ok? $scope.shoppingorderinfo.section_to_show = 'confirmation';

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
