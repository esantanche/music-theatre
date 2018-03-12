<?php
/**
 * @file musth_restws.votesaggregate.ctrl.inc
 *
 * @brief a VotesAggregate is a resource that gives the results of the voting that has been going on
 * about a node. People voted a node, let's say a review, and this api returns the results.
 * Is the result a thumbs-up or a thumbs-down? And how many votes have been given?
 *
 * There is only a query method (and the read method of course)
 *
 * It's possible to get a single VotesAggregate resource containing the aggregates of the votes given
 * to a node.
 *
 * It's also possible to get all aggregates given a tag. This is used to fetch all aggregates for a collection
 * of nodes. For example all aggregates for all tracks of a given programme
 *
 * This api has no notion of programmes-tracks relationships. It takes the tag as it is and the client has to
 * make sure that the tag is doing its job properly.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class VotesAggregateResourceController implements RestWSQueryResourceControllerInterface {

    private $aggregates_keyed_by_node_id;   // Keeping the aggregates we find so that the read method doesn't have
                                            // to fetch them again

    public function __construct() {

        $this->aggregates_keyed_by_node_id = array();

        //watchdog('musth_restws', 'W7D001 Mh67ty ReviewResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource VotesAggregate this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource VotesAggregate
     */
    public function propertyInfo() {

        return array(
            'nid' => array(
                'type' => 'int',
                'label' => t('Node id of the node the votes aggregates are about'),
            ),
            'tag' => array( // Tag used to retrieve aggregates of votes given to many nodes that share precisely the same tag
                'type' => 'text',
                'label' => t('Tag used to select and return a collection of votes in one go'),
            ),
            'average' => array(
                'type' => 'int',
                'label' => t('Average of votes'),
            ),
            'sum' => array(
                'type' => 'int',
                'label' => t('Sum of votes'),
            ),
            'count' => array(
                'type' => 'int',
                'label' => t('Count of votes'),
            )
        );
    }

    /**
     * Metadata wrapper for the VotesAggregate resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int VotesAggregate id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $votesaggregate_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_votesaggregate',
            $votesaggregate_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * The filter 'nid' is supported. If this filter is defined, we send back the VotesAggregate resource
     * associated to the node whose id is the one the filter specifies.
     *
     * By using the filter 'tag' all VotesAggregate resources associated to that tag are returned.
     *
     * For example, if the tag is 'V1036', we get the aggregated votes given to nodes with the given tag
     * being used when creating the vote.
     *
     * In this example 'V1036' is the catalogue no of a programme, so we get the aggregated votes given to
     * a collection of nodes that are somehow associated to that programme.
     *
     * Let's not detail the idea because this api knows nothing about the actual meaning of tags. It just
     * collects all aggregates for a tag.
     *
     * The client has to provide a tag that is fit for its job.
     *
     * @todo documentation to fix now we have tags and nodes at the same time (node + tag)
     *
     * @todo add an attention saying that this api should be refactored quite heavily by
     * making it return an object for each row in votingapi_cache table
     * A row for the average, one for the count, etc. because, in this way, we can fetch many
     * tags at the same time for a node. Now we have to call this api one time for each tag.
     * So, first we call it to fetch the aggregates with tag 'vote', then we do the same for tag 'fan',
     * for example.
     *
     * This method will actually fetch the votes aggregates and put them in a member variable so that
     * the read method doesn't have to fetch the aggregates again.
     *
     * @restfulness Completely. No user id involved here
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used
     * @throws RestWSException
     * @return array Array containing the ids of the VotesAggregate resources we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        // I don't need the logged in user (global $user;) because votes are public

        //watchdog('musth_restws', 'W7D001 VOTEAGG-q 78sf votesaggr query <br> filters (!f) <br> (!m) ',
        //    array('!f' => print_r($filters, true),
        //          '!m' => print_r($meta_controls, true)
        //    ), WATCHDOG_DEBUG);

        // Implemented filters:
        // 1) The VotesAggregate resource for a single node and a single tag
        // 2) The VotesAggregate resource for a single given node
        // 3) All VotesAggregate resources for a single tag

        // @todo comments to fix?

        // @todo when a node is in the query parameters, we may return the aggregates for all tags
        // so that the client doesn't have to call this api twice, every time for a different tag

        $nid = 0;

        // Let's check if the node exists first so that we don't have to do this check
        // twice
        if (!empty($filters['nid'])) {

            $nid = $filters['nid'];

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
                    'W3E225 The node doesnt exist, we cant votes aggregates about a non-existing node (!n)',
                    array('!n' => print_r($nid, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The node cant be found or its not published', 412);
            }

        }

        if ($nid && !empty($filters['tag'])) {

            $this->aggregates_keyed_by_node_id =
                musth_helper_functions_get_voting_results('node', $nid, $filters['tag']);

        } elseif ($nid) {
            // $filters['nid'] not specified or equal to zero are both considered empty
            // So, here we know that $filters['nid'] is not zero


            // Now we can proceed to get the aggregates for the given node

            // We park the results in the array $this->aggregates_keyed_by_node_id so that the read method
            // doesn't have to fetch them again

            $this->aggregates_keyed_by_node_id = musth_helper_functions_get_voting_results('node', $nid);

            //watchdog('musth_restws',
            //    'W3E??? ???? 8yygy6565434rr nid: (!f) (!a) ',
            //    array('!f' => print_r($nid, true),
            //          '!a' => print_r($this->aggregates_keyed_by_node_id, true)
            //         ),
            //    WATCHDOG_DEBUG);

        } elseif (!empty($filters['tag'])) {

            $this->aggregates_keyed_by_node_id = musth_helper_functions_get_voting_results_by_tag($filters['tag']);

        } else {

            watchdog('musth_restws',
                'W3E226 No nid and no tag provided, what did you call this api for? (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('We need a nid or a tag', 412);
        }

        // throw new RestWSException('We 6456456456d or a tag', 500);

        // We are not checking if $this->aggregates_keyed_by_node_id == null and why
        // Maybe there are no votes for the given tag or node or maybe something went wrong in the functions
        // musth_helper_functions_get_voting_results_by_tag and musth_helper_functions_get_voting_results
        // These function will write some watchdogs if anything is wrong, check them

        // We pass to the read method the ids of the nodes whose aggregates we found
        // The read method will get the aggregates from the array $this->aggregates_keyed_by_node_id

        return array_keys($this->aggregates_keyed_by_node_id);
    }

    /**
     * Not implemented
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @param array $values Properties to be used to create the review
     * @throws RestWSException
     * @return int Id of the new review
     */
    public function create(array $values) {

        throw new RestWSException('Not implemented', 501);
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
     * @param int $client_limit Not used here
     * @return int Maximum 1000 resources
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a VotesAggregate
     *
     * Consider that in this case $nid is not the id of the votes aggregate, but it's
     * the id of the node the votes aggregate is about. The table votingapi_cache,
     * each row of which corresponds to a VotesAggregate resource (not precisely, but almost),
     * has a vote_cache_id columns that identifies the VotesAggregate (almost), but we don't use it.
     *
     * Since a VotesAggregate is about a node and a node can have one VotesAggregate only, at least for now,
     * we use the node id to identify a VotesAggregate.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $nid Node id of the node whose VotesAggregate we have to send back
     * @return VotesAggregate Object containing the VotesAggregate resource
     * @throws RestWSException
     */
    public function read($nid) {

        //watchdog('musth_restws',
        //    'W3E??? ???? nxhbxgsdvbv \VotesAggregateResourceController::read nid: (!f) (!a) ',
        //    array('!f' => print_r($nid, true)),
        //    WATCHDOG_DEBUG);

        if (isset($this->aggregates_keyed_by_node_id[$nid])) {

            $votes_aggregate_for_the_given_node = $this->aggregates_keyed_by_node_id[$nid];

        } else {

            // What happened here? It happened that the read method has been called directly
            // when the query method should be called to fetch aggregates
            // Maybe a hacker is trying to use this method to gain some insight

            watchdog('musth_restws',
                'W3E227 Attempt to read a votes aggregate by direct call (!n) (!t) ',
                array('!n' => print_r($nid, true),
                      '!t' => print_r($this->aggregates_keyed_by_node_id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Read method for VotesAggregate called directly', 403);
        }

        // Not all three of average, sum and count are set at the same time
        // Usually you have average and count or sum and count
        // So, if one of them is not set, we set it to zero

        if (isset($votes_aggregate_for_the_given_node['average']))
            $average = intval($votes_aggregate_for_the_given_node['average']);
        else
            $average = 0;

        if (isset($votes_aggregate_for_the_given_node['sum']))
            $sum = intval($votes_aggregate_for_the_given_node['sum']);
        else
            $sum = 0;

        if (isset($votes_aggregate_for_the_given_node['count']))
            $count = intval($votes_aggregate_for_the_given_node['count']);
        else
            $count = 0;

        $votes_aggregate_to_return = new VotesAggregate(
            intval($nid),
            $votes_aggregate_for_the_given_node['tag'],
            $average,
            $sum,
            $count
        );

        return $votes_aggregate_to_return;
    }

    /**
     * Not implemented
     *
     * @param int $id Id of the VotesAggregate to update
     * @param array $values Properties to update
     * @throws RestWSException
     */
    public function update($id, array $values) {

        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Not implemented
     *
     * @param int $id Id of the VotesAggregate to delete
     * @throws RestWSException
     */
    public function delete($id) {

        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Access granted for every operation and id
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

        return 'musth_restws_votesaggregate';
    }

}
