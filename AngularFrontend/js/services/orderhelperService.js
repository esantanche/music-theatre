/**
 * @ngdoc overview
 * @name Orderhelper
 * @description Service that helps with creating, loading and updating orders.
 */

var orderhelperServices = angular.module('orderhelperServices', ['orderServices', 'ordervalueServices']);

/**
 * @ngdoc service
 * @name Orderhelper.service:Orderhelper
 * @description Helper service for orders. Anything we have to do with orders has to be done by using
 * this service.
 * This service manages any status change orders go through.
 * It doesn't deal with line item tough. The LineItemhelper service manages them.
 * It's worth recalling that, every time a line item is created, we have to reload
 * the order that contains that line item to refresh it.
 * This will refresh the order's total amount.
 * @requires Order.service:Order
 * @requires Orderhelper.service:Ordervalue
 */
orderhelperServices.service('Orderhelper', [ '$q', 'Order', 'Ordervalue', 'Clientexceptionhelper',
                                             'Settings',
    function($q, Order, Ordervalue, Clientexceptionhelper, Settings) {

        //console.debug('DBG-18NH orderhelperServices');

        this.order_statuses_and_their_readable_form = [
            { status: "cart", readable_status: "CART" },
            { status: "checkout_checkout", readable_status: "CHECKOUT" },
            { status: "checkout_review", readable_status: "REVIEW" },
            { status: "checkout_payment", readable_status: "PAYMENT" },
            // The checkout_complete status should never show up. If it does, it's a bug
            { status: "checkout_complete", readable_status: "PENDING" },
            { status: "pending", readable_status: "PENDING" },
            { status: "processing", readable_status: "PROCESSING" },
            { status: "completed", readable_status: "COMPLETED" }
        ];

        var i, len;

        var self = this;

        this.readable_order_status_lookup = {};
        for (i = 0, len = this.order_statuses_and_their_readable_form.length; i < len; i++) {
            this.readable_order_status_lookup[this.order_statuses_and_their_readable_form[i].status] =
                this.order_statuses_and_their_readable_form[i].readable_status;
        }

        /**
         * @ngdoc method
         * @name load_shopping_order
         * @description This method is about the shopping order only. A separate method will load
         * every order a user ever created. The order this function loads should have either status 'cart'
         * or any of the statuses beginning with 'checkout_'.
         * If the status is different, there is a bug.
         * This method doesn't load any line item. See the LineItemhelper service for line items.
         * @methodOf Orderhelper.service:Orderhelper
         * @param {int} order_id The order id of the order we have to load
         * @returns {promise} The returned object is the order whose id we have been given
         * The method returns a promise, actually, whose payload will be that order.
         */
        this.load_shopping_order = function(order_id) {
            var deferred = $q.defer();

            //console.debug('DBG-9191 load_order ' + order_id);

            Order.query({ order_id: order_id },
                function(orders) {

                    if (orders) {

                        //console.debug('DBG-67667 load_order ');
                        //console.debug(orders);

                        // Even if we asked for a single order, we get a list anyway
                        // We just get the first item in the list because there will be
                        // only one of them
                        var returned_order = orders.list[0];

                        // We store the order id and its status for later use

                        Ordervalue.shopping_order_id = returned_order.order_id;
                        Ordervalue.status = returned_order.status;

                        // This method is about retrieving shopping orders. We shouldn't use it to get any order.
                        // For that there will be another method.
                        // The if statement below checks if we got a non-shopping order and throws an exception
                        // We return the order anyway, but a watchdog will let us know about the problem

                        if (returned_order.status != 'cart' && returned_order.status.indexOf("checkout") == -1) {

                            console.error('W3E118 The method load_shopping_order shouldnt be used to retrieve ' +
                                'non-shopping orders, we have a bug here');
                            Clientexceptionhelper.send_client_exception('W3E118 The method load_shopping_order ' +
                                'shouldnt be used to retrieve non-shopping orders, we have a bug here');

                        }

                        //console.debug('programme ' + returned_programme.nid + ' got from restws');
                        //console.debug(returned_order);

                        // Returning the order
                        deferred.resolve(returned_order);

                    } else {

                        // We got an empty response to our query

                        console.error('W3E119 Empty response when loading a shopping order');
                        Clientexceptionhelper.send_client_exception('W3E119 Empty response when loading a shopping order');
                        deferred.reject('Empty response when loading a shopping order');
                    }

                },
                function(err) {

                    console.error('W3E120 Error when loading a shopping order. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E120 Error when loading a shopping order. Reason: ' + err.status);
                    deferred.reject('Error when loading a shopping order. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name load_users_orders
         * @description This method returns all orders created by the logged-in user.
         * This method doesn't load any line item. See the LineItemhelper service for line items.
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {promise} The returned object is the list of the orders an authenticated user created.
         * The method returns a promise, actually, whose payload will be that list.
         */
        this.load_users_orders = function() {
            var deferred = $q.defer();

            console.debug('DBG-y4derf8hyy load_users_orders');

            // Here we assume that controllers checked that the user is logged in

            Order.query({ },
                function(orders) {

                    if (orders) {

                        var orders_list_for_the_logged_in_user = [];

                        if (orders.list)
                            orders_list_for_the_logged_in_user = orders.list;

                        for (var i = 0; i < orders_list_for_the_logged_in_user.length; i++) {

                            orders_list_for_the_logged_in_user[i].not_a_shopping_order =
                                Settings.non_shopping_order_statuses.indexOf(orders_list_for_the_logged_in_user[i].status) != -1;

                            //console.debug('DBG-87654321 ');
                            //console.debug()

                            if (orders_list_for_the_logged_in_user[i].order_id == Ordervalue.shopping_order_id) {

                                orders_list_for_the_logged_in_user[i].readable_status = "CURRENT CART";

                            } else {

                                orders_list_for_the_logged_in_user[i].readable_status =
                                    self.readable_order_status_lookup[orders_list_for_the_logged_in_user[i].status];

                            }

                        }

                        console.debug(orders_list_for_the_logged_in_user);

                        // Returning the order
                        deferred.resolve(orders_list_for_the_logged_in_user);

                    } else {

                        // We got an empty response to our query

                        console.error('W3E159 Orders not returned, empty response');
                        Clientexceptionhelper.send_client_exception('W3E159 Orders not returned, empty response');
                        deferred.reject('Orders not returned, empty response');
                    }

                },
                function(err) {

                    console.error('W3E160 Error in fetching a users orders. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E160 Error in fetching a users orders. Reason: ' + err.status);
                    deferred.reject('Error in fetching a users orders. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name create_order
         * @description Here we create an order. A newly created order is always a 'cart' order.
         * We store the id of the order because it's anonymous and the server won't be able to
         * find it if we don't have its id.
         * This method is internal, which means that it's used only by other methods in this service
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {promise} The returned object is the id of the new order
         * The method returns a promise, actually, whose payload will be that order id.
         */
        this.create_order = function() {
            var deferred = $q.defer();

            Order.create({ },
                function(order_id_response) {

                    if (order_id_response) {

                        //console.debug('DBG-8DCF create_order ');
                        //console.debug(order_id_response.id);

                        // The server created a new order whose id is order_id_response.id
                        // It's status is 'cart'
                        // We save these two details to be able to work more on the order later
                        // We save the status because we will change it later and we need to
                        // keep track of it

                        Ordervalue.shopping_order_id = order_id_response.id;
                        Ordervalue.status = 'cart';

                        // Returning the order id
                        deferred.resolve(order_id_response.id);

                    } else {

                        console.error('W3E121 Empty response when creating a cart order');
                        Clientexceptionhelper.send_client_exception('W3E121 Empty response when creating a cart order');
                        deferred.reject('Empty response when creating a cart order');

                    }

                },
                function(err) {

                    console.error('W3E122 Error when creating a cart order. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E122 Error when creating a cart order. Reason: ' + err.status);
                    deferred.reject('Error when creating a cart order. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name get_shopping_order_id_or_create_it
         * @description If a shopping order has already been created, we return its id.
         * If not, we call the method create_order to create it.
         * This method is used by controllers.
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {promise} The returned object is the id of the cart order
         * The method returns a promise, actually, whose payload will be that order id.
         */
        this.get_shopping_order_id_or_create_it = function() {
            var deferred = $q.defer();

            //console.debug('DBG-87CF get_shopping_order_id_or_create_it');
            //console.debug(Ordervalue.shopping_order_id);

            if (Ordervalue.shopping_order_id != 0) {

                // In this case we don't create the order because we created it
                // already and we have its id

                // We just return the id

                deferred.resolve(Ordervalue.shopping_order_id);
                return deferred.promise;

            } else {

                // We have to create the cart order because we haven't created it yet

                this.create_order().then(
                    function(order_id) {

                        //console.debug('DBG-9BGF order_id');
                        //console.debug(order_id);

                        // We have just to pass the order id to our caller

                        deferred.resolve(order_id);
                    },
                    function(reason) {

                        console.error('W3E123 Error when calling the method create_order. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E123 Error when calling the method create_order. ' +
                            'Reason: ' + reason);
                        deferred.reject('Error when calling the method create_order. Status code: ' + reason);

                    }
                );

            }

            //console.debug(Ordervalue.shopping_order_id);

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name update_order
         * @description With this method we update the shopping order. We can change its status or add
         * the customer's email or the id of their customer profile, which has to be created
         * before calling this method.
         * No need to pass the order id to this method because it works on the shopping
         * order whose details we stored in the value service Ordervalue
         * This method is internal, it is called only by other methods of this same service.
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {promise} Nothing is returned if the update is successful, an exception
         * is thrown if it's unsuccessful.
         * The method returns a promise, actually, whose payload will be empty.
         * @param {string} status New status to be given to the order
         * @param {string} [mail] User's email address
         * @param {int} [customer_profile_id] Id of the customer profile
         */
        this.update_order = function(status, mail, customer_profile_id) {
            var deferred = $q.defer();

            // We will update the following fields:
            // order_id is just Ordervalue.shopping_order_id
            // status
            // mail
            // customer_profile_id (which has to have been created when this function is called)
            // Only the status parameter is required

            if (Ordervalue.shopping_order_id == 0) {
                // We can't update the shopping order if we didn't create it yet
                // It's a bug because this method should be called only when a shopping
                // order already exists

                console.error('W3E124 The shopping order has not been created yet, we cant update it.');
                Clientexceptionhelper.send_client_exception('W3E124 The shopping order has not been created yet, we cant update it.');
                deferred.reject('The shopping order has not been created yet, we cant update it.');
            }

            var properties_to_update = { status: status };

            if (mail)
                properties_to_update['mail'] = mail;

            if (customer_profile_id)
                properties_to_update['customer_profile_id'] = customer_profile_id;

            //console.debug(properties_to_update);

            Order.update({ order_id: parseInt(Ordervalue.shopping_order_id) },
                         properties_to_update,
                function(response) {

                    //console.debug('DBG-uo6254 order updates successfully');

                    if (status == 'checkout_complete') {

                        // Actually now the order is in the status 'pending' because when
                        // we change the order status to 'checkout_complete' the status
                        // is automatically moved on to 'pending'. But this function
                        // has been called to put the order in the 'checkout_complete' status

                        // The order can now be found in the user's profile and it's no longer
                        // a shopping order

                        // We reset the order id so that the user can place another order

                        Ordervalue.status = '';
                        Ordervalue.shopping_order_id = 0;

                    } else {

                        // We updated the order status and the checkout process is not
                        // complete, so let's keep track of the status in our
                        // Ordervalue service

                        Ordervalue.status = status;
                    }

                    deferred.resolve('Order updated successfully');
                },
                function(err) {

                    console.error('W3E125 Error when updating a shopping order. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E125 Error when updating a shopping order. Reason: ' + err.status);
                    deferred.reject('Error when updating a shopping order. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name go_to_next_order_status
         * @description This method is called by controllers to move the order to the next status in
         * the checkout process. If the current shopping order is in the status 'cart' it will be moved
         * to the status 'checkout_checkout', If it's in 'checkout_checkout', it will be moved to
         * 'checkout_review', and so on
         * @methodOf Orderhelper.service:Orderhelper
         * @param {string} [mail] Email address of the user
         * @param {int} [customer_profile_id] Id of the customer profile created to collect
         * the post address of the user
         * @returns {promise} The method returns the string 'Order updated successfully' or throws an
         * exception. The method returns a promise, actually, whose payload will be that string.
         */
        this.go_to_next_order_status = function(mail, customer_profile_id) {
            var deferred = $q.defer();

            if (Ordervalue.shopping_order_id == 0) {
                // We can't move the shopping order to the next status if we didn't create it yet
                // It's a bug because this method should be called only when a shopping
                // order already exists

                console.error('W3E126 The shopping order has not been created yet, we cant update it.');
                Clientexceptionhelper.send_client_exception('W3E126 The shopping order has not been created yet, we cant update it.');
                deferred.reject('The shopping order has not been created yet, we cant update it.');
            }

            //console.debug('DBG-gtnos7263 go_to_next_order_status');

            switch(Ordervalue.status) {
                case 'cart':

                    // Moving to the status checkout_checkout

                    this.update_order('checkout_checkout', null, null).then(
                        function(response) {

                            deferred.resolve('Order updated successfully');

                        },
                        function(reason) {

                            console.error('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_checkout. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_checkout. Reason: ' + reason);
                            deferred.reject('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_checkout. Reason: ' + reason);

                        }
                    );

                    break;
                case 'checkout_checkout':

                    // Moving to the status checkout_review and setting the fields 'mail'
                    // and 'customer_profile_id' in the order
                    // The customer profile has been created before calling this method

                    this.update_order('checkout_review', mail, customer_profile_id).then(
                        function(response) {

                            deferred.resolve('Order updated successfully');

                        },
                        function(reason) {

                            console.error('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_review. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E127 Error when moving a shopping order to ' +
                                'the next status. Next status: checkout_review. Reason: ' + reason);
                            deferred.reject('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_review. Reason: ' + reason);

                        }
                    );

                    break;
                case 'checkout_review':

                    // Moving to the status checkout_payment

                    this.update_order('checkout_payment', null, null).then(
                        function(response) {

                            deferred.resolve('Order updated successfully');

                        },
                        function(reason) {

                            console.error('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_payment. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E127 Error when moving a shopping order ' +
                                'to the next status. Next status: checkout_payment. Reason: ' + reason);
                            deferred.reject('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_payment. Reason: ' + reason);

                        }
                    );

                    break;

                case 'checkout_payment':

                    // Moving to the status checkout_complete
                    // When we move an order to checkout_complete, the checkout completion rules
                    // will run and move the order to 'pending'
                    // This is dealt with in the method update_order

                    this.update_order('checkout_complete', null, null).then(
                        function(response) {

                            deferred.resolve('Order updated successfully');

                        },
                        function(reason) {

                            console.error('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_complete. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E127 Error when moving a shopping order to ' +
                                'the next status. Next status: checkout_complete. Reason: ' + reason);
                            deferred.reject('W3E127 Error when moving a shopping order to the next status. ' +
                                'Next status: checkout_complete. Reason: ' + reason);

                        }
                    );

                    break;
                default:
                    console.error('W3E128 Function go_to_next_order_status called for a non-shopping order');
                    Clientexceptionhelper.send_client_exception('W3E128 Function go_to_next_order_status called for a non-shopping order');
                    deferred.reject('Function go_to_next_order_status called for a non-shopping order');
            }

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @name put_order_back_in_cart_status
         * @description This method is called by controllers to move the order back to the 'cart' status
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {promise} The method returns the string 'Order updated successfully' or throws an
         * exception. The method returns a promise, actually, whose payload will be that string.
         */
        this.put_order_back_in_cart_status = function() {
            var deferred = $q.defer();

            console.debug('DBG-pobics8181 put_order_back_in_cart_status');

            if (Ordervalue.shopping_order_id == 0) {
                // We can't move the shopping order back to the 'cart' status if we didn't create it yet
                // It's a bug because this method should be called only when a shopping
                // order already exists

                console.error('W3E129 The shopping order has not been created yet, we cant move it back to cart');
                Clientexceptionhelper.send_client_exception('W3E129 The shopping order has not been created yet, ' +
                    'we cant move it back to cart');
                deferred.reject('The shopping order has not been created yet, we cant move it back to cart');
            }

            // If the order is already in 'cart' status, do nothing

            if (Ordervalue.status == 'cart') {

                deferred.resolve('Order already in cart status');
                return deferred.promise;
            }

            this.update_order('cart', null, null).then(
                function(response) {

                    deferred.resolve('Order updated successfully');

                },
                function(reason) {

                    console.error('W3E130 Error when moving a shopping order back to the cart status. Reason: ' + reason);
                    Clientexceptionhelper.send_client_exception('W3E130 Error when moving a shopping ' +
                        'order back to the cart status. Reason: ' + reason);
                    deferred.reject('Error when moving a shopping order back to the cart status. Reason: ' + reason);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name info_about_current_shopping_order
         * @description This method is called by controllers to know about the shopping order status and
         * call other methods as appropriate.
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {object} Object containing the shopping order's id and its status
         */
        this.info_about_current_shopping_order = function() {

            return { shopping_order_id: Ordervalue.shopping_order_id,
                     status: Ordervalue.status };
        };

        /**
         * @ngdoc method
         * @name set_the_given_order_as_shopping_order
         * @description This method is called when the logged-in user wants to complete
         * an incomplete order. The order is set as the current shopping order and put
         * in 'cart' status. By doing this, the user can complete the order by adding
         * more products and move it to checkout.
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {bool} True on success or false on failure
         */
        this.set_the_given_order_as_shopping_order = function(order) {

            //console.debug('DBG-stgoaso8GTF enter');

            // The given order should be a shopping order, not a pending/processing/complete one

            if (Settings.non_shopping_order_statuses.indexOf(order.status) != -1) {
                // The given order is not a shopping order
                // We can't use a non-shopping order as cart
                // This is a bug, this function should not be called in this case

                console.error('W3E161 The given order is not a shopping order');
                Clientexceptionhelper.send_client_exception('W3E161 The given order is not a shopping order');

                return false;
            }

            // We can't check if the user is logged in because we can't use the Userhelper service here.
            // It would create a circular dependence.

            // We are trusting the calling function with providing a proper order, one that actually exists
            // and whose data is correct

            // Our shopping order is now the given one
            // The previous one will be lost if it was anonymous. Actually, since now the user is logged in,
            // any anonymous order should have been converted to authenticated

            Ordervalue.shopping_order_id = order.order_id;
            Ordervalue.status = order.status;

            //console.debug('DBG-stgoaso8GTF Ordervalue');
            //console.debug(Ordervalue);

            // This will put in cart status the current shopping order which is the one
            // whose id is Ordervalue.shopping_order_id
            // Ordervalue.shopping_order_id is now order.order_id, so it's the order we were given that
            // we are putting in cart status

            // @todo this function does its exception handling, but we may want to do some of it
            // here too
            this.put_order_back_in_cart_status();

            // Assuming, for now, that everything is fine
            return true;
        };

        /**
         * @ngdoc method
         * @name convert_the_current_shopping_order
         * @description When a user logs in, we want to convert any existing shopping order
         * To convert an order means to associate it to an authenticated user if it is
         * anonymous. Here we want to associate the current shopping order, if any,
         * to the just logged-in user.
         * @attention We should check if the shopping order is anonymous
         * If we ask for a non-anonymous order to be converted, it does no harm because
         * the order rest api will check, but we can save a rest call if we do the check here
         * For now we don't do the check and call the rest api anyway
         * @methodOf Orderhelper.service:Orderhelper
         * @returns {bool} True on success or false on failure
         */
        this.convert_the_current_shopping_order = function() {

            // This function is called by the Userhelper service when a login has just been performed
            // If there is any anonymous shopping order, we have to convert it
            // This means that we have to associate the order to the user who just logged in

            // We would like to check if the user is logged in
            // This function should be called precisely when the user logs in
            // We can't check if the user is logged in because there would be
            // a circular dependence between this service (Orderhelper) and
            // the service Userhelper

            // We check if there is a shopping order

            if (Ordervalue.shopping_order_id == 0) {
                // No shopping order to convert

                // No exception here. This function can be called even if there is no
                // shopping order to convert.
                // It just does the check and returns

                return true;
            }

            // We should check if the shopping order is anonymous
            // If we ask for a non-anonymous order to be converted, it does no harm because
            // the order rest api will check, but we can save a rest call if we do the check here
            // For now we don't do the check and call the rest api anyway

            // @todo any exception handling here? use of 'then'?

            // Sure it's null, null, null! We are not changing anything here
            // The difference is that the user is now logged in. The rest api will see this and proceed to
            // perform the conversion

            this.update_order(null, null, null);

            // @todo is this ok?
            return true;
        };

        /**
         * @ngdoc method
         * @name reset_shopping_order
         * @description This function forgets the current shopping cart. This may be needed on user logout
         * for instance. We don't want another user to be shown a user's shopping cart.
         * After this function execution, a new shopping cart will have to be created for the anonymous user
         * and, if the user logs in, it will be converted.
         * @methodOf Orderhelper.service:Orderhelper
         */
        this.reset_shopping_order = function() {

            Ordervalue.shopping_order_id = 0;
            Ordervalue.status = '';

        }

    }

]);

/**
 * @ngdoc service
 * @name Orderhelper.service:Ordervalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about the shopping order we created using the method
 * create_order.
 * It stores the id of the shopping order and its status. We need the id to update the order
 * and the status to keep track of it along the checkout process.
 * Only the Orderhelper service should use this service.
 */
var ordervalueServices = angular.module('ordervalueServices', [ ]);

ordervalueServices.value('Ordervalue', { shopping_order_id: 0,
                                         status: '' }
);

/**
 * This is my reference table for calling rest apis

 Order.create({ order_id: 3566, status: 'cart', hostname: '234.22.44.33' },
 function(order_creation_object) {
 console.debug('DBG-6HNB returning from order create id: ' + order_creation_object.id);
 });

 Order.query({ order_id: 2822, status: 'cart'},
 function(orders) {
 console.debug('DBG-1NHJ returning from query');
 console.debug(orders);
 });

 Order.update({ order_id: 777, status: 'cart', order_number: 'KIJ89' },
 function(dummyreply) {
 console.debug('DBG-7VFG returning from update');
 console.debug(dummyreply);
 });

 Order.delete({ order_id: 7767 },
 function(dummyreply) {
 console.debug('DBG-0178 returning from delete');
 console.debug(dummyreply);
 });
 */