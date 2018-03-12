<?php
/**
 * @file musth_restws.clientexception.res.inc
 *
 * @brief The class ClientException is defined here. It's the object we send back to angular
 * as confirmation when it sends us info about an exception happened on the client side
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class ClientException {

    public $message;

    public function __construct($message) {

        $this->message = $message;

    }
}
