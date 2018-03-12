<?php
/**
 * @file musth_restws.paymenttransaction.ctrl.inc
 *
 * @brief This file is about the PaymentTransactionResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the PaymentTransaction resource
 *
 * Query api
 * You can:
 * - Query a single transaction
 *
 * Create api
 * You can:
 * - Create a pending transaction
 *
 * Update api
 * You can:
 * - Set a transaction as successful or failed
 *
 * Sure we want to check if a transaction was really successful, we don't trust the client in this
 * case because a hacker may be wanting to set a transaction as successful when it isn't
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// For the definition of this payment method, see file commerce_payment_example.module
define('MUSICTHEATRE_PAYMENT_METHOD', 'commerce_payment_example');

class PaymentTransactionResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

//        watchdog('musth_restws', 'W7D001 0ASD PaymentTransactionResourceController __construct',
//            array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource PaymentTransaction this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource PaymentTransaction
     */
    public function propertyInfo() {

        /*
         * Table: Table: commerce_payment_transaction
        Columns:
        transaction_id	int(10) UN PK AI
        revision_id	int(10) UN
        uid	int(11)
        order_id	int(10) UN
        payment_method	varchar(128)
        instance_id	varchar(255)
        remote_id	varchar(255)
        message	longtext
        message_variables	longblob
        amount	int(11)
        currency_code	varchar(32)
        status	varchar(128)
        remote_status	varchar(128)
        payload	longblob  This is what we have to send to the payment gateway
        created	int(11) DONT USE THIS
        changed	int(11) DONT USE THIS
        data	longblob DONT USE THIS
        */

        return array(
            'transaction_id' => array(
                'type' => 'int',
                'label' => t('Transaction id'),
            ),
            'uid' => array(
                'type' => 'int',
                'label' => t('user id'),
            ),
            'order_id' => array(
                'type' => 'int',
                'label' => t('Order id'),
            ),
            'remote_id' => array(
                'type' => 'Text',
                'label' => t('Id given by the payment gateway'),
            ),
            'amount' => array(
                'type' => 'int',
                'label' => t('Amount'),
            ),
            'currency_code' => array(
                'type' => 'Text',
                'label' => t('Currency'),
            ),
            'status' => array(
                'type' => 'Text',
                'label' => t('Status (pending/success/failure)'),
            ),
            'remote_status' => array(
                'type' => 'Text',
                'label' => t('Remote status from payment gateway'),
            ),
            'payload' => array( // Sure this payload has to be encrypted
                'type' => 'Text',
                'label' => t('Payload to be sent to the payment gateway'),
            ),
        );
    }

    /**
     * Metadata wrapper for the PaymentTransaction resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int PaymentTransaction id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $payment_transaction_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_payment_transaction',
            $payment_transaction_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * For now we just query single transactions. To do this, Angular has to provide a transaction id.
     *
     * @attention For now we don't check if the logged-in owns the transaction, we just return it anyway.
     *
     * @restfulness Yes. User id is not used here
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the transaction id of the transaction to be returned
     */
    public function query($filters = array(), $meta_controls = array()) {

        // global $user; I may need a user later

//        watchdog('musth_restws', 'W7D001 PTQ-1 1LMZ paym trans query <br> filters (!f) <br> user (!u) ',
//            array('!f' => print_r($filters, true),
//                  '!u' => print_r('', true)
//            ), WATCHDOG_DEBUG);

        // Filters to be implemented:
        // A single transaction given a transaction id (transaction_id=<id>)

        // Ideas for other filters:
        // - Transactions given an order id
        // - Transaction for the logged in user

        // Case 1: A transaction given its id

        // Check if the transaction exists and return its id

        if (isset($filters['transaction_id'])) {

            // If we have the transaction id, we have to send back that transaction only
            $transaction_id = $filters['transaction_id'];

            $transaction_as_array = entity_load('commerce_payment_transaction', array($transaction_id));

            if (empty($transaction_as_array)) {

                watchdog('musth_restws', 'W3E079 Please, give the id of an existing transaction (!f) ',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Transaction not found', 404);

            }

        } else {

            watchdog('musth_restws', 'W3E080 Please, give the id of a transaction (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Give the id of a transaction', 412);
        }

        // End case 1 (more cases to come...)

        return array($transaction_id);
    }

    /**
     * To create a transaction:
     * * Send a POST http query
     * * Send: order_id, amount (integer), currency_code (GBP)
     * * The sent message has to be in json format
     *
     * @attention We may want to implement:
     * - A check on the existence of the order the transaction has to be associated
     * - A check that the logged-in user is the same as the owner of the order the transaction has to be
     * associated to
     *
     * @see RestWSResourceControllerInterface::create()
     * @restfulness Well, we should send the uid explicitly.
     * Now we are relying on the logged-in user's information.
     */
    public function create(array $values) {

        global $user; // We need $user because we have to set the uid property of the transaction resource

        //watchdog('musth_restws', 'W7D001 PTC-start ZXCV \PaymentTransactionResourceController::create values (!v) (!u) ',
        //    array('!v' => print_r($values, true),
        //          '!u' => print_r($user->uid, true)),
        //    WATCHDOG_DEBUG);

        // Values we need to create a transaction
        // uid: $user->uid (maybe we don't need this)
        // order_id: needed
        // amount: needed
        // currency_code: needed
        // status: a transaction is created with status='pending'
        // method: It's MUSICTHEATRE_PAYMENT_METHOD, see file
        // sites/all/modules/commerce/modules/payment/modules/commerce_payment_example.module

        // Let's get the values we need

        // First we need the order id

        $the_given_values_are_valid = true;
        $order_id = 0;
        $amount = 0;
        $currency_code = '';

        if (isset($values['order_id']) && !empty($values['order_id'])) {
            $order_id = $values['order_id'];
        } else {
            // We need an order id
            $the_given_values_are_valid = false;
        }

        // Second, we need an amount

        if (isset($values['amount']) && !empty($values['amount'])) {
            $amount = intval($values['amount']);

            if (!is_numeric($amount) || !is_integer($amount))
                $the_given_values_are_valid = false;

            //watchdog('musth_restws', 'W7D001 PTC 6TGB \PaymentTransactionResourceController::create <br/> (!v) <br/> (!u) <br/> (!p) ',
            //    array('!v' => print_r(is_numeric($amount), true),
            //        '!u' => print_r(is_integer($amount), true),
            //        '!p' => print_r($the_given_values_are_valid, true)),
            //    WATCHDOG_DEBUG);

        } else {
            $the_given_values_are_valid = false;
        }

        // Third, we need the currency
        // Now it's only GBP

        if (isset($values['currency_code']) && !empty($values['currency_code'])) {
            $currency_code = $values['currency_code'];

            if ($currency_code != 'GBP')
                $the_given_values_are_valid = false;

            //watchdog('musth_restws', 'W7D001 PTC 1MNB \PaymentTransactionResourceController::create <br/> (!v) <br/> (!u) <br/> (!p) ',
            //    array('!v' => print_r('', true),
            //        '!u' => print_r('', true),
            //        '!p' => print_r($the_given_values_are_valid, true)),
            //    WATCHDOG_DEBUG);

        } else {
            $the_given_values_are_valid = false;
        }

        // @attention We may want to send back a detailed message about the problem
        // we had with the values. For now we just send a generic message

        if (!$the_given_values_are_valid) {

            watchdog('musth_restws',
                'W3E081 The given values are invalid (!v) ',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('The given values are invalid', 412);
        }

        $payment_transaction = commerce_payment_transaction_new(MUSICTHEATRE_PAYMENT_METHOD, $order_id);

        // We have to set the transaction status

        $payment_transaction->status = COMMERCE_PAYMENT_STATUS_PENDING;

        $payment_transaction->uid = $user->uid;

        // Now the amount

        // A safety check, just in case

        if ($amount == 0) {

            watchdog('musth_restws',
                'W3E082 Amount is zero (!v) ',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Amount is zero', 412);
        }

        $payment_transaction->amount = $amount;

        // The currency code

        // A safety check

        if (empty($currency_code)) {

            // This check is a bit redundant, but it here...

            watchdog('musth_restws',
                'W3E083 Empty currency code (!v) ',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Empty currency code', 412);
        }

        $payment_transaction->currency_code = $currency_code;

        // @todo these fields are just an example, we will have to review them
        // when we have the payment gateway defined

        $payment_transaction->message = 'Emanuele was here @amount @currency_code';
        $payment_transaction->message_variables = array(
            '@amount' => $amount,
            '@currency_code' => $currency_code,
        );

        $payment_transaction->payload = array(
            'Amount' => $amount,
            'Currency' => $currency_code,
        );

        try {
            commerce_payment_transaction_save($payment_transaction);
        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E084 Error in saving a transaction. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a transaction', 500);
        }

        //watchdog('musth_restws', 'W7D001 PTC-end 7VQP \PaymentTransactionResourceController::create <br/> (!v) <br/> (!u) <br/> (!p) ',
        //        array('!v' => print_r($values, true),
        //              '!u' => print_r($user->uid, true),
        //              '!p' => print_r($payment_transaction, true)),
        //        WATCHDOG_DEBUG);

        // A create api returns the entity id only
        // If you want the full object, you have to call the get method

        return $payment_transaction->transaction_id;
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
     * @return int Maximum 1000 resources will be sent
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a transaction
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $transaction_id Id of the transaction to be returned
     * @return PaymentTransaction Object containing the information described by the properties (propertyInfo)
     */
    public function read($transaction_id) {

//        watchdog('musth_restws', 'W7D001 LKJH TPR-start \PaymentTransactionResourceController::read start (!i) (!p) ',
//            array('!i' => print_r($transaction_id, true),
//                  '!p' => print_r('', true)),
//            WATCHDOG_DEBUG);

        $transaction_as_array = entity_load('commerce_payment_transaction', array($transaction_id));
        $transaction = $transaction_as_array[$transaction_id];

        $transaction_to_return = new PaymentTransaction($transaction_id,
            $transaction->uid,
            $transaction->order_id,
            $transaction->amount,
            $transaction->currency_code,
            $transaction->status,
            $transaction->remote_id,
            $transaction->remote_status,
            $transaction->payload
        );

        //watchdog('musth_restws', 'W7D001 DFGT TPR-end \PaymentTransactionResourceController::read end (!i) (!p) ',
        //    array('!i' => print_r($transaction_to_return, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // Sending back the PaymentTransaction object

        return $transaction_to_return;
    }

    /**
     * To update a transaction:
     * * You send a PUT http query
     * * You call the url /musth_restws_payment_transaction/{transaction_id}
     * * You send the fields to be updated in json format
     * * Typically you send the field 'status' because you want to set a transaction as
     * successful or failed
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Yes. User id doesn't participate to this method.
     * @param int $transaction_id Id of the transaction to update
     * @param array $values Array of the properties that we have to update
     * @throws RestWSException
     */
    public function update($transaction_id, array $values) {

//        watchdog('musth_restws', 'W7D001 HGFD \PaymentTransactionResourceController::update values (!v) (!i) ',
//            array('!v' => print_r($values, true),
//                  '!i' => print_r($transaction_id, true)),
//            WATCHDOG_DEBUG);

        // To call this api, Angular has to provide a transaction id, the transaction id of the
        // transaction to update

        if (!isset($transaction_id)) {

            watchdog('musth_restws', 'W3E085 Please, give the id of a transaction',
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('Please, give the id of a transaction', 412);
        }

        // Let's check if the transaction exists

        $transaction_as_array = entity_load('commerce_payment_transaction', array($transaction_id));

        if (empty($transaction_as_array)) {

            watchdog('musth_restws', 'W3E086 Please, give the id of an existing transaction (!t) ',
                array('!t' => print_r($transaction_id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Transaction not found, transaction id: ' . $transaction_id, 404);
        }

        $transaction = $transaction_as_array[$transaction_id];

        if (isset($values['payload'])) {

            // @todo for now let's say that the payload is just a string
            // We have to see which payment gateway we will use so that we can see
            // which sort of payload we have to deal with

            $transaction->payload = $values['payload'];

        }

        if (isset($values['status'])) {

            // We check if the new status is valid

            $new_status = $values['status'];

            if (!commerce_payment_transaction_status_load($new_status)) {

                watchdog('musth_restws', 'W3E087 The given status is invalid (!t) (!v) ',
                    array('!t' => print_r($transaction_id, true),
                          '!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Invalid status provided when updating a transaction, transaction id: ' . $transaction_id, 412);
            }

            $transaction->status = $values['status'];

        }

        try {
            commerce_payment_transaction_save($transaction);
        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E088 Error in saving a transaction. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a transaction', 500);
        }

        //watchdog('musth_restws', 'W7D001 9SLG \PaymentTransactionResourceController::update (!i) (!t) ',
        //    array('!i' => print_r('', true),
        //          '!t' => print_r($transaction, true)),
        //    WATCHDOG_DEBUG);

        // It looks like we have just to tell that the update was successful

        // a return is ignored here
        //return TRUE;
    }

    /**
     * Not implemented. We don't delete transactions.
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($id) {
        throw new RestWSException('Not implemented', 501);

        // we may want to check if the order exists and throw a
        // RestWSException('Not found', 404) is it doesn't

        // do we need this: commerce_cart_order_product_line_item_delete

        // commerce_line_item_delete_references if you delete a line item, you should
        // delete its references

        // make sure that the order gets updated, but this is done by the api
        // commerce_cart_order_refresh next time you query the order

        //watchdog('musth_restws', 'W7D001 ZXCV line item delete values (!v) (!i) ',
        //    array('!v' => print_r('', true),
        //        '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // if you don't find sth, send this error:
        //throw new RestWSException('Not found', 404);

        // a return is ignored here
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

        return 'musth_restws_payment_transaction';
    }

}
