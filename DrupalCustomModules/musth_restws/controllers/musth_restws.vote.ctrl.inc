<?php
/**
 * @file musth_restws.vote.ctrl.inc
 *
 * @brief This file is about the VoteResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Vote resource
 *
 * The Vote resource corresponds to a single vote given to an entity. Votes are created
 * by using Voting Drupal apis.
 *
 * All votes given by a user can be retrieved in one go by using the query method.
 *
 * Votes can be created and given a tag such that, when fetching votes aggregates, all aggregates calculated
 * on votes that have been given the same tag can be returned together.
 *
 * Typically tags are used to retrieve votes aggregates that are about all tracks belonging to a same programme,
 * for example. We use this tag trick because a vote given to a track shows no direct relationship to the programme
 * the track belongs to.
 *
 * @attention No effort is done here to check if tags given to votes are actually correct. The client
 * has to make sure that the tags it gives to votes are fit for their purpose
 *
 * No permission check is done when votes are queried because they are public.
 *
 * Only logged-in users can create votes.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class VoteResourceController implements RestWSQueryResourceControllerInterface {

    private $votes_given_by_the_user_indexed_by_vote_id;   // Keeping the votes we find so that the read method doesn't have
                                                           // to fetch them again

    public function __construct() {

        $this->votes_given_by_the_user_indexed_by_vote_id = array();

        //watchdog('musth_restws', 'W7D001 Mh67ty ReviewResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Vote this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Vote
     */
    public function propertyInfo() {

        return array(
            'id' => array(
                'type' => 'int',
                'label' => t('Id of the vote from voting apis'),
            ),
            // Remember that entities other than nodes are not supported
            'nid' => array(
                'type' => 'int',
                'label' => t('Node id of the node the vote is about'),
            ),
            'uid' => array( // User id of the voter
                'type' => 'int',
                'label' => t('User id of the voter'),
            ),
            'name' => array(
                'type' => 'text',
                'label' => t('Made-up user name, or real name, of the user who voted'),
            ),
            'avatar' => array( // Avatar url
                'type' => 'text',
                'label' => t('Avatar'),
            ),
            'tag' => array( // Tag used to retrieve aggregates of votes given to nodes with the votes sharing the same tag
                'type' => 'text',
                'label' => t('Tag used to select and return a collection of votes in one go'),
            ),
            'value_type' => array(
                'type' => 'text',
                'label' => t('percent or points'),
            ),
            'value' => array(
                'type' => 'int',
                'label' => t('The actual vote, 1/-1 or 0 to 100'),
            ),
            // We need the display title of the programme whose node id is nid
            // It's the programme this vote is about
            // We should always have a display title for nodes voted by
            // using our voting system
            // If there is no display title, we will return an empty property
            'display_title' => array(
                'type' => 'text',
                'label' => t('Display title'),
            ),
            // The same as above. We need the system title as well because
            // the client needs it to calculate the url of the node's page
            'system_title' => array(
                'type' => 'text',
                'label' => t('System title'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Vote resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Vote id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $vote_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_vote',
            $vote_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * The filter 'uid' is supported. If this filter is defined, all votes given by the user identified
     * by 'uid' are returned.
     *
     * If no 'uid' filter is specified, we throw an exception because no other filters are supported.
     *
     * @restfulness Yes. Uid is given explicitly.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used here
     * @throws RestWSException
     * @return array Array containing the ids of the votes we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        // I don't need the logged-in user profile (global $user;) because votes are public

        //watchdog('musth_restws', 'W7D001 VOTE-q 78sf vote query <br> filters (!f) <br> (!m) ',
        //    array('!f' => print_r($filters, true),
        //          '!m' => print_r($meta_controls, true)
        //    ), WATCHDOG_DEBUG);

        // Implemented filters:
        // 1) All votes for a given user
        // 2) fixme

        // No meta controls here (for now), so no paging

        $nid = 0;
        $node_votes_are_about = null;

        // Let's check if the node exists first so that we don't have to do this check
        // twice
        if (!empty($filters['nid'])) {

            $nid = $filters['nid'];

            // @todo any fix to comments?

            //watchdog('musth_restws',
            //    'W3E??? ???? s7d7tdd nid: (!f)',
            //    array('!f' => print_r($nid, true)),
            //    WATCHDOG_DEBUG);

            // Now attempting to check the existence of the node
            // we have to return aggregates for
            // As a check, we count it as existent only if it's published
            // How could a vote have been cast on an unpublished node?

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('status', 1) // get the node only if it's published
                ->propertyCondition('nid', $nid)
                ->count()
                ->execute();

            if (!$result) {

                watchdog('musth_restws',
                    'W3E225???? ahThairaegei7aequob4 The node doesnt exist, we cant votes aggregates about a non-existing node (!n)',
                    array('!n' => print_r($nid, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The node cant be found or its not published', 412);
            }

        }

        if (!empty($filters['uid'])) {

            // If we have the user id of a user, we have to send back all votes ever given by that user
            $uid = $filters['uid'];

            // @attention we may want to check if $uid is the id of an existing user.
            // Now we don't check this so we may happen to send back no votes because the given uid was wrong
            // and not because that user created no votes

            // We want all votes the user whose id is $uid ever gave
            // The entity type is 'node' because we don't support other entity types for now

            $criteria = array(
                'entity_type' => 'node', // entities other than nodes are not supported
                'uid' => $uid
            );

            //watchdog('musth_restws', 'W7D001 VOTE-q 8w8uuu vote query <br> filters (!f) <br> votes (!s) <br> vote ids (!m) ',
            //    array('!f' => print_r($filters, true),
            //          '!s' => print_r($this->votes_given_by_the_user_indexed_by_vote_id, true),
            //          '!m' => print_r($vote_ids, true)
            //    ), WATCHDOG_DEBUG);

        } elseif ($nid) {

            $criteria = array(
                'entity_type' => 'node', // entities other than nodes are not supported
                'entity_id' => $nid
            );

            if (!empty($filters['tag']))
                $criteria['tag'] = $filters['tag'];

        } else {

            watchdog('musth_restws', 'W3E215 No uid specified. We need the uid of the voter to retrieve their votes (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('A user id has to be specified', 412);

        }

        $vote_ids = array();

        if ($criteria) {

            try {

                $votes_given_by_the_user = votingapi_select_votes($criteria);

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E214 Error in querying votes. Error message: (!e) ',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                return null;
            }

            // I'm storing the votes in $this->votes_given_by_the_user_indexed_by_vote_id so that the read method
            // doesn't have to fetch the votes again

            foreach ($votes_given_by_the_user as $full_details_vote) {

                $vote_ids[] = $full_details_vote['vote_id'];

                // @todo We need to add display_title and system_title

                //watchdog('musth_restws', 'W7D001 VOTE-q 67yyggstt node vote is about <br> node (!f) <br> nid (!s) <br> - (!m) ',
                //    array('!f' => print_r($node_votes_are_about, true),
                //          '!s' => print_r($nid, true),
                //          '!m' => print_r($full_details_vote, true)
                //    ), WATCHDOG_DEBUG);

                // @attention We assume that votes are cast on nodes only

                // If a vote is cast on a review, for example, no system title or display title will be
                // available

                // @todo excpt handling: check that the entity the vote is about is actually a node

                $node_votes_are_about = node_load($full_details_vote['entity_id']);

                if (isset($node_votes_are_about->field_system_title[LANGUAGE_NONE]))
                    $system_title = $node_votes_are_about->field_system_title[LANGUAGE_NONE][0]['value'];
                else
                    $system_title = '';

                $full_details_vote['system_title'] = $system_title;

                if (isset($node_votes_are_about->field_display_title[LANGUAGE_NONE]))
                    $display_title = $node_votes_are_about->field_display_title[LANGUAGE_NONE][0]['value'];
                else
                    $display_title = '';

                $full_details_vote['display_title'] = $display_title;

                // The vote with all its details is put in the array $this->votes_given_by_the_user_indexed_by_vote_id
                // indexed by vote id so that the read method has an easy life when retrieving it

                $this->votes_given_by_the_user_indexed_by_vote_id[$full_details_vote['vote_id']] = $full_details_vote;
            }

        }

        return $vote_ids;
    }

    /**
     * To create a vote:
     * * you send a POST http query
     * * you have to authenticate because anonymous users can't create votes
     * * you send:
     * ** uid, the id of the voter. It has to be the same as the logged-in user
     * ** nid, the id of the node being voted
     * ** tag, an optional tag to be associated to the vote. Defaults to 'vote'
     * ** value_type, 'percent' or 'points'. Mandatory
     * ** value, the actual vote. It may be 1 or -1 for 'points' votes or 0 to 100 for 'percent' votes
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @restfulness Yes. Uid is given explicitly.
     * @param array $values Properties to be used to create the vote
     * @throws RestWSException
     * @return int Id of the new vote. Actually we return a dummy id because we don't care about the real
     * vote id
     */
    public function create(array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 REVIEW-create 1st comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //        '!o' => print_r('', true),
        //        '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // To create a vote we need:

        // id, no we will return it
        // nid, node id of the node the vote is given to
        // uid, id of the user that voted
        // tag, it's optional and will be used to fetch the aggregates that have been
        // calculated for a collection of nodes
        // value_type, percent or points, percent for 0-to-100 votes and points for +1/-1 votes
        // value, actual vote

        // About tags
        // Tags are used here to fetch the aggregates calculated for a collection of nodes in one go
        // The VotesAggregate REST api will be used to do this. For example, if we want the aggregates calculated for
        // all tracks in a programme, when we create votes for a track, we can give them a tag that is unique for the
        // programme the tracks belong to.
        // It's the client responsibility to provide a tag that is suitable to perform this task.
        // The tag has to be such that:
        // 1) the voted node can have only one of it
        // 2) it can't be undefined for a node
        // 3) it correctly collects the nodes in the way the client needs them collected

        if (!empty($values['uid'])) {

            $voter_user_id = intval($values['uid']);

            // Here we check that the voter and the logged-in user are the same user
            if ($user->uid != $voter_user_id) {

                // For a vote to be created as given by a user, that user has to be logged in

                watchdog('musth_restws',
                    'W3E216 The logged-in user is not the same as the voter specified in the given values (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The logged-in user is not the same as the voter specified in the given values', 412);
            }

        } else {

            // If $values['uid'] == 0 we end up here

            // We need the user id of the voter to create a vote, and they have to be logged in

            watchdog('musth_restws',
                'W3E217 No uid specified. We need the uid of the voter to create a vote (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No uid specified. We need the uid of the voter to create a vote', 412);
        }

        //watchdog('musth_restws', 'W7D001 CMMT-C uua76763 comment create values (!v) ',
        //    array('!v' => print_r($values, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['nid'])) {

            $nid = $values['nid'];

            // If we are given the node id of a node the vote is about, we check if that node exists

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('nid', $nid)
                ->count()
                ->execute();

            if (!$result) {

                watchdog('musth_restws',
                    'W3E218 The node doesnt exist, we cant create a vote about nothing (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The node doesnt exist, we cant create a vote about nothing', 412);
            }

        } else {

            // We need a nid to create a vote

            watchdog('musth_restws',
                'W3E219 Angular called this api passing no nid at all (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No nid provided, cant create a vote about nothing', 412);
        }

        // @attention We may want to load the node being voted to:
        // 1) Check that the voter doesn't own the node
        // 2) The node is actually a node and not another type of entity
        // 3) If the node is a programme, we may want to check that the vote type is 'percent' and not 'points'
        // 4) If the node is a review, we may want to check that the vote type is 'points' and not 'percent'
        // Now we don't do these check to save a query

        // So, we use the provided tag to tag the vote we are about to create, but we do no check to make it sure
        // the tag does its job properly

        // @attention in the future we may want to check if the tag is correct to prevent bugs

        if (!empty($values['tag']))
            $tag = $values['tag'];
        else
            $tag = 'vote';

        if (!empty($values['value_type'])) {

            $value_type = $values['value_type'];

        } else {

            watchdog('musth_restws',
                'W3E220 No value type specified. We need the value type to be specified to create a vote (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No value_type provided, we cant create a vote with no value type', 412);
        }

        if (!in_array($value_type, array('percent', 'points'))) {
            //  percent or points

            watchdog('musth_restws',
                'W3E221 Wrong value type specified. We need the value type to be correct to create a vote (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Wrong value_type provided', 412);
        }

        // Let's remember that 0 as a vote is allowed. It's used for example
        // when a user no longer wants to be a fan of a node
        if (isset($values['value'])) {

            $value = $values['value'];

        } else {

            watchdog('musth_restws',
                'W3E222 No value specified. We need the value of the vote to be specified to create a vote (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No value provided, we cant create a vote with no value', 412);
        }

        if (($value_type == 'percent' && ($value < 0 || $value > 100)) ||
            ($value_type == 'points' && ($value != -1 && $value != 1))) {

            watchdog('musth_restws',
                'W3E223 Wrong value specified. We need the value to be correct to create a vote (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Wrong value provided', 412);
        }

        // Any exception handling is done inside the function musth_helper_functions_cast_vote itself

        musth_helper_functions_cast_vote('node', $nid, $tag, $value_type, $value, $voter_user_id);

        //watchdog('musth_restws', 'W7D001 REVIEW review create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //          '!o' => print_r($review, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // Returning a dummy id for now, we don't need the real one
        return 1;
    }

    /**
     * We don't implement paging in this case.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * Actually the filters are passed to this method first
     * @return int Number of resources to be sent back (max)
     * @throws RestWSException
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * We don't implement paging in this case.
     *
     * @param int $client_limit Not used
     * @return int Maximum 1000 resources sent back
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a vote
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $id Id of the vote we have to send back info about
     * @throws RestWSException
     * @return Review Object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        //global $user;

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        if (!count($this->votes_given_by_the_user_indexed_by_vote_id)) {

            // Here it happens that the read method has been called without calling the query method first
            // This happens if a resource is queried directly like in
            // http://musictheatre-production/musth_restws_vote/116
            // We don't do this usually, so it's a hacker's attempt

            watchdog('musth_restws',
                'W3E224 Attempt to read a vote by direct call (!i)',
                array('!i' => print_r($id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Query method not called before this one (read)', 403);
        }

        $vote_author_user_profile = user_load($this->votes_given_by_the_user_indexed_by_vote_id[$id]['uid']);

        if (isset($vote_author_user_profile->field_first_name[LANGUAGE_NONE])) {
            $first_name = $vote_author_user_profile->field_first_name[LANGUAGE_NONE][0]['value'];
        } else {
            $first_name = '';
        }

        if (isset($vote_author_user_profile->field_middle_names[LANGUAGE_NONE])) {
            $middle_names = $vote_author_user_profile->field_middle_names[LANGUAGE_NONE][0]['value'];
        } else {
            $middle_names = '';
        }

        if (isset($vote_author_user_profile->field_family_name[LANGUAGE_NONE])) {
            $family_name = $vote_author_user_profile->field_family_name[LANGUAGE_NONE][0]['value'];
        } else {
            $family_name = '';
        }

        $composed_real_name = musth_helper_functions_compose_real_name($first_name, $middle_names, $family_name);

        // $comment->name is the username and it is not OK because there may be the uid at the end of the name
        // Usernames created by the registration process are like this one: firstname.surname_156
        // 156 is the user id and we don't want it to show up, it's ugly.
        // For this reason we use the function musth_helper_functions_make_username_nice_to_display that manipulate
        // the username to make it nicer. It cuts the uid part.

        if (empty($composed_real_name))
            $name_to_display_as_vote_author =
                musth_helper_functions_make_username_nice_to_display($vote_author_user_profile->name);
        else
            $name_to_display_as_vote_author = $composed_real_name;

        $avatar_file_info = $vote_author_user_profile->picture;

        //$avatar_image_object = image_load($avatar_file_info->uri);

        if ($avatar_file_info)
            $avatar_url = file_create_url($avatar_file_info->uri);
        else
            $avatar_url = '';



        $vote_to_return = new Vote($id,
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['entity_id'],
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['uid'],
            $name_to_display_as_vote_author,
            $avatar_url,
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['tag'],
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['value_type'],
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['value'],
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['display_title'],
            $this->votes_given_by_the_user_indexed_by_vote_id[$id]['system_title']);


        return $vote_to_return;
    }

    /**
     * Not implemented
     *
     * @param int $id Id of the vote to update
     * @param array $values Properties to update
     * @throws RestWSException
     */
    public function update($id, array $values) {

        throw new RestWSException('Not implemented', 501);

    }

    /**
     * Not implemented
     *
     * @param int $id Id of the vote to delete
     * @throws RestWSException
     */
    public function delete($id) {

        throw new RestWSException('Not implemented', 501);

    }

    /**
     * Access granted for every operation and resource id
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

        return 'musth_restws_vote';
    }

}
