<?php
/**
 * @file musth_restws.user.res.inc
 *
 * @brief The class User is defined here. It's the object we send back to angular
 * when it attempts a login. There is the info about the logged in user or
 * nothing if the login failed.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class User {

    public $uid;
    public $name;
    public $mail;
    public $first_name;
    public $middle_names;
    public $family_name;
    public $language;
    public $roles;
    public $licenses;
    public $groups;
    public $avatar;

    public function __construct($uid,
                                $name = 'Missing username',
                                $mail = '',
                                $first_name = '',
                                $middle_names = '',
                                $family_name = '',
                                $language = 'en',
                                $roles = array(),
                                $licenses = array(),
                                $groups = array(),
                                $avatar = '') {

        $this->uid = $uid;
        $this->name = $name;
        $this->mail = $mail;
        $this->first_name = $first_name;
        $this->middle_names = $middle_names;
        $this->family_name = $family_name;
        $this->language = $language;
        $this->roles = $roles;
        $this->licenses = $licenses;
        $this->groups = $groups;
        $this->avatar = $avatar;

    }
}

/**
 * Class Role
 *
 * We need this class to create the roles array, see the $roles member above
 */
class Role {

    public $roleid;
    public $roletitle;

    public function __construct($roleid,
                                $roletitle) {

        $this->roleid = $roleid;
        $this->roletitle = $roletitle;

    }

}

/**
 * Class License
 *
 * We need this class to create the licenses array, see the $licenses member above
 */
class License {

    public $license_id;
    public $uid;
    public $sku;
    public $title;
    public $granted;
    public $expires;
    public $track_id;
    public $programme_id;
    public $programme_system_title;
    public $programme_display_title;

    public function __construct($license_id,
                                $uid,
                                $sku,
                                $title,
                                $granted,
                                $expires,
                                $track_id = 0,
                                $programme_id = 0,
                                $programme_system_title = '',
                                $programme_display_title = '') {

        $this->license_id = $license_id;
        $this->uid = $uid;
        $this->sku = $sku;
        $this->title = $title;
        $this->granted = $granted;
        $this->expires = $expires;
        $this->track_id = $track_id;
        $this->programme_id = $programme_id;
        $this->programme_system_title = $programme_system_title;
        $this->programme_display_title = $programme_display_title;

    }

}

/**
 * Class UserGroup
 *
 * We need this class to create the groups array, see the $groups member above
 *
 * It's called UserGroup to avoid conflict with Group resource
 * It's a group a user belongs to
 */
class UserGroup {

    public $id; // Group id
    public $title;
    public $role; // Role the user has in the group. One of NONE, MEMBER, ADMIN

    public function __construct($id,
                                $title,
                                $role = 'NONE') {

        $this->id = $id;
        $this->title = $title;
        $this->role = $role;

    }

}
