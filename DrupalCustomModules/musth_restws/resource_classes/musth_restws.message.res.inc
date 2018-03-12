<?php
/**
 * @file musth_restws.message.res.inc
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

class Message {

    public $sender_name;
    public $sender_email;
    public $body;

    public function __construct($sender_name,
                                $sender_email,
                                $body) {

        $this->sender_name = $sender_name;
        $this->sender_email = $sender_email;
        $this->body = $body;

    }
}
