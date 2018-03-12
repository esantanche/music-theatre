<?php
/**
 * @file
 *
 * @brief The class DownloadableUrl is defined here. It's the object we send back to angular
 * when it requests the signed urls it has to use to download a Downloadable (audio cd, sheet music, etc)
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class DownloadableUrl {

    public $catalogue_no;
    public $url;

    public function __construct($catalogue_no,
                                $url = '') {

        $this->catalogue_no = $catalogue_no;
        $this->url = $url;

    }
}
