<?php
/**
 * @file musth_restws.lineitem.res.inc
 *
 * @brief The class LineItem is defined here. It's the object we send back to angular
 * when it queries a line item.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class LineItem {

    public $line_item_id;
    public $order_id;
    public $type;
    public $line_item_label;
    public $product_title;
    public $quantity;
    public $product_id;
    public $unit_price_amount;
    public $unit_price_currency;
    public $total_amount;
    public $total_currency;

    public function __construct($line_item_id,
                                $order_id,
                                $type = 'commerce_line_item',
                                $line_item_label = '',
                                $product_title = '',
                                $quantity = 1,
                                $product_id = 0,
                                $unit_price_amount = 0,
                                $unit_price_currency = '',
                                $total_amount = 0,
                                $total_currency = '') {

        $this->line_item_id = $line_item_id;
        $this->order_id = $order_id;
        $this->type = $type;
        $this->line_item_label = $line_item_label;
        $this->product_title = $product_title;
        $this->quantity = $quantity;
        $this->product_id = $product_id;
        $this->unit_price_amount = $unit_price_amount;
        $this->unit_price_currency = $unit_price_currency;
        $this->total_amount = $total_amount;
        $this->total_currency = $total_currency;

    }
}
