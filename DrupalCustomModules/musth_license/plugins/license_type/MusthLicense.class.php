<?php
/**
 * @file MusthLicense.class.php
 *
 * @brief Definition of the class that defines our custom license
 *
 * As you can see our license is very standard. There are only the attributes that every
 * Commerce License has, like duration, renewals and so on
 *
 * @ingroup musthlicense
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 17/03/14
 * Time: 18:06
 */

class MusthLicense extends CommerceLicenseBase {

    /**
     * Implements CommerceLicenseInterface::isConfigurable().
     */
    public function isConfigurable() {
        return FALSE;
    }

}
