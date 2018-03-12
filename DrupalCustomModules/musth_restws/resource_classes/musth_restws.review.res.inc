<?php
/**
 * @file musth_restws.review.res.inc
 *
 * @brief The class Review is defined here. It's the object we send back to angular
 * when it queries a review.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Review {

    /*
    'id' => array(
    'type' => 'int',
    'label' => t('Node id of the review'),
    ),
    'nid' => array(
    'type' => 'int',
    'label' => t('Node id of the programme the review is about'),
    ),
    'uid' => array( // Author of the review
    'type' => 'int',
    'label' => t('Author of the review'),
    ),
    'title' => array(
    'type' => 'text',
    'label' => t('Review title'),
    ),
    'body' => array(
    'type' => 'text',
    'label' => t('Review body'),
    ),
    'rating' => array(
    'type' => 'int',
    'label' => t('Rating'),
    ),
    'status' => array(
    'type' => 'text',
    'label' => t('Status: draft, submitted, published'),
    ),
    */

    public $id;
    public $nid;
    public $uid;
    public $name;
    public $avatar;
    public $title;
    public $body;
    public $rating;
    public $status;

    public function __construct($id,
                                $nid = 0,
                                $uid = 0,
                                $name = '',
                                $avatar = '',
                                $title = '',
                                $body = '',
                                $rating = null,
                                $status = '') {

        $this->id = $id;
        $this->nid = $nid;
        $this->uid = $uid;
        $this->name = $name;
        $this->avatar = $avatar;
        $this->title = $title;
        $this->body = $body;
        $this->rating = $rating;
        $this->status = $status;

    }

}
