<?php
/**
 * @file musth_restws.vote.res.inc
 *
 * @brief The class Vote is defined here. It's the object we send back to angular
 * when it queries a vote.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Vote {

    public $id;
    public $nid;
    public $uid;
    public $name;
    public $avatar;
    public $tag;
    public $value_type;
    public $value;
    public $display_title;
    public $system_title;

    public function __construct($id,
                                $nid = 0,
                                $uid = 0,
                                $name = '',
                                $avatar = '',
                                $tag = '',
                                $value_type = '',
                                $value = '',
                                $display_title = '',
                                $system_title = '') {

        $this->id = $id;
        $this->nid = $nid;
        $this->uid = $uid;
        $this->name = $name;
        $this->avatar = $avatar;
        $this->tag = $tag;
        $this->value_type = $value_type;
        $this->value = $value;
        $this->display_title = $display_title;
        $this->system_title = $system_title;

    }

}
