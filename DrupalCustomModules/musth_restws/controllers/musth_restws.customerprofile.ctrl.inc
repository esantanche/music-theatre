<?php
/**
 * @file musth_restws.customerprofile.ctrl.inc
 *
 * @brief This file is about the CustomerProfileResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the CustomerProfile resource
 *
 * A CustomerProfile has to be associated to an order when processing its checkout.
 *
 * We create a customer profile when the user enters her address. We query the profile if we need
 * to read it for example when a user wants to use the last profile they entered.
 * We are unlikely to update or delete a profile.
 *
 * More precisely, we may want to update the profile if the user wants to edit his address.
 * Now this function is not implemented.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class CustomerProfileResourceController implements RestWSQueryResourceControllerInterface {

    private $customer_profile; // I store it because I have to load it in the query api, so I
                               // don't want to reload it in the read api

    public function __construct() {

        $this->customer_profile = new stdClass();

//        watchdog('musth_restws', 'W7D001 9RFD CustomerProfileResourceController __construct',
//            array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource CustomerProfile this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource CustomerProfile
     */
    public function propertyInfo() {

        /*
         * @attention some fields have not been used. maybe we add them later
         *
         * Table: commerce_customer_profile
        Columns:
        profile_id	int(10) UN PK AI
        revision_id	int(10) UN
        type	varchar(255)
        uid	int(11)
        status	int(11)
        created	int(11)
        changed	int(11)
        data	longblob

        Table: field_data_commerce_customer_address
        Columns:
        entity_type	varchar(128) PK
        bundle	varchar(128)
        deleted	tinyint(4) PK
        entity_id	int(10) UN PK
        revision_id	int(10) UN
        language	varchar(32) PK
        delta	int(10) UN PK
        commerce_customer_address_country	varchar(2)
        commerce_customer_address_administrative_area	varchar(255)
        commerce_customer_address_sub_administrative_area	varchar(255) NOT USED
        commerce_customer_address_locality	varchar(255)
        commerce_customer_address_dependent_locality	varchar(255) NOT USED
        commerce_customer_address_postal_code	varchar(255)
        commerce_customer_address_thoroughfare	varchar(255)
        commerce_customer_address_premise	varchar(255)
        commerce_customer_address_sub_premise	varchar(255)   NOT USED
        commerce_customer_address_organisation_name	varchar(255)
        commerce_customer_address_name_line	varchar(255) NOT USED
        commerce_customer_address_first_name	varchar(255)
        commerce_customer_address_last_name	varchar(255)
        commerce_customer_address_data	longtext NOT USED
        */

        return array(
            'profile_id' => array(
                'type' => 'int',
                'label' => t('Profile id'),
            ),
            'type' => array( // This is 'billing' in our case but it could be different in the future
                'type' => 'text',
                'label' => t('Profile bundle'),
            ),
            'uid' => array( // This property is returned as cross check only, Angular knows which user is logged in
                'type' => 'int',
                'label' => t('Drupal user id'),
            ),
            'status' => array( // 1 = active, 0 = disabled
                'type' => 'int',
                'label' => t('Status'),
            ),
            'security_token' => array(
                'type' => 'text',
                'label' => t('Security token for anonymous profiles'),
            ),
            // Two letters code (http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
            // https://github.com/umpirsky/country-list/blob/master/country/cldr/en/country.csv
            // https://github.com/umpirsky/country-list/tree/master/country/icu/en_GB
            // ICU's list looks richer than the CLDR's
            'country' => array(
                'type' => 'text',
                'label' => t('Customer address: country'),
            ),
            // USA states go here, possibly with ISO codes (http://en.wikipedia.org/wiki/ISO_3166-2:US)
            // Label: State/Province/Region
            'administrative_area' => array(
                'type' => 'text',
                'label' => t('Customer address: administrative area'),
            ),
            // Label: City/Town
            // Sublocalities may go here (like London, Harrow)
            'locality' => array( // London, Oxford, Cambridge, etc
                'type' => 'text',
                'label' => t('Customer address: locality'),
            ),
            // Label: ZIP/Postal code
            'postal_code' => array(
                'type' => 'text',
                'label' => t('Customer address: postal code'),
            ),
            // This is called "Address line 2" in the Angular frontend
            'thoroughfare' => array( // The road, street, avenue, etc
                'type' => 'text',
                'label' => t('Customer address: thoroughfare'),
            ),
            // This is called "Address line 1" in the Angular frontend
            'premise' => array( // The house number (50, 236a Room 1, etc)
                'type' => 'text',
                'label' => t('Customer address: premise'),
            ),
            'organisation_name' => array( // Musth, IBM, BBC, etc
                'type' => 'text',
                'label' => t('Customer address: organisation name'),
            ),
            // Note: if you don't provide the field 'name_line', the fields first_name and last_name
            // won't be set anyway and actually what happens is that first name and last name are
            // taken from the name line ignoring the ones you give here
            'first_name' => array( // This will be the first word in name_line
                'type' => 'text',
                'label' => t('Customer address: first_name'),
            ),
            'last_name' => array( // This will contain the other words in name_line
                'type' => 'text',
                'label' => t('Customer address: last_name'),
            ),
            'name_line' => array(
                'type' => 'text',
                'label' => t('Customer address: name_line'),
            ),
        );
    }

    /**
     * Metadata wrapper for the CustomerProfile resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int CustomerProfile id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $customer_profile_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_customer_profile',
            $customer_profile_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the id of the wanted profile and the security token
     *
     * For anonymous users, only anonymous customer profiles will be returned and the
     * security token will be checked.
     *
     * If the provided security token doesn't match with the one provided when creating
     * the profile, access will be denied.
     *
     * This is to assure that an anonymous user can access only the profile she created.
     *
     * If no profile id is provided, the last profile entered by the logged-in user will
     * be returned.
     *
     * @restfulness Well, we should send the uid explicitly.
     * Now we are relying on the logged-in user's information
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the profile id if every check is successful
     */
    public function query($filters = array(), $meta_controls = array()) {

        global $user;

//        watchdog('musth_restws', 'W7D001 CPQ-1 6TGB customer profile query <br> filters (!f) <br> user (!u) ',
//            array('!f' => print_r($filters, true),
//                  '!u' => print_r($user, true)
//            ), WATCHDOG_DEBUG);

        // Filters to be implemented
        // single customer profile profile_id=<id> (plus security token)
        // Last customer profile entered for the logged-in user

        if (!empty($filters['profile_id'])) {

            $profile_id = $filters['profile_id'];

        } else {

            if ($user->uid) {

                // In this case the user is logged-in ($user->uid != 0)
                // and no profile_id filter has been specified
                // We return the most recent profile the logged-in user entered

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'commerce_customer_profile')
                    ->propertyCondition('uid', $user->uid)
                    ->propertyOrderBy('profile_id', 'DESC') // We want the most recent
                    ->execute();

//                watchdog('musth_restws', 'W7D001 CPQ-3 IVFR customer profile query <br> (!f) <br> (!m) ',
//                        array('!f' => print_r($result, true),
//                              '!m' => print_r(0, true)
//                        ), WATCHDOG_DEBUG);

                if (isset($result['commerce_customer_profile'])) {
                    $profile_ids = array_keys($result['commerce_customer_profile']);

                    // Taking the most recent customer profile
                    $profile_id = $profile_ids[0];

                } else {
                    // No customer profile for the logged-in user
                    // Maybe they didn't enter any

                    return array();
                }

            } else {

                // User not logged in and profile id not given

                watchdog('musth_restws', 'W3E052 Angular called this api passing no ' .
                                          'profile_id and user not logged-in (!v) ',
                    array('!v' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('No profile id specified and user not logged-in', 412);
            }

        }

        $profile_as_array = entity_load('commerce_customer_profile', array($profile_id));

        if (empty($profile_as_array)) {

            watchdog('musth_restws', 'W3E053 Cant load a customer profile that should exist (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Customer profile not found', 404);
        }

        $customer_profile = $profile_as_array[$profile_id];

        if ($customer_profile->uid != $user->uid) {

            // Which problem do we have here?
            // It's possible that an anonymous user wants to get the customer profile
            // of an authenticated user ($customer_profile->uid != 0 and $user->uid == 0)
            // Or maybe an authenticated used wants to read an anonymous profile
            // ($customer_profile->uid == 0 and $user->uid != 0)
            // Or maybe an authenticated used wants to read the profile of another user
            // $customer_profile->uid != $user->uid with both != 0
            // All these cases are not permitted, we throw an exception

            watchdog('musth_restws', 'W3E054 Angular is asking for a customer profile ' .
                                      'the logged in user doesnt own (!p) (!u) ',
                array('!p' => print_r($customer_profile, true),
                      '!u' => print_r($user, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('The logged in user doesnt own the given customer profile', 403);
        }

        // We can't allow access to anonymous customer profiles if the security token is not provided
        // or if it doesn't match

        if ($user->uid == 0) {
            // There should be the token we need to allow access to the profile only to the
            // client that created it.
            // We don't want user spying on other people's profiles

            if (isset($filters['security_token'])) {
                $provided_security_token = $filters['security_token'];

                $customer_profile_wrapper = entity_metadata_wrapper('commerce_customer_profile', $customer_profile);

                $stored_security_token = $customer_profile_wrapper->field_security_token->value();

                if ($provided_security_token != $stored_security_token) {

                    watchdog('musth_rules', 'W3E055 Angular sent a security token that doesnt ' .
                                             'match with the stored one (!v) ',
                        array('!v' => print_r($filters, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Provided security token doesnt match with stored one.', 403);
                }

            } else {

                watchdog('musth_rules', 'W3E056 Angular didnt send a security token (!v) ',
                    array('!v' => print_r($filters, true),),
                    WATCHDOG_ERROR);

                throw new RestWSException('Security token needed but not provided', 403);
            }

        }

        $this->customer_profile = $customer_profile;

        //watchdog('musth_restws', 'W7D001 CPQ-2 8XSD customer profile query <br> (!f) <br> (!m) ',
        //        array('!f' => print_r(0, true),
        //              '!m' => print_r(0, true)
        //        ), WATCHDOG_DEBUG);

        return array($profile_id);
    }

    /**
     * To create a customer profile:
     * * You send a POST http query
     * * No need to authenticate
     * * You send the address fields
     *
     * If the user is anonymous, you have to send the security token as well. We will check
     * it if the profile is queried later to avoid that anonymous users access other
     * anonymous profiles
     *
     * @restfulness Well, we should send the uid explicitly.
     * Doing so, it's explicit who is the customer profile owner and we don't relay on the logged-in user info.
     * @see RestWSResourceControllerInterface::create()
     */
    public function create(array $values) {

        global $user;

//        watchdog('musth_restws', 'W7D001 CPC-1 0CDF customer profile create values (!v) (!o) (!u) ',
//            array('!v' => print_r($values, true),
//                '!o' => print_r($user->uid, true),
//                '!u' => print_r('', true)),
//            WATCHDOG_DEBUG);

        // Needed values:
        // profile_id No, we will be given this one when we create the profile
        // type No, it's always 'billing' for now
        // uid No, the user this customer profile is attached to will be $user, the logged in user
        // status No, it's 1 because the profile is created active
        // security_token, we need it so that we can check it when the profile is queried later
        // the address fields are not mandatory

        // Let's check uid. Let's not create a customer profile if the user whose uid is the given one
        // already has a customer profile

        $uid_of_the_user_the_profile_is_for = $user->uid;

        // We allow a user to have many customer profiles because we may want to implement an address book
        // of profiles. Users may want products shipped to different addresses

        $profile = commerce_customer_profile_new('billing', $uid_of_the_user_the_profile_is_for);

        $profile_wrapper = entity_metadata_wrapper('commerce_customer_profile', $profile);

        // Note: if you don't provide the field 'name_line', the fields first_name and last_name
        // won't be set anyway and actually what happens is that first name and last name are
        // taken from the name line ignoring the ones you give here

        $array_address_fields = array('country',
                                      'administrative_area',
                                      'locality',
                                      'postal_code',
                                      'thoroughfare',
                                      'premise',
                                      'organisation_name',
                                      'first_name',
                                      'last_name',
                                      'name_line');

        foreach ($array_address_fields as $address_field_name) {

            if (isset($values[$address_field_name])) {
                $profile_wrapper->commerce_customer_address->$address_field_name->set($values[$address_field_name]);

                //watchdog('musth_restws', 'W7D001 CPC-x78 customer profile address doing <br/> (!v) <br/> (!o) <br/> (!p) ',
                //    array('!v' => print_r($address_field_name, true),
                //          '!o' => print_r($values[$address_field_name], true),
                //          '!p' => print_r('', true)),
                //    WATCHDOG_DEBUG);
            }

        }

        if ($uid_of_the_user_the_profile_is_for == 0) {
            // If the user is anonymous, we need the security token to prevent other
            // anonymous users from accessing other users' profiles

            // Let's store the security token Angular provides so that we can check it when the profile
            // is queried later

            if (isset($values['security_token']) && !empty($values['security_token'])) {
                $provided_security_token = $values['security_token'];

                $profile_wrapper->field_security_token->set($provided_security_token);

            } else {

                watchdog('musth_rules', 'W3E058 Angular should provide a security token (!v) ',
                    array('!v' => print_r($values, true),),
                    WATCHDOG_ERROR);

                throw new RestWSException('Security token needed but not provided', 403);
            }

        }

        // What about associating the customer profile to the order?
        // It's done on order update

        try {
            commerce_customer_profile_save($profile);
        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E059 Error in saving a customer profile. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a customer profile', 500);
        }

        //watchdog('musth_restws', 'W7D001 CPC-2 8GBH customer profile create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //          '!o' => print_r(0, true),
        //         '!p' => print_r($profile, true)),
        //    WATCHDOG_DEBUG);

        // A create api returns only the id of the created entity
        // If you want the full entity, you have to call the get method

        return $profile->profile_id;
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Maximum 1000 entities will be sent (limit high enough to send just all of them)
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here.
     *
     * @param int $client_limit Ignored
     * @return int Maximum 1000 entities will be sent (limit high enough to send just all of them)
     */
    public function limit($client_limit = NULL) {
        return 1000;
    }

    /**
     * This is the function that sends back the customer profile
     *
     * The profile has already been loaded in the query api, so here we just copy it to the
     * object we have to return to Angular
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $profile_id int Id of the customer profile just loaded in the query api
     * @return CustomerProfile Object containing the information described by the properties (propertyInfo)
     */
    public function read($profile_id) {

        //watchdog('musth_restws', 'W7D001 67GH CPR-1 \CustomerProfileResourceController::read (!i) (!p) ',
        //    array('!i' => print_r($profile_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // I loaded the profile in the query api, let's not reload it, let's use the profile we just loaded in the
        // query api

        $customer_profile = $this->customer_profile;

        $customer_profile_wrapper = entity_metadata_wrapper('commerce_customer_profile', $customer_profile);

        /*
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
        */

        $customer_profile_to_return = new CustomerProfile($profile_id,
            $customer_profile->type,
            $customer_profile->uid,
            $customer_profile->status,
            'Dear Angular, you have to send me the security token, not I. I just check it',
            $customer_profile_wrapper->commerce_customer_address->country->value(),
            $customer_profile_wrapper->commerce_customer_address->administrative_area->value(),
            $customer_profile_wrapper->commerce_customer_address->locality->value(),
            $customer_profile_wrapper->commerce_customer_address->postal_code->value(),
            $customer_profile_wrapper->commerce_customer_address->thoroughfare->value(),
            $customer_profile_wrapper->commerce_customer_address->premise->value(),
            $customer_profile_wrapper->commerce_customer_address->organisation_name->value(),
            $customer_profile_wrapper->commerce_customer_address->first_name->value(),
            $customer_profile_wrapper->commerce_customer_address->last_name->value(),
            $customer_profile_wrapper->commerce_customer_address->name_line->value()
        );

        //watchdog('musth_restws', 'W7D001 DFGT  CPR-2 \CustomerProfileResourceController::read read (!i) (!p) ',
        //    array('!i' => print_r($profile_id, true),
        //         '!p' => print_r($customer_profile_to_return, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the CustomerProfile object

        return $customer_profile_to_return;
    }

    /**
     * For now we don't update customer profiles.
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($profile_id, array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * No deleting customer profiles here.
     * We will delete customer profiles using some rules, if needed
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($profile_id) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        //watchdog('musth_restws', 'W7D001 6767 ProgrammeResourceController access (!o) (!i) ',
        //    array('!o' => print_r($op, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_customer_profile';
    }

}
