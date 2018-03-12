<?php
/**
 * @file musth_restws.programme.ctrl.inc
 *
 * @brief This file is about the ProgrammeResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Programme resource
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class ProgrammeResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //watchdog('musth_restws', 'W7D001 8HBG ProgrammeResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Programme this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Programme
     */
    public function propertyInfo() {

        return array(
            'nid' => array(
                'type' => 'int',
                'label' => t('Nid'),
            ),
            'system_title' => array(
                'type' => 'text',
                'label' => t('System title'),
            ),
            'display_title' => array(
                'type' => 'text',
                'label' => t('Display title'),
            ),
            'display_sub_title' => array(
                'type' => 'text',
                'label' => t('Display sub title'),
            ),
            'summary_panel_image' => array(
                'type' => 'text',
                'label' => t('Summary panel image filename'),
            ),
            'summary' => array(
                'type' => 'text',
                'label' => t('Summary'),
            ),
            'synopsis' => array(
                'type' => 'text',
                'label' => t('Synopsis'),
            ),
            'sleeve_notes' => array(
                'type' => 'text',
                'label' => t('Sleeve notes'),
            ),
            'body' => array(
                'type' => 'text',
                'label' => t('Body (for articles)'),
            ),
            'credits_elements' => array(
                'type' => 'array',
                'label' => t('Credits elements'),
            ),
            'tracks' => array(
                'type' => 'array',
                'label' => t('Track objects'),
            ),
            'rating' => array(
                'type' => 'int',
                'label' => t('Rating'),
            ),
            // In general there will be just one bio info object only, but there could be many of them
            // They collect biographic information about a person
            'bio_info' => array(
                'type' => 'array',
                'label' => t('Bio info objects'),
            ),
            // There should be one partner details object only, but
            // for many reasons there could be many (versions for example)
            // That's why it's an array
            'partner_details' => array(
                'type' => 'array',
                'label' => t('Partner details objects'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Programme resource
     *
     * Needed because our resource doesn't correspond perfectly to a Drupal node
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Node id for which the metadata wrapper has to be returned
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $programme_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_programme',
            $programme_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the node id of the wanted programme. We return the same node id
     * and RESTws will read the programme using the method 'read'
     *
     * This will happen only if the programme exists and is published. Otherwise the caller will get
     * an empty array as return value
     *
     * @attention We check if the requested programme exists and is
     * published (for single programmes). Actually we shouldn't get a request for a programme
     * that doesn't exist or is not published. So, we may want to
     * get rid of these checks for performance
     *
     * @restfulness Yes. Programmes are public.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Node id of the programme, the same as the one we get in the
     * filter, but only if the programme exists and is published. Otherwise we
     * return an empty array
     */
    public function query($filters = array(), $meta_controls = array()) {

        $nid = 0; // Safety initialisation

        if (isset($filters['nid'])) {
            $nid = $filters['nid'];
        } else {

            watchdog('musth_restws',
                'W3E095 Angular passed no filters (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('We need a filter', 412);
        }

        if ($nid) {

            // @todo fix for partners
            // Now attempting to load the requested programme but only if it's
            // published
            // We are not using a condition like entityCondition('bundle', 'programme')
            // because now a programme can be anything. If Angular is asking for
            // a node by giving us its id, it means that the tagring gave that id
            // to Angular and it's a valid id of a "programme"
            // It can be a video, an audio or a library "programme"

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('status', 1) // get the programme only if it's published
                ->propertyCondition('nid', $nid)
                ->execute();

            if (isset($result['node'])) {
                $query_result = array($nid);
            } else {
                $query_result = array();

                watchdog('musth_restws',
                    'W3E023 The requested programme doesnt exist or is not published (!n)',
                    array('!n' => print_r($nid, true)),
                    WATCHDOG_ERROR);

                // We return an empty result to angular

            }

        } else {

            // Angular is passing nid=0 for same mysterious reason

            watchdog('musth_restws',
                'W3E096 Angular passed a node id equal to zero (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('The node id cant be zero', 412);
        }

        //watchdog('musth_restws', 'W7D001 RFRF ProgrammeResourceController query (!f) (!m) (!n) ',
        //        array('!f' => print_r($filters, true),
        //              '!m' => print_r($query_result, true),
        //              '!n' => print_r($ape_containing_the_search_term, true),
        //        ), WATCHDOG_DEBUG);

        return $query_result;
    }

    /**
     * We don't create programmes through this api
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
     * @return int Maximum 1000 programmes will be sent
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * We don't do paging for now
     *
     * @param int $client_limit Ignored
     * @return int Maximum 1000 programmes will be sent
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that actually reads the programme and prepares the object to send back to angular
     *
     * @attention The fields containing html markup like summary and sleeve_notes have to be
     * displayed by angular using the ng-bind-html directive. We return these fields as they are because
     * the html markup will be inserted by editors. We don't have to produce it automatically
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $id int Node id of the programme
     * @return Programme object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        // We know, now, that the programme exists and is published because the method
        // query has been called before this one
        // For the same reason we don't do exception handling about the node not being found
        // because we know that the method query has found it

        $n = node_load($id);

        //watchdog('musth_restws', 'W7D001 7ytgyg ProgrammeResourceController::read ' .
        //         'load_tracks_and_credits_list (!i) (!m) (!n) ',
        //    array('!i' => print_r($id, true),
        //          '!m' => print_r($n, true),
        //          '!n' => print_r('', true),
        //    ), WATCHDOG_DEBUG);

        $load_tracks_and_credits_list = false;
        $load_bio_info = false;
        $load_partner_details = false;

        if (isset($n->field_system_title[LANGUAGE_NONE])) {
            $system_title = $n->field_system_title[LANGUAGE_NONE][0]['value'];

            // Library "programmes" don't have tracks and credits list for now

            switch (substr($system_title, 0, 1)) {
                case 'V':
                case 'A':
                    $load_tracks_and_credits_list = true;
                    break;
                case 'L':
                    $load_bio_info = true;
                    break;
                case 'P':
                    $load_partner_details = true;
                    break;
                default:
                    // @todo exception handling here
                    watchdog('musth_restws',
                        'W3E??? dung7jae7phir3k Unknown first letter of system title (!t) ',
                        array('!t' => print_r($system_title, true)),
                        WATCHDOG_ERROR);
            }

        } else
            $system_title = 'Missing system title';

        // Now we don't need taxonomy on the angular side, so we are not sending it

        if ($load_tracks_and_credits_list) {

            //watchdog('musth_restws', 'W7D001 7ASW ProgrammeResourceController::read ' .
            //         'load_tracks_and_credits_list (!i) (!m) (!n) ',
            //    array('!i' => print_r($id, true),
            //          '!m' => print_r('', true),
            //          '!n' => print_r('', true),
            //    ), WATCHDOG_DEBUG);

            // Loading the credits list

            if (isset($n->field_cast_crew_credits[LANGUAGE_NONE])) {
                $credits_elements_array =
                    musth_restws_make_credits_elements_array($n->field_cast_crew_credits[LANGUAGE_NONE]);
            } else {
                $credits_elements_array = array();
            }

            // We sort the tracks by catalogue no so that we have them sorted by
            // segment no and then by track no

            $query = new EntityFieldQuery();
            $tids_of_found_tracks = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'programme_track')
                ->fieldCondition('field_programme', 'target_id', $id, '=')
                ->fieldOrderBy('field_catalogue_no', 'value', 'ASC')
                ->execute();

            // No check on $tids_of_found_tracks to see if the entity field query worked
            // We have done many checks above

            // But we want to check if there are any tracks associated to this programme

            if (isset($tids_of_found_tracks['node'])) {

                $tids_of_found_tracks_just_the_tids = array_keys($tids_of_found_tracks['node']);

                //watchdog('musth_restws', 'W7D001 3333 TrackResourceController query (!f) (!m) (!n) ',
                //    array('!f' => print_r($filters, true),
                //        '!m' => print_r($meta_controls, true),
                //        '!n' => print_r($tracks_as_array, true),
                //    ), WATCHDOG_DEBUG);

            } else {

                watchdog('musth_restws',
                    'W3E029 No tracks for this programme (!n) ',
                    array('!n' => print_r($id, true)),
                    WATCHDOG_ERROR);

                $tids_of_found_tracks_just_the_tids = array();

            }

            // Loading the actual track nodes

            $array_track_objects = musth_restws_load_tracks($tids_of_found_tracks_just_the_tids);

        } else {

            $credits_elements_array = array();
            $array_track_objects = array();

        }

        // Loading bio info if present and only for Biography nodes
        // Actually we don't check the bundle here, we attempt to
        // fetch the bio info for any library programme

        if ($load_bio_info)
            $array_bio_info_objects = musth_restws_load_bio_info($n);
        else
            $array_bio_info_objects = array();

        if ($load_partner_details)
            $array_partner_details_objects = musth_restws_load_partner_details($n);
        else
            $array_partner_details_objects = array();

        // About the other fields, if they are defined we get their values.
        // Otherwise we send back a default value.

        // We complete the filename of the summary panel image with the base url
        // @todo just a test, use a define. We have to see if we get images from the cdn or from
        // our website

        if (isset($n->field_summary_panel_image[LANGUAGE_NONE]))
            $image_full_url = "/backend/sites/default/files/" .
                $n->field_summary_panel_image[LANGUAGE_NONE][0]['filename'];
        else
            $image_full_url = "Missing summary panel image";

        if (isset($n->field_display_title[LANGUAGE_NONE]))
            $display_title = $n->field_display_title[LANGUAGE_NONE][0]['value'];
        else
            $display_title = '';

        if (isset($n->field_display_sub_title[LANGUAGE_NONE]))
            $display_sub_title = $n->field_display_sub_title[LANGUAGE_NONE][0]['value'];
        else
            $display_sub_title = '';

        // These two fields, body and summary, contain html markup. To correctly display it in angularjs we have to use
        // the directive ng-bind-html
        // The html markup in fields like these will be inserted by editors, so here we just
        // send to angular the fields as it is

        if (isset($n->body[LANGUAGE_NONE]))
            $body = $n->body[LANGUAGE_NONE][0]['value'];
        else
            $body = '';

        if (isset($n->field_summary[LANGUAGE_NONE]))
            $summary = $n->field_summary[LANGUAGE_NONE][0]['value'];
        else
            $summary = '';

        //watchdog('musth_restws', 'W7D001 8989 ProgrammeResourceController summary (!i) (!p) ',
        //    array('!i' => print_r($id, true),
        //          '!p' => print_r($summary, true)),
        //    WATCHDOG_DEBUG);

        // The field field_synopsis in programmes is an entity reference to a synopsis
        // content node

        if (isset($n->field_synopsis[LANGUAGE_NONE]))
            $synopsis_nid = $n->field_synopsis[LANGUAGE_NONE][0]['target_id'];
        else
            $synopsis_nid = 0;

        // We get the field 'body' of the synopsis node

        if ($synopsis_nid > 0) {
            $synopsis_node = node_load($synopsis_nid);
            $synopsis = $synopsis_node->body[LANGUAGE_NONE][0]['value'];
        } else {
            $synopsis = '';
        }

        if (isset($n->field_sleeve_notes[LANGUAGE_NONE]))
            $sleeve_notes = $n->field_sleeve_notes[LANGUAGE_NONE][0]['value'];
        else
            $sleeve_notes = '';

        // Creating the Programme object to send back

        $programme_obj_to_return = new Programme($id,
            $display_title,
            $display_sub_title,
            $system_title,
            $image_full_url,  // summary panel image full url
            $summary,
            $synopsis,
            $sleeve_notes,
            $body,
            $credits_elements_array,
            $array_track_objects,
            $array_bio_info_objects,
            $array_partner_details_objects);

        //watchdog('musth_restws', 'W7D001 996TGBHY ProgrammeResourceController read (!i) (!p) ',
        //    array('!i' => print_r($id, true),
        //          '!p' => print_r($image_full_url, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Programme object

        return $programme_obj_to_return;
    }

    /**
     * Not implemented. We don't update programmes through this api
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($id, array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Not implemented. We don't delete programmes through this api
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

        //watchdog('musth_restws', 'W7D001 8765 ProgrammeResourceController resource ',
        //    array(),
        //    WATCHDOG_DEBUG);

        return 'musth_restws_programme';
    }

}

/**
 * This function reads a $field_cast_crew_credits field, which can come from a programme
 * or from a track and etches the details of the Person or Organisation nodes
 * that are referred.
 * The names of the people in the credits list are composed using initials
 * as required
 *
 * The returned array is an array of objects of class Credits_element
 *
 * @param $field_cast_crew_credits array The field that contains the references to the Person or Organisation
 * nodes that are the credits for the given programme or track
 * @return array|bool Array with the credits elements
 */
function musth_restws_make_credits_elements_array($field_cast_crew_credits) {

    $credits_elements_array = array();

    // Loading field credits field_cast_crew_credits

    $credits_field_collection_eids_to_load = array();

    foreach ($field_cast_crew_credits as $credits_field_collection_eid_as_array) {
        $credits_field_collection_eids_to_load[] = $credits_field_collection_eid_as_array['value'];
    }

    $credits_field_collections_as_array =
        entity_load('field_collection_item', $credits_field_collection_eids_to_load);

    if (empty($credits_field_collections_as_array)) {

        watchdog('musth_restws', 'W3E025 Cant load field collections that should exist! (!c) ',
            array('!c' => print_r($credits_field_collections_as_array, true)),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    foreach ($credits_field_collections_as_array as $credits_field_collection_eid => $credits_field_collection) {

        // If the fields field_person_or_organisation and field_role_title are not both set,
        // I ignore this field collection item

        if (!isset($credits_field_collection->field_person_or_organisation[LANGUAGE_NONE])) continue;
        if (!isset($credits_field_collection->field_role_title[LANGUAGE_NONE])) continue;

        // Getting the node id of the person or organisation

        $credits_field_collection_person_or_organisation_nid =
            $credits_field_collection->field_person_or_organisation[LANGUAGE_NONE][0]['target_id'];

        // If the node id is zero, I ignore this field collection item

        if ($credits_field_collection_person_or_organisation_nid == 0) continue;

        // I get the role title ('Composer', 'Performer', etc)

        $credits_field_collection_role_title =
            $credits_field_collection->field_role_title[LANGUAGE_NONE][0]['value'];

        // Again, if the field field_role_title has a value but this value is empty,
        // I ignore the field collection item

        if (empty($credits_field_collection_role_title)) continue;

        // Calculating the label (name of person or organisation) to send back

        $credits_field_collection_label =
            musth_helper_functions_get_label_for_credit_element($credits_field_collection_person_or_organisation_nid);

        // What is a principle? We don't know and don't care. Editor flag a credits element as a principle and
        // Angular will give them special relevance.
        $credits_field_is_a_principle =
            $credits_field_collection->field_is_a_principle[LANGUAGE_NONE][0]['value'];

        // Populating the array $credits_elements_array of the credits elements
        // It will be part of the Programme object we send back

        $credits_element = new Credits_element($credits_field_collection_label,
                                               $credits_field_collection_role_title,
                                               $credits_field_is_a_principle);

        $credits_elements_array[] = $credits_element;

        //watchdog('musth_restws', 'W7D001 7654 credits_field_collection_ref read (!i) (!p) ',
        //    array('!i' => print_r($credits_element, true),
        //          '!p' => print_r(0, true)),
        //    WATCHDOG_DEBUG);

    }

    return $credits_elements_array;
}

/**
 * Loading the tracks given their node ids
 *
 * @param $tids_of_found_tracks_just_the_tids array The node ids (tids) of the track to load
 * @return array Array of objects of class Track
 */
function musth_restws_load_tracks($tids_of_found_tracks_just_the_tids) {

    $array_track_objects = array();

    foreach ($tids_of_found_tracks_just_the_tids as $tid) {

        $t = node_load($tid); // Loading the track

        // No exception handling, already done a lot of it in the query method

        if (isset($t->field_segment_no[LANGUAGE_NONE])) {
            $segment_no = $t->field_segment_no[LANGUAGE_NONE][0]['value'];
        } else {
            $segment_no = 0;
        }

        if (isset($t->field_track_no[LANGUAGE_NONE])) {
            $track_no = $t->field_track_no[LANGUAGE_NONE][0]['value'];
        } else {
            $track_no = 0;
        }

        if (isset($t->field_track_tooltip[LANGUAGE_NONE])) {
            $track_tooltip = $t->field_track_tooltip[LANGUAGE_NONE][0]['value'];
        } else {
            $track_tooltip = '';
        }

        if (isset($t->field_time_in[LANGUAGE_NONE])) {
            $time_in = $t->field_time_in[LANGUAGE_NONE][0]['value'];
        } else {
            $time_in = 0;
        }

        if (isset($t->field_time_out[LANGUAGE_NONE])) {
            $time_out = $t->field_time_out[LANGUAGE_NONE][0]['value'];
        } else {
            $time_out = 0;
        }

        if (isset($t->field_cast_crew_credits[LANGUAGE_NONE])) {
            $credits_elements_array =
                musth_restws_make_credits_elements_array($t->field_cast_crew_credits[LANGUAGE_NONE]);
        } else {
            $credits_elements_array = array();
        }

        // We get nid, programme_movie_url and programme_subtitles_url from
        // $this because they have been calculated in TrackResourceController::query
        // and are the same for every track

        $track_object = new Track($tid,
            $t->title,
            $segment_no,
            $track_no,
            $track_tooltip,
            $time_in,
            $time_out,
            $credits_elements_array
        );

        $array_track_objects[] = $track_object;

    }

    return $array_track_objects;
}

/**
 * This function captures all biographic info a programme may have.
 * It's used with those programmes that are actually biographies.
 *
 * All field whose name begins with 'field_person' are returned in an object.
 *
 * For now we return one object only with bio info. In the future there may be many of them.
 * Imagine if we have a biography about a band. There will be as many bio info objects as there
 * are band members.
 *
 * @param $programme node The programme containing the bio info we have to return as array of objects
 * @return array Array of objects of class Bio_info
 */
function musth_restws_load_bio_info($programme) {

    // We need the names of all the fields in our programme that contain bio info
    // These fields have a name beginning with 'field_person'
    // We will copy in the bio info object we return all these fields

    $field_info_instances_bio_bundle = field_info_instances('node', 'biography');
    $names_of_bio_fields = preg_grep('/^field_person/', array_keys($field_info_instances_bio_bundle));

    //watchdog('musth_restws', 'W7D001 nnic musth_restws_load_bio_info names not in cache (!n) <br><br> (!f) ',
    //    array('!n' => print_r($names_of_bio_fields, true),
    //          '!f' => print_r('', true)),
    //    WATCHDOG_DEBUG);

    // Now we retrieve the values contained in the fields whose names we found above

    $bio_info_array = array();

    foreach($names_of_bio_fields as $name_of_bio_field) {

        $bio_field = field_get_items('node', $programme, $name_of_bio_field);

        $field_value = $bio_field[0]['value'];

        // We have a bio info field here
        // Its name is like: field_person_birthdate
        // We get the third part of this name, which is birthdate

        $array_parts_bio_field_name = explode('_', $name_of_bio_field);

        // We use the third part of the field's name as a key to store the field's value
        // in $bio_info_array

        $bio_info_array[$array_parts_bio_field_name[2]] = $field_value;

    }

    // We pass the array $bio_info_array to the constructor of the class Bio_info
    // to get an object
    $bio_info_object = new Bio_info($bio_info_array);

    // We have one object only, why are we going to make an array of it?
    // Because in the future we may have many Bio_info objects to send

    $array_bio_info_objects = array($bio_info_object);

    return $array_bio_info_objects;
}





/**
 * @todo fix everythig here
 * This function captures all biographic info a programme may have.
 * It's used with those programmes that are actually biographies.
 *
 * All field whose name begins with 'field_person' are returned in an object.
 *
 * For now we return one object only with bio info. In the future there may be many of them.
 * Imagine if we have a biography about a band. There will be as many bio info objects as there
 * are band members.
 *
 * @todo important to tell about the structure of the name of a parter details field
 * like: field_partner_detail_<name of detail with no underscores in it>
 *
 * @param $programme node The programme containing the bio info we have to return as array of objects
 * @return array Array of objects of class Bio_info
 */
function musth_restws_load_partner_details($programme)
{

    // We need the names of all the fields in our programme that contain bio info
    // These fields have a name beginning with 'field_person'
    // We will copy in the bio info object we return all these fields

    $field_info_instances_person_bundle = field_info_instances('node', 'person');
    $field_info_instances_organisation_bundle = field_info_instances('node', 'organisation');

    $names_of_partner_details_fields = array_unique(array_merge(
        preg_grep('/^field_pd/', array_keys($field_info_instances_person_bundle)),
        preg_grep('/^field_pd/', array_keys($field_info_instances_organisation_bundle))
    ));



    // Now we retrieve the values contained in the fields whose names we found above

    $partner_details_array = array();

    foreach ($names_of_partner_details_fields as $name_of_partner_details_field) {

        $partner_details_field = field_get_items('node', $programme, $name_of_partner_details_field);

        if ($partner_details_field) {
            $field_value = $partner_details_field[0]['value'];
            // @todo delete me please! $array_parts_partner_details_field_name = explode('_', $name_of_partner_details_field);

            $field_name = str_replace('field_pd_', '', $name_of_partner_details_field);

            $partner_details_array[$field_name] = $field_value;

//            watchdog('musth_restws', 'W7D001 ?? musth_restws_load_partner_details end($array_parts_partner_details_field_name) ' .
//                ' (!n) <br><br> (!f) ',
//                array('!n' => print_r($field_name, true),
//                    '!f' => print_r($field_value, true)),
//                WATCHDOG_DEBUG);


        }

        // @todo fix comments
        // We have a bio info field here
        // Its name is like: field_person_birthdate
        // We get the third part of this name, which is birthdate

        // We use the third part of the field's name as a key to store the field's value
        // in $bio_info_array

    }

    $partner_details_array['partner_type'] = $programme->type;

    // @todo got to add taxonomies
    // @todo got to make a helper function here



    $partner_details_array['profession'] = musth_helper_functions_make_string_from_taxonomy_field('node',
        $programme,
        'field_profession');

    $partner_details_array['instrument'] = musth_helper_functions_make_string_from_taxonomy_field('node',
        $programme,
        'field_instrument');

    $partner_details_array['organisation_type'] = musth_helper_functions_make_string_from_taxonomy_field('node',
        $programme,
        'field_organisation_type');

    // We pass the array $bio_info_array to the constructor of the class Bio_info
    // to get an object
    $partner_details_object = new Partner_details($partner_details_array);


//    watchdog('musth_restws', 'W7D001 ?? musth_restws_load_partner_details $names_of_partner_details_fields' .
//        ' (!n) <br><br> (!f) ',
//        array('!n' => print_r($programme, true),
//            '!f' => print_r($partner_details_array, true)),
//        WATCHDOG_DEBUG);

    // @todo fix We have one object only, why are we going to make an array of it?
    // Because in the future we may have many Bio_info objects to send

    $array_partner_details_objects = array($partner_details_object);

    return $array_partner_details_objects;
}