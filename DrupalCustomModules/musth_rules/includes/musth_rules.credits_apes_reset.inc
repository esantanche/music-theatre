<?php

/**
 * @file musth_rules.credits_apes_reset.inc
 *
 * @brief Here there are the actions used to reset
 * the apes that are created from the credits lists
 *
 * Precisely, the apes that we reset here are related to the credits types:
 * - Composer
 * - Conductor
 * - Performer
 * - Ensemble
 * - Venue
 *
 * This .inc file doesn't include the actions that build or refresh the apes
 * These latter actions are in an another .inc file @see musth_rules.credits_apes_build.inc
 *
 * @ingroup musthrules
 */

/**
 * Resetting the credits apes
 *
 * This function deletes all the apes that have been created for the credits elements
 *
 * It will delete all apes related to video or audio programmes, but not both at the same time.
 * It has to be called twice, one time to delete all apes for video programmes and one time to
 * delete all apes for audio programmes.
 *
 * @param[in] Settings (not used)
 * @return TRUE if successful, FALSE otherwise
 */
function musth_rules_action_apes_resetting_credits($media_type) {

    $media_type_is_valid = musth_rules_check_if_there_is_at_least_one_programme_for_the_given_media_type($media_type);

    if (!$media_type_is_valid) {

        watchdog('musth_rules', 'W3E093 Media type not valid. Media type: (!m)',
            array('!m' => print_r($media_type, true)),
            WATCHDOG_ERROR);

        return FALSE;

    }

    // The credits types we work on
    $credit_types_we_work_on = array('Composer', 'Conductor', 'Performer', 'Ensemble', 'Venue');

    foreach($credit_types_we_work_on as $credit_type_we_work_on) {

        // The name of the ape related to the current credits type
        // The credits type has its first letter uppercase, we make it lowercase
        // to match the ape name
        $name_of_ape = 'ape_' . strtolower($credit_type_we_work_on);

        // Loading every existing ape for the current taxonomy ($taxonomy_we_have_apes_for)
        // Taking into account that we have to consider only apes that are about the
        // given media type

        try {
            $query = new EntityFieldQuery();
            $nids_of_found_apes = $query->entityCondition('entity_type', $name_of_ape)
                ->entityCondition('bundle', $name_of_ape)
                ->fieldCondition('field_media_type', 'value', $media_type, '=')
                ->execute();
        }
        catch (Exception $e) {
            watchdog('musth_rules', 'W3E012 Error in loading every ape nid for a credits type. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);
            // Get out of here!
            return FALSE;
        }

        //watchdog('musth_rules', 'W7D001 6543 tax nids (!t) (!n) ',
        //    array('!t' => print_r($taxonomy_we_have_apes_for, true),
        //          '!n' => print_r($nids_of_found_apes, true)), WATCHDOG_DEBUG);

        // Are there any apes for the current credits type?
        if (isset($nids_of_found_apes[$name_of_ape])) {
            $apes_nids = array_keys($nids_of_found_apes[$name_of_ape]);

            //watchdog('musth_rules', 'W7D001 5TGB eps nids (!t) (!n) ',
            //     array('!t' => print_r($taxonomy_we_have_apes_for, true),
            //         '!n' => print_r($apes_nids, true))WATCHDOG_DEBUG);

            // Delete all of them
            entity_delete_multiple($name_of_ape, $apes_nids);

        } else {
            // No ape found. It may be that there are no apes and this function has been run by mistake
            // We emit a notice about it anyway
            watchdog('musth_rules', 'W5N002 No apes to delete. credits type: (!t)',
                array('!t' => print_r($credit_type_we_work_on, true)),
                WATCHDOG_NOTICE);
        }

    }

    return TRUE;
}
