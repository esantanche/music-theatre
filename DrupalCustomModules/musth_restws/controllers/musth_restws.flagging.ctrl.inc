<?php
/**
 * @file musth_restws.flagging.ctrl.inc
 *
 * @brief This file is about the FlaggingResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Flagging resource
 *
 * Flaggings are flags given to nodes or comments or other types of entities.
 *
 * We use them to flag comments as abusive.
 *
 * Flags and flaggings are managed by the Drupal module Flag.
 *
 * Let's remember that a Flag is the generic description of a flag. A Flagging is the occurrence
 * of a flag given to an entity.
 *
 * This REST api allows the client to create Flaggings, i.e. to flag a comment as abusive.
 * There are no other uses for this api for now.
 *
 * It's possible to query single Flaggings, but for debugging purposes only.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class FlaggingResourceController implements RestWSQueryResourceControllerInterface {

    private $flagging; // I store it because I have to load it in the query api, so I
                       // don't want to reload it in the read api

    public function __construct() {

        $this->flagging = new stdClass();

        //watchdog('musth_restws', 'W7D001 LGDF FlaggingResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Flagging this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Flagging
     */
    public function propertyInfo() {

        return array(
            'flagging_id' => array(
                'type' => 'int',
                'label' => t('Flagging id'),
            ),
            // Name of the flag, i.e. abusive_comment
            // This is the flag being given to the entity of id entity_id
            'flag_name' => array(
                'type' => 'text',
                'label' => t('Flag name'),
            ),
            // The flag's definition will tell us the entity type even if none is specified when the
            // flagging is created. So we can always return an entity type when a query is performed
            'entity_type' => array(
                'type' => 'text',
                'label' => t('Type of the entity being flagged'),
            ),
            'entity_id' => array( // id of the flagged entity
                'type' => 'int',
                'label' => t('Id of the flagged entity'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Flagging resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int CustomerProfile id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $flagging_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_flagging',
            $flagging_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the id of the wanted flagging.
     *
     * Flaggings are queried for debugging purposes only.
     *
     * @restfulness This method is used for debugging purposes only, so we don't care if it's restful or not.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the flagging id if every check is successful
     */
    public function query($filters = array(), $meta_controls = array()) {

        global $user;

        //watchdog('musth_restws', 'W7D001 CPQ-1 6TGB customer profile query <br> filters (!f) <br> user (!u) ',
        //    array('!f' => print_r($filters, true),
        //          '!u' => print_r($user, true)
        //    ), WATCHDOG_DEBUG);

        // Filters to be implemented
        // 1) single flagging, for debugging purposes only

        if (!empty($filters['flagging_id'])) {

            $flagging_id = $filters['flagging_id'];

        } else {

            // No exception handling, this query is for debugging purposes only

            throw new RestWSException('Flagging id not specified', 412);
        }

        // No exception handling, this query is for debugging purposes only

        $flagging = flagging_load($flagging_id);

        if (empty($flagging)) {

            // No exception handling, this query is for debugging purposes only

            //watchdog('musth_restws', 'W3E???  Cant load a flagging that should exist (!f) ',
            //    array('!f' => print_r($filters, true)),
            //    WATCHDOG_ERROR);

            throw new RestWSException('Flagging not found', 404);
        }

        // Saving the flagging for the read method to return. We don't want to query again the flagging
        // in the read method
        $this->flagging = $flagging;

        //watchdog('musth_restws', 'W7D001 CPQ-2 8XSD customer profile query <br> (!f) <br> (!m) ',
        //        array('!f' => print_r(0, true),
        //              '!m' => print_r(0, true)
        //        ), WATCHDOG_DEBUG);

        return array($flagging_id);
    }

    /**
     * To create a flagging:
     * * You send a POST http query
     * * You have to authenticate because anonymous users can't flag anything as abusive or whatever
     * * You send the id of the entity to flag
     * * You send the name of the flag to be used to flag the entity
     *
     * @see RestWSResourceControllerInterface::create()
     * @restfulness Yes. No user id is used to create a Flagging. Authorization is checked, but this doesn't
     * make the method not restful.
     * @param array $values Values sent in the POST message body. We use flag_name and entity_id
     * @return int Returning a dummy id because we are not interested in the id of the newly created flagging
     * @throws RestWSException
     */
    public function create(array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001  8s8y flagging create values (!v) (!o) (!u) ',
        //    array('!v' => print_r($values, true),
        //        '!o' => print_r($user->uid, true),
        //        '!u' => print_r('', true)),
        //   WATCHDOG_DEBUG);

        if ($user->uid == 0) {

            watchdog('musth_restws', 'W3E205 Only authenticated users can flag a content as abusive or whatever (!v) ',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Only authenticated users can create flaggings', 403);

        }

        // Needed values:
        // flag_name: name of the flag that has to be applied to the given entity
        // entity_id: the id of the entity

        // The flag function below checks if the flag of name $values['flag_name'] exists.
        // It checks as well that the entity of id $values['entity_id'] exists and its type is one
        // that the flag expects
        // If these conditions are not met, $flagging_successful will be false

        try {

            $flagging_successful = flag('flag', $values['flag_name'], $values['entity_id']);

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E209 Error in creating a flagging. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in creating a flagging', 500);
        }

        if (!$flagging_successful) {

            watchdog('musth_restws', 'W3E210 Invalid entity id or flag name when creating a flagging. Values: (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Invalid values used when attempting to create a flagging', 412);
        }

        //watchdog('musth_restws', 'W7D001 CPC-2 8GBH customer profile create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //          '!o' => print_r(0, true),
        //         '!p' => print_r($profile, true)),
        //    WATCHDOG_DEBUG);

        // A create api returns only the id of the created entity
        // If you want the full entity, you have to call the get method
        // In this case there is no querying flaggings except for debugging purposes

        // Here we return zero because the api we called above doesn't return the id of the newly created flagging
        // and we don't mind, actually

        return 0;
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
     * This is the function that sends back a flagging
     *
     * Currently, it's used only for debugging purposes
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $flagging_id Id of the flagging to return
     * @return Flagging Object containing the information described by the properties (propertyInfo)
     */
    public function read($flagging_id) {

        //watchdog('musth_restws', 'W7D001 67GH CPR-1 \CustomerProfileResourceController::read (!i) (!p) ',
        //    array('!i' => print_r($profile_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // We loaded the flagging in the query api, let's not reload it

        $flagging = $this->flagging;

        // No exception handling here because we query flaggings only for debugging purposes

        $flag_names = _flag_get_flag_names();

        $flagging_to_return = new Flagging($flagging->flagging_id,
            $flag_names[$flagging->fid],
            $flagging->entity_type,
            $flagging->entity_id
        );

        //watchdog('musth_restws', 'W7D001 DFGT  CPR-2 \CustomerProfileResourceController::read read (!i) (!p) ',
        //    array('!i' => print_r($profile_id, true),
        //         '!p' => print_r($customer_profile_to_return, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Flagging object

        return $flagging_to_return;
    }

    /**
     * For now we don't update flaggings
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($flagging_id, array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * No deleting flaggings here.
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($flagging_id) {
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

        return 'musth_restws_flagging';
    }

}
