<?php
/**
 * @file musth_restws.clientexception.ctrl.inc
 *
 * @brief This api gets an error message from the client and writes a watchdog about it
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class ClientExceptionResourceController implements RestWSQueryResourceControllerInterface {

    private $message;   // The query method puts the message here for the read
                        // function to send it back as confirmation

    public function __construct() {

        $this->message = '';

        //watchdog('musth_restws', 'W7D001 7BHG URLsKitResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource ClientException this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource ClientException
     */
    public function propertyInfo() {

        return array(
            'message' => array(
                'type' => 'text',
                'label' => t('Error message'),
            ),
        );
    }

    /**
     * Metadata wrapper for the ClientException resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Just the number one as dummy identifier for this resource
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $client_exception_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_client_exception',
            $client_exception_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the error message that has to copied to a watchdog
     *
     * The read function, in this case just sends back a confirmation
     *
     * @attention what about permissions here? we might be deluged by watchdogs?
     *
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @return array Array containing a dummy id (1)
     */
    public function query($filters = array(), $meta_controls = array()) {

        if (isset($filters['message'])) {
            $message = $filters['message'];
        } else {
            $message = 'Message unknown';
        }

        if (empty($message)) {
            $message = 'Empty message';
        }

        // Cleaning the message from characters that could cause problems to Drupal
        // we are removing: ' & " ( )

        $cleaned_message = preg_replace("/['!&\"()]/", '', $message);

        watchdog('musth_restws',
            $cleaned_message, array(),
            WATCHDOG_ERROR);

        // Storing the message for the read function to send it back as confirmation
        $this->message = $cleaned_message;

        // We pass the id 1 and RESTws will call the method 'read' passing this id
        // See you at the read method...

        return array(1);
    }

    /**
     * We don't create anything through this api
     *
     * @see RestWSResourceControllerInterface::create()
     */
    public function create(array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Maximum one result will be sent
     */
    public function count($filters = array()) {

        return 1;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here. We send one
     * confirmation message ony. No need for paging.
     *
     * @param int $client_limit Ignored
     * @return int Just one, we don't send more than one message back.
     */
    public function limit($client_limit = NULL) {
        return 1;
    }

    /**
     * Just sending back the error message as confirmation
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $id int Dummy argument, ignored in this context
     * @return ClientException object containing the confirmation message
     */
    public function read($id) {

        // $id is actually ignored because we send just the message for confirmation

        // We send back the same message the client sent us just for confirmation

        $client_exception_object_to_return = new ClientException($this->message);

        return $client_exception_object_to_return;
    }

    /**
     * Not implemented. We don't update anything through this api
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($id, array $values) {
        throw new RestWSException('Not implemented', 501);
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

        return 'musth_restws_client_exception';
    }

}
