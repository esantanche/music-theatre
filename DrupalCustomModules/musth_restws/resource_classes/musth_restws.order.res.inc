<?php
/**
 * @file musth_restws.order.res.inc
 *
 * @brief The class Order is defined here. It's the object we send back to angular
 * when it queries an order.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Order {

    public $order_id;
    public $order_number;
    public $uid;
    public $mail;
    public $customer_profile_id;
    public $status;
    public $total_amount;
    public $total_currency;
    public $created;
    public $changed;

    public function __construct($order_id = 0,
                                $order_number = '',
                                $uid = 0,
                                $mail = '',
                                $customer_profile_id = 0,
                                $status = 'cart',
                                $total_amount = 0,
                                $total_currency = '',
                                $created = 0,
                                $changed = 0) {

        $this->order_id = $order_id;
        $this->order_number = $order_number;
        $this->uid = $uid;
        $this->mail = $mail;
        $this->customer_profile_id = $customer_profile_id;
        $this->status = $status;
        $this->total_amount = $total_amount;
        $this->total_currency = $total_currency;
        $this->created = $created;
        $this->changed = $changed;

    }
}
