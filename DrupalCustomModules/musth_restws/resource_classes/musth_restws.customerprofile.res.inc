<?php
/**
 * @file musth_restws.customerprofile.res.inc
 *
 * @brief The class CustomerProfile is defined here. It's the object we send back to angular
 * when it queries a customer profile.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class CustomerProfile {

    public $profile_id;
    public $type;
    public $uid;
    public $status;
    public $security_token;
    public $country;
    public $administrative_area;
    public $locality;
    public $postal_code;
    public $thoroughfare;
    public $premise;
    public $organisation_name;
    public $first_name;
    public $last_name;
    public $name_line;

    public function __construct($profile_id,
                                $type = 'billing',
                                $uid = 0,
                                $status = 1,
                                $security_token = '',
                                $country = '',
                                $administrative_area = '',
                                $locality = '',
                                $postal_code = '',
                                $thoroughfare = '',
                                $premise = '',
                                $organisation_name = '',
                                $first_name = '',
                                $last_name = '',
                                $name_line = ''
                               ) {

        $this->profile_id = $profile_id;
        $this->type = $type;
        $this->uid = $uid;
        $this->status = $status;
        $this->security_token = $security_token;
        $this->country = $country;
        $this->administrative_area = $administrative_area;
        $this->locality = $locality;
        $this->postal_code = $postal_code;
        $this->thoroughfare = $thoroughfare;
        $this->premise = $premise;
        $this->organisation_name = $organisation_name;
        $this->first_name = $first_name;
        $this->last_name = $last_name;
        $this->name_line = $name_line;

    }
}
