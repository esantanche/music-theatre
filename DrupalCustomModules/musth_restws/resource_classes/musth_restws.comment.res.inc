<?php
/**
 * @file musth_restws.comment.res.inc
 *
 * @brief The class Comment is defined here. It's the object we send back to angular
 * when it queries a comment.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Comment {

    public $cid;
    public $nid;
    public $uid;
    public $name;
    public $avatar;
    public $body;
    public $changed;

    public function __construct($cid,
                                $nid = 0,
                                $uid = 0,
                                $name = '',
                                $avatar = '',
                                $body = '',
                                $changed) {

        $this->cid = $cid;
        $this->nid = $nid;
        $this->uid = $uid;
        $this->name = $name;
        $this->avatar = $avatar;
        $this->body = $body;
        $this->changed = $changed;

    }
}
