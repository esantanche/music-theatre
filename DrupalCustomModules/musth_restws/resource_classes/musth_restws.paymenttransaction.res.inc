<?php
/**
 * @file musth_restws.paymenttransaction.res.inc
 *
 * @brief The class PaymentTransaction is defined here. It's the object we send back to angular
 * when it queries a payment transaction
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class PaymentTransaction {

    public $transaction_id;
    public $uid;
    public $order_id;
    public $remote_id;
    public $amount;
    public $currency_code;
    public $status;
    public $remote_status;
    public $payload;

    public function __construct($transaction_id,
                                $uid,
                                $order_id,
                                $amount,
                                $currency_code,
                                $status,
                                $remote_id = '',
                                $remote_status = '',
                                $payload = '') {

        $this->transaction_id = $transaction_id;
        $this->uid = $uid;
        $this->order_id = $order_id;
        $this->amount = $amount;
        $this->currency_code = $currency_code;
        $this->status = $status;
        $this->remote_id = $remote_id;
        $this->remote_status = $remote_status;
        $this->payload = $payload;

    }
}
