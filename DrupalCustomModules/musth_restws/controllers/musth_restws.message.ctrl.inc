<?php
/**
 * @file musth_restws.message.ctrl.inc
 *
 * @brief @Tdodo fixme This api gets an error message from the client and writes a watchdog about it
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class MessageResourceController implements RestWSQueryResourceControllerInterface {

    private $message;   // The query method puts the message here for the read
                        // function to send it back as confirmation

    public function __construct() {

        $this->message = null; // @todo do I need this?

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
            'sender_name' => array(
                'type' => 'text',
                'label' => t('Name of the user who sent the message'),
            ),
            'sender_email' => array(
                'type' => 'text',
                'label' => t('Sender email'),
            ),
            'body' => array(
                'type' => 'text',
                'label' => t('Message body'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Message resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Just the number one as dummy identifier for this resource
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $message_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_message',
            $message_resource_obj_to_be_wrapped,
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

        if (empty($filters['sender_name'])) {

            throw new RestWSException('No sender name specified', 412);

        } else {
            $sender_name = $filters['sender_name'];
        }

        if (empty($filters['sender_email'])) {

            throw new RestWSException('No sender email specified', 412);

        } else {
            $sender_email = $filters['sender_email'];
        }

        if (empty($filters['body'])) {

            throw new RestWSException('No message body specified', 412);

        } else {
            $body = $filters['body'];
        }

        $message_may_be_spammy = musth_helper_functions_this_text_is_spammy($body);

        if ($message_may_be_spammy)
            $new_message_status = 'spam';
        else
            $new_message_status = 'new';

        // Creating the new comment object

        $message_title = truncate_utf8($body, 29, TRUE);

        $message_properties = array(
            'type' => 'message',
            'uid' => 0,
            'status' => 1,
            'comment' => 1, // Comments are allowed for messages
            'promote' => 0, // Messages don't go to the Drupal front page (not that we care...)
        );

        // We create the message
        $message = entity_create('node', $message_properties);

        $message_wrapper = entity_metadata_wrapper('node', $message);

        // By using the wrapper, we do not have to worry about telling Drupal
        // what language we are using. The Entity API handles that for us.
        $message_wrapper->title->set($message_title);

        // For the field body we set only the value. We don't use the summary or the format fields
        $message_wrapper->body->set(array('value' => $body));

        $message_wrapper->field_sender_name->set($sender_name);

        $message_wrapper->field_sender_email->set($sender_email);

        $message_wrapper->field_message_status->set($new_message_status);

        // @todo exptc hndlng to implement

        $message_wrapper->save();

        $this->message = $message;

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

        // @todo exptc hndlng to implement

        //        $review_wrapper->body->value()['value']

        $message_wrapper = entity_metadata_wrapper('node', $this->message);

        $message_object_to_return = new Message($message_wrapper->field_sender_name->value(),
            $message_wrapper->field_sender_email->value(),
            $message_wrapper->body->value());

        return $message_object_to_return;
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

        return 'musth_restws_message';
    }

}
