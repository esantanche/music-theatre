<?php
/**
 * @file musth_restws.user.ctrl.inc
 *
 * @brief This file is about the UserResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the User resource
 *
 * This api returns user id, name (made-up name), mail, preferred language and roles of the logged-in user
 *
 * We send the real name (first name, middle names, family name) and the list of active licenses as well.
 *
 * As most recent addition, we send the list of the groups the user is a member of.
 *
 * It's also possible to get the list of the members of a group.
 *
 * The property 'name' is no longer the username. It's the real name or, if there is no real name,
 * the username after some transformations. This property is used to show the name of the user in comments and
 * group members lists.
 *
 * Currently we login by using Drupal standard login page. The user's browser will get a cookie and Angular will
 * also ask for a RESTws token needed to call create, update or delete apis.
 *
 * So, no login happens here. We just get the user profile of the logged-in user in the $user global variable.
 * Http basic authentication is still supported. We use it for debugging purposes.
 *
 * @see http://en.wikipedia.org/wiki/Basic_access_authentication
 *
 * No account is created any more by using this api. We create accounts by using standard registration
 * Drupal pages.
 *
 * This api can be used to update a user profile for example to change real names.
 *
 * Since the advent of groups, the update method has become more complicated.
 *
 * It's used, as well, to allow users to join and leave groups (the join/leave function works like a toggle:
 * you call the method and you join the group, you call it again and you leave the group)
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

define('MUSICTHEATRE_USERS_PAGE_LENGTH', 20);

class UserResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //watchdog('musth_restws', 'W7D001 8GFR UserResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource User this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource User
     */
    public function propertyInfo() {

        // About avatars:
        // When uploading an avatar, the property 'avatar' listed here is the actual image encoded by using base64
        // encoding
        // When querying an avatar, the property 'avatar' is the url of the avatar as stored in the
        // server's file system

        return array(
            'uid' => array(
                'type' => 'int',
                'label' => t('Used id'),
            ),
            'name' => array(  // This is the real name or a formatted username if there is no real name
                'type' => 'text',
                'label' => t('Made-up user name, or real name'),
            ),
            'mail' => array(
                'type' => 'text',
                'label' => t('Email address'),
            ),
            // We will use first_name, middle_names and family_name to show the user's "real"
            // name on social groups
            'first_name' => array(
                'type' => 'text',
                'label' => t('First name'),
            ),
            'middle_names' => array(
                'type' => 'text',
                'label' => t('Middle names'),
            ),
            'family_name' => array(
                'type' => 'text',
                'label' => t('Family name'),
            ),
            'language' => array(
                'type' => 'text',
                'label' => t('Language'),
            ),
            'roles' => array(
                'type' => 'array',
                'label' => t('User roles'),
            ),
            'licenses' => array( // Array of active licenses the user owns
                'type' => 'array',
                'label' => t('Active licenses'),
            ),
            'groups' => array( // Array of groups the user belongs to
                'type' => 'array',
                'label' => t('Groups'),
            ),
            'avatar' => array( // Avatar to show on the user profile
                'type' => 'text',
                'label' => t('Avatar'),
            ),
        );
    }

    /**
     * Metadata wrapper for the User resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int User id (uid)
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $user_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_user',
            $user_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * There are three ways to use this method:
     * 1) Pass no filters and you will get the user profile of the logged-in user
     * 2) Pass the user id of a user as filter and you get the public user profile of
     * that user, unless they are logged-in and you get the same as case 1
     * 3) Pass the group id of a group as 'groups' filter and you get the list of users
     * who are members of that group
     *
     * About case 3
     *
     * * we return the public profiles of group members, except for the logged-in user.
     * If they are members of that group, we return their full profile
     * * group members are sorted in order of membership age. The ones who joined first are
     * listed first. The first one is likely to always be the group creator.
     *
     * @attention we are sorting by the date when the user became member of the group
     * The oldest members first. We may want to change this sorting order
     *
     * Authentication process
     *
     * The Angular client will add an Authorization http header to perform an http basic
     * authentication or there will be a cookie because a login will have been performed
     * by using Drupal standard login page.
     *
     * The module RESTws will perform a Drupal login by using the Authorization http header
     * or the login will have already been done by using Drupal login page.
     *
     * If no filter is passed, this function will just check if the login was successful
     * and will get the user id. The read function will return information about the logged-in user or nothing
     * if no user was actually logged in.
     *
     * @restfulness Only for anonymous. If the user is logged-in, results are different from
     * when the user is not. We may find a way to differentiate between logged-in and non-logged-in
     * users by using some query parameter.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array We use the page meta control to deliver a single page of the results
     * (used only when retrieving the list of a group's members
     * @return array Array containing the user ids of the users whose profiles we have to return
     * @throws RestWSException
     */
    public function query($filters = array(), $meta_controls = array()) {

        global $user;

        // Implemented filters
        // 1) All users who belong to a group (given the group id) with paging and
        //    no permission checking because the list of members of a group is public
        //    Sorting is by when users joined the group. Those who joined first are listed first
        //    Paging is supported in this case
        // 2) When given a user id as filter, we return the public profile of that user unless
        //    that user happens to be the same as the logged-in user. In this case we return the
        //    full profile
        // 3) When given no filters, we return the full profile of the logged-in user

        $user_ids_of_users_to_return = array(); // Yes, it's needless, but it's just for safety

        //        watchdog('musth_restws', 'W7D001 ri9aequeer9iz9A user query first watchdog ' .
        //            ' <br> filters (!f) <br> meta (!m) <br> user (!u) ',
        //            array('!f' => print_r($filters, true),
        //                '!m' => print_r($meta_controls, true),
        //                '!u' => print_r($user->uid, true),
        //            ), WATCHDOG_DEBUG);

        // Returning all users in a group

        // Sorry for using a property called 'groups' to pass as a parameter a single group
        // It will be something like: groups=932 where 932 is the id of a single group
        // we want all members of

        if (!empty($filters['groups'])) {

            $group_nid = $filters['groups'];

            // First check that the group exists, is actually a group and is published

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'group')
                ->propertyCondition('nid', $group_nid)
                ->propertyCondition('status', NODE_PUBLISHED) // Get the group only if published
                ->count()
                ->execute();

            if ($result == 0) {

                // The group doesn't exist or is unpublished or exists as a node but it's not a group

                // This is likely to be an Angular bug. The requested group should exist
                // It may also be that the group has just been deleted or unpublished
                // Anyway, certainly we can't send back to angular the list of the users who are members of
                // a group that doesn't exist

                watchdog('musth_restws',
                    'W3E297 Angular wants the members of a group that does not exist [query] (!f) ',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Group doesnt exist', 412);

            } else {

                // The group exists, is published and is actually a group, let's find its members

                // @attention we are sorting by the date when the user became member of the group
                // Oldest members first

                // Defining the starting point of the page we have to serve
                if (isset($meta_controls['page']))
                    $start = intval($meta_controls['page']) * MUSICTHEATRE_USERS_PAGE_LENGTH;
                else
                    $start = 0;

                // We find the group's members by searching for membership objects
                // Each membership object represents the fact that a user is member of the group

                // Skipping exception handling because we did it in the count method were
                // we performed basically the same query
                // Anyway, at worst we send back an empty list of members

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'og_membership')
                    ->propertyCondition('group_type', 'node', '=')
                    ->propertyCondition('gid', $group_nid, '=')
                    ->propertyCondition('entity_type', 'user', '=')
                    ->propertyCondition('state', OG_STATE_ACTIVE, '=') // Only active members. Pending and blocked
                                                                       // members are ignored
                    ->propertyOrderBy('created', 'ASC') // Oldest members first
                    ->range($start, MUSICTHEATRE_USERS_PAGE_LENGTH)  // Serving only the requested page
                    ->execute();

                $user_ids_of_users_to_return = array();

                // Now getting user ids of the group members
                // They are inside membership objects, the ones we fetched by using the query above

                if (!empty($result['og_membership'])) {

                    // We have to load the membership objects to find who is the user
                    // each membership object is about
                    $og_memberships = og_membership_load_multiple(array_keys($result['og_membership']));

                    // We extract user ids of the group members
                    foreach ($og_memberships as $og_membership) {

                        // The property etid of the membership object $og_membership actually is
                        // the user id of the user
                        // We collect these user ids in the array $user_ids_of_users_to_return
                        $user_ids_of_users_to_return[] = $og_membership->etid;
                    }
                }

                /*watchdog('musth_restws', 'W7D001 ahsaer3quu3Hohh9yoh9 user query og_get_group_members_properties ' .
                    ' <br> group (!f) <br> users list (!m) <br> users list (!u) ',
                    array('!f' => print_r($result, true),
                        '!m' => print_r($user_ids_of_users_to_return, true),
                        '!u' => print_r($user_ids_of_users_to_return, true),
                    ), WATCHDOG_DEBUG);*/

            }

        } else if (!empty($filters['uid'])) {

            // In this case we want the profile of the user whose id is $filters['uid']
            // The read method will send back their full profile if the same user is logged-in
            // or their public profile if they aren't

            $user_id_of_user_we_have_to_return = $filters['uid'];

            if ($user_id_of_user_we_have_to_return == $user->uid) {

                // If the user Angular wants the profile of is the same as the logged-in
                // user, of course the user exists, we don't need any query

                $user_ids_of_users_to_return = array($filters['uid']);

            } else {

                // If the user Angular wants the profile of is not the same as the logged-in
                // user, we need a query to know if the user exists or not

                try {

                    // Checking if the user exists
                    $query = new EntityFieldQuery();
                    $result = $query->entityCondition('entity_type', 'user')
                        ->propertyCondition('uid', $user_id_of_user_we_have_to_return, '=')
                        ->count()
                        ->execute();

                    //throw new Exception('Just a test exception W3E298.');

                }
                catch (Exception $e) {

                    watchdog('musth_restws', 'W3E298 Error when checking if a user exists. Error message: (!e)',
                        array('!e' => print_r($e->getMessage(), true)),
                        WATCHDOG_ERROR);

                    // Get out of here!
                    throw new RestWSException('Error when checking if a user exists', 500);
                }

                if ($result) {

                    $user_ids_of_users_to_return = array($filters['uid']);

                } else {

                    // This is a bug because angular shouldn't send a user id that doesn't
                    // refer to an existing user
                    // Or maybe it's a hacker scanning all user ids?

                    watchdog('musth_restws',
                        'W3E299 Angular wants the user profile of a user who does not exist (!f)',
                        array('!f' => print_r($filters, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('User not found', 404);

                }

            }

        } else {

            // If $user->uid == 0, which happens when the user is not logged in, the read method
            // will get user id == 0 as a parameter and will return an empty user profile
            $user_ids_of_users_to_return = array($user->uid);

        }

        //        watchdog('musth_restws', 'W7D001 rah1Eel1si user query user_ids_of_users_to_return ' .
        //            ' <br> group (!f) <br> entities (!m) <br> empty (!u) ',
        //            array('!f' => print_r($user_ids_of_users_to_return, true),
        //                  '!m' => print_r('', true),
        //                  '!u' => print_r('', true),
        //            ), WATCHDOG_DEBUG);

        return $user_ids_of_users_to_return;
    }

    /**
     * We don't create accounts here. We use the standard Drupal registration process to create accounts.
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @param array $values Not used
     * @return int|string|void Not used
     * @throws RestWSException Method not implemented
     */
    public function create(array $values) {

        throw new RestWSException('Not implemented', 501);
    }

    /**
     * We implement paging in this case.
     *
     * When we do, this method is the first called. The RESTws module will come here first to
     * see if there is something to return. If the count method returns a non-zero result, it
     * will call the query method. If the count method returns zero, the query method won't be
     * called at all (this doesn't actually seem to be true as the RESTws module seems to be a bit
     * buggy, but this bug may be fixed. Now it seems that RESTws calls the query method even
     * if there are no resources to return).
     *
     * This method performs the query needed to count all members of a given group when a group is given.
     *
     * If no group is given, this method returns 1, but it doesn't check if the requested user exists or anything else.
     * Maybe there are zero users to return, but, as long as paging is concerned, zero or 1 makes no difference.
     *
     * The query method will check if the user actually exists.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Number of resources. It will be used to calculate how many pages of results we
     * have to serve
     * @throws RestWSException
     */
    public function count($filters = array()) {

        // Why, as a default, I say that there is one user to return?
        // I say this because:
        // 1) If all users belonging to a group are what we want, the queries below will
        //    count them overriding this initial value
        // 2) If the filter 'groups' is not set, it's one user only that we want and, whatever
        //    the page length is, the number of pages will always be the same, one page only
        //    If there is no user to be returned, the number of pages doesn't matter anyway
        $count_of_users_to_return = 1;

        if (!empty($filters['groups'])) {

            // In this case a group id is given and we have to count how many members the group has

            $group_nid = $filters['groups'];

            // First let's check if the group exists
            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'group')
                ->propertyCondition('nid', $group_nid)
                ->propertyCondition('status', NODE_PUBLISHED) // Consider the group only if published
                ->count()
                ->execute();

            if ($result == 0) {

                // This is likely to be an Angular bug. The requested group should exist
                // It may also be that the group has been just deleted
                // Anyway, certainly we can't send back to angular the list of the users who are members of
                // a group that doesn't exist

                watchdog('musth_restws',
                    'W3E297 Angular wants the members of a group that does not exist [count] (!f) ',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Group does not exist', 412);

            } else {

                // Now we count all group members
                // This api has been tested and it returns users only, only the group members

                try {

                    $query = new EntityFieldQuery();
                    $count_of_users_to_return = $query->entityCondition('entity_type', 'og_membership')
                        ->propertyCondition('group_type', 'node', '=')
                        ->propertyCondition('gid', $group_nid, '=')
                        ->propertyCondition('entity_type', 'user', '=')
                        ->propertyCondition('state', OG_STATE_ACTIVE, '=')
                        ->count()
                        ->execute();

                    //throw new Exception('Just a test exception  W3E300 .');

                }
                catch (Exception $e) {

                    watchdog('musth_restws', 'W3E300 Error when counting group members. Error message: (!e)',
                        array('!e' => print_r($e->getMessage(), true)),
                        WATCHDOG_ERROR);

                    // Get out of here!
                    throw new RestWSException('Error when counting group members', 500);
                }

            }

        }

        //        watchdog('musth_restws', 'W7D001 baeP3yoh4ziHunu user count ' .
        //            ' <br> result (!f)  ',
        //            array('!f' => print_r($count_of_users_to_return, true),
        //            ), WATCHDOG_DEBUG);

        return $count_of_users_to_return;
    }

    /**
     * We do paging and we send maximum MUSICTHEATRE_USERS_PAGE_LENGTH results at a time.
     * Our page is that long.
     *
     * @param int $client_limit Ignored
     * @return int Maximum MUSICTHEATRE_USERS_PAGE_LENGTH resources sent in a page
     */
    public function limit($client_limit = NULL) {

        return MUSICTHEATRE_USERS_PAGE_LENGTH;
    }

    /**
     * This is the function that sends back information about users.
     *
     * A user id is given and there are two cases:
     *
     * 1. That user is logged-in
     * 2. That user is not logged-in
     *
     * Case 1 Logged-in user
     *
     * In this case we send back the full profile. All properties are sent back
     *
     * Case 2 Non-logged-in user
     *
     * In this case we send back the public profile only
     * Now the public profile is hardcoded (the user can't choose what is public and what is not)
     * and includes:
     *
     * * groups the user belongs to with group id, group title and user role
     * * real name
     * * user id of course
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $uid int User id of the user whose data we have to send back
     * @throws RestWSException
     * @return User Object containing the information described by the properties (propertyInfo)
     */
    public function read($uid) {

        global $user;

        //        watchdog('musth_restws', 'W7D001 UserResourceController::read (!u) ',
        //            array('!u' => print_r($uid, true)),
        //            WATCHDOG_DEBUG);

        if ($uid == 0) {
            // If uid == 0, let's send back an empty user object

            $user_object_to_return = new User(0);

        } else {

            // Now building the user profile, public or full, to send back

            $roles_array = array();
            $licenses_array = array();
            $user_email = '';
            $user_language = ''; // The user's preferred language

            // Do we have to return the public profile or the full one?
            // If the given user, $uid, is logged in, $uid == $user->uid,
            // we send back the full profile
            $return_full_profile = ($uid == $user->uid);

            // Loading the user profile explicitly because it looks like
            // the variable $user does not have all the information
            // we need in all cases
            // I mean that if you call the api by using soap, which uses
            // basic authentication, you get a user profile in $user
            // If you use the cookie-based login, you get another profile
            // with less information
            // So, I load the profile explicitly and I get everything I need

            try {

                $requested_user = user_load($uid);

                //throw new Exception('Just a test exception  W3E302 .');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E302 Error when loading user profile. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error when loading user profile', 500);
            }

            if (!$requested_user) {

                // User not found
                // This is a hacker using this method because Angular uses the query
                // method, which checks if a user exists before passing its uid to this method

                watchdog('musth_restws', 'W3E301 User not found, what is going on? (!u) ',
                    array('!u' => print_r($uid, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('User not found', 404);

            }

            if ($return_full_profile) {

                /*watchdog('musth_restws', 'W7D001 enter $return_full_profile \UserResourceController::read $user_object_to_return '.
                    '<br> logged-in user (!u) <br> req user (!r) <br> user obj (!l) <br> req user (!q) <br> full (!f) ',
                    array('!u' => print_r($user->uid, true),
                        '!r' => print_r($uid, true),
                        '!l' => print_r($user, true),
                        '!q' => print_r($requested_user, true),
                        '!f' => print_r($return_full_profile, true)
                    ),
                    WATCHDOG_DEBUG);*/

                $requested_user_roles = $requested_user->roles;

                // Preparing the array of the user roles
                foreach ($requested_user_roles as $roleid => $roletitle) {
                    $role = new Role($roleid, $roletitle);
                    $roles_array[] = $role;
                }

                // Here $uid == $user->uid

                // Loading the licenses the user owns
                $licenses_array = musth_restws_load_licenses($uid);

                if (gettype($licenses_array) != 'array') {

                    // If the function musth_restws_load_licenses above doesn't return
                    // an array, not even an empty one, there has been a problem inside
                    // the function itself. See watchdogs for details

                    watchdog('musth_restws', 'W3E150 Error in loading a users licenses ' .
                        'Licenses array: (!l) ',
                        array('!l' => print_r($licenses_array, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Error in loading licenses a user owns', 500);
                }

                $user_email = $requested_user->mail;
                $user_language = $requested_user->language;

            }

            // Both the public and the full profiles include the list of the groups
            // the given user belongs to

            // Example of $user_groups
            //   Array (
            //             [0] => UserGroup Object (
            //                [id] => 932
            //                [title] => Don Pasquale Fan Group by esantanchewrong@gmail.com
            //                [role] => MEMBER
            //             )
            //             [1] => UserGroup Object (
            //                [id] => 934
            //                [title] => Happy Music by mlm
            //                [role] => ADMIN
            //             )
            //             [2] => UserGroup Object (
            //                [id] => 935
            //                [title] => Ponchielli has been here
            //                [role] => ADMIN
            //             )
            //             [3] => UserGroup Object (
            //                [id] => 937
            //                [title] => ssbbfd
            //                [role] => ADMIN
            //             )
            //         )

            // Exception handling inside the function
            $user_groups = musth_restws_load_user_groups($requested_user);

            if (isset($requested_user->field_first_name[LANGUAGE_NONE])) {
                $first_name = $requested_user->field_first_name[LANGUAGE_NONE][0]['value'];
            } else {
                $first_name = '';
            }

            if (isset($requested_user->field_middle_names[LANGUAGE_NONE])) {
                $middle_names = $requested_user->field_middle_names[LANGUAGE_NONE][0]['value'];
            } else {
                $middle_names = '';
            }

            if (isset($requested_user->field_family_name[LANGUAGE_NONE])) {
                $family_name = $requested_user->field_family_name[LANGUAGE_NONE][0]['value'];
            } else {
                $family_name = '';
            }

            $composed_real_name = musth_helper_functions_compose_real_name($first_name, $middle_names, $family_name);

            // If there is no real name we use $requested_user->name, the user's Drupal username, to make a name
            // to display.
            // The username is not OK because there may be the uid at the end of the name
            // Usernames are created by the registration process and are like this one: firstname.surname_156
            // 156 is the user id and we don't want it to show up, it's ugly.
            // For this reason we use the function musth_helper_functions_make_username_nice_to_display
            // that manipulates the username to make it nicer. It cuts the uid part.
            // There are more ways a username may be made, but, anyway, the function above does its best to
            // clean it up

            if (empty($composed_real_name))
                $name_to_display_as_name_of_the_user =
                    musth_helper_functions_make_username_nice_to_display($requested_user->name);
            else
                $name_to_display_as_name_of_the_user = $composed_real_name;

            // $avatar_file_info will contain an object
            // For example:  (stdClass Object ( [fid] => 45 [uri] => public://pictures/fileOKLYeL
            // [filename] => fileOKLYeL [filemime] => application/octet-stream [uid] => 115 [status] => 1
            // [timestamp] => 1441619919 [filesize] => 50675 ) )

            $avatar_file_info = $requested_user->picture;

            if ($avatar_file_info)
                $avatar_url = file_create_url($avatar_file_info->uri);
            else
                $avatar_url = '';

            //watchdog('musth_restws', 'W7D001 IKJUIKJUIK   (!a) ',
            //    array('!a' => print_r($avatar_url, true)),
            //    WATCHDOG_DEBUG);

            // Creating the User object to send back
            $user_object_to_return = new User($uid,
                $name_to_display_as_name_of_the_user,
                $user_email,
                $first_name,
                $middle_names,
                $family_name,
                $user_language,
                $roles_array,
                $licenses_array,
                $user_groups,
                $avatar_url);

        } // end if ($uid == 0)

        // Sending back the User object

        /*watchdog('musth_restws', 'W7D001 thisisit \UserResourceController::read $user_object_to_return '.
            '<br> logged-in user (!u) <br> req user (!r) <br> user obj (!l) <br> req user (!q) <br> full (!f) ',
            array('!u' => print_r($user->uid, true),
                  '!r' => print_r($uid, true),
                  '!l' => print_r($user_object_to_return, true),
                  '!q' => print_r($requested_user, true),
                '!f' => print_r($return_full_profile, true)
            ),
            WATCHDOG_DEBUG);*/

        return $user_object_to_return;
    }

    /**
     * This method is used to updated some user properties and to allow users to join groups.
     *
     * ## Authorizations
     *
     * For now this method can used only to update the user profile of the logged-in user.
     * To use this method a user has to be logged in and they have to pass their user id in
     * the parameter $id.
     *
     * $id is passed as template parameter. This means that you find it in the url.
     * Example: http://musictheatre-production/musth_restws_user/156 --- 156 is the user id
     * All other values are in the PUT request body.
     *
     * ## Properties that can be updated
     *
     * * first_name
     * * middle_names
     * * family_name
     * * avatar
     *
     * Consider that, if all of first name, middle names and family name are empty strings, the user
     * will no longer have a real name. This is not a problem because we show their Drupal username (prettified)
     * if we have no real name.
     *
     * With this method we update the user's avatar. This method gets it as a string that contains the avatar
     * encoded in base 64.
     *
     * Avatars are 220x220px images in png format.
     *
     * ## Joining a group
     *
     * By using this method a user can join and leave a group. They have to send the group id
     * as the property 'groups'. Sorry for using a property called 'groups' to send one group id only.
     *
     * It works like a toggle. If the user is already member of the group, they leave it, if they aren't, they
     * join in.
     *
     * If the user is member of the group but they have a pending or blocked membership, they can't join or leave the
     * group.
     *
     * Only active members can leave a group and only non-members can join one, where for non-member we mean
     * a user who has no membership at all, either active, pending or blocked.
     *
     * This is to prevent users from leaving a group they were blocked members of and rejoin it a second later.
     *
     * ## Using this method to block a user
     *
     * The idea is to allow a group admin to block a user by using this method.
     * This has not been implemented.
     * For now, group admins who want to block a user have to send an email to editors.
     *
     * @restfulness Yes. The user id is explicitly given ($id)
     * @see RestWSResourceControllerInterface::update()
     * @param int $id User id of the user whose profile we are asked to change
     * @param array $values Properties to change (first_name, middle_names and family_name) or group the user
     * wants to join or leave (groups property)
     * @throws RestWSException
     */
    public function update($id, array $values) {

        global $user;

        /*watchdog('musth_restws', 'W7D001 UserResourceController::update <br> id (!i) <br> values (!v) ',
            array('!i' => print_r($id, true),
                  '!v' => print_r($values, true)),
            WATCHDOG_DEBUG);*/

        // For now, this check is OK as the only way users are added to groups, for now, is to have them
        // use this method to join a group. This because, for now, all groups are open
        if (!$user->uid || $id != $user->uid) {

            // If the user is not logged-in, no profile update is allowed
            // If the user the update has been requested for is not the one that
            // is logged-in, again authorisation is denied

            // Both cases are either bugs on the angular side or unauthorised attempts to access
            // the database

            watchdog('musth_restws', 'W3E151 Unauthorised attempt to update an user profile. ' .
                'Logged-in user id: (!l) id of the User resource they want to update: (!u)',
                array('!l' => print_r($user->uid, true),
                      '!u' => print_r($id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Unauthorised attempt to update an user profile', 403);
        }

        if (isset($values['avatar'])) {

            $encoded_avatar = $values['avatar'];

            // Example of $encoded_avatar:
            // (data:image/png;base64,iVBORw0KGgoAA ... )
            // I call encoding method this part: 'base64'

            list(, $data_part_including_encoding_method) = explode(';', $encoded_avatar);
            list(, $data_part_excluding_encoding_method) = explode(',', $data_part_including_encoding_method);
            $data_part_after_decoding = base64_decode($data_part_excluding_encoding_method);

            // $data_part_after_decoding contains the binary image ready to be saved to file system

            $file = file_save_data($data_part_after_decoding, 'public://pictures');

            // $file will contain an object
            // For example:  (stdClass Object ( [fid] => 45 [uri] => public://pictures/fileOKLYeL
            // [filename] => fileOKLYeL [filemime] => application/octet-stream [uid] => 115 [status] => 1
            // [timestamp] => 1441619919 [filesize] => 50675 ) )

            $edit['picture'] = $file;
            user_save($user, $edit);

            //watchdog('musth_restws', 'W7D001 UserResourceController::update avatar <br> (!a) <br> (!v) ',
            //    array('!a' => print_r($encoded_avatar, true),
            //        '!v' => print_r($file, true)),
            //    WATCHDOG_DEBUG);

        }

        $user_wrapper = entity_metadata_wrapper('user', $user);

        // Updating real name
        // We update these fields if they are set
        // If they are set but empty, we clear their value in the database
        // Example
        // If the first name is 'Emanuele' and $values['first_name'] is an empty
        // string, we remove the first name by making it empty in the user profile
        // It can happen that the real name becomes completely empty
        // Angular should ask the user if they really want to clear their real name

        if (isset($values['first_name']))
            $user_wrapper->field_first_name->set($values['first_name']);

        if (isset($values['middle_names']))
            $user_wrapper->field_middle_names->set($values['middle_names']);

        if (isset($values['family_name']))
            $user_wrapper->field_family_name->set($values['family_name']);

        // Let's add the user to the group, or remove them, if a group is specified

        if (!empty($values['groups'])) {

            $group_id_of_the_group_the_user_wants_to_join_or_leave = $values['groups'];

            // Does the group exist? Is it actually a group?

            // @attention we may want to do exception handling for the function og_is_group

            if (!og_is_group('node', $group_id_of_the_group_the_user_wants_to_join_or_leave)) {

                // The group doesn't exist or it exists as a node but it is not a group

                // This is an Angular bug because it should send the id of an existing group
                // It may be that the group has been deleted just a second ago

                watchdog('musth_restws', 'W3E303 Angular wants to add a user to a group that does not exist (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The given group is not a group or does not exist at all', 412);

            }

            // watchdog('musth_restws', 'W7D001 UserResourceController::update og_is_group returns <br> true if group (!i) <br> xxx (!v) ',
            //          array('!i' => print_r($it_is_a_group, true),
            //                '!v' => print_r($values, true)),
            //          WATCHDOG_DEBUG);

            // Now we add the user to the given group ($group_id_of_the_group_the_user_wants_to_join_or_leave)
            // For them to be added, they must not be members of the group
            // If they are active, pending or blocked members of the group, we don't add them

            // @attention we may want to do exception handling for the function og_is_member

            if (!og_is_member('node', // Our groups are all nodes
                              $group_id_of_the_group_the_user_wants_to_join_or_leave, // Group id
                              'user', // We want to check membership for a user
                              $user, // The user we want to check membership of
                              null  // Please consider the user as member whatever their status, active, pending or
                                    // blocked
                             )) {

                /* watchdog('musth_restws', 'W7D001 UserResourceController::update og_is_member returns TRUE <br> id (!i) <br> values (!v) ',
                    array('!i' => print_r($id, true),
                        '!v' => print_r($values, true)),
                    WATCHDOG_DEBUG);*/

                $values_for_og_group_function = array(
                    'entity_type' => 'user',  // The entity we want to add to the group is a user
                    'entity' => $user,        // This is it
                );

                try {

                    // The membership is create active. The user becomes an active member of the group immediately

                    og_group('node', // Our groups are all nodes
                        $group_id_of_the_group_the_user_wants_to_join_or_leave, // Group id
                        $values_for_og_group_function);

                    //throw new Exception('Just a test exception  W3E304 ????.');

                }
                catch (Exception $e) {

                    watchdog('musth_restws', 'W3E304 Error when adding a user to a group. Error message: (!e)',
                        array('!e' => print_r($e->getMessage(), true)),
                        WATCHDOG_ERROR);

                    // Get out of here!
                    throw new RestWSException('Error when adding a user to a group', 500);

                }

            } else {
                // OK, in this case the user is member of the group
                // But, are they active, pending or blocked?

                // If they are active, we let them leave the group
                // If they aren't, they can't leave the group but they won't be listed
                // as members because only active members are listed as members

                // Now I want to know if the user is an active member of the group

                // @attention we may want to do exception handling for the function og_is_member

                if (og_is_member('node', // Our groups are all nodes
                                 $group_id_of_the_group_the_user_wants_to_join_or_leave, // Group id
                                 'user', // We want to check membership for a user
                                 $user, // The user we want to check membership of
                                 array(OG_STATE_ACTIVE) // Please consider the user as member only if active
                                )) {

                    if (in_array('administrator member',
                                 og_get_user_roles('node',
                                                   $group_id_of_the_group_the_user_wants_to_join_or_leave,
                                                   $user->uid))) {

                        // @todo excpt handling to do

                        watchdog('musth_restws', 'W3E??? ku9ohyaera fixme An admin cannot leave their group. Values: (!v)',
                            array('!v' => print_r($values, true)),
                            WATCHDOG_ERROR);

                        // Get out of here!
                        throw new RestWSException('An admin cannot leave their group', 412);

                    }

                    // If they are active members of the group, they are using this method to leave the group
                    // Let them leave the group
                    // If they are pending or blocked members of the group, they can't leave it

                    try {

                        og_ungroup('node', $group_id_of_the_group_the_user_wants_to_join_or_leave, 'user', $user->uid);

                        //throw new Exception('Just a test exception W3E305 ????.');

                    }
                    catch (Exception $e) {

                        watchdog('musth_restws', 'W3E305 Error when removing a user from a group. Error message: (!e)',
                            array('!e' => print_r($e->getMessage(), true)),
                            WATCHDOG_ERROR);

                        // Get out of here!
                        throw new RestWSException('Error when removing a user from a group', 500);

                    }

                }

            } //  if (!og_is_member

        } // if (!empty($values['groups'])) {

        try {

            $user_wrapper->save();

            //throw new Exception('Just a test exception W3E152 ????.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', ' W3E152 Error in updating a user profile. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in updating a user profile', 500);

        }

    }

    /**
     * Not implemented. We don't delete anything through this api
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($id) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_user';
    }

}

/**
 * This function retrieves all active licenses the given user owns
 *
 * @param $userid int Drupal user id of the user
 * @return array|bool Array of the licenses or FALSE on error
 */
function musth_restws_load_licenses($userid) {

    // Retrieving all licenses for the given user

    $array_of_licenses_to_be_returned = array();

    try {

        // Loading all active licenses for the given user

        $query = new EntityFieldQuery();
        $ids_of_found_licenses = $query->entityCondition('entity_type', 'commerce_license')
            ->propertyCondition('status', COMMERCE_LICENSE_ACTIVE)
            ->propertyCondition('uid', $userid)
            ->execute();

    } catch (Exception $e) {

        watchdog('musth_rules', 'W3E137 Error in querying licenses a user owns. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    if (isset($ids_of_found_licenses['commerce_license'])) {

        // At least one license has been found

        $ids_of_found_licenses_just_the_ids = array_keys($ids_of_found_licenses['commerce_license']);

        //watchdog('musth_restws', 'W7D001 3333 TrackResourceController query (!f) (!m) (!n) ',
        //    array('!f' => print_r($filters, true),
        //        '!m' => print_r($meta_controls, true),
        //        '!n' => print_r($tracks_as_array, true),
        //    ), WATCHDOG_DEBUG);

        // Loading the actual licenses

        $license_entities = entity_load('commerce_license', $ids_of_found_licenses_just_the_ids);

        // $license_entities should contain the entities.
        // It can't be empty because we found at least one id in the previous query
        if (empty($license_entities)) {

            watchdog('musth_restws', 'W3E138 Empty array of licenses when it shouldnt be so (!l) ',
                array('!l' => print_r($ids_of_found_licenses_just_the_ids, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

        foreach($license_entities as $license_entity) {

            $id_of_the_product_the_current_license_is_about = $license_entity->product_id;

            if ($id_of_the_product_the_current_license_is_about != 0) {

                $product_as_array = entity_load('commerce_product', array($id_of_the_product_the_current_license_is_about));
                $product = $product_as_array[$id_of_the_product_the_current_license_is_about];

                // From the product we get the SKU, we need it to know which product the license is about

                $sku_of_the_product_current_license_is_about = $product->sku;

                // We get the track id and the programme id of the track and the programme the current product is about,
                // provided that the product actually is about a track

                $product_has_an_associated_track =
                    musth_helper_functions_this_product_has_an_associated_track($sku_of_the_product_current_license_is_about);

                /*watchdog('musth_restws', 'W7D001 76SWDE musth_restws_load_licenses $product_has_no_associated_track (!l) ',
                    array('!l' => print_r($product_has_an_associated_track, true)), WATCHDOG_DEBUG);*/

                $track_id = 0;
                $programme_id = 0;
                $programme_system_title = '';
                $programme_display_title = '';

                if ($product_has_an_associated_track) {

                    // Let's get the track

                    $product_wrapper = entity_metadata_wrapper('commerce_product', $product);

                    // We get the ids of the track and the programme associated to the current license
                    // If the license is about a subscription, there will be no track and no programme

                    if (isset($product_wrapper->field_track)) {

                        //watchdog('musth_restws', 'W7D001 81GTF-1 musth_restws_load_licenses access (!o) (!i) ',
                        //    array('!o' => print_r($product_wrapper, true),
                        //          '!i' => print_r('', true)),
                        //    WATCHDOG_DEBUG);

                        // field_track is single value. This is why we can directly get the node id
                        $track_id = $product_wrapper->field_track->value()->nid;

                        //watchdog('musth_restws', 'W7D001 81GTF-2 musth_restws_load_licenses access (!o) (!i) ',
                        //    array('!o' => print_r($product_wrapper, true),
                        //        '!i' => print_r($track_id, true)),
                        //    WATCHDOG_DEBUG);

                        if ($track_id) {

                            $track = $product_wrapper->field_track->value();

                            $track_wrapper = entity_metadata_wrapper('node', $track);

                            //watchdog('musth_restws', 'W7D001 81GTF-2a musth_restws_load_licenses access (!o) (!i) ',
                            //    array('!o' => print_r('', true),
                            //          '!i' => print_r($track_wrapper, true)),
                            //    WATCHDOG_DEBUG);

                            // It looks like field_programme is a list.
                            // This is because the field is multivalued
                            // Instead field_track in products is single valued.
                            $programmes = $track_wrapper->field_programme->value();

                            $programme_id = $programmes[0]->nid;

                            // @todo need to get system title and display title

                            if (isset($programmes[0]->field_system_title[LANGUAGE_NONE]))
                                $programme_system_title = $programmes[0]->field_system_title[LANGUAGE_NONE][0]['value'];
                            else
                                $programme_system_title = '';

                            if (isset($programmes[0]->field_display_title[LANGUAGE_NONE]))
                                $programme_display_title = $programmes[0]->field_display_title[LANGUAGE_NONE][0]['value'];
                            else
                                $programme_display_title = '';

                            //watchdog('musth_restws', 'W7D001 81GTF-3 musth_restws_load_licenses access (!o) (!i) ',
                            //    array('!o' => print_r($programme_id, true),
                            //        '!i' => print_r('', true)),
                            //    WATCHDOG_DEBUG);

                        }
                    }

                    if (!$track_id) {

                        watchdog('musth_restws', 'W3E153 We found a product that is about no track. Product: (!p) ',
                            array('!p' => print_r($product, true)),
                            WATCHDOG_ERROR);

                        // Get out of here!
                        return FALSE;
                    }

                }

                // @attention Is $product->title correct?
                // Do we have to use title_field instead? It looks like Commerce doesn't fully support it

                $license_object_to_return = new License($license_entity->license_id,
                                                        $userid,
                                                        $sku_of_the_product_current_license_is_about,
                                                        $product->title,
                                                        $license_entity->granted,
                                                        $license_entity->expires,
                                                        $track_id,
                                                        $programme_id,
                                                        $programme_system_title,
                                                        $programme_display_title);

                $array_of_licenses_to_be_returned[] = $license_object_to_return;

            } else {

                // It can't be that we found a license that is about no product

                watchdog('musth_restws', 'W3E139 We found a license that is about no product (!l) ',
                    array('!l' => print_r($license_entity, true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                // We don't want to risk to send back an incomplete array of licenses
                // It's better to throw an exception so that the user knows that something
                // went wrong and the list of licenses is a wrong one
                // if we send an incomplete list of licenses the user will complain that
                // some licenses are missing
                return FALSE;
            }

        }

    }

    return $array_of_licenses_to_be_returned;
}

/**
 * This function retrieves all groups a user is member of
 *
 * Below there is an example of the groups it will return.
 * There will be the group id, the group title and the role
 * the user has in the group.
 *
 * A user will have, as long as this group object is concerned, one of
 * these three roles: ADMIN, MEMBER, NONE.
 *
 * For now pending membership are not supported.
 *
 * <pre>
 * UserGroup Object (
 *    [id] => 932
 *    [title] => Don Pasquale Fan Group by esantanchewrong@gmail.com
 *    [role] => MEMBER
 * )
 * </pre>
 *
 * @param $user User Drupal user object representing the user we want the groups
 * they belong to
 * @return array Array of the groups
 * @throws RestWSException
 */
function musth_restws_load_user_groups($user) {

    $array_of_user_groups_to_be_returned = array();

    // Using the function og_get_groups_by_user to fetch the groups a user belongs to

    // Example of $array_of_groups_the_user_belongs_to
    // (Array ( [node] => Array ( [932] => 932 [934] => 934 [935] => 935 [937] => 937 [939] => 939 ) ) )

    try {

        $array_of_groups_the_user_belongs_to = og_get_groups_by_user($user);

        //throw new Exception('Just a test exception W3E306.');

    } catch (Exception $e) {

        watchdog('musth_rules', 'W3E306 Error when getting groups a user belongs to. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        throw new RestWSException('Error when getting groups a user belongs to', 500);
    }

    if (isset($array_of_groups_the_user_belongs_to['node'])) {

        // The user belongs to at least one group

        // Scanning all groups the user belongs to
        foreach($array_of_groups_the_user_belongs_to['node'] as $group_id) {

            // Loading the group of id $group_id to which the user belongs
            $a_group_the_user_belongs_to = node_load($group_id);

            // Let's ignore unpublished groups
            if ($a_group_the_user_belongs_to->status == NODE_NOT_PUBLISHED) continue;

            // Getting the OG roles the user has in the current group ($a_group_the_user_belongs_to)
            // Example of $array_of_user_OG_roles:
            // Array ( [2] => member [3] => administrator member )

            try {

                $array_of_user_OG_roles = og_get_user_roles('node', $group_id, $user->uid);

                //throw new Exception('Just a test exception W3E307.');

            } catch (Exception $e) {

                watchdog('musth_rules', 'W3E307 Error when getting the OG roles a user has. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('W3E307 Error when getting the OG roles a user has', 500);
            }

            // $user_role will be a string, either NONE, MEMBER or ADMIN
            $user_role = musth_restws_make_user_role_from_og_roles($array_of_user_OG_roles);

            //            watchdog('musth_restws', 'W7D001 GHGHGGh group <br> group (!u) <br> roles (!g) <br> role (!r) ',
            //                array('!u' => print_r($group_id, true),
            //                    '!g' => print_r($array_of_user_OG_roles, true),
            //                    '!r' => print_r($user_role, true)),
            //                WATCHDOG_DEBUG);

            $user_group_object_to_return = new UserGroup($group_id,
                $a_group_the_user_belongs_to->title,
                $user_role);

            $array_of_user_groups_to_be_returned[] = $user_group_object_to_return;

        }

    }

    //    watchdog('musth_restws', 'W7D001 Ongaochai3ziephaifah <br> user (!u) <br> user groups (!g) ',
    //        array('!u' => print_r($array_of_groups_the_user_belongs_to, true),
    //          '!g' => print_r($array_of_user_groups_to_be_returned, true)),
    //        WATCHDOG_DEBUG);

    return $array_of_user_groups_to_be_returned;
}

/**
 * By analysing the array of roles OG returns about a user, this function returns a string
 * that is the user role according to our own convention (NONE/MEMBER/ADMIN)
 *
 * @param $roles_array Array of OG defined roles
 * @return string The user role, one of NONE, MEMBER or ADMIN
 */
function musth_restws_make_user_role_from_og_roles($roles_array) {

    // OG roles are:
    // (Array ( [2] => member, [3] => administrator member ) )
    // for an admin
    // (Array ( [2] => member ) )
    // for a simple member

    // We want
    // $user_role == "MEMBER"
    // for a simple member
    // $user_role == "ADMIN"
    // for an admin

    // A user who is not member will have
    // $user_role == "NONE"

    // @attention pending users are not supported now

    $user_role = "NONE";

    if (in_array('member', $roles_array))
        $user_role = "MEMBER";

    if (in_array('administrator member', $roles_array))
        $user_role = "ADMIN";

    return $user_role;
}