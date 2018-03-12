<?php

/**
 * @file musth_rules.credits_apes_build.inc
 *
 * @brief Here there are the actions used to build or refresh
 * the apes that are created from the credits lists
 *
 * Precisely, the apes created here are related to these types of credits:
 * - Composer
 * - Conductor
 * - Performer
 * - Ensemble
 * - Venue
 *
 * Glossary:
 * - A <b>credits type</b> is one of Composer, Conductor, Performer, Ensemble or Venue
 * - A <b>credits element</b> is an actual composer, conductor etc. It's the actual person or organisation
 *
 * This .inc file doesn't include the actions that reset the apes by deleting them all.
 * These latter actions are in an another .inc @see musth_rules.credit_apes_reset.inc
 *
 * @ingroup musthrules
 */

/**
 * Building or updating the credits lists apes
 *
 * We have to create or update apes for the credits types whose names
 * are in the variable $credit_types_we_create_apes_for
 *
 * This action has to be called for both media type, 'video' and 'audio'.
 *
 * It will create (or update) apes related to video or audio programmes, but not both at the same time.
 * It has to be called twice, one time to create apes for video programmes and one time to
 * create apes for audio programmes.
 *
 * This function is going to do the job for all credits types
 *
 * @attention This function won't delete apes related to credits elements that have been deleted or that
 * don't appear in programmes any more. Maybe we want to do this as well later on.
 *
 * @param[in] $settings The action configuration settings, not used
 * @return TRUE or FALSE on exception
 */
function musth_rules_action_apes_building_credits($media_type) {

    //watchdog('musth_rules', 'W7D001   rules_action_apes_building_genre (!s)',
    //    array('!s' => print_r($settings, true)),
    //    WATCHDOG_DEBUG);

    $media_type_is_valid = musth_rules_check_if_there_is_at_least_one_programme_for_the_given_media_type($media_type);

    if (!$media_type_is_valid) {

        watchdog('musth_rules', 'W3E093 Media type not valid. Media type: (!m)',
            array('!m' => print_r($media_type, true)),
            WATCHDOG_ERROR);

        return FALSE;
    }

    /**
     * These are the fields an ape contains
     * field_label: The name of the credits element the ape is about
     * field_nid: The nid of the credits element
     * field_programmes_count: The number of programmes the credits element appears
     * field_programme_nids_list: List of the nids of the programmes that contain the credits element.
     * It's a multivalued field
     *
     * Now there is also the field field_media_type to differentiate apes that are about
     * video programmes from those that are about audio programmes.
     */

    // We have to create apes for these credits types
    $credit_types_we_create_apes_for = array('Composer', 'Conductor', 'Performer', 'Ensemble', 'Venue');

    // Step 1 Counting credits element occurrences
    // We scan the credits elements and count how many times they appear in programmes

    $credit_elements_with_count = musth_rules_programmes_scan_credits_variant($media_type);

    //watchdog('musth_rules', 'W7D001 1LAS $credit_elements_with_count (!s)',
    //    array('!s' => print_r($credit_elements_with_count, true)),
    //    WATCHDOG_DEBUG);

    // Step 2 Create or update the apes
    // Now we have the count of the occurrences of every credits element in programmes
    // We proceed with creating or updating the apes

    musth_rules_create_or_update_credit_apes($credit_elements_with_count, $credit_types_we_create_apes_for, $media_type);

    /**
     * @attention We don't cleanup the apes related to credits elements
     * that no longer appear in any programme or that have been deleted
     * @attention LATER maybe we do it later. Now (2014-02-25 17:58) we will use the reset action to solve this sort of problems
     * @see musth_rules_action_apes_resetting_credits
     * @attention LATER if cleaning apes that are no longer used, refuse to delete more than 10 apes and raise an exception in such a case
     */

    return TRUE;
}

/**
 * This function scans every credits element to count how many times a credits element appears in programmes
 *
 * Only programmes of the given media type will be take into account.
 *
 * @attention I trust that the role title in the credits lists is one in $credit_types_we_create_apes_for.
 * Maybe we want to check it and throw an error
 *
 * @attention I am trusting every credits element with not appearing more than one time in a programme with the
 * same role title (like two times Stravinsky as conductor in the same programme).
 * Should I check it and throw an error?
 *
 * @param[in] $credit_types_we_create_apes_for Names of the credits types we have to look for in programmes
 * @return array credits elements with the count of their occurrences
 */
function musth_rules_programmes_scan_credits_variant($media_type) {

    // Now loading every field collection with bundle field_cast_crew_credits
    // They are the credits lists
    // We are loading every field collection, of type field_cast_crew_credits, related to every programme
    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'field_collection_item')
        ->entityCondition('bundle', 'field_cast_crew_credits')
        ->execute();

    // There should be a result
    if (isset($result['field_collection_item'])) {

        //watchdog('musth_rules', 'W7D001 6FCD musth_rules_programmes_scan (!i) (!t) ',
        //    array('!i' => print_r("ggg", true), '!t' => print_r($result['field_collection_item'], true)),
        //          WATCHDOG_DEBUG);

        // Actually loading the credits fields
        $credit_fields_eids = array_keys($result['field_collection_item']);
        $credit_field_entities = entity_load('field_collection_item', $credit_fields_eids);

        //watchdog('musth_rules', 'W7D001 T108 musth_rules_programmes_scan (!i) (!t) ',
        //    array('!i' => print_r($credit_field_entities[$credit_fields_eids[0]]->field_role_title, true),
        //          '!t' => print_r($credit_field_entities[$credit_fields_eids[0]]->field_person_or_organisation, true)),
        //    WATCHDOG_DEBUG);

        // $credit_field_entities should contain the credits fields, all of them
        // It can't be empty
        if (empty($credit_field_entities)) {

            watchdog('musth_rules', 'W3E007 Empty credits lists, something is wrong!',
                array(),
                WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

    } else {
        // No credits lists? Something is wrong!

        watchdog('musth_rules', 'W3E008 No result from EFQ used to get all credits elements',
            array(),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    // Going to do the actual count of occurrences
    $credit_elements_with_count =
        musth_rules_scan_credit_field_entities_and_count_their_occurrences($credit_field_entities, $media_type);

    //watchdog('musth_rules', 'W7D001 6767 $credit_elements_with_count (!t) ',
    //    array('!i' => print_r(0, true),
    //        '!t' => print_r($credit_elements_with_count, true)),
    //    WATCHDOG_DEBUG);

    return $credit_elements_with_count;
}

/**
 * This function scans all credits elements to count their occurrences in programmes
 *
 * Only programmes of the given media type will be take into account.
 *
 * @param $credit_field_entities array The array of all field collection entities whose bundle is 'field_cast_crew_credits'
 * It's the full set of credits we have to scan
 * @param $media_type string 'video' or 'audio'
 * @return array credits elements and the number of their occurrences in programmes
 */
function musth_rules_scan_credit_field_entities_and_count_their_occurrences($credit_field_entities, $media_type) {

    // This array is going to contain the result
    // It will be indexed first by the credits type,
    // second by the nid of the credits element.
    // Every its element will have three fields:
    // 'label' => credits element name
    // 'programmes_count' => The number of programmes the credits element appears in
    // 'programme_nids_list' => List of the nids of the programmes that contain the credits element
    $credit_elements_with_count = array();

    foreach($credit_field_entities as $credit_field_entity) {

        // $credit_field_entity is our individual credits field
        // We want to know if the programme it's related to is published or not

        // We get the programme the credits field is associated to
        $host_programme = $credit_field_entity->hostEntity();

        // We don't want programmes that are not actually programmes
        // It may happen that the current $credit_field_entity is attached to
        // a host entity that is not a programme

        if ($host_programme->type != 'programme') continue;

        // We get the status of that programme (status = true if the programme is published)
        $host_programme_is_published = $host_programme->status;

        // Ignore the credits field if its programme is unpublished
        // We don't want to consider credits from programmes that are not published
        if (!$host_programme_is_published) continue;

        $programme_system_title_field = $host_programme->field_system_title;

        if (isset($programme_system_title_field[LANGUAGE_NONE])) {

            $programme_system_title = $programme_system_title_field[LANGUAGE_NONE][0]['value'];

            if ($programme_system_title[0] == 'V')
                $programme_media_type = 'video';
            elseif ($programme_system_title[0] == 'A')
                $programme_media_type = 'audio';
            else
                $programme_media_type = 'undef';

        } else {
            $programme_media_type = 'undef';
        }

        // Ignoring programmes that aren't of our given media type
        if ($programme_media_type != $media_type) continue;

        $field_role_title = $credit_field_entity->field_role_title;
        $field_person_or_organisation = $credit_field_entity->field_person_or_organisation;

        //watchdog('musth_rules', 'W7D001 67CF credit_field_entity (!i) (!t) ',
        //    array('!i' => print_r($credit_field_entity->item_id, true),
        //        '!t' => print_r($credit_field_entity, true)),
        //    WATCHDOG_DEBUG);

        // Sometimes the fields field_role_title or field_person_or_organisation are empty
        // It happens when the editor leaves an empty field at the end of the credits list
        // We filter these empty fields out
        if (!isset($field_role_title[LANGUAGE_NONE]) or !isset($field_person_or_organisation[LANGUAGE_NONE])) continue;

        /**
         * These are the fields an ape contains
         * field_label: The name of the credits element the ape is about
         * field_nid: The nid of the credits element
         * field_programmes_count: The number of programmes the credits element appears
         * field_programme_nids_list: List of the nids of the programmes that contain the credits element.
         * It's a multivalued field
         *
         * Now there is also the field field_media_type to differentiate apes that are about
         * video programmes from those that are about audio programmes.
         */

        $credit_element_role_title = $field_role_title[LANGUAGE_NONE][0]['value'];
        $credit_element_person_or_organisation_nid = $field_person_or_organisation[LANGUAGE_NONE][0]['target_id'];

        //watchdog('musth_rules', 'W7D001 8156 credit_field_entity (!i) (!t) ',
        //    array('!i' => print_r($credit_element_role_title, true),
        //          '!t' => print_r($credit_element_person_or_organisation_nid, true)),
        //    WATCHDOG_DEBUG);

        // I am trusting the role title to be one in $credit_types_we_create_apes_for
        // maybe we want to check it (I put an 'attention' above)

        if (isset($credit_elements_with_count[$credit_element_role_title][$credit_element_person_or_organisation_nid])) {
            // We already found occurrences of this credits element
            // We just increment by one the number of occurrences and we add the programme nid to the list
            // of the nids of the programmes where the credits element appears

            $host_programme_nid = $host_programme->nid;

            $programme_nids_list =
                $credit_elements_with_count[$credit_element_role_title][$credit_element_person_or_organisation_nid]['programme_nids_list'];

            // This is to improve performances because isset() is faster than in_array()
            // Actually in this case there isn't so much improvement
            $associative_programme_nids_list = array_combine($programme_nids_list, $programme_nids_list);

            // Now imagine that we already found this person with the same role title in the same programme
            // We don't want to count him twice. There shouldn't be such duplications, but we are filtering them away silently
            if (!isset($associative_programme_nids_list[$host_programme_nid])) {

                $credit_elements_with_count[$credit_element_role_title][$credit_element_person_or_organisation_nid]['programmes_count']++;
                $credit_elements_with_count[$credit_element_role_title][$credit_element_person_or_organisation_nid]['programme_nids_list'][] =
                    $host_programme_nid;

            }

        } else {
            // It's the first time that we find an occurrence of this credits element
            // We have to create its position in the array $credit_elements_with_count and
            // fill in these fields:
            // 'label' => credits element name
            // 'programmes_count' => The number of programmes the credits element appears in
            // 'programme_nids_list' => List of the nids of the programmes that contain the credits element

            // We retrieve the display name of the person or organization, that is the name we have to put
            // in the field 'label'

            $credit_element_label = musth_helper_functions_get_label_for_credit_element($credit_element_person_or_organisation_nid,
                $credit_element_role_title, TRUE);

            // We initialise the position related to the credits element with the label, a programmes count set to 1
            // and a programme nids list with the only programme we have found the credits element in until now
            $credit_elements_with_count[$credit_element_role_title][$credit_element_person_or_organisation_nid] = array(
                'label' => $credit_element_label,
                'programmes_count' => 1,
                'programme_nids_list' => array($host_programme->nid)
            );

            //watchdog('musth_rules', 'W7D001 0CDS credit_element (!i) (!t) ',
            //    array('!i' => print_r($credit_element_person_or_organisation_nid, true),
            //        '!t' => print_r($credit_element_label, true)),
            //    WATCHDOG_DEBUG);

        }

    } // end of foreach($credit_field_entities as $credit_field_entity)

    return $credit_elements_with_count;
}

/**
 * This function creates of updates the apes using the $credit_elements_with_count array where we have the
 * computed counts
 *
 * @attention This function doesn't delete any ape
 *
 * Only apes of the given media type will considered for update or creation
 *
 * @param $credit_elements_with_count array The full list of credits elements with the count
 * of their occurrences in programmes
 * @param $credit_types_we_create_apes_for array The usual array of credits type we are creating apes for
 * @param $media_type 'video' or 'audio'
 * @return TRUE if successful, FALSE on error
 */
function musth_rules_create_or_update_credit_apes($credit_elements_with_count, $credit_types_we_create_apes_for, $media_type) {

    // Let's recall what we have in $credit_elements_with_count
    // It will be indexed first by the credits type,
    // second by the nid of the credits element.
    // Every its element will have three fields:
    // 'label' => credits element name
    // 'programmes_count' => The number of programmes the credits element appears in
    // 'programme_nids_list' => List of the nids of the programmes that contain the credits element

    // The apes have the following fields:
    // field_label the display label
    // field_nid the nid of the node containing the credits element
    // field_programmes_count number of occurrences of the credits element in programmes
    // field_programme_nids_list list of the nids of the programmes where the credits element appears

    // Now there is also the field field_media_type to differentiate apes that are about
    // video programmes from those that are about audio programmes.

    foreach($credit_types_we_create_apes_for as $credit_type) {

        // The name of the ape related to the current credits type
        // The credits type has its first letter uppercase, we make it lowercase
        // to match the ape name
        $name_of_ape = 'ape_' . strtolower($credit_type);

        //watchdog('musth_rules', 'W7D001 6767 (!i) (!t) ',
        //    array('!i' => print_r($taxonomy_machine_name, true), '!t' => print_r($name_of_ape, true)),
        //          WATCHDOG_DEBUG);

        // Ignore a credit type if we have no credit elements for it

        if (!isset($credit_elements_with_count[$credit_type])) continue;

        // Scanning the $credit_elements_with_count array for the given credits type
        foreach($credit_elements_with_count[$credit_type] as $credit_element_nid => $credit_element_fields) {

            //watchdog('musth_rules', 'W7D001 QVGB (!i) (!t) ',
            //    array('!i' => print_r($term_tid, true), '!t' => print_r($term_fields, true)),
            //    WATCHDOG_DEBUG);

            // If a credits element has programmes_count zero, it means that it appears in no programmes
            // We don't create an ape

            if ($credit_element_fields['programmes_count'] == 0) continue;

            // I have to see if an ape exists for the current credits element, whose nid is $credit_element_nid

            // I have to check for exceptions because otherwise I end up creating apes when something
            // went wrong and I shouldn't

            try {
                $query = new EntityFieldQuery();
                $eids_of_found_apes = $query->entityCondition('entity_type', $name_of_ape)
                    ->entityCondition('bundle', $name_of_ape)
                    ->fieldCondition('field_nid', 'value', $credit_element_nid, '=')
                    ->fieldCondition('field_media_type', 'value', $media_type, '=')
                    ->execute();
            }
            catch (Exception $e) {
                watchdog('musth_rules', 'W3E011 Error in checking if an ape already exists. Error message: (!e)',
                        array('!e' => print_r($e->getMessage(), true)),
                        WATCHDOG_ERROR);
                // Get out of here!
                return FALSE;
            }

            if (isset($eids_of_found_apes[$name_of_ape])) {
                // There is an ape for the current credits element. We have only to modify it

                // Actually $eids_of_ape_already_existing_about_our_credit_element is supposed to contain one eid only
                // despite being an array
                $eids_of_ape_already_existing_about_our_credit_element = array_keys($eids_of_found_apes[$name_of_ape]);
                $ape_as_array = entity_load($name_of_ape, $eids_of_ape_already_existing_about_our_credit_element);

                // Here I skip exception handling because I did it for the query above. I don't
                // want to do exception handling for everything, it slows down execution

                // Now modifying the ape and saving it

                $ape_to_change = $ape_as_array[$eids_of_ape_already_existing_about_our_credit_element[0]];

                $ape_to_change->field_label = array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_fields['label'])));
                $ape_to_change->field_nid = array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_nid)));
                // Actually media type doesn't change but we confirm it just in case
                $ape_to_change->field_media_type = array(LANGUAGE_NONE => array(0 => array('value' => $media_type)));
                $ape_to_change->field_programmes_count =
                    array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_fields['programmes_count'])));
                $ape_to_change->field_programme_nids_list[LANGUAGE_NONE] = array();
                foreach($credit_element_fields['programme_nids_list'] as $programme_nid) {
                    $ape_to_change->field_programme_nids_list[LANGUAGE_NONE][] = array('value' => $programme_nid);
                }

                $ape_to_change->save();

                //watchdog('musth_rules', 'W7D001 7YGQ modifying ape (!i) (!t) ',
                //    array('!i' => print_r($credit_element_nid, true),
                //          '!t' => print_r($ape_to_change, true)),
                //    WATCHDOG_DEBUG);

            } else {

                // No ape has been found for this term. Let's create it

                // Creating and saving the ape

                $entity = entity_create($name_of_ape, array('type' => $name_of_ape));
                $entity->field_label = array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_fields['label'])));
                $entity->field_nid = array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_nid)));
                $entity->field_media_type = array(LANGUAGE_NONE => array(0 => array('value' => $media_type)));
                $entity->field_programmes_count =
                    array(LANGUAGE_NONE => array(0 => array('value' => $credit_element_fields['programmes_count'])));
                $entity->field_programme_nids_list[LANGUAGE_NONE] = array();
                foreach($credit_element_fields['programme_nids_list'] as $programme_nid) {
                    $entity->field_programme_nids_list[LANGUAGE_NONE][] = array('value' => $programme_nid);
                }

                $entity->save();

                //watchdog('musth_rules', 'W7D001 1LAM creating ape (!i) (!t) ',
                //    array('!i' => print_r($name_of_ape, true), '!t' => print_r($entity, true)),
                //    WATCHDOG_DEBUG);

            }

        }

    }

    return TRUE;
}
