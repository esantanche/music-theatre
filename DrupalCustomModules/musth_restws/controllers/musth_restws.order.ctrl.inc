<?php
/**
 * @file musth_restws.order.ctrl.inc
 *
 * @brief This file is about the OrderResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Order resource
 *
 * Query api
 * You can:
 * - Query a single order
 * - Query the 'cart' order(s) for the logged-in user, if any
 * - Query every order for the logged-in user
 *
 * Create api
 * You can:
 * - create an empty 'cart' order for the logged-in user or an anonymous 'cart' order
 *
 * Update api
 * You can:
 * - Change order status to move the order on along the checkout process
 * - Associate the user email to an order (you have to do this sooner or later)
 * - Associate a customer profile to an order (you have to do this sooner or later)
 * - Convert an order from anonymous to authenticated by updating the order when
 * the user is logged-in
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class OrderResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //        watchdog('musth_restws', 'W7D001 8CVB OrderResourceController __construct',
        //            array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Order this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Order
     */
    public function propertyInfo() {

        /*
         *
         *Table: commerce_order
            Columns:
            order_id	int(10) UN PK AI
            order_number	varchar(255)
            revision_id	int(10) UN
            type	varchar(255)
            uid	    int(11)
            mail	varchar(255)
            status	varchar(255)
            created	int(11)
            changed	int(11)
            hostname    varchar(128)
            data	longblob
        */

        return array(
            'order_id' => array(
                'type' => 'int',
                'label' => t('Order id'),
            ),
            'order_number' => array(
                'type' => 'text',
                'label' => t('Order number'),
            ),
            'uid' => array(
                'type' => 'int',
                'label' => t('User id'),
            ),
            'mail' => array(
                'type' => 'text',
                'label' => t('User email address'),
            ),
            'customer_profile_id' => array(
                'type' => 'int',
                'label' => t('Customer profile id'),
            ),
            'status' => array(
                'type' => 'text',
                'label' => t('Order status'),
            ),
            'total_amount' => array( // Calculated total in pence
                'type' => 'int',
                'label' => t('Total amount'),
            ),
            'total_currency' => array( // Currency the total is expressed in
                'type' => 'text',
                'label' => t('Total currency'),
            ),
            'created' => array( // Unix timestamp the order was created
                'type' => 'int',
                'label' => t('Creation unix timestamp'),
            ),
            'changed' => array( // Unix timestamp the order was last changed
                'type' => 'int',
                'label' => t('last change unix timestamp'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Order resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Order id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $order_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_order',
            $order_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case there are three possibilities:
     * - Single order
     * - Cart order
     * - Every order
     *
     * First possibility: single order
     * In this case Angular has to pass the order id
     *
     * Second possibility: cart order
     * Angular passes the credentials to log in and status='cart' as a filter.
     * We will send back the 'cart' order(s) for the logged-in user
     *
     * Third possibility: every order
     * Angular passes the credentials to log in and no filters
     * We will send back every order for the logged-in user
     *
     * @attention here, what about orders in 'checkout_...'?
     * If an order is anonymous and it's in 'checkout_*' status, we won't be able
     * to find it by using this api. It's lost and the user will have to restart
     * from scratch.
     * We can always run a rule to change these orders back to 'cart' status after
     * a while and send an email to the user if they left their email address.
     * I would avoid doing this if the user has already created a new cart.
     *
     * @restfulness Well, we should send the uid explicitly.
     * Now we are relying on the logged-in user's information. Anyway, consider
     * that orders cannot be cached because when they are queried they
     * update the order's total amount.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the order ids of the orders to be sent back
     */
    public function query($filters = array(), $meta_controls = array()) {

        global $user;

        // We don't care if an anonymous user wants to see orders that other users
        // created. We just don't send other people's email addresses to anonymous users

        // Implemented filters:
        // Single order by order id (order_id=<id>) (used also for cart orders created
        // by anonymous users)
        // Cart order of the logged in user (status='cart' and user id from $user->uid)
        // Every order for the logged in user (uid from $user->uid and no filter)

        // The filter status='cart' used to get all cart order for the logged in user
        // is still working but it's not used on the Angular side.
        // Angular uses this api to retrieve all orders for the logged-in user and
        // cart orders are included in the reply

        // Notice that the 'cart' filter returns all 'cart' orders for the logged-in user
        // if there are many of them

        // @attention here, what about orders in 'checkout_...'?
        // If an order is anonymous and it's in 'checkout_*' status, we won't be able
        // to find it by using this api. It's lost and the user will have to restart
        // from scratch

        $return_cart_for_current_user = false;
        $return_every_order_for_current_user = false;
        $order_id = 0;

        if (!empty($filters['order_id'])) {
            // If we have the order id, just send the order back
            $order_id = $filters['order_id'];
        } else {
            // No order id, let's check the status

            if (!empty($filters['status'])) {
                // If we have a status, it should be 'cart'. We are not supporting filtering
                // on other statuses now
                $status = $filters['status'];
                if ($status == 'cart') {

                    // This REST api shouldn't be called to get 'cart' orders for the logged-in user
                    // It's still working if called, but let me watchdog a warning

                    watchdog('musth_restws',
                        '6TG2PL Why is this api called to get cart orders?. (!f) (!u) ',
                        array('!f' => print_r($filters, true),
                              '!u' => print_r($user, true)),
                        WATCHDOG_WARNING);

                    // Let's go on with checking if the user is logged in
                    if ($user->uid != 0) {
                        $return_cart_for_current_user = true;
                    } else {
                        // No order id is provided, so we can only send back the 'cart' order of the
                        // logged-in user. But no user is logged in, or the credentials were wrong

                        watchdog('musth_restws',
                            'W3E069 User not logged in, we cant send back the cart order. (!f) (!u) ',
                            array('!f' => print_r($filters, true),
                                  '!u' => print_r($user, true)),
                            WATCHDOG_ERROR);

                        throw new RestWSException('No logged-in user or wrong credentials', 403);
                    }

                } else {

                    watchdog('musth_restws',
                        'W3E070 Filtering on statuses other than cart not supported (!f)',
                        array('!f' => print_r($filters, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Filtering on statuses other than cart not supported', 412);
                }

            } else {
                // No status set (and no order_id)
                // In this case we return every order associated to the logged-in user

                if ($user->uid != 0) {
                    $return_every_order_for_current_user = true;
                } else {

                    watchdog('musth_restws',
                        'W3E071 We send the full list of orders only to logged-in users. (!f) (!u) ',
                        array('!f' => print_r($filters, true),
                              '!u' => print_r($user, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('We send the full list of orders only to logged-in users', 403);
                }

            }

        } // if (isset($filters['order_id']))

        $query = new EntityFieldQuery();
        $query->entityCondition('entity_type', 'commerce_order')
              ->entityCondition('bundle', 'commerce_order');

        if ($return_cart_for_current_user)
            $query->propertyCondition('status', 'cart');

        if ($return_cart_for_current_user || $return_every_order_for_current_user)
            $query->propertyCondition('uid', $user->uid);

        if ($order_id)
            $query->propertyCondition('order_id', $order_id);

        $result = $query->execute();

        if (isset($result['commerce_order'])) {
            $order_ids = array_keys($result['commerce_order']);
        } else {
            // No order found? Throw an exception unless angular asked for all orders for the current user

            if ($return_every_order_for_current_user) {

                // If angular asked for all orders for the current user, we are in the case that the user
                // has no orders. It can be.
                $order_ids = array();

            } else {
                // In any other case we throw an exception because we should find an order

                watchdog('musth_rules', 'W3E072 No orders found (!f) (!u) ',
                    array('!f' => print_r($filters, true),
                        '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('No orders found', 404);

            }

        }

        // Commerce apis calculate the order total themselves, nothing to do about it

        //watchdog('musth_restws', 'W7D001 8181 order query flags (!f) (!m) (!n) (!i) (!q) ',
        //        array('!f' => print_r($return_cart_for_current_user, true),
        //              '!m' => print_r($return_every_order_for_current_user, true),
        //              '!n' => print_r($order_id, true),
        //              '!i' => print_r($order_ids, true),
        //              '!q' => print_r($query, true),
        //        ), WATCHDOG_DEBUG);

        return $order_ids;
    }

    /**
     * To create an order:
     * - send a POST http query
     * - authenticate as registered user or as anonymous
     * - send an empty POST message in json format
     *
     * You get back:
     * - Only the order id
     *
     * @see RestWSResourceControllerInterface::create()
     * @restfulness Well, we should send the uid explicitly.
     * Now we are relying on the logged-in user's information
     */
    public function create(array $values) {

        global $user;

        // We support only the basic order type 'commerce_order' for now

        // We ignore the order status, if any, because 'cart' orders only can be created
        // in our design

        // So, to create a new order we need just the user id or zero for anonymous carts.
        // Hostname and creation and last change timestamps are set automatically

        $order = commerce_order_new($user->uid, 'cart');

        commerce_order_save($order);

        //        watchdog('musth_restws', 'W7D001 7VQPkiu8 order create values (!v) (!o) (!u) ',
        //                array('!v' => print_r($values, true),
        //                      '!u' => print_r($user->uid, true),
        //                      '!o' => print_r($order, true)),
        //                WATCHDOG_DEBUG);

        // A create api returns the order id only
        // If you want the full object, you have to call the get method

        return $order->order_id;
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Maximum 1000 resources will be sent
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here.
     *
     * @param int $client_limit Ignored
     * @return int Maximum 1000 resources sent
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a single order
     *
     * We don't use a security token here. Simply we don't send back the user's email
     * address if it's an anonymous user. Angular has to keep it locally.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $order_id Id of the order to be sent back
     * @return Order Object containing the information described by the properties (propertyInfo)
     */
    public function read($order_id) {

        global $user;

        //watchdog('musth_restws', 'W7D001 5DXS OrderResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($order_id, true),
        //        '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        $order_as_array = entity_load('commerce_order', array($order_id));
        $order = $order_as_array[$order_id];

        // The order total, which is in the field commerce_order_total, is calculated
        // automatically when the order is refreshed, which happens at least when we
        // call the line item api to get all the line items of an order

        // Refreshing the order in case any product changed its price or there are other
        // changes to take care of

        // Since we refresh the order here, there is no need to do it when we load
        // line items. Just call the order query api first and then the line item query api

        if ($order->status == 'cart')
            commerce_cart_order_refresh($order);

        $order_wrapper = entity_metadata_wrapper('commerce_order', $order);

        //watchdog('musth_restws', 'W7D001 71788 kkk OrderResourceController read (!i) (!p) ',
        //    array('!i' => print_r('', true),
        //        '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        if (isset($order->commerce_customer_billing[LANGUAGE_NONE]))
            $customer_profile_id = $order->commerce_customer_billing[LANGUAGE_NONE][0]['profile_id'];
        else
            $customer_profile_id = 0;

        if ($user->uid) {
            // For logged-in users we can send back the email address

            $user_email = $order->mail;

        } else {
            // For anonymous users we can't

            $user_email = 'Cant send you the email address for privacy';
        }

        $order_to_return = new Order($order->order_id,
            $order->order_number,
            $order->uid,
            $user_email,
            $customer_profile_id,
            $order->status,
            $order_wrapper->commerce_order_total->amount->value(),
            $order_wrapper->commerce_order_total->currency_code->value(),
            $order->created,
            $order->changed
        );

        //watchdog('musth_restws', 'W7D001 7171 OrderResourceController read (!i) (!p) ',
        //    array('!i' => print_r('', true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Order object

        return $order_to_return;
    }

    /**
     * This is the url to use for this api: /musth_restws_order/{order_id} and it has to be a PUT http query
     *
     * To update an order you send:
     * - order id in the url as above
     * - status if you want to change the order status
     * - mail if you want to set the email address of the user owning the order
     * - customer_profile_id to associate the order with a customer profile
     *
     * The order id is mandatory. Of the others at least one has to be present otherwise
     * why did you call this api?
     *
     * We do this as well: we convert an anonymous order and associate it to an user
     * if she logs in
     *
     * @attention We will have to update orders if an user changes her email address
     * at least for 'cart' orders
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Well, we should send the uid explicitly.
     * Now we are relying on the logged-in user's information
     **/
    public function update($order_id, array $values) {

        global $user;

        //        watchdog('musth_restws', 'W7D001 OU-1 8765 order update values (!v) (!i) ',
        //            array('!v' => print_r($values, true),
        //                  '!i' => print_r($order_id, true)),
        //            WATCHDOG_DEBUG);

        // In general, the client sends only the values that we have to change

        if (!isset($order_id)) {

            watchdog('musth_restws', 'W3E073 Please, give the id of an order',
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('No order id given', 412);
        }

        // First we load the order to be sure that it exists

        $order_as_array = entity_load('commerce_order', array($order_id));

        if (empty($order_as_array)) {

            watchdog('musth_restws', 'W3E074 Please, give the id of an existing order (!o) ',
                array('!o' => print_r($order_id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Order not found, order id: ' . $order_id, 404);
        }

        $order = $order_as_array[$order_id];

        // We do order conversion here
        // If the user is logged in and the order is anonymous, we assign the order to the logged-in user

        if ($order->uid == 0 && $user->uid != 0) {
            commerce_cart_order_convert($order, $user);

            //            watchdog('musth_restws', 'W7D001 OU-1 47hf order update CONVERTION (!v) (!i) ',
            //                array('!v' => print_r($values, true),
            //                    '!i' => print_r($order_id, true)),
            //                WATCHDOG_DEBUG);

        }
        // We deal with order status changes

        if (isset($values['status'])) {
            $new_status = $values['status'];

            // We are not checking if the new status is a valid one
            // We are trusting the client with giving the right status

            if ($order->status != $new_status) {
                $status_successfully_changed = musth_restws_change_order_status($order, $new_status);

                if (!$status_successfully_changed) {

                    watchdog('musth_restws', 'W3E075 Cant change order status (!o) ',
                        array('!o' => print_r($order_id, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Cant change order status, order id: ' . $order_id, 412);
                }

                // @todo super dirty trick temporarily used to mark transaction as paid just to demonstrate the app
                //                           ->entityCondition('bundle', 'commerce_payment_transaction')

                if ($new_status == 'checkout_complete') {

                    $query = new EntityFieldQuery();
                    $query->entityCondition('entity_type', 'commerce_payment_transaction')
                          ->propertyCondition('order_id', $order_id);

                    //                    if ($return_cart_for_current_user)
                    //                        $query->propertyCondition('status', 'cart');
                    //
                    //                    if ($return_cart_for_current_user || $return_every_order_for_current_user)
                    //                        $query->propertyCondition('uid', $user->uid);
                    //
                    //                    if ($order_id)
                    //                        $query->propertyCondition('order_id', $order_id);

                    $result = $query->execute();

                    if (isset($result['commerce_payment_transaction'])) {
                        $transaction_ids = array_keys($result['commerce_payment_transaction']);

//                        watchdog('musth_restws', 'W7D001 OrderResourceController::update <br> ' .
//                                                  'transaction ids (!f) <br> order id (!m) <br> (!n) <br> (!i) <br> (!q) ',
//                                array('!f' => print_r($transaction_ids, true),
//                                      '!m' => print_r($order_id, true),
//                                      '!n' => print_r('', true),
//                                      '!i' => print_r('', true),
//                                      '!q' => print_r('', true),
//                                ), WATCHDOG_DEBUG);

                        $transaction_as_array = entity_load('commerce_payment_transaction', array($transaction_ids[0]));

                        $transaction = $transaction_as_array[$transaction_ids[0]];

                        $transaction->status = 'success';

                        commerce_payment_transaction_save($transaction);

                    } else {

                        // @todo this is a dirty trick we are using here, don't bother fixing things

                        watchdog('musth_restws', 'W7D001 OrderResourceController::update NO TRANSACTION FOUND! <br> ' .
                            ' (!f) <br> order id (!m) <br> (!n) <br> (!i) <br> (!q) ',
                            array('!f' => print_r('', true),
                                '!m' => print_r($order_id, true),
                                '!n' => print_r('', true),
                                '!i' => print_r('', true),
                                '!q' => print_r('', true),
                            ), WATCHDOG_ERROR);

                    }

                }

            }

        }

        // Do we have to update the email address? If it's set, yes

        if (isset($values['mail']))
            $order->mail = $values['mail'];

        // Update the customer profile id if provided

        if (isset($values['customer_profile_id'])) {

            $profile_id = $values['customer_profile_id'];

            $customer_profile_as_array = entity_load('commerce_customer_profile', array($profile_id));

            if (empty($customer_profile_as_array)) {

                // We need a valid customer profile after all

                watchdog('musth_restws', 'W3E076 Customer profile not found (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Customer profile not found', 404);

            } else {

                $customer_profile = $customer_profile_as_array[$profile_id];

            }

            $order_wrapper = entity_metadata_wrapper('commerce_order', $order);
            $order_wrapper->commerce_customer_billing = $customer_profile;

        }

        try {
            commerce_order_save($order);
        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E077 Error in saving an order. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving an order', 500);

        }

    }

    /**
     * Not implemented. We don't delete orders.
     *
     * If we have to delete orders, we do it by using administration tools.
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($id) {
        throw new RestWSException('Not implemented', 501);

    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        //watchdog('musth_restws', 'W7D001 6767 ProgrammeResourceController access (!o) (!i) ',
        //    array('!o' => print_r($op, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_order';
    }

}

/**
 * This function performs the status change for an order.
 * It checks the preconditions that have to be met in order for
 * the order status to change
 *
 * @attention Maybe we want to use commerce_checkout_order_can_checkout anyway
 *
 * @param $order Order Order we have to change the status of
 * @param $new_status string New status
 * @return bool TRUE if the status change was successful
 */
function musth_restws_change_order_status($order, $new_status) {

    if ($new_status == 'checkout_complete') {

        // The following check is needed to see if the order can change status to
        // checkout_complete
        if (!commerce_checkout_complete_access($order)) {
            // We can't change status
            // Actually we shouldn't have any problem because the check is based on
            // the status itself, but you never know, there could me more requirements to meet

            watchdog('musth_restws', 'W3E078 The given order cant access checkout completion (!o) ',
                array('!o' => print_r($order, true)),
                WATCHDOG_ERROR);

            return FALSE;
        }

    }

    // What about the commerce api commerce_checkout_order_can_checkout? Why don't we use it?
    // We don't because it checks if an order has at least one line item
    // We trust Angular with this check

    // Just in case, let's refresh the order before changing status
    if ($order->status == 'cart')
        commerce_cart_order_refresh($order);

    // We are skipping the save because the order will be saved later
    commerce_order_status_update($order, $new_status, TRUE);

    if ($new_status == 'checkout_complete') {
        // Staring the process that will complete the order checkout and put it in
        // the 'pending' status
        // The checkout completion rules will run
        commerce_checkout_complete($order);
    }

    return TRUE;
}