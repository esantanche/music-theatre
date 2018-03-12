<?php
/**
 * @file musth_restws.product.res.inc
 *
 * @brief The class Product is defined here. It's the object we send back to angular
 * when it queries products.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Product {

    /*
    'sku' => array(
    'type' => 'text',
    'label' => t('Product SKU'),
    ),
    'title' => array(
    'type' => 'text',
    'label' => t('Title'),
    ),
    'price_amount' => array( // Price in pence
    'type' => 'int',
    'label' => t('Price amount'),
    ),
    'price_currency' => array( // Currency the price is expressed in
    'type' => 'text',
    'label' => t('Price currency'),
    ),
    'tid' => array(
    'type' => 'int',
    'label' => t('Track node id'),
    ),
    */

    public $sku;
    public $title;
    public $price_amount;
    public $price_currency;
    public $tid;

    public function __construct($sku,
                                $title = '',
                                $price_amount = 0,
                                $price_currency = '',
                                $tid = 0) {

        $this->sku = $sku;
        $this->title = $title;
        $this->price_amount = $price_amount;
        $this->price_currency = $price_currency;
        $this->tid = $tid;

    }
}
