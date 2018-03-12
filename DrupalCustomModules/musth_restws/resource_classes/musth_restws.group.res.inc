<?php
/**
 * @file musth_restws.group.res.inc
 *
 * @brief The class Group is defined here. It's the object we send back to angular
 * when it queries a group.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Group {

    public $nid;
    public $uid;
    public $title;
    public $description;
    public $created;

    public function __construct($nid,
                                $uid,
                                $title,
                                $description,
                                $created) {

        $this->nid = $nid;
        $this->uid = $uid;
        $this->title = $title;
        $this->description = $description;
        $this->created = $created;

    }
}
