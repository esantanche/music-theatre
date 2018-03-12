<?php
/**
 * @file musth_restws.downloadableurl.ctrl.inc
 *
 * @brief This file is about the DownloadableUrlResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the DownloadableUrl resource
 *
 * This api returns the signed urls that Angular needs to download a downloadable.
 *
 * Downloadables are audio cd tracks, sheet music, etc. Anything that can be downloaded.
 *
 * Downloadables are identified by their catalogue no.
 * So, we have:
 * - Highest level downloadables. Their catalogue no is like A12340000 (last four digits are zero)
 * - Segment downloadables. Their catalogue no is like A12340100 (last two digits are zero)
 * - Lowest level downloadables. Their catalogue no is like A12340101
 *
 * The highest level and segment downloadables will be downloaded as zipped files.
 * The lowest level downloadables will be mp3, pdf and so on.
 *
 * The first letter, let's recall it, is the item type. V=Video, A=Audio, etc
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// Where the downloadables are downloaded from
// http://hwcdn.net/c6j4u5n4/cds/audio/test.mp3
// @todo temporary Highwinds url from where to get downloadables
define('MUSICTHEATRE_DOWNLOADABLE_BASE_URL', 'http://hwcdn.net/c6j4u5n4/cds/audio/');

// This is the API secret to be used to sign the urls
define('DOWNLOADABLES_SIGNED_URLS_SECRET', 'not so secret');

// How long an url is supposed to be valid (seconds)
define('DOWNLOADABLES_URL_SIGNATURE_TIMEOUT', 300);

class DownloadableUrlResourceController implements RestWSQueryResourceControllerInterface {

    private $catalogue_no;

    public function __construct() {

        $this->catalogue_no = '';

        //watchdog('musth_restws', 'W7D001 7BHG URLsKitResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource DownloadableUrl this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource DownloadableUrl
     */
    public function propertyInfo() {

        return array(
            'catalogue_no' => array( // 9 digits catalogue no, like A12340101, V23450304
                'type' => 'text',
                'label' => t('Catalogue no'),
            ),
            'url' => array( // signed url where the downloadable can be found
                'type' => 'text',
                'label' => t('Url'),
            ),
        );
    }

    /**
     * Metadata wrapper for the DownloadableUrl resource
     *
     * Needed because our resource doesn't correspond perfectly to a Drupal node
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Id for which the metadata wrapper has to be returned
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $downloadable_url_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_downloadable_url',
            $downloadable_url_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the catalogue no of a downloadable.
     *
     * We reject catalogue nos that aren't about downloadable items.
     *
     * @restfulness Only for anonymous. If the user is logged-in, results are different from
     * when the user is not. We may find a way to differentiate between logged-in and non-logged-in
     * users by using some query parameter.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing a dummy id (1)
     */
    public function query($filters = array(), $meta_controls = array()) {

        if (isset($filters['catalogue_no'])) {
            $catalogue_no = $filters['catalogue_no'];
        } else {

            watchdog('musth_restws',
                'W3E089 Missing or empty catalogue no. See filters: (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Missing or empty catalogue no', 412);
        }

        if (empty($catalogue_no)) {

            watchdog('musth_restws',
                'W3E089 Missing or empty catalogue no. See filters: (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Missing or empty catalogue no', 412);
        }

        // We download audio only programmes and tracks for now
        // We check that the first letter of the catalogue no is an 'A'

        if ($catalogue_no[0] != 'A') {

            watchdog('musth_restws',
                'W3E101 Item is not downloadable. See filters: (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Item is not downloadable', 412);
        }

        // We provide urls for everything
        // * - Highest level downloadables. They are zips containing all the lower level items
        // * - Segment downloadables. They are zips containing all the lower level items
        // * - Lowest level downloadables. They are files in mp3 or pdf or whatever format

        //watchdog('musth_restws', 'W7D001 9SCD user uid (!f) (!m) (!n) ',
        //        array('!f' => print_r($user, true),
        //              '!m' => print_r($user->roles, true),
        //              '!n' => print_r('', true),
        //        ), WATCHDOG_DEBUG);

        // We checked if the catalogue no is set, is not empty and refers to a downloadable item
        // Now we just store the catalogue no in $this for the read method to use it

        $this->catalogue_no = $catalogue_no;

        //throw new RestWSException('just a test', 500);


        // We pass the id 1 and RESTws will call the method 'read' passing this id
        // See you at the read method...

        //watchdog('musth_restws', 'W7D001 8FCD ProgrammeResourceController query (!f) (!m) (!n) ',
        //        array('!f' => print_r($filters, true),
        //              '!m' => print_r($query_result, true),
        //              '!n' => print_r($nid, true),
        //        ), WATCHDOG_DEBUG);

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
     * @return int Maximum one downloadableurl will be sent
     */
    public function count($filters = array()) {

        return 1;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here.
     *
     * @param int $client_limit Ignored
     * @return int Just one, we don't send more than one downloadableurl.
     */
    public function limit($client_limit = NULL) {

        return 1;
    }

    /**
     * This is the function that builds and signs the url and prepares
     * the object to send back to angular
     *
     * Here we check if the user owns a valid license to download the downloadable.
     * If he doesn't, we send back an empty url.
     *
     * We check if the downloadable is free. In such a case, we send back a url anyway.
     *
     * @attention We will need to send to angular the expiration time so that it
     * hasn't to call this api every time a download button is pressed
     *
     * @attention Now only zip (of mp3 files) and mp3 files are supported, in the future we will have to
     * support video programmes as well
     *
     * @attention We will want the user to be logged in when we have free downloadables. We don't want
     * users to download free downloadable if they are not registered and logged in.@deprecated
     * For now there is no free downloadable to download.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $id int Dummy argument, ignored in this context
     * @return DownloadableUrl object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        global $user; // We need the user to check for permissions

        $userid =  $user->uid;

        // $id is actually ignored because we send only one URL for the downloadable
        // whose catalogue no is $this->catalogue_no

        // @todo no signed urls for now, we will reintroduce them later

        // Checking for permissions

        if ($userid == 0) {
            // No permissions for non-logged-in users.

            $permission_granted = false;

        } else {

            $permission_granted = musth_helper_check_for_license($this->catalogue_no, $userid);

//            watchdog('musth_restws', 'W7D001 1717 read (!i) (!p) ',
//                array('!i' => print_r($permission_granted, true),
//                      '!p' => print_r($this->catalogue_no, true)),
//                WATCHDOG_DEBUG);

        }

        // Checking if it's a free downloadable we are talking about here

        if (!$permission_granted) {

            $permission_granted = musth_helper_programme_or_track_is_free($this->catalogue_no);

//            watchdog('musth_restws', 'W7D001 01GCD read after musth_helper_programme_or_track_is_free (!i) (!p) ',
//                array('!i' => print_r($this->catalogue_no, true),
//                      '!p' => print_r($permission_granted, true)),
//                WATCHDOG_DEBUG);

        }

        // Building the url for the full movie, but only if the user has permissions

        if ($permission_granted) {

            // @todo we have to sign this url
            // by using musth_helper_functions_add_signature_to_path($path_of_movie, SIGNED_URLS_SECRET, URL_SIGNATURE_TIMEOUT);

            // If it's a segment or a highest level downloadable we have to make the url for
            // a .zip file because it will be a zipped file with all the lowest level items

            $item_no = intval(substr($this->catalogue_no, 7, 2));

            if (!$item_no)
                $filename_extension = '.zip';
            else
                $filename_extension = '.mp3';

            $path_of_item = MUSICTHEATRE_DOWNLOADABLE_BASE_URL . $this->catalogue_no . $filename_extension;

            $url_of_item = $path_of_item; // @todo this url will be signed

        } else {
            // No permission, no url

            $url_of_item = '';
        }

        $downloadable_url_object_to_return = new DownloadableUrl($this->catalogue_no,
            $url_of_item);

        //watchdog('musth_restws', 'W7D001 996TGBHY ProgrammeResourceController read (!i) (!p) ',
        //    array('!i' => print_r($id, true),
        //          '!p' => print_r($image_full_url, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the DownloadableUrl object

        return $downloadable_url_object_to_return;
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

        return 'musth_restws_downloadable_url';
    }

}
