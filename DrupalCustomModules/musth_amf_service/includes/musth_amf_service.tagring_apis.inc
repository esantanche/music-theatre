<?php
/**
 * @file musth_amf_service.tagring_apis.inc
 *
 * @brief This file contains the functions that implement the amf apis that the tagring calls
 *
 * The apis are defined in the file:
 * @see musth_amf_service.module
 *
 * The functions that actually fetch the apes are in a different file
 * @see musth_amf_service.ape_queries.inc
 *
 * @ingroup musthamfservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 26/02/14
 * Time: 14:05
 */

// @todo we need the right url here

define('MUSICTHEATRE_IMAGE_TAG_RING_BASE_URL', '/backend/sites/default/files/tag_ring');
#define('MUSICTHEATRE_IMAGE_TAG_RING_BASE_URL', 'http://hwcdn.net/c6j4u5n4/cds/images/programmes/tag_ring');
#define('MUSICTHEATRE_IMAGE_TAG_RING_BASE_URL', 'http://musictheatre-production-ng/images/Images_for_tests');

/**
 * Api API.get_flash_config
 *
 * The tagring calls this api first thing when it loads
 * We send to it an array with the vids and the their associated label.
 *
 * In our case, vids are no longer meaningful because we use apes
 * @link apesexplained See apes explained page
 *
 * A different configuration will be sent for different tagrings.
 * Now we have three of them, the video, the audio and the library tagrings.
 * @see musth_amf_service_full_flash_settings
 *
 * @return array The first level key of the array is 'filters', then there is
 * an array of arrays each containing a vid and its label
 */
function musth_amf_service_tagring_api_get_flash_config() {

    //watchdog('musth_amf_service', 'W7D001 98981 musth_amf_service_tagring_api_get_flash_config current path (!p)',
    //    array('!p' => print_r(current_path(), true)),
    //    WATCHDOG_DEBUG);

    // We get the full tagring settings, including those used in other apis
    $complete_flash_settings = musth_amf_service_full_flash_settings();

    //watchdog('musth_rules', 'W7D001 0987 musth_amf_service_tagring_api_get_flash_config complete_flash_settings (!s)',
    //    array('!s' => print_r($complete_flash_settings['vocabulary_info'], true)),
    //    WATCHDOG_DEBUG);

    // We create the array to be sent to the tagring

    $vocabulary_info_for_tagring = array();

    foreach ($complete_flash_settings['vocabulary_info'] as $vid => $info_for_individual_vocabulary) {
        // Only vids and their labels are sent
        $vocabulary_info_for_tagring[] = array(
            'vid' => $vid,
            'label' => $info_for_individual_vocabulary['label'],
        );
    }

    // The tagring wants a first level key named 'filters'

    $config_for_tagring = array(
        'filters' => $vocabulary_info_for_tagring
    );

    //watchdog('musth_rules', 'W7D001 TYUU musth_amf_service_tagring_api_get_flash_config $config_for_tagring (!s)',
    //    array('!s' => print_r($config_for_tagring, true)),
    //    WATCHDOG_DEBUG);

    return $config_for_tagring;
}

/**
 * Help function returning every configuration we need about the tagring.
 *
 * Different configurations are provided according to the tagring type (video, audio or library).
 *
 * @return array Array of arrays containing the configurations
 */
function musth_amf_service_full_flash_settings() {

    // Which tagring are we dealing with? The audio, the video or the library one? Maybe in the future there will
    // be many others.
    // We differentiate between tagrings by checking the gateway they use.
    // The gateways are in the format "amf_<content type>"
    // We have amf_video, amf_audio and amf_library.
    // The gateway is identified by the url used and the url is returned by the function current_path,
    // a standard Drupal function, used in the function below.

    $parameters = musth_helper_functions_get_parameters_from_current_path();

    $requested_content_type = $parameters['content_type'];

    /**
     * For now we have this array of settings only
     *
     * The key is the vocabulary id. The tagring knows only
     * this, it doesn't know about entity types and apes
     *
     * The fields are:
     * - label The label the tagring has to associate to the vid
     * - ape_name The name of the ape we send to the tagring when it
     * wants this vocabulary
     * - ape_type It can be taxonomy or credits. We have apes calculated from
     * actual taxonomies and ones calculated from credits lists
     *
     * There was a field called 'key' before. We deleted it and it looks like
     * the tagring doesn't use it actually
     *
     * The array is ordered in the order the tagring has to display the vocabularies.
     * If you change the order, the order in which the vocabularies are displayed
     * will change as well
     */
    switch ($requested_content_type) {
        case 'video':
            $complete_flash_settings['vocabulary_info'] = array(
                4 => array(
                    'label' => 'Genre',
                    'ape_name' => 'genre',
                    'ape_type' => 'taxonomy',
                ),
                1 => array(
                    'label' => 'Form',
                    'ape_name' => 'form',
                    'ape_type' => 'taxonomy',
                ),
                2 => array(
                    'label' => 'Period',
                    'ape_name' => 'period',
                    'ape_type' => 'taxonomy',
                ),
                5 => array(
                    'label' => 'Instrument',
                    'ape_name' => 'instrument',
                    'ape_type' => 'taxonomy',
                ),
                7 => array(
                    'label' => 'Composer',
                    'ape_name' => 'composer',
                    'ape_type' => 'credits',
                ),
                9 => array(
                    'label' => 'Conductor',
                    'ape_name' => 'conductor',
                    'ape_type' => 'credits',
                ),
                8 => array(
                    'label' => 'Performer',
                    'ape_name' => 'performer',
                    'ape_type' => 'credits',
                ),
                3 => array(
                    'label' => 'Ensemble',
                    'ape_name' => 'ensemble',
                    'ape_type' => 'credits',
                ),
                18 => array(
                    'label' => 'Venue',
                    'ape_name' => 'venue',
                    'ape_type' => 'credits',
                ),
                21 => array(
                    'label' => 'Film Type',
                    'ape_name' => 'film_type',
                    'ape_type' => 'taxonomy',
                ),
            );
            break;
        case 'audio':
            $complete_flash_settings['vocabulary_info'] = array(
                4 => array(
                    'label' => 'Genre',
                    'ape_name' => 'genre',
                    'ape_type' => 'taxonomy',
                ),
                1 => array(
                    'label' => 'Form',
                    'ape_name' => 'form',
                    'ape_type' => 'taxonomy',
                ),
                2 => array(
                    'label' => 'Period',
                    'ape_name' => 'period',
                    'ape_type' => 'taxonomy',
                ),
                5 => array(
                    'label' => 'Instrument',
                    'ape_name' => 'instrument',
                    'ape_type' => 'taxonomy',
                ),
                7 => array(
                    'label' => 'Composer',
                    'ape_name' => 'composer',
                    'ape_type' => 'credits',
                ),
                9 => array(
                    'label' => 'Conductor',
                    'ape_name' => 'conductor',
                    'ape_type' => 'credits',
                ),
                8 => array(
                    'label' => 'Performer',
                    'ape_name' => 'performer',
                    'ape_type' => 'credits',
                ),
                3 => array(
                    'label' => 'Ensemble',
                    'ape_name' => 'ensemble',
                    'ape_type' => 'credits',
                ),
                18 => array(
                    'label' => 'Venue',
                    'ape_name' => 'venue',
                    'ape_type' => 'credits',
                ),
            );
            break;
        case 'library':
            $complete_flash_settings['vocabulary_info'] = array(
                4 => array(
                    'label' => 'Type',
                    'ape_name' => 'type',
                    'ape_type' => 'taxonomy',
                ),
                1 => array(
                    'label' => 'Genre',
                    'ape_name' => 'genre',
                    'ape_type' => 'taxonomy',
                ),
                2 => array(
                    'label' => 'Form',
                    'ape_name' => 'form',
                    'ape_type' => 'taxonomy',
                ),
                5 => array(
                    'label' => 'Period',
                    'ape_name' => 'period',
                    'ape_type' => 'taxonomy',
                ),
                7 => array(
                    'label' => 'Instrument',
                    'ape_name' => 'instrument',
                    'ape_type' => 'taxonomy',
                ),
            );
            break;
        case 'partners':
            $complete_flash_settings['vocabulary_info'] = array(
                4 => array(
                    'label' => 'Profession',
                    'ape_name' => 'profession',
                    'ape_type' => 'taxonomy',
                ),
                1 => array(
                    'label' => 'Organisation type',
                    'ape_name' => 'organisation_type',
                    'ape_type' => 'taxonomy',
                ),
                2 => array(
                    'label' => 'Instrument',
                    'ape_name' => 'instrument',
                    'ape_type' => 'taxonomy',
                ),
                5 => array(
                    'label' => 'Period',
                    'ape_name' => 'period',
                    'ape_type' => 'taxonomy',
                ),
                7 => array(
                    'label' => 'Genre',
                    'ape_name' => 'genre',
                    'ape_type' => 'taxonomy',
                ),
                9 => array(
                    'label' => 'Form',
                    'ape_name' => 'form',
                    'ape_type' => 'taxonomy',
                ),
                8 => array(
                    'label' => 'Voice',
                    'ape_name' => 'voice',
                    'ape_type' => 'taxonomy',
                )
            );
            break;
        default:
            $complete_flash_settings['vocabulary_info'] = array();
    }

    return $complete_flash_settings;
}

/**
 * Just a helper function that gives the name of the ape associated to the vocabulary
 * identified by $vid
 *
 * @param[in] $vid The vocabulary id of the vocabulary we want the ape name of
 * @return string Name of the ape
 */
function musth_amf_service_get_ape_name_for_a_vocabulary($vid) {

    $full_flash_settings = musth_amf_service_full_flash_settings();

    $vocabulary_info = $full_flash_settings['vocabulary_info'];

    if (!isset($vocabulary_info[$vid])) {
        // Invalid vocabulary id

        watchdog('musth_amf_service', 'W3E019 Invalid vid in get_ape_name_for_a_vocabulary (!v)',
            array('!v' => print_r($vid, true)),
            WATCHDOG_ERROR);

        return FALSE;
    }

    return $vocabulary_info[$vid]['ape_name'];
}

/**
 * Just a helper function that gives the type of the ape associated to the vocabulary
 * identified by $vid.
 *
 * We have apes of two types. Those of type 'taxonomy' and those of type 'credits'.
 *
 * @param[in] $vid The vocabulary id of the vocabulary we want the ape type of
 * @return string Type of the ape ('taxonomy' or 'credits')
 */
function musth_amf_service_get_ape_type_for_a_vocabulary($vid) {

    $full_flash_settings = musth_amf_service_full_flash_settings();

    $vocabulary_info = $full_flash_settings['vocabulary_info'];

    if (!isset($vocabulary_info[$vid])) {
        // Invalid vocabulary id

        watchdog('musth_amf_service', 'W3E019 Invalid vid in get_ape_type_for_a_vocabulary (!v)',
            array('!v' => print_r($vid, true)),
            WATCHDOG_ERROR);

        return FALSE;
    }

    return $vocabulary_info[$vid]['ape_type'];
}

/**
 * Helper function that parses a query string and returns an array with the ape name
 * of each vocabulary referred to in the query string as well as the eid
 * of the ape.
 * The query string is in the format: vid=tid&vid=tid&vid=tid ...
 * Tid is actually an eid
 *
 * @param[in] $query_string Query string in the format vid=tid&vid=tid&vid=tid ...
 * @return array array of couples ape_name - eid
 */
function musth_amf_service_get_apes_names_and_eids_from_query_string($query_string) {

    $apes_names_and_eids_of_the_filter_apes = array();

    $vid_and_eid_couples = explode('&', $query_string);

    foreach($vid_and_eid_couples as $vid_and_eid_couple) {
        // $vid_and_eid_couple is in the form vid=eid where vid is the vocabulary id and eid is the id of the ape
        $vid_and_eid_as_array = explode('=', $vid_and_eid_couple);

        $ape_name_and_eid_as_array =
            array( 'ape_name' => musth_amf_service_get_ape_name_for_a_vocabulary($vid_and_eid_as_array[0]),
                   'eid' => $vid_and_eid_as_array[1]);
        $apes_names_and_eids_of_the_filter_apes[] = $ape_name_and_eid_as_array;
    }

    return $apes_names_and_eids_of_the_filter_apes;
}

/**
 * Api the tagring uses to get the default playlist to display when no selection is made
 * or when the tagring is freshly loaded
 *
 * In the past there was an api called nodequeue.getQueueMediaItems that the tagring doesn't
 * actually uses any more. This one is the only one used to get the playlist
 *
 * @param[in] $qid Requested node queue, ignored. The tagring sends the number 1 because
 * it wants the old nodequeue no. 1. We send the default playlist
 * @return array of integers The node ids of the programmes included in the default tagring playlist
 */
function musth_amf_service_tagring_api_get_queuemediaids($qid) {

    // Which tagring are we dealing with? The audio, the video or the library one? Maybe in the future there will
    // be many others.
    // We differentiate between tagrings by checking the gateway they use.
    // The gateways are in the format "amf_<content type>"
    // We have amf_video, amf_audio and amf_library
    // The gateway is identified by the url used and the url is returned by the function current_path,
    // a standard Drupal function, used in the function below.

    $parameters = musth_helper_functions_get_parameters_from_current_path();

    //watchdog('musth_amf_service', 'W7D001 63534 castagq current path (!p) (!r) ',
    //    array('!p' => print_r(current_path(), true),
    //          '!r' => print_r($parameters, true)),
    //    WATCHDOG_DEBUG);

//    watchdog('musth_amf_service', 'W7D001 musth_amf_service_tagring_api_get_queuemediaids (!q) ',
//        array('!q' => print_r($qid, true)),
//        WATCHDOG_DEBUG);

    // I ignore $qid completely and send the default tagring_playlist entity

    // We have to send to the tagring the playlist for the requested content type
    // The tagring is now supporting three different content types, 'video', 'audio' and 'library'.
    // There will be more of them.

    // Loading every default tagring_playlist entity for the given content type (audio, video or library)
    // Actually there should be one and only one of them
    try {
        $query = new EntityFieldQuery();
        $eids_of_found_tagring_playlists = $query->entityCondition('entity_type', 'tagring_playlist')
            ->entityCondition('bundle', 'tagring_playlist')
            ->fieldCondition('field_is_default', 'value', 1, '=')
            ->fieldCondition('field_tagring_content_type', 'value', $parameters['content_type'], '=')
            ->execute();
    }
    catch (Exception $e) {
        watchdog('musth_amf_service', 'W3E013 Error in loading the default playlist for the tagring. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here!
        return services_error(t('W3E013 No default playlist'));
    }

    // The array that will contain the playlist to be sent back to the tagring
    $playlist_programme_nids = array();

    // If a default playlist has been found, let's load it
    if (isset($eids_of_found_tagring_playlists['tagring_playlist'])) {

        // Getting the array of the eids of the playlists. Actually there should be only one of them
        $tagring_playlists_eids = array_keys($eids_of_found_tagring_playlists['tagring_playlist']);

        // Loading the playlist
        $tagring_playlist_as_array = entity_load('tagring_playlist', $tagring_playlists_eids);

        $tagring_playlist_to_return = $tagring_playlist_as_array[$tagring_playlists_eids[0]];

        // This field contains the playlist (list of nids of programmes)
        $field_with_playlist_programme_nids = $tagring_playlist_to_return->field_programme;

        // This is actually an array of arrays, each one containing a nid
        $arrays_of_playlist_programme_nids = $field_with_playlist_programme_nids[LANGUAGE_NONE];

        // We need an array with just the node ids of the programmes in the playlist
        // We want these node ids as integers, not as strings
        foreach ($arrays_of_playlist_programme_nids as $array_of_playlist_programme_nids) {
            $playlist_programme_nids[] = intval($array_of_playlist_programme_nids['target_id']);
        }

        // Now $playlist_programme_nids is a simple array of nids

        //watchdog('musth_amf_service', 'W7D001 9191  (!t) (!n) ',
        //    array('!t' => print_r($qid, true),
        //        '!n' => print_r($tagring_playlist_to_return, true)), WATCHDOG_DEBUG);

    } else {
        // No default tagring_playlist found

        watchdog('musth_amf_service', 'W3E014 Cant find any default playlist',
            array(),
            WATCHDOG_ERROR);

        return services_error(t('W3E014 Cant find any default playlist'));
    }

    return $playlist_programme_nids;
}

/**
 * Api used to retrieve the programmes given their nids. Actually the tagring uses a few fields only, not
 * the full programme
 *
 * @param[in] $ids Array of the nids of the requested programmes
 * @return array of mediaitem objects
 */
function musth_amf_service_tagring_api_get_items_by_id($ids) {

    // Media items it's how the tagring calls programmes
    // Actually media items are subsets of programmes including only the
    // information the tagring needs
    $media_items = array();

    //watchdog('musth_amf_service', 'W7D001 tagring_api_get_items_by_id (!i) ',
    //    array('!i' => print_r($ids, true)),
    //    WATCHDOG_DEBUG);

    if (!is_array($ids)) {
        // We think that the tagring is always sending an array of nids
        // and never a comma-delimited string
        // So, if we get a comma-delimited string, we throw an error

        watchdog('musth_amf_service', 'W3E015 The nids have to be passed in an array (!i) ',
            array('!i' => print_r($ids, true)),
            WATCHDOG_ERROR);

        return services_error(t('W3E015 The nids have to be passed in an array'));
    }

    if (count($ids)) {

        foreach($ids as $nid) {

            // We load the programme and get the info we have to send to the tagring
            if ($n = node_load($nid)) {

                $mi = array();

                $mi['id'] = $n->nid;
                $mi['title'] = $n->title;

                if (isset($n->field_display_title[LANGUAGE_NONE]))
                    $mi['field_display_title'] = $n->field_display_title[LANGUAGE_NONE][0]['value'];
                else
                    $mi['field_display_title'] = "";

                if (isset($n->field_display_sub_title[LANGUAGE_NONE]))
                    $mi['field_credit'] = $n->field_display_sub_title[LANGUAGE_NONE][0]['value'];
                else
                    $mi['field_credit'] = "";

                if (isset($n->field_tagring_tooltip[LANGUAGE_NONE]))
                    $mi['field_tagring_tooltip'] = $n->field_tagring_tooltip[LANGUAGE_NONE][0]['value'];
                else
                    $mi['field_tagring_tooltip'] = "";

                // used for tests, just keeping it - $mi['field_tagring_tooltip'] = $mi['field_display_title'] .
                // ' ' . $mi['field_credit'];

                if (isset($n->field_tagring_icon_filename[LANGUAGE_NONE]))
                    $mi['thumbnail_url'] = MUSICTHEATRE_IMAGE_TAG_RING_BASE_URL . '/' .
                        $n->field_tagring_icon_filename[LANGUAGE_NONE][0]['value'];
                else
                    $mi['thumbnail_url'] = "";

                $mediaItem = new MediaItem($mi);
                $media_items[] = $mediaItem;

            } else {

                watchdog('musth_amf_service', 'W3E016 Programme not found! It should be there! (!n) ',
                    array('!n' => print_r($nid, true)),
                    WATCHDOG_ERROR);

                return services_error(t('W3E016 Programme not found! It should be there!'));
            }
        }

    } else {

        // Usually the tagring sends a non-empty array of nids. There is something wrong

        // Ehi! it looks like that the tagring sometimes does send an empty array of nids
        // and we have just to ignore it!!

        /*
        watchdog('musth_amf_service', 'W3E017 The tagring sent an empty array of ids (!i) ',
            array('!i' => print_r($ids, true)),
            WATCHDOG_ERROR);

        return services_error(t('W3E017 The array of ids cannot be empty'));
        */
    }

    //watchdog('musth_amf_service', 'W7D001 media_items (!m) ',
    //    array('!m' => print_r($media_items, true)),
    //    WATCHDOG_DEBUG);

    return $media_items;
}

/**
 * This is the most complicated api the tagring calls.
 * It's used to retrieve the vocabularies and to perform combined searches
 *
 * In our case, some taxonomies have been replaced by virtual taxonomies generated
 * from the credits lists. Moreover, every taxonomy sent to the tagring is actually
 * a list of apes.
 *
 * This api has two basic way of working.
 *
 * In the first case the tagring asks for a simple vocabulary to the sent back to it.
 * The parameter $vid is defined and it corresponds to the vocabulary to be sent.
 * We actually figure out which type of apes we have to read and send them to the tagring.
 *
 * In the second case the tagring sends a vocabulary id ($vid) and a query string.
 * It's the case of combined queries.
 *
 * The query string is in this format: vid=tid&vid=tid&vid=tid ...
 * This string restricts the list of terms that are returned. These latter terms belong to
 * the vocabulary identified by $vid.
 *
 * The returned terms have to appear in at least one programme and the programmes where these terms
 * appear have to be related to the terms given by the query string as well.
 *
 * An example:
 * $vid = 4 $query_string = 7=67&18=788
 * We want the list of genres (the vocabulary no. 4 is Genre) that appear in at least one programme
 * and we want these programmes to be related to an individual composer (vocabulary no. 7 is Composer)
 * and an individual venue (vocabulary no. 18 is Venue)
 *
 * Terminology used in this function
 * - return vocabulary It's the vocabulary identified by $vid. We have to return its terms possibly
 * filtered using the query string
 * - filter vocabularies They are the vocabularies specified in the query string. We use them to filter
 * the return vocabulary
 *
 * @param[in] $vid Requested vocabulary
 * @param[in] $query_string Query string in the form vid=tid&vid=tid&vid=tid ...
 * @return array Array of arrays each one about an ape
 */
function musth_amf_service_tagring_api_get_filtered_terms($vid, $query_string = NULL) {

    // $result_for_the_tagring is the variable that will contain the result to be sent back
    // to the tagring
    // It's an array of arrays. Each one of them has:
    // 'label' => Taxonomy term label for a taxonomy term or name for a person or organisation
    // 'tid' => The eid of the the ape this info is from
    // 'count' => Occurrences of this ape in programmes
    // 'depth' => 0 if the ape has no parents, 1 otherwise
    // 'parent' => eid of the parent ape
    // Taxonomy apes has a hierarchy and they may have parent terms. Credits apes have always depth=0 and parent=0

    // Keep this in case you have to measure performances: timer_start('get_filtered_terms');

    //watchdog('musth_amf_service', 'W7D001 musth_amf_service_tagring_api_get_filtered_terms (!v) (!q) ',
    //    array('!v' => print_r($vid, true),
    //          '!q' => print_r($query_string, true)
    //    ),
    //    WATCHDOG_DEBUG);

    $return_vocabulary_ape_name = musth_amf_service_get_ape_name_for_a_vocabulary($vid);
    $return_vocabulary_ape_type = musth_amf_service_get_ape_type_for_a_vocabulary($vid);

    if ($query_string) {
        // This is the most difficult case. We have a combined search

        // We have to parse the query string to know which filter vocabularies we have to take
        // into account

        // The query string is in the format vid=tid&vid=tid&vid=tid ...
        // vid is the id of a filter vocabulary
        // tid was a taxonomy id, now it's the eid of an ape that contains the information about
        // the entity to use to filter
        // For example it can be that vid=7 (Composer) and the tid is, actually, the eid of the
        // ape that is about Mozart

        // Extracting the eids and the ape names of the apes we have to use to filter the result

        $apes_names_and_eids_of_the_filter_apes = musth_amf_service_get_apes_names_and_eids_from_query_string($query_string);

        // We pass ape names and eids to the following function which is going to give us the list of the nids of the
        // programmes that are related to the given search criteria. These latter are given us in the query string

        $intersected_array_of_nids =
            musth_amf_service_get_nids_lists_and_intersect_them($apes_names_and_eids_of_the_filter_apes);

        // $intersected_array_of_nids is the list of the programmes that are related to the terms passed in the query
        // string
        // For example, if the query string is:
        // 7=67&18=788
        // $intersected_array_of_nids will contain the nids of the programmes that are associated with
        // both the composer no. 67 and the venue no. 788
        // Remember that 67 and 788 are not the node ids of the composer and of the venue. They are the eids
        // of the apes that contain information about that composer and venue

        // $intersected_array_of_nids is an associative array in this format:
        // [26] => 26, [67] => 67, ...
        // Why? Because php searches associative arrays faster

        // Now we want the return vocabulary, the one identified by $vid. First of all get the entire
        // vocabulary. We don't filter it.

        $vocabulary_and_its_map = musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type($return_vocabulary_ape_name,
                                                                                                 $return_vocabulary_ape_type,
                                                                                                 TRUE);

        // The error message is produced in the function itself (musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type)
        if (!$vocabulary_and_its_map)
            return services_error(t('Error when calling musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type'));

        // $vocabulary_and_its_map contains the vocabulary. For vocabulary we mean all the apes for the given vocabulary
        // For example all the apes for Genre

        // $vocabulary_and_its_map contains the map as well. The map is the list of the programmes where our apes
        // appear. For each programme it provides, as well, the list of the apes associated with that programme.

        $map_of_apes_occurrences_by_programme = $vocabulary_and_its_map['map_apes_occurrences_by_programme'];

        // Now the fun begins
        // $map_of_apes_occurrences_by_programme is the list of all the programmes where the terms of the return vocabulary
        // appear
        // Example:
        // If $vid = 4, the return vocabulary is the Genre vocabulary
        // In this case $map_of_apes_occurrences_by_programme is the list of the programmes that have a Genre associated
        // Virtually, it could be a list of all programmes because all programmes can have a Genre associated
        // But we have to filter all these programmes using the query string
        // The programmes filtered using the query string are in $intersected_array_of_nids

        // This is why we intersect the two arrays

        $intersected_array_of_nids_with_apes = array_intersect_key($map_of_apes_occurrences_by_programme,
                                                                   $intersected_array_of_nids);

        // $intersected_array_of_nids_with_apes contains only programmes that satisfy the query string and that have
        // terms of the return vocabulary associated with them

        // Example:
        // If $vid = 4 and query_string = 7=67&18=788, in $intersected_array_of_nids_with_apes
        // we will have the nids of the programmes that have a Genre associated with them and
        // that have the composer no. 67 and the venue no. 788.

        // $intersected_array_of_nids_with_apes is a list of programme nids, but it also has the eids of the
        // apes associated with each programme

        // So, the apes that we have to send back to the tagring are precisely in $intersected_array_of_nids_with_apes

        //watchdog('musth_amf_service', 'W7D001 XX675t (!v) (!q) (!m) ',
        //    array('!v' => print_r($intersect_them_boh, true),
        //          '!q' => print_r($intersected_array_of_nids, true),
        //          '!m' => print_r($map_apes_occurrences_by_programme, true)
        //    ),
        //    WATCHDOG_DEBUG);

        // How many times our apes occur in the restricted list of programmes?
        // The tagring calls it 'count'. It has to display it near each term.
        // This 'count' is different from the one that we get when we want
        // a complete vocabulary because it's calculated on the smaller list of
        // programmes that satisfy the query string

        $apes_occurrences = array();

        foreach ($intersected_array_of_nids_with_apes as $programme_nid => $apes_occurring_in_this_programme) {
            foreach ($apes_occurring_in_this_programme as $ape_eid) {
                if (isset($apes_occurrences[$ape_eid])) {
                    // We have already encountered this ape
                    $apes_occurrences[$ape_eid]++;
                } else {
                    // It's the first time that we encounter this ape
                    $apes_occurrences[$ape_eid] = 1;
                }
            }
        }

        //watchdog('musth_amf_service', 'W7D001 7188 (!v) (!q) (!m) ',
        //    array('!v' => print_r($apes_occurrences, true),
        //          '!q' => print_r($intersected_array_of_nids_with_apes, true),
        //          '!m' => print_r(0, true)
        //    ),
        //    WATCHDOG_DEBUG);

        // Yes, $programme_nid is not used actually

        // Now we have just to prepare the result to send to the tagring

        $result_for_the_tagring = array();

        // We are scanning the return vocabulary. We have to take only the apes
        // that result from the filtering done above

        foreach ($vocabulary_and_its_map['apes_info'] as $info_for_an_ape) {

            $eid_of_the_current_ape = $info_for_an_ape['tid'];

            // The ape is not among the ones that result from the filtering
            // above
            // Remember that 'tid' is the eid of an ape actually
            if (!isset($apes_occurrences[$eid_of_the_current_ape])) continue;

            $info_to_return_about_the_current_ape = array(
                'label' => $info_for_an_ape['label'],
                'tid' => $eid_of_the_current_ape,
                'count' => $apes_occurrences[$eid_of_the_current_ape],
                'depth' => $info_for_an_ape['hierarchy_depth'],
                'parent' => $info_for_an_ape['parent_tid'],
            );

            $result_for_the_tagring[] = $info_to_return_about_the_current_ape;
        }

    } else {

        // No query string here! This is simpler!

        $vocabulary_without_the_map =
            musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type($return_vocabulary_ape_name,
                                                                           $return_vocabulary_ape_type);

        // The error message is produced in the function itself (musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type)
        if (!$vocabulary_without_the_map)
            return services_error(t('Error when calling musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type'));

        $result_for_the_tagring = array();

        foreach ($vocabulary_without_the_map['apes_info'] as $info_for_an_ape) {

            $info_to_return_about_the_current_ape = array(
                'label' => $info_for_an_ape['label'],
                'tid' => $info_for_an_ape['tid'],
                'count' => $info_for_an_ape['programmes_count'],
                'depth' => $info_for_an_ape['hierarchy_depth'],
                'parent' => $info_for_an_ape['parent_tid'],
            );

            $result_for_the_tagring[] = $info_to_return_about_the_current_ape;
        }

    }

    // Keep this in case you have to measure performances: $timer_result = timer_stop('get_filtered_terms');

    //watchdog('musth_amf_service', 'W7D001 81UHY (!v) (!q) (!m) ',
    //   array('!v' => print_r($result_for_the_tagring, true),
    //        '!q' => print_r(0, true),
    //        '!m' => print_r(0, true)
    //    ),
    //    WATCHDOG_DEBUG);

    return $result_for_the_tagring;
}

/**
 * This api sends back the nids of the programmes that satisfy the search criteria specified
 * in a query string.
 * The tagring uses it to get the nids of the programmes that are the result of a combined query
 *
 * @param[in] $query_string The query string in the format: vid=tid&vid=tid&vid=tid ...
 * @return array Array of the nids of the programmes that satisfy the search criteria given by the query string
 */
function musth_amf_service_tagring_api_get_item_ids($query_string) {

    // Keep this in case you have to measure performances: timer_start('get_item_ids');

    if (!$query_string) {
        // The query string cannot be empty

        watchdog('musth_amf_service', 'W3E018 Empty query string (!i) ',
            array('!i' => print_r($query_string, true)),
            WATCHDOG_ERROR);

        return services_error(t('W3E018 The query string cannot be empty'));
    }

    // We parse the query string and get an array with the name of the ape type and the eids of the apes
    // that constitute the filter
    // This query string: 2=34&7=155 becomes:
    // [0] => Array ( [ape_name] => period [eid] => 34 )
    // [1] => Array ( [ape_name] => composer [eid] => 155 )

    $apes_names_and_eids_of_the_filter_apes =
        musth_amf_service_get_apes_names_and_eids_from_query_string($query_string);

    // We pass the array we got from the previous function to the following function that finds the programmes
    // that satisfy the given criteria
    // In our example we want the programmes associated to the period identified by the ape no. 34
    // (Early 20th Century) and with the composer identified by the ape no. 155 (Riccardo Muti, he is not a composer
    // and the data I'm using is test data, but anyway)

    $intersected_array_of_nids =
        musth_amf_service_get_nids_lists_and_intersect_them($apes_names_and_eids_of_the_filter_apes);

    //watchdog('musth_amf_service', 'W7D001 get_item_ids (!v) (!q) (!t) ',
    //    array('!v' => print_r($intersected_array_of_nids, true),
    //        '!q' => print_r($query_string, true),
    //        '!t' => print_r($apes_names_and_eids_of_the_filter_apes, true)
    //    ),
    //    WATCHDOG_DEBUG);

    // We get an associative array like this one:
    // [23] => 23 [78] => 78
    // I know that it looks redundant, but it's an associative array and this type of arrays are faster

    // We make the associative array simple because the tagring wants a simple array

    $simple_nids_array = array_keys($intersected_array_of_nids);

    // Keep this in case you have to measure performances: $timer_result = timer_stop('get_item_ids');

    //watchdog('musth_amf_service', 'W7D001 67TGB get_item_ids (!q) (!t) (!v) ',
    //    array('!q' => print_r($query_string, true),
    //          '!t' => print_r($apes_names_and_eids_of_the_filter_apes, true),
    //          '!v' => print_r($simple_nids_array, true),
    //    ),
    //    WATCHDOG_DEBUG);

    return $simple_nids_array;
}
