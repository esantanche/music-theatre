<?php

/**
 * @file musth_rules.taxonomy_apes_build.inc
 *
 * @brief Here there are the actions used to build or refresh
 * the apes that are created from the existing non-credit taxonomies
 *
 * Precisely, the apes created here are related to the taxonomies:
 * - Genre
 * - Form
 * - Period
 * - Instrument
 * - Film type
 * - Type (Library item type, article, synopsis, biography)
 *
 * This .inc file doesn't include the actions that reset the apes by deleting them all.
 * These latter actions are in an another .inc @see musth_rules.taxonomy_apes_reset.inc
 *
 * @ingroup musthrules
 */

/**
 * Building or updating the taxonomy apes
 *
 * We have to create or update apes for the taxonomies whose names are in the variable $taxonomies_we_create_apes_for
 * The tagring is not interested in 'organisation_type', so the latter won't be considered
 * This function is going to do the job for all taxonomies
 *
 * @todo have to add partners
 *
 * This action has to be called for every media type, 'video', 'audio' and 'library'.
 *
 * It will create (or update) apes related to video, audio or library "programmes", but not all at the same time.
 * It has to be called three times, one time to create apes for video programmes, one time to
 * create apes for audio programmes and one time to create apes for library "programmes".
 *
 * @attention This function won't delete apes related to terms that have been deleted or that don't appear in programmes
 * any more. Maybe we want to do this as well later on.
 *
 * @attention Now we call programmes audio, video and library ones. We will want to refactor this naming convention.
 * Now a programme is any node, regardless of the content type, that has at least the field field_system_title.
 * The first letter of this field tells us about the media type, video, audio or library.
 * Actually such a node has to have some other fields the tagring displays.
 *
 * @param[in] $settings The action configuration settings, not used
 * @return TRUE or FALSE on exception
 */
function musth_rules_action_apes_building_taxonomies($media_type) {

    // We throw an exception if the given media type is wrong
    // We know that a media type is wrong if there are no programmes for that media type

    $media_type_is_valid = musth_rules_check_if_there_is_at_least_one_programme_for_the_given_media_type($media_type);

    if (!$media_type_is_valid) {

        watchdog('musth_rules', 'W3E093 Media type not valid. Media type: (!m)',
            array('!m' => print_r($media_type, true)),
            WATCHDOG_ERROR);

        return FALSE;

    }

    //    watchdog('musth_rules', 'W7D001 musth_rules_action_apes_building_taxonomies 8GV4 (!m) (!t) ',
    //        array('!m' => print_r($media_type, true),
    //              '!t' => print_r($media_type_is_valid, true)),
    //        WATCHDOG_DEBUG);

    /**
     * These are the fields an ape contains
     * field_label: The label of the term the ape is about
     * field_tid: The tid of the term
     * field_programmes_count: The number of programmes the term appears in
     * field_hierarchy_depth: 0 if the term has no parents, 1 if it has
     * field_parent_tid: The tid of the parent term or zero if there are no parents.
     * We don't consider terms having more than one parent
     * field_programme_nids_list: List of the nids of the programmes that contain the term.
     * It's a multivalued field
     *
     * Now there is also the field field_media_type to differentiate apes that are about
     * video programmes from those that are about audio programmes or library "programmes".
     */

    // We use the same list of taxonomies for every media type because media types that
    // don't have a taxonomy will have no apes about that taxonomy
    // At worst we will perform some useless scanning of programmes

    // We have to create apes for these taxonomies. The tagring is not interested in 'organisation_type'
    $taxonomies_we_create_apes_for = array('genre', 'form', 'period', 'instrument', 'film_type',
                                           'type', 'organisation_type', 'profession', 'voice');

    // Step 1. For each taxonomy, load the taxonomy tree
    // The tree starts with every taxonomy term appearing zero times in programmes
    // Later we calculate how many times a term appears in programmes
    // We will keep a list of all the programmes where a term appears. It's useful for other computations.

    $taxonomy_tree_with_no_counts = array();
    foreach($taxonomies_we_create_apes_for as $taxonomy_to_create_apes_for) {
        // $taxonomy_tree_with_no_counts has the programmes count set to zero. We will compute it later
        $taxonomy_tree_with_no_counts[$taxonomy_to_create_apes_for] =
            musth_rules_load_taxonomy_tree($taxonomy_to_create_apes_for);

        //        watchdog('musth_rules', 'W7D001 6FCD tax tree (!i) (!t) ',
        //            array('!i' => print_r($taxonomy_to_create_apes_for, true),
        //                  '!t' => print_r($taxonomy_tree_with_no_counts[$taxonomy_to_create_apes_for], true)), WATCHDOG_DEBUG);

    }

    // Let's see what we have in $taxonomy_tree_with_no_counts
    // It's an array with, as first index, the taxonomy machine name, second, the term tid, then these fields:
    // 'order' => $term_order_no,
    // 'label' => $term_name,
    // 'programmes_count' => 0,
    // 'programme_nids_list' => array(),
    // 'hierarchy_depth' => $term_hierarchy_depth,
    // 'parent_tid' => $term_parent);

    //watchdog('musth_rules', 'W7D001 7YHN genre_vocabulary_vid full_taxonomy_tree (!i) (!t) ',
    //    array('!i' => print_r($taxonomy_to_create_apes_for, true), '!t' => print_r($full_taxonomy_tree, true)), WATCHDOG_DEBUG););

    // Step 2 Counting term occurrences
    // Now I have to cycle the programmes to find in which ones of them the taxonomy terms appear

    // We need the media type because we will scan only the programmes of the given media type

    $taxonomy_tree_with_counts = musth_rules_programmes_scan($taxonomy_tree_with_no_counts,
                                                              $taxonomies_we_create_apes_for,
                                                              $media_type);

    //watchdog('musth_rules', 'W7D001 0BGS taxonomy_tree_with_counts (!i) (!t) ',
    //    array('!i' => print_r($taxonomies_we_create_apes_for, true), '!t' => print_r($taxonomy_tree_with_counts, true)),
    //    WATCHDOG_DEBUG);

    // Step 3 Create or update the apes
    // Now we have the count of the occurrences of every term in programmes
    // We proceed with creating or updating the apes

    musth_rules_create_or_update_apes($taxonomy_tree_with_counts, $taxonomies_we_create_apes_for, $media_type);

    /**
     * @attention We don't cleanup the apes that no longer appear in any programme or that have been deleted
     * @attention LATER maybe we do it later. Now (2014-02-14 17:22) we will use the reset action to solve this sort of problems
     * @see musth_rules_action_apes_resetting_taxonomies
     * @attention LATER if cleaning apes that are no longer used, refuse to delete more than 10 apes and raise an exception in such a case
     */

    return TRUE;
}

/**
 * Function that loads the taxonomy tree for a given taxonomy
 *
 * @attention Terms are supposed to have one parent only. This function will return the first parent
 * only for term that have more than one parent
 *
 * @param[in] $taxonomy_machine_name The machine name of the taxonomy to load
 * @return Array containing the terms indexed by tid
 */
function musth_rules_load_taxonomy_tree($taxonomy_machine_name) {

    // Get the vocabulary id (vid) of the given taxonomy
    $taxonomy_object = taxonomy_vocabulary_machine_name_load($taxonomy_machine_name);
    $taxonomy_vid = $taxonomy_object->vid;

    // Get the taxonomy tree
    try {
        $full_taxonomy_tree = taxonomy_get_tree($taxonomy_vid, 0, NULL, TRUE);
    }
    catch (Exception $e) {
        watchdog('musth_rules', 'W3E004 Error in loading taxonomy tree. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        return FALSE;
    }

    // The taxonomy tree follows the term order defined when creating the taxonomy
    // We remember this order in the field 'order'
    $terms_array_by_tid = array();
    foreach ($full_taxonomy_tree as $term_order_no => $term) {
        $term_tid = $term->tid;
        $term_name = $term->name;
        // We decided that every instrument has one and one only parent
        $term_parent = $term->parents[0];
        if ($term_parent > 0) {
            // The term has parents
            $term_hierarchy_depth = 1;
        } else {
            // The term has no parents
            $term_hierarchy_depth = 0;
        }

        // Populate the array to be returned
        $terms_array_by_tid[$term_tid] = array('order' => $term_order_no,
            'label' => $term_name,
            'programmes_count' => 0,
            'programme_nids_list' => array(),
            'hierarchy_depth' => $term_hierarchy_depth,
            'parent_tid' => $term_parent);
    }

    return $terms_array_by_tid;
}

/**
 * This function scans every published programme to count how many times a taxonomy term appears in programmes.
 *
 * It will scan only the programmes that are of the given media type.
 *
 * @param $taxonomy_tree_with_no_counts array Taxonomy terms (for every taxonomy) with zeroed counts
 * @param $taxonomies_we_create_apes_for array Machine names of the taxonomies we have to look for in programmes
 * @param $media_type string 'video' or 'audio'
 * @return array Taxonomy tree with programmes count computed
 */
function musth_rules_programmes_scan($taxonomy_tree_with_no_counts, $taxonomies_we_create_apes_for, $media_type) {

    // Let's recall what we have in $taxonomy_tree_with_no_counts
    // It's an array with first index the taxonomy machine name, second, the term tid, then these fields:
    // 'order' => $term_order_no,
    // 'label' => $term_name,
    // 'programmes_count' => 0,
    // 'programme_nids_list' => array(),
    // 'hierarchy_depth' => $term_hierarchy_depth,
    // 'parent_tid' => $term_parent);

    $media_type_to_prefix = array( 'video'    => 'V',
        'audio'    => 'A',
        'library'  => 'L',
        'partners' => 'P' );

    // If we are given an invalid media type, we return 0

    if (isset($media_type_to_prefix[$media_type]))
        $media_type_prefix = $media_type_to_prefix[$media_type];
    else {
        // Get out of here!
        return FALSE;
    }

    // There is no condition like entityCondition('bundle', 'programme') here
    // because we search for any node that has a field_system_title field
    // whose value begins with the media prefix letter corresponding to
    // the given media type

    // Now loading every published programme
    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'node')
        ->propertyCondition('status', 1)   // only published programmes
        ->fieldCondition('field_system_title', 'value', $media_type_prefix, 'STARTS_WITH')
        ->execute();

    if (isset($result['node'])) {
        $programmes_nids = array_keys($result['node']);
        $programmes = entity_load('node', $programmes_nids);
    } else {
        // No programmes? Something is wrong!

        watchdog('musth_rules', 'W3E003 No programmes found for the given media type',
            array(),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    // Now $programmes contains every published programme
    // Now we are going to scan all programmes to count term occurrences

    foreach($programmes as $programme) {

        // We find term occurrences for an individual programme

        $terms_and_their_occurrences_in_the_given_programme =
            musth_rules_count_terms_in_a_programme($programme, $taxonomies_we_create_apes_for);

        // We have, in $terms_and_their_occurrences_in_the_given_programme, the number of occurrences of terms in the current
        // programme $programme
        // We have to sum these occurrences to form a statistic for all programmes

        foreach($terms_and_their_occurrences_in_the_given_programme as $taxonomy_machine_name => $occurrences_by_tid) {

            // $occurrences_by_tid is an array with the occurrences of each tid in the form [tid] => <no of occurrences>

            //watchdog('musth_rules', 'W7D001 1111 (!i) (!t) ',
            //    array('!i' => print_r($taxonomy_machine_name, true), '!t' => print_r($occurrences_by_tid, true)),
            //          WATCHDOG_DEBUG);

            foreach($occurrences_by_tid as $tid => $no_of_occurrences) {
                // The number of occurrences for this term has to be put in:
                // $taxonomy_tree_with_no_counts[ <taxonomy machine name> ][ <term tid> ]['programmes_count']
                // Doing so, $taxonomy_tree_with_no_counts will actually contain the counts

                if (isset($taxonomy_tree_with_no_counts[$taxonomy_machine_name][$tid]['programmes_count'])) {
                    // We add the found occurrences.
                    // $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$tid]['programmes_count'] is
                    // initially zero
                    $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$tid]['programmes_count'] += $no_of_occurrences;

                    // I add the current programme to the list of programmes where the current term has been found
                    $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$tid]['programme_nids_list'][] = $programme->nid;

                    // If the current term has a parent, we have to increase the number of occurrences of the latter as well
                    $parent_of_current_term = $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$tid]['parent_tid'];
                    if ($parent_of_current_term > 0) {

                        if (isset($taxonomy_tree_with_no_counts[$taxonomy_machine_name][$parent_of_current_term])) {

                            // We don't want to add the programme to the parent term if it's already there because
                            // we don't want the same programme to appear in the list of programmes related
                            // to the parent term more than once
                            if (!in_array($programme->nid,
                                          $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$parent_of_current_term]['programme_nids_list'])) {

                                $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$parent_of_current_term]['programmes_count'] +=
                                    $no_of_occurrences;

                                // I add the current programme to the list of programmes where the parent of the current term has been found
                                // Even if the parent of the current term isn't actually used by the programme, we have to pretend
                                // that the parent appears in the programme
                                // Otherwise the parent term would result as not appearing in any programme
                                $taxonomy_tree_with_no_counts[$taxonomy_machine_name][$parent_of_current_term]['programme_nids_list'][] =
                                    $programme->nid;

                            }

                        } else {
                            // Error here
                            // If our current term, the one of tid $tid, has a parent, we should find the latter in
                            // $taxonomy_tree_with_no_counts where every term should be present
                            watchdog('musth_rules', 'W3E002 Parent not found. Taxonomy: (!t) Parent: (!r) Programme: (!p)',
                                array('!t' => print_r($taxonomy_machine_name, true),
                                    '!r' => print_r($parent_of_current_term, true),
                                    '!p' => print_r($programme->title, true)),
                                WATCHDOG_ERROR);
                        }

                    }

                } else {
                    // How can it be that we found a term in a programme that isn't in $taxonomy_tree_with_no_counts?
                    // In $taxonomy_tree_with_no_counts we should find every possible term

                    watchdog('musth_rules', 'W3E001 Unknown term. Taxonomy: (!t) Term tid: (!i) Programme: (!p)',
                        array('!t' => print_r($taxonomy_machine_name, true),
                              '!i' => print_r($tid, true),
                              '!p' => print_r($programme->title, true)),
                        WATCHDOG_ERROR);
                }

            }

        }

        //watchdog('musth_rules', 'W7D001 6VFZ (!i) (!t) ',
        //    array('!i' => print_r($programme->nid, true),
        //'!t' => print_r($terms_and_their_occurrences_in_the_given_programme, true))WATCHDOG_DEBUG););

    }

    // Now $taxonomy_tree_with_no_counts has the occurrences count, so we return it
    return $taxonomy_tree_with_no_counts;
}

/**
 * This function counts terms occurrences in a single programme
 *
 * @param[in] $programme Programme where to look for taxonomy terms
 * @param[in] $taxonomies_we_create_apes_for Machine names of the taxonomies we have to look for in programmes
 * @return Array Terms and their occurrences in the given programme
 */
function musth_rules_count_terms_in_a_programme($programme, $taxonomies_we_create_apes_for) {

    $terms_and_their_occurrences_in_the_given_programme = array();

    foreach($taxonomies_we_create_apes_for as $taxonomy_machine_name) {

        // Initialise the array for the current taxonomy
        $terms_and_their_occurrences_in_the_given_programme[$taxonomy_machine_name] = array();

        // I assume that the field in the programme object that contains a taxonomy has the same name as the
        // taxonomy itself. So, in a programme the field field_genre will contain the genre taxonomy

        // We have to read this field in the given programme. There we find the current taxonomy term
        $name_of_field_where_the_taxonomy_is_stored = 'field_' . $taxonomy_machine_name;

        // We are using this function because it doesn't throw an exception if
        // the field we are looking for doesn't exist for the current programme

        $taxonomy_terms = field_get_items('node', $programme, $name_of_field_where_the_taxonomy_is_stored);

        //watchdog('musth_rules', 'W7D001 musth_rules_count_terms_in_a_programme 0ASDRF (!i) (!c) ',
        //    array('!i' => print_r($taxonomy_terms, true),
        //          '!c' => print_r($taxonomy_machine_name, true)),WATCHDOG_DEBUG);

        // If the field doesn't exist, we continue with the next taxonomy
        if (!$taxonomy_terms) continue;

        //watchdog('musth_rules', 'W7D001 musth_rules_count_terms_in_a_programme 9191jnhb (!i) (!c) ',
        //    array('!i' => print_r($taxonomy_terms_field, true),
        //          '!c' => print_r($programme, true)),WATCHDOG_DEBUG);

        // It's a multivalue field, so we scan all the values
        foreach ($taxonomy_terms as $field_value) {
            $tid_of_term_referenced_in_taxonomy_term_field = $field_value['tid'];

            //watchdog('musth_rules', 'W7D001 6171 (!i) (!c) ',
            //    array('!i' => print_r($tid_of_term_referenced_in_taxonomy_term_field, true),
            //          '!c' => print_r($programme->field_catalogue_no[LANGUAGE_NONE][0]['value'], true))WATCHDOG_DEBUG););

            // Updating the count of programmes where the term of tid $tid_of_term_referenced_in_taxonomy_term_field appears
            if (isset($terms_and_their_occurrences_in_the_given_programme[$taxonomy_machine_name][$tid_of_term_referenced_in_taxonomy_term_field])) {
                $terms_and_their_occurrences_in_the_given_programme[$taxonomy_machine_name][$tid_of_term_referenced_in_taxonomy_term_field]++;
            } else {
                $terms_and_their_occurrences_in_the_given_programme[$taxonomy_machine_name][$tid_of_term_referenced_in_taxonomy_term_field] = 1;
            }

        }

    }

    return $terms_and_their_occurrences_in_the_given_programme;
}

/**
 * This function creates of updates the apes using the $taxonomy_tree_with_counts array where we have the
 * computed counts
 *
 * @attention This function doesn't delete any ape
 *
 * @param $taxonomy_tree_with_counts array The full taxonomy tree with the count of term occurrences in programmes
 * @param $taxonomies_we_create_apes_for array The usual array of taxonomies we are creating apes for
 * @param $media_type string 'video', 'audio' or 'library'
 * @return TRUE if successful, FALSE on error
 */
function musth_rules_create_or_update_apes($taxonomy_tree_with_counts, $taxonomies_we_create_apes_for, $media_type) {

    // Let's recall what we have in $taxonomy_tree_with_counts
    // It's an array with first index the taxonomy machine name, second, the term tid, then these fields:
    // 'order' => $term_order_no,
    // 'label' => $term_name,
    // 'programmes_count' => <now here we have the actual count of occurrences,
    // 'programme_nids_list' => array(),
    // 'hierarchy_depth' => $term_hierarchy_depth,
    // 'parent_tid' => $term_parent);

    foreach($taxonomies_we_create_apes_for as $taxonomy_machine_name) {

        // The name of the ape related to the current taxonomy
        $name_of_ape = 'ape_' . $taxonomy_machine_name;

        //watchdog('musth_rules', 'W7D001 6767 (!i) (!t) ',
        //    array('!i' => print_r($taxonomy_machine_name, true), '!t' => print_r($name_of_ape, true)),
        //          WATCHDOG_DEBUG);

        // Scanning the entire tree
        foreach($taxonomy_tree_with_counts[$taxonomy_machine_name] as $term_tid => $term_fields) {

            //watchdog('musth_rules', 'W7D001 QVGB (!i) (!t) ',
            //    array('!i' => print_r($term_tid, true), '!t' => print_r($term_fields, true)),
            //    WATCHDOG_DEBUG);

            // If a term has programmes_count zero, it means that it appears in no programmes
            // We don't create an ape

            if ($term_fields['programmes_count'] == 0) continue;

            // I have to see if an ape exists for the current term, whose tid is $term_tid

            // I have to check for exceptions because otherwise I end up creating apes when something
            // went wrong and I shouldn't

            try {
                $query = new EntityFieldQuery();
                $nids_of_found_apes = $query->entityCondition('entity_type', $name_of_ape)
                    ->entityCondition('bundle', $name_of_ape)
                    ->fieldCondition('field_tid', 'value', $term_tid, '=')
                    ->fieldCondition('field_media_type', 'value', $media_type, '=')
                    ->execute();
            }
            catch (Exception $e) {
                watchdog('musth_rules', 'W3E005 Error in checking if an ape already exists. Error message: (!e)',
                        array('!e' => print_r($e->getMessage(), true)),
                        WATCHDOG_ERROR);
                // Get out of here!
                return FALSE;
            }

            if (isset($nids_of_found_apes[$name_of_ape])) {
                // There is an ape for the current term. We have only to modify it

                // Actually $nids_of_ape_already_existing_about_our_term is supposed to contain one nid only
                // despite being an array
                $nids_of_ape_already_existing_about_our_term = array_keys($nids_of_found_apes[$name_of_ape]);
                $ape_as_array = entity_load($name_of_ape, $nids_of_ape_already_existing_about_our_term);

                // Here I skip exception handling because I did it for the query above. I don't
                // want to do exception handling for everything, it slows down execution

                // Now modifying the ape and saving it

                $ape_to_change = $ape_as_array[$nids_of_ape_already_existing_about_our_term[0]];

                $ape_to_change->field_order = array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['order'])));
                $ape_to_change->field_label = array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['label'])));
                $ape_to_change->field_tid = array(LANGUAGE_NONE => array(0 => array('value' => $term_tid)));
                // Actually media type doesn't change but we confirm it just in case
                $ape_to_change->field_media_type = array(LANGUAGE_NONE => array(0 => array('value' => $media_type)));
                $ape_to_change->field_programmes_count =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['programmes_count'])));
                $ape_to_change->field_programme_nids_list[LANGUAGE_NONE] = array();
                foreach($term_fields['programme_nids_list'] as $programme_nid) {
                    $ape_to_change->field_programme_nids_list[LANGUAGE_NONE][] = array('value' => $programme_nid);
                }
                $ape_to_change->field_hierarchy_depth =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['hierarchy_depth'])));
                $ape_to_change->field_parent_tid =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['parent_tid'])));

                $ape_to_change->save();

                //watchdog('musth_rules', 'W7D001 7YGQ modifying ape (!i) (!t) ',
                //    array('!i' => print_r($term_tid, true), '!t' => print_r($ape_to_change, true)),
                //    WATCHDOG_DEBUG);

            } else {

                // No ape has been found for this term. Let's create it

                // field_label
                // field_tid
                // field_programmes_count
                // field_hierarchy_depth
                // field_parent_tid
                // field_programme_nids_list

                // 'order' => $term_order_no,
                // 'label' => $term_name,
                // 'programmes_count' => <now here we have the actual count of occurrences,
                // 'programme_nids_list' => array(),
                // 'hierarchy_depth' => $term_hierarchy_depth,
                // 'parent_tid' => $term_parent);

                // Creating and saving the ape

                $entity = entity_create($name_of_ape, array('type' => $name_of_ape));
                $entity->field_order = array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['order'])));
                $entity->field_label = array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['label'])));
                $entity->field_tid = array(LANGUAGE_NONE => array(0 => array('value' => $term_tid)));
                $entity->field_media_type = array(LANGUAGE_NONE => array(0 => array('value' => $media_type)));
                $entity->field_programmes_count =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['programmes_count'])));
                $entity->field_programme_nids_list[LANGUAGE_NONE] = array();
                foreach($term_fields['programme_nids_list'] as $programme_nid) {
                    $entity->field_programme_nids_list[LANGUAGE_NONE][] = array('value' => $programme_nid);
                }
                $entity->field_hierarchy_depth =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['hierarchy_depth'])));
                $entity->field_parent_tid =
                    array(LANGUAGE_NONE => array(0 => array('value' => $term_fields['parent_tid'])));

                $entity->save();

                //watchdog('musth_rules', 'W7D001 OGFR creating ape (!i) (!t) ',
                //    array('!i' => print_r($name_of_ape, true), '!t' => print_r($entity, true)),
                //    WATCHDOG_DEBUG);

            }

        }

    }

    return TRUE;
}

/**
 * If there is at least one programme for a given media type, it means that the media type is
 * valid. It's invalid otherwise.
 *
 * @param $media_type string Media type we want to answer the question for
 * @return bool TRUE (>0) if there is at least one programme for the given media type
 */
function musth_rules_check_if_there_is_at_least_one_programme_for_the_given_media_type($media_type) {

    // To check if there is at least one programme of the given media type
    // we have to check if the catalogue no prefix starts with 'V' for videos or 'A'
    // for audios

    $media_type_to_prefix = array( 'video'    => 'V',
                                   'audio'    => 'A',
                                   'library'  => 'L',
                                   'partners' => 'P' );

    // If we are given an invalid media type, we return 0

    if (isset($media_type_to_prefix[$media_type]))
        $media_type_prefix = $media_type_to_prefix[$media_type];
    else
        return 0;

    // There is no condition like entityCondition('bundle', 'programme') here
    // because we search for any node that has a field_system_title field
    // whose value begins with the media prefix letter corresponding to
    // the given media type

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'node')
        ->propertyCondition('status', 1)   // only published "programmes"
        ->fieldCondition('field_system_title', 'value', $media_type_prefix, 'STARTS_WITH')
        ->count()
        ->execute();

    //watchdog('musth_rules', 'W7D001 7QFG check_if_there_is_at_least_one_programme_for_the_given_media_type (!c) (!m) ',
    //    array('!c' => print_r($result, true),
    //          '!m' => print_r($media_type, true)),
    //    WATCHDOG_DEBUG);

    return $result;
}