<?php
/**
 * @file musth_restws.group.ctrl.inc
 *
 * @brief This file is about the GroupResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Group resource
 *
 * Here groups are created, changed and deleted.
 *
 * Groups we are talking about are OG groups.
 *
 * Queries
 * * all groups given at least three letters of the title
 * * all groups
 * * a single group given its id
 *
 * Note that:
 * * groups are created unpublished if found spammy
 * * when updating, we unpublish a group if Mollom finds it spammy
 * * when creating or updating a group, we trim the title and check that it's at least three characters long
 *
 * Permissions
 * * only logged-in users can create, update and delete groups
 * * only the group creator can update or delete a group
 * * everyone can read groups, but only if they are published
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// How many groups in a page, which means how many groups are sent at the same time when a query call is performed
define('MUSICTHEATRE_GROUPS_PAGE_LENGTH', 12);

class GroupResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //        watchdog('musth_restws', 'W7D001 GroupResourceController __construct mb_internal_encoding (!e) ',
        //            array('!e' => print_r(mb_internal_encoding(), true)),
        //            WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Group this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Group
     */
    public function propertyInfo() {

        return array(
            'nid' => array( // There is no distinction between node id and group id any more
                'type' => 'int',
                'label' => t('Node id of the group'),
            ),
            'uid' => array( // uid of the group creator. It has to be given explicitly
                'type' => 'int',
                'label' => t('Uid of the group creator'),
            ),
            'title' => array( // It hasn't to be unique
                'type' => 'text',
                'label' => t('Group title'),
            ),
            'description' => array( // Actually it's the field body of the node that represents the group
                'type' => 'text',
                'label' => t('Group description'),
            ),
            'created' => array( // Unix timestamp the group was created
                'type' => 'int',
                'label' => t('Creation unix timestamp'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Group resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Group id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $group_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_group',
            $group_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * Actually, in the case of this api, we have paging in place. This means that the count method
     * is called before this one.
     *
     * If the count method returns zero, this method won't be called (this is not sure, maybe this method
     * is called even if the count method returns zero).
     *
     * We implement two filters here.
     *
     * If we are given the node id of a group, we return it.
     *
     * Otherwise we return all groups, but, if we have a filter on the title property, we use it to filter the
     * results.
     *
     * The title can be just part of one.
     *
     * Sorting is by title.
     *
     * Only published groups are returned.
     *
     * @restfulness Yes. No user id checked or used.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array We use the page meta control to deliver a single page of the results
     * @throws RestWSException
     * @return array Array containing the ids of the groups we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        // Do we need to check if the user is logged-in or not?
        // Groups are public. We need the user to be logged-in when we create, edit or delete groups,
        // but not when we query them.

        // Implemented filters:
        // 1) All groups given at least three letters of the title, case insensitive.
        //    The (partial) title is $filters['title']
        //    Alphabetic sorting
        //    Only published groups
        // 2) The group whose id is given ($filters['nid'])
        //    Check if it exists of course
        // 3) As a default, all groups
        //    Alphabetic sorting
        //    Only published groups

        $query_result = array();

        //watchdog('musth_restws', 'W7D001 CMMT-Q 78yg comment query <br> filters (!f) <br> ',
        //    array('!f' => print_r($filters, true)
        //    ), WATCHDOG_DEBUG);

        if (!empty($filters['nid'])) {

            // If we have the node id of a group, we have to send it back
            $nid = $filters['nid'];

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'group')
                ->propertyCondition('nid', $nid)
                ->propertyCondition('status', NODE_PUBLISHED) // Get the group only if published
                ->count()
                ->execute();

            if ($result == 0) {

                // This is likely to be an Angular bug. The requested group should exist
                // It may also be that the group has been just deleted

                watchdog('musth_restws',
                    'W3E274 Angular wants details about a group that doesnt exist [query] (!f)',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

            } else {

                // The group exists and is published, let's return it

                $query_result = array($nid);

            }

            //watchdog('musth_restws', 'W7D001 CMMT-Q g56sdft comment query <br> filters (!f) <br> start (!s) <br> meta (!m) ',
            //    array('!f' => print_r($filters, true),
            //          '!s' => print_r($start, true),
            //          '!m' => print_r($meta_controls, true)
            //    ), WATCHDOG_DEBUG);

        } else {

            // We return all groups unless there is a filter on title

            // Defining the starting point of the page we have to serve
            if (isset($meta_controls['page']))
                $start = intval($meta_controls['page']) * MUSICTHEATRE_GROUPS_PAGE_LENGTH;
            else
                $start = 0;

            $query = new EntityFieldQuery();
            $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'group')
                ->propertyCondition('status', NODE_PUBLISHED) // Get published groups only
                ->propertyOrderBy('title', 'ASC')
                ->range($start, MUSICTHEATRE_GROUPS_PAGE_LENGTH);  // Serving only the requested page

            // We have a filter on title.
            // We add a condition to filter groups that match the given title (or part of it)
            if (!empty($filters['title'])) {

                $title = $filters['title'];

                // Using mb_strlen to get the correct length when the title is a multibyte utf8 string
                // with Chinese chars or similar

                // We refuse to do the query if the given title is less that three characters long

                if (mb_strlen($title) < 3) {
                    // Angular shouldn't be sending short titles, something is wrong, it's a bug

                    watchdog('musth_restws', 'W3E275 Title too short [query] (!f)',
                        array('!f' => print_r($filters, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Title too short', 412);
                }

                // Adding a condition on title, so that we get only groups whose title matches
                $query->propertyCondition('title', $title, 'CONTAINS');

            }

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            $result = $query->execute();

            if (isset($result['node'])) {

                $query_result = array_keys($result['node']);

            } else if ($start > 0) {

                // This shouldn't happen
                // RESTws should calculate pages correctly thanks to a fix done
                // We shouldn't have a situation in which we are serving an empty result set because RESTws should
                // reject queries with a too high page number before getting here
                // The fix that makes RESTws work correctly is described in a page titled "Emergency fix to RESTws"
                // in cmort-intranet
                // If RESTws module got updated, the fix has gone lost and has to be done again

                watchdog('musth_restws',
                    'W3E276 About to send empty page because of RESTws bug <br> filters (!f) <br> start (!s) <br> meta (!m) <br> result (!r) ',
                    array('!f' => print_r($filters, true),
                          '!s' => print_r($start, true),
                          '!m' => print_r($meta_controls, true),
                          '!r' => print_r($result, true)),
                    WATCHDOG_ERROR);

                // We return an empty result set anyway, hoping that someone will see the watchdog

            }

        }

        return $query_result;
    }

    /**
     * To create a group:
     * * you send a POST http query
     * * you must authenticate because anonymous users can't create groups
     * * send: title and description, as well as the uid of the group creator
     * * send the fields in json format
     *
     * The given group creator uid has to match with the uid of the logged-in user.
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @restfulness Yes. Uid is given explicitly.
     * @param array $values Properties to be used to create the group
     * @throws RestWSException
     * @return int Id of the new group
     */
    public function create(array $values) {

        global $user;

        // Create
        //
        // any user can create a group if they are logged-in
        // they have to be assigned the OG roles of admin and moderator (moderator is for later)
        // a group is created with comments closed because users won't comment the group, they will comment posts
        // the group type is Group
        // title and description have to be non-empty
        // a group is created unpublished by a user and has to be approved by an editor

//        watchdog('musth_restws', 'W7D001 GRP-C 1st group create values <br/> (!v) <br/> (!o) <br/> (!p) ',
//            array('!v' => print_r($values, true),
//                '!o' => print_r('', true),
//                '!p' => print_r('', true)),
//            WATCHDOG_DEBUG);

        if (!$user->uid) {

            // We don't create groups for not logged-in users

            watchdog('musth_restws',
                'W3E277 Anonymous users cannot create groups (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Only logged-in users can create groups', 403);
        }

        // To create a group:
        // title
        // description
        // uid, it has to be in $values anyway. Here we just check that the same user is logged in

        if (!empty($values['uid'])) {

            $group_creator_user_id = intval($values['uid']);

            // We need the user id of the group creator explicitly given in $values
            // Here we just check that the group creator is the same person as the logged-in user

            if ($user->uid != $group_creator_user_id) {

                watchdog('musth_restws',
                    'W3E278 The logged-in user is not the same as the group creator specified in the given values ' .
                    '<br> values (!v) <br> user (!u) ',
                    array('!v' => print_r($values, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The logged-in user is not the same as the group creator specified in the given values', 412);
            }

        } else {

            // We need the user id of the group creator to create a group. It has to be explicitly specified

            watchdog('musth_restws',
                'W3E279 No uid specified. We need the uid of the group creator explicitly specified (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No uid specified. We need the uid of the group creator explicitly specified', 412);
        }

        if (!empty($values['title'])) {

            $title = trim($values['title']);

        } else {

            watchdog('musth_restws',
                'W3E280 No title provided, we cant create a group with no title (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No title provided, cant create a group with no title', 412);
        }

        // Using mb_strlen to get the correct length when the title is a multibyte utf8 string
        // with Chinese chars or similar
        // This check works correctly with Chinese chars like U+2861D, which takes two bytes and a half
        // to store but counts as one character only
        // The function strlen() would count it as two bytes and a half and two of these characters
        // would not pass the test (strlen($title) < 3) because they would take five bytes.
        // Instead those two characters would pass the test (mb_strlen($title) < 3) because mb_strlen counts
        // them as two characters

        if (mb_strlen($title) < 3) {
            // Exception here because Angular shouldn't be sending short titles, something is wrong,
            // it's likely to be a bug

            watchdog('musth_restws', 'W3E281 Title too short (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Title too short', 412);
        }

        if (!empty($values['description'])) {

            $description = $values['description'];

        } else {

            watchdog('musth_restws',
                'W3E282 No description provided, we cant create a group with no description (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No description provided, we cant create a group with no description', 412);
        }

        // Creating the new group object
        // If the group is spammy, we held it for moderation and don't publish it

        $group_may_be_spammy = musth_helper_functions_this_text_is_spammy($title) ||
            musth_helper_functions_this_text_is_spammy($description);

        if ($group_may_be_spammy)
            $new_group_status = NODE_NOT_PUBLISHED;
        else
            $new_group_status = NODE_PUBLISHED;

        $group_properties = array(
            'type' => 'group',
            'uid' => $group_creator_user_id,
            'status' => $new_group_status,  // A group starts unpublished if spammy
            'comment' => 0, // Comments are not allowed for groups
            'promote' => 0, // Groups don't go to the Drupal front page (not that we care...)
        );
        // We create the group. A group is just a node.
        $group = entity_create('node', $group_properties);

        $group_wrapper = entity_metadata_wrapper('node', $group);

        // By using the wrapper, we do not have to worry about telling Drupal
        // what language we are using. The Entity API handles that for us.
        $group_wrapper->title->set($title);

        // For the field body we set only the value. We don't use the summary or the format fields
        $group_wrapper->body->set(array('value' => $description));

        try {

            $group_wrapper->save();

            // throw new Exception('Just a test exception W3E283.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E283 Error in saving a new group. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a new group', 500);
        }

        if ($group_may_be_spammy) {

            // This is not a true exception because it may happen to have spammy groups
            // We send back to Angular a 406 error so that Angular can tell the user that
            // their group has been held for moderation

            throw new RestWSException('Group saved but held for moderation', 406);
        }

        // The group creator is automatically given the role of administrator member

        //watchdog('musth_restws', 'W7D001 CMMT-C comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($new_comment_status, true),
        //          '!o' => print_r($comment_may_be_spammy, true),
        //          '!p' => print_r($result, true)),
        //    WATCHDOG_DEBUG);

        // Returning the id of the freshly created group
        return $group->nid;
    }

    /**
     * We implement paging in this case.
     *
     * When we do, this method is the first called. The RESTws module will come here first to
     * see if there is something to return. If the count method returns a non-zero result, it
     * will call the query method. If the count method returns zero, the query method won't be
     * called at all.
     *
     * If there are no groups for the given, possibly partial, title, this method will return zero
     * and the RESTws module will send back a 404 and won't call the query method.
     *
     * In case no filters are given, the count of all published groups is return, possibly being zero as well.
     *
     * In case a single group is required, this method returns 1 if the group exists and is published.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * Actually the filters are passed to this method first
     * @throws RestWSException
     * @return int Number of resources to be sent back
     */
    public function count($filters = array()) {

        //watchdog('musth_restws', 'W7D001 CMMT-CNT hy6 comment count <br> filters (!f) <br> ',
        //    array('!f' => print_r($filters, true)), WATCHDOG_DEBUG);

        $result = 0; // Yes, it's needless, but it's for safety in case the code below changes

        if (!empty($filters['nid'])) {

            $nid = $filters['nid'];

            try {
                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'group')
                    ->propertyCondition('nid', $nid)
                    ->propertyCondition('status', 1) // Get published groups only
                    ->count()
                    ->execute();

                // throw new Exception('Just a test exception W3E284.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E284 Error when searching for a group. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error when searching for a group', 500);
            }

            if ($result == 0) {

                // This is strange. Angular is asking for a group and is giving a wrong nid
                // It looks like a bug
                // It may be that the group has been deleted precisely when Angular was asking for its details
                // We throw an exception because it's unlikely that Angular wants info about a group and the group
                // has been just deleted

                watchdog('musth_restws',
                    'W3E274 Angular wants details about a group that doesnt exist [count] (!f)',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

            }

        } else {

            try {

                // Here we count all groups, unless we have a title filter
                // We deal with the title filter below

                $query = new EntityFieldQuery();
                $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'group')
                    ->propertyCondition('status', 1) // Get published groups only
                    ->count();

                if (!empty($filters['title'])) {

                    $title = $filters['title'];

                    // Using mb_strlen to get the correct length when the title is a multibyte utf8 string
                    // with Chinese chars or similar
                    // This check works correctly with Chinese chars like U+2861D, which takes two bytes and a half
                    // to store but counts as one character only
                    // The function strelen() would count it as two bytes and a half and two of these characters
                    // would not pass the test (strlen($title) < 3) because they would take five bytes.
                    // Instead those two characters would pass the test (mb_strlen($title) < 3) because mb_strlen counts
                    // them as two characters

                    // We won't perform the search if the title is shorter than three characters

                    if (mb_strlen($title) < 3) {
                        // Angular shouldn't be sending short titles, something is wrong, it's a bug

                        watchdog('musth_restws', 'W3E275 Title too short [count] (!f)',
                            array('!f' => print_r($filters, true)),
                            WATCHDOG_ERROR);

                        throw new RestWSException('Title too short', 412);
                    }

                    // Let's remember that, thanks to our collation (utf8_unicode_ci), the condition
                    // propertyCondition('title', $title, 'CONTAINS') will perform a case insensitive
                    // match
                    $query->propertyCondition('title', $title, 'CONTAINS');

                }

                $result = $query->execute();

                // throw new Exception('Just a test exception W3E285.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E285 Error when counting groups. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting groups', 500);
            }

        }

        //        watchdog('musth_restws', 'W7D001 CMMT-CNT aen4Eesaeb group count <br> filters (!f) <br> count (!c) ',
        //            array('!f' => print_r($filters, true),
        //                  '!c' => print_r($result, true)),
        //            WATCHDOG_DEBUG);

        return $result;
    }

    /**
     * We do paging and we send maximum MUSICTHEATRE_GROUPS_PAGE_LENGTH results at a time.
     * Our page is that long.
     *
     * @param int $client_limit Ignored
     * @return int Maximum MUSICTHEATRE_GROUPS_PAGE_LENGTH resources sent in a page
     */
    public function limit($client_limit = NULL) {

        return MUSICTHEATRE_GROUPS_PAGE_LENGTH;
    }

    /**
     * This is the function that sends back information about a group
     *
     * @attention We may want not to send back unpublished groups. This can happen if this method is called directly.
     * The frontend is not doing this, but hackers may do it. It's not critical because the most that they can get is
     * an unpublished group.
     *
     * It's possible to have unpublished groups. They are freshly created groups that editors didn't publish yet.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $id Id of the group we have to send back info about
     * @throws RestWSException
     * @return Group Object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        $group = node_load($id);

        if ($group) {

            // Check if the node of id $id is actually a group
            // It may not be so if this method is called directly
            // This check can be useful because hackers may use this method to get any node,
            // even if just the info we send back here

            if (!og_is_group('node', $group)) {

                watchdog('musth_restws',
                    'W3E286 The requested node is not a group. Id: ' . $id,
                    array(),
                    WATCHDOG_ERROR);

                throw new RestWSException('The node whose id is given is not a group, what is going on? Id: ' . $id, 403);
            }

            $group_wrapper = entity_metadata_wrapper('node', $group);

            // The line
            // $group_wrapper->body->value()['value']
            // should be
            // $group_wrapper->body->value()['safe_value']
            // if we allow html in group bodies (descriptions).
            // Now we don't, so we use 'value' because 'safe_value' contains html markup even if the
            // original group doesn't

            $group_to_return = new Group($id,
                $group->uid,
                $group->title,
                $group_wrapper->body->value()['value'],
                $group->created
            );

        } else {

            // The group has not been found
            // We throw a 404, but this shouldn't happen. In our client applications we don't
            // call the read method directly. We call the query method.
            // A hacker may use the read method directly or we may use it for debugging purposes.

            watchdog('musth_restws', 'W3E287 Group not found, what is going on? id: ' . $id,
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('Group not found, what is going on? Group id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 DFGT LIR-2 LineItemResourceController read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r($line_item, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Group object

        return $group_to_return;
    }

    /**
     * An update is a PUT http query. You use the url: http://musictheatre-production/musth_restws_group/99
     * where 99 is the id of the group you want to update.
     *
     * Any property you want to update has to be in a json object sent in the body of the PUT call.
     *
     * The id of the group we have to update is in the url and is passed
     * to this method as the parameter $id.
     *
     * The array $values may contain:
     *
     * * title: new title of the group (min three characters)
     * * description: new body of the group
     *
     * Only the owner of a group can update it.
     *
     * The group is held for moderation if Mollom finds it spammy after the update
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Yes. User id doesn't participate to this method because the group's owner
     * cannot be changed by using this method.
     * @param int $id Id of the group we have to update
     * @param array $values Associative array of the properties we have to change.
     * @throws RestWSException
     */
    public function update($id, array $values) {

        global $user;

//        watchdog('musth_restws', 'W7D001 ngbfwq GroupResourceController::update group update values (!v) (!i) ',
//            array('!v' => print_r($values, true),
//                  '!i' => print_r($id, true)),
//            WATCHDOG_DEBUG);

        // It's possible to update
        // title
        // description
        // Actually we want both of them and they can't be empty

        if (!empty($values['title'])) {

            $title = trim($values['title']);

        } else {

            watchdog('musth_restws',
                'W3E288 No title provided when updating a group (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No title provided, a group needs a title', 412);
        }

        if (mb_strlen($title) < 3) {
            // Exception here because Angular shouldn't be sending short titles, something is wrong

            watchdog('musth_restws', 'W3E289 Title too short (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Title too short', 412);
        }

        if (!empty($values['description'])) {

            $description = $values['description'];

        } else {

            watchdog('musth_restws',
                'W3E290 No description provided when updating a group (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No description provided, a group needs a description', 412);
        }

        // Checking if the group exists

        $group = node_load($id);

        if ($group) {

            // Only the group creator can change a group

            if ($group->uid != $user->uid) {

                // Consider that this exception can happen as well if the user is not logged-in at all ($user->uid == 0)

                watchdog('musth_restws',
                    'W3E291 The logged-in user is not the same as the group creator specified in the given values ' .
                    ' <br> group id (!c) <br> user (!u) ',
                    array('!c' => print_r($id, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Cant update group, the logged-in user doesnt own it. Id: ' . $id, 403);
            }

            // Now updating the group

            // If the group is spammy, we held it for moderation and unpublish it

            $group_may_be_spammy = musth_helper_functions_this_text_is_spammy($title) ||
                musth_helper_functions_this_text_is_spammy($description);

            if ($group_may_be_spammy)
                $group->status = NODE_NOT_PUBLISHED;
            else
                $group->status = NODE_PUBLISHED;

            $group_wrapper = entity_metadata_wrapper('node', $group);

            // By using the wrapper, we do not have to worry about telling Drupal
            // what language we are using. The Entity API handles that for us.
            $group_wrapper->title->set($title);

            // For the field body we set only the value. We don't use the summary or the format fields
            $group_wrapper->body->set(array('value' => $description));

            try {

                $group_wrapper->save();

                // throw new Exception('Just a test exception W3E292.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E292 Error in updating a group. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in updating a group', 500);
            }

        } else {

            watchdog('musth_restws', 'W3E293 Group not found (!g) (!v) ',
                array('!g' => print_r($id, true),
                      '!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Group not found, group id: ' . $id, 404);
        }

        if ($group_may_be_spammy)
            throw new RestWSException('Group updated but held for moderation', 406);

        //watchdog('musth_restws', 'W7D001 8765 line item update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, an update call returns nothing if it's successful
    }

    /**
     * This api deletes a group given its id.
     *
     * Only the group creator can delete a group.
     *
     * To delete the group we use the Drupal api node_delete.
     *
     * @see RestWSResourceControllerInterface::delete()
     *
     * @restfulness Yes. User id is used for checking only
     * @param int $id Id of the group to delete
     * @throws RestWSException
     */
    public function delete($id) {

        global $user;

        $group = node_load($id);

        //watchdog('musth_restws', 'W7D001 7yhtggg CommentResourceController::delete values (!u) (!i) ',
        //    array('!u' => print_r($comment, true),
        //        '!i' => print_r($cid, true)),
        //    WATCHDOG_DEBUG);

        if ($group) {

            // Only the group creator can delete a group

            if ($group->uid != $user->uid) {

                // This is a bug because Angular shouldn't ask for a group to be deleted if its owner
                // is not logged-in.
                // Or maybe it's a hacker

                watchdog('musth_restws', 'W3E294 The logged-in user is not the same as the group ' .
                                          'creator specified in the given values <br> group id (!g) <br> user (!u) ',
                    array('!g' => print_r($id, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Cant delete group, user doesnt own it: ' . $id, 403);
            }

            try {

                node_delete($id);

                // throw new Exception('Just a test exception W3E295.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E295 Error in deleting a group. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in deleting a group', 500);
            }

        } else {

            // This is likely to be an Angular bug because Angular is wanting to delete a group that
            // doesn't exist

            watchdog('musth_restws', 'W3E296 Group not found <br> group id (!g) <br> user (!u) ',
                array('!g' => print_r($id, true),
                      '!u' => print_r($user, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Group not found, group id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 ZXCV line item delete values (!v) (!i) ',
        //    array('!v' => print_r('', true),
        //        '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, throw exceptions if there are problems
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

        return 'musth_restws_group';
    }

}
