<?php
/**
 * @file musth_restws.post.res.inc
 *
 * @brief The class Post is defined here. It's the object we send back to angular
 * when it queries a post.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Post {

    public $nid; // Post node id
    public $gid; // Group id of the group the post belongs to
    public $uid; // User id of the author
    public $name; // Author name, ready to display
    public $avatar;
    public $published;
    public $body;
    public $numcomments; // How many comments have been created for this post
    public $changed;

    public function __construct($nid,
                                $gid = 0,
                                $uid = 0,
                                $name = '',
                                $avatar = '',
                                $published = false,
                                $body = '',
                                $numcomments = 0,
                                $changed) {

        $this->nid = $nid;
        $this->gid = $gid;
        $this->uid = $uid;
        $this->name = $name;
        $this->avatar = $avatar;
        $this->published = $published;
        $this->body = $body;
        $this->numcomments = $numcomments;
        $this->changed = $changed;

    }
}
