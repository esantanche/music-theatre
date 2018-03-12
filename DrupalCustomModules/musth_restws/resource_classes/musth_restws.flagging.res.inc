<?php
/**
 * @file musth_restws.flagging.res.inc
 *
 * @brief The class Flagging is defined here. It's the object we send back to angular
 * when it queries a flagging.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Flagging {

    public $flagging_id;
    public $flag_name;
    public $entity_type;
    public $entity_id;

    public function __construct($flagging_id,
                                $flag_name = '',
                                $entity_type = '',
                                $entity_id = 0) {

        $this->flagging_id = $flagging_id;
        $this->flag_name = $flag_name;
        $this->entity_type = $entity_type;
        $this->entity_id = $entity_id;

    }
}
