<?php
/**
 * @file musth_restws.votesaggregate.res.inc
 *
 * @brief The class VotesAggregate is defined here. It's the object we send back to angular
 * when it queries a VotesAggregate.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class VotesAggregate {

    public $nid;
    public $tag;
    public $average;
    public $sum;
    public $count;

    public function __construct($nid = 0,
                                $tag = '',
                                $average = 0,
                                $sum = 0,
                                $count = 0) {

        $this->nid = $nid;
        $this->tag = $tag;
        $this->average = $average;
        $this->sum = $sum;
        $this->count = $count;

    }

}
