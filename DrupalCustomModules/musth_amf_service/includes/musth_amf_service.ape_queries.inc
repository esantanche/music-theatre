<?php
/**
 * @file musth_amf_service.ape_queries.inc
 *
 * @brief Functions that the tagring apis use to actually query the apes from the database
 *
 * These functions do the heavy work of querying the database to return the apes
 *
 * @ingroup musthamfservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 03/03/14
 * Time: 12:20
 */

/**
 * Given an ape name and its type return all the apes of that type
 *
 * Example:
 * Say $ape_name is 'genre'. We want back every Genre ape
 *
 * Optionally we want the map.
 * The map is the list of every programme that has at least one ape of the given type associated.
 *
 * Example:
 * If $ape_name is 'genre', the map lists every programme that has a 'genre', any 'genre'.
 * So, it may be that the map lists all programmes if they all have a 'genre'
 *
 * The map specify the apes of type 'genre' that are associated with each programme.
 *
 * @param $ape_name
 * @param $ape_type
 * @param $compute_map_apes_occurrences_by_programme
 * @internal param $ [in] string $ape_name Ape name ('genre', 'form', 'period', 'instrument', ...)
 * @internal param $ [in] string $ape_type Either 'taxonomy' or 'credits'
 * @internal param $ [in] bool $compute_map_apes_occurrences_by_programme True if we have to calculate the map as well
 * @return array Array containing the info about every ape of the given type and the map as well
 */
function musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type($ape_name, $ape_type,
                                                                        $compute_map_apes_occurrences_by_programme = FALSE) {


    // Which tagring are we dealing with? The audio, the video or the library one? Maybe in the future there will
    // be many others.
    // We differentiate between tagrings by checking the gateway they use.
    // The gateways are in the format "amf_<content type>"
    // We have amf_video, amf_audio and amf_library.
    // The gateway is identified by the url used and the url is returned by the function current_path,
    // a standard Drupal function, used in the function below.

    $parameters = musth_helper_functions_get_parameters_from_current_path();

    // $parameters['content_type'] is the content type, 'video', 'audio' or 'library'

    //watchdog('musth_amf_service', 'W7D001 71721 casgaafatoct current path (!p) (!r) ',
    //    array('!p' => print_r(current_path(), true),
    //          '!r' => print_r($parameters, true)),
    //    WATCHDOG_DEBUG);

    // Every ape is supposed to appear only once in a programme. This because we eliminated
    // duplicate occurrences when creating the apes
    // @see musth_rules_scan_credit_field_entities_and_count_their_occurrences

    // What do we have to return?
    // For each ape we return an associative array with:
    // 'label' => ape label (taxonomy term label or name of a person or organisation)
    // 'programmes_count' => Occurrences of this ape in programmes
    // 'programme_nids_list' => List of the nids of the programmes where this ape appears
    // 'hierarchy_depth'  => 0 if the ape has no parents, 1 otherwise (only for taxonomy apes)
    // 'parent_tid' => eid of the parent ape (only for taxonomy apes)
    // We have to return the map as well if required

    // The map lists the apes associated to every programme

    $map_apes_occurrences_by_programme = array();

    // The actual machine name of the ape is $ape_name prefixed with 'ape_'
    $ape_name_including_prefix = 'ape_' . $ape_name;

    // This array will contain the info about every apes of the given type (identified by $ape_name)
    $apes_info = array();

    //watchdog('musth_amf_service', 'W7D001 1010 musth_amf_service_get_all_apes_for_a_taxonomy_or_credits_type (!n) (!t) ',
    //    array('!n' => print_r($ape_name_including_prefix, true),
    //          '!t' => print_r($ape_type, true)),
    //    WATCHDOG_DEBUG);

    if ($ape_type == 'taxonomy') {
        // For the taxonomy type of apes we want them ordered by the field_order field that follows the
        // taxonomy hierarchy
        $name_of_field_to_order_by = 'field_order';
    } else {
        // For the credit type of apes we want them ordered by the field_label field, that is in
        // alphabetical order (so, name of people and organisations are sorted alphabetically)
        $name_of_field_to_order_by = 'field_label';
    }

    // Loading every ape of the given type ($ape_name). For example, every 'genre' ape

    // The tagring supports audio and video and we are choosing between them by using the
    // variable $parameters['content_type']

    try {
        $query = new EntityFieldQuery();
        $eids_of_found_apes_as_arrays = $query->entityCondition('entity_type', $ape_name_including_prefix)
            ->entityCondition('bundle', $ape_name_including_prefix)
            ->fieldCondition('field_media_type', 'value', $parameters['content_type'], '=')
            ->fieldOrderBy($name_of_field_to_order_by, 'value', 'ASC')
            ->execute();
    }
    catch (Exception $e) {

        watchdog('musth_amf_service', 'W3E020 Error in loading every ape of a given type. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    if (isset($eids_of_found_apes_as_arrays[$ape_name_including_prefix])) {

        $eids_of_found_apes = array_keys($eids_of_found_apes_as_arrays[$ape_name_including_prefix]);
        $actual_apes = entity_load($ape_name_including_prefix, $eids_of_found_apes);

        // We are going to scan every found ape to collect the info we need about each of them
        // We also compute the map, that is the list of programmes and, for each of them, the
        // list of apes that occur in those programmes

        foreach ($actual_apes as $ape_eid => $ape) {
            //watchdog('musth_amf_service', 'W7D001 7B5F apes (!i) (!a) ',
            //    array('!i' => print_r($ape_eid, true),
            //        '!a' => print_r($ape->field_programme_nids_list[LANGUAGE_NONE], true)),
            //    WATCHDOG_DEBUG);

            // We collect the information to send back to the tagring

            if ($ape_type == 'taxonomy') {

                $ape_info_array = array(
                    'tid' => $ape_eid,
                    'label' => $ape->field_label[LANGUAGE_NONE][0]['value'],
                    'programmes_count' => $ape->field_programmes_count[LANGUAGE_NONE][0]['value'],
                    'hierarchy_depth'  => $ape->field_hierarchy_depth[LANGUAGE_NONE][0]['value'],
                    'parent_tid' => $ape->field_parent_tid[LANGUAGE_NONE][0]['value'],
                );

            } else {

                $ape_info_array = array(
                    'tid' => $ape_eid,
                    'label' => $ape->field_label[LANGUAGE_NONE][0]['value'],
                    'programmes_count' => $ape->field_programmes_count[LANGUAGE_NONE][0]['value'],
                    'hierarchy_depth'  => 0,
                    'parent_tid' => 0,
                );

            }

            $apes_info[] = $ape_info_array;

            // If required, we compute the map

            if ($compute_map_apes_occurrences_by_programme) {

                // We scan the nids of the programmes associated to the current ape $ape

                foreach($ape->field_programme_nids_list[LANGUAGE_NONE] as $programme_nid_as_array) {

                    //watchdog('musth_amf_service', 'W7D001 6VFS programme_nid_in_array (!n) (!r) ',
                    //    array('!n' => print_r($ape_name, true),
                    //        '!r' => print_r($programme_nid_in_array, true)),
                    //    WATCHDOG_DEBUG);

                    // $programme_nid is the nid of a programme where the ape $ape can be found

                    $programme_nid = $programme_nid_as_array['value'];

                    // The current ape $ape, whose eid is $ape_eid, gets listed in the array
                    // $map_apes_occurrences_by_programme[$programme_nid]
                    // which is the list of the apes associated to the programme of nid $programme_nid

                    if ($compute_map_apes_occurrences_by_programme) {
                        if (isset($map_apes_occurrences_by_programme[$programme_nid])) {
                            $map_apes_occurrences_by_programme[$programme_nid][] = $ape_eid;
                        } else {
                            $map_apes_occurrences_by_programme[$programme_nid] = array($ape_eid);
                        }
                    }

                }

            }

        }

    } else {
        // We didn't find any ape. It can't be!

        watchdog('musth_amf_service', 'W3E021 No apes found, something is wrong! Ape name: (!a)',
            array('!a' => print_r($ape_name_including_prefix, true)),
            WATCHDOG_ERROR);

        return FALSE;
    }

    //watchdog('musth_amf_service', 'W7D001 8177 return_boh (!n) (!r) ',
    //    array('!n' => print_r($ape_name, true),
    //        '!r' => print_r($apes_info, true)),
    //    WATCHDOG_DEBUG);

    return array( 'apes_info' => $apes_info,
                  'map_apes_occurrences_by_programme' => $map_apes_occurrences_by_programme );
}

/**
 * It's the function that performs a combined search of programmes
 *
 * Example:
 * The array $apes_to_be_intersected contains:
 * [0] => Array ( [ape_name] => period [eid] => 34 )
 * [1] => Array ( [ape_name] => composer [eid] => 155 )
 *
 * This means that this function has to return the nids of the programmes that are associated to the period
 * described by the ape no. 34 and to the composer described by the ape no. 155
 * It could be that we want the period "Early 20th century" and the composer "Debussy"
 *
 * @param[in] $apes_to_be_intersected Array of arrays. Each one of them contains a pair ape_name - eid
 * representing a filter
 * @return array List of the nids of the filtered programmes
 */
function musth_amf_service_get_nids_lists_and_intersect_them($apes_to_be_intersected) {

    // We return a keyed array because keyed arrays are better for performance when
    // we interstect them

    //watchdog('musth_amf_service', 'W7D001 8XCD musth_amf_service_get_nids_lists_and_intersect_them apes_to_be_intersected (!q) (!s) ',
    //    array('!q' => print_r(0, true),
    //        '!s' => print_r($apes_to_be_intersected, true)
    //    ),
    //    WATCHDOG_DEBUG);

    // We use the php function array_combine to create associative arrays from simple ones
    // Like this: $result = array_combine($eids, $eids);

    // This is the array that will contain the result
    // It's called 'intersected..' because it the result of the intersection of many lists of nids
    // as we will see below

    $intersected_list_of_nids = array();

    foreach ($apes_to_be_intersected as $ape_to_be_intersected) {

        // The machine name of the ape has to be formed using a prefix:

        $ape_name_including_prefix = 'ape_' . $ape_to_be_intersected['ape_name'];

        // We get the eid of the ape we have to use to filter the programmes

        $eid_of_ape_as_array = array($ape_to_be_intersected['eid']);

        $ape_as_array = entity_load($ape_name_including_prefix, $eid_of_ape_as_array);

        if (empty($ape_as_array)) {

            watchdog('musth_amf_service', 'W3E022 Cant load an ape that should exist! (!a) (!e) ',
                array('!a' => print_r($ape_name_including_prefix, true),
                      '!e' => print_r($eid_of_ape_as_array, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

        // Let's get the actual ape
        $ape = $ape_as_array[$ape_to_be_intersected['eid']];

        // We read the field that, in the ape, contains the list of the programmes
        // in which that ape appears
        $nids_list_field = $ape->field_programme_nids_list;

        $nids_list = array();
        foreach ($nids_list_field[LANGUAGE_NONE] as $nid_as_array) {

            // This is the actual nid
            $nid = $nid_as_array['value'];

            // I want the array associative in order for it to be ready for intersections
            $nids_list[$nid] = $nid;
        }

        // Now $nids_list is an associative array with the nids of the programmes
        // where the ape $ape appears
        // The array is associative instead of simple for performance

        //watchdog('musth_amf_service', 'W7D001 0987 ape (!q) (!s) ',
        //    array('!q' => print_r($ape_label[LANGUAGE_NONE][0]['value'], true),
        //          '!s' => print_r($ape_name_including_prefix, true)
        //   ),
        //    WATCHDOG_DEBUG);

        // This is where the magic happens
        // The first time we get here, we just copy the nids list $nids_list in
        // $intersected_list_of_nids
        // The following times, we intersect $nids_list with $intersected_list_of_nids
        // because the intersection of those two arrays will given the set of the programmes
        // that are associated with the current ape $ape as well as with the previous ones

        // Example:
        // Say that $apes_to_be_intersected is something like:
        //  * [0] => Array ( [ape_name] => period [eid] => 34 )
        //  * [1] => Array ( [ape_name] => composer [eid] => 155 )
        // Say that the ape whose eid is 34 is the period "Early 20th century" and
        // the ape whose eid is 155 is the composer "Debussy"
        // The first time we get here $nids_list is the list of the nids of the programmes
        // associated with the period "Early 20th century"
        // The second time we get here $nids_list is the list of the nids of the programmes
        // associated with the composer "Debussy"
        // We will intersect these two array so that the result is the array of the nids
        // of the programmes that are associated with both those period and composer

        if (empty($intersected_list_of_nids)) {
            // Making the array unique in case the same programme is reported many times
            $intersected_list_of_nids = $nids_list;
        } else {
            $intersected_list_of_nids = array_intersect_key($intersected_list_of_nids, $nids_list);
        }
    }

    // We get an associative array like this one:
    // [23] => 23 [78] => 78
    // I know that it looks redundant, but it's an associative array and this type of arrays are faster

    return $intersected_list_of_nids;
}