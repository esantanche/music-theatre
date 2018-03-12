<?php

/**
 * @file musth_rules.taxonomy_apes_reset.inc
 *
 * @brief Here there are the actions used to reset
 * the apes that are created from the existing non-credit taxonomies
 *
 * Precisely, the apes that we reset here are related to the taxonomies:
 * - Genre
 * - Form
 * - Period
 * - Instrument
 * - Film type
 * - Type (Library item type, article, synopsis, biography)
 *
 * This .inc file doesn't include the actions that build or refresh the apes
 * These latter actions are in an another .inc file @see musth_rules.taxonomy_apes_build.inc
 *
 * @ingroup musthrules
 */

/**
 * Resetting the taxonomy apes
 *
 * This function deletes all the apes that have been created for taxonomy terms
 *
 * @todo update for partners
 *
 * This action has to be called for all three media types, 'video', 'audio' and 'library'.
 *
 * It will delete all apes related to video, audio or library programmes, but not all at the same time.
 * It has to be called three times, a time to delete all apes for video programmes, a time to
 * delete all apes for audio programmes and a time to delete all apes for library "programmes"
 *
 * @param[in] Settings (not used)
 * @param $media_type string 'video', 'audio' or 'library'
 * @return TRUE if successful, FALSE otherwise
 */
function musth_rules_action_apes_resetting_taxonomies($media_type) {

    $media_type_is_valid = musth_rules_check_if_there_is_at_least_one_programme_for_the_given_media_type($media_type);

    if (!$media_type_is_valid) {

        watchdog('musth_rules', 'W3E093 Media type not valid. Media type: (!m) ',
            array('!m' => print_r($media_type, true)),
            WATCHDOG_ERROR);

        return FALSE;

    }

    // The taxonomies we work on
    $taxonomies_we_have_apes_for = array('genre', 'form', 'period', 'instrument', 'film_type',
        'type', 'organisation_type', 'profession', 'voice');

    foreach($taxonomies_we_have_apes_for as $taxonomy_we_have_apes_for) {

        // The name of the ape related to the current taxonomy
        $name_of_ape = 'ape_' . $taxonomy_we_have_apes_for;

        // Loading every existing ape for the current taxonomy ($taxonomy_we_have_apes_for)
        // Filtering on media type
        try {
            $query = new EntityFieldQuery();
            $nids_of_found_apes = $query->entityCondition('entity_type', $name_of_ape)
                ->entityCondition('bundle', $name_of_ape)
                ->fieldCondition('field_media_type', 'value', $media_type, '=')
                ->execute();
        }
        catch (Exception $e) {
            watchdog('musth_rules', 'W3E006 Error in loading every ape nid for a taxonomy. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);
            // Get out of here!
            return FALSE;
        }

        //watchdog('musth_rules', 'W7D001 6543 tax nids (!t) (!n) ',
        //    array('!t' => print_r($taxonomy_we_have_apes_for, true),
        //          '!n' => print_r($nids_of_found_apes, true)), WATCHDOG_DEBUG);

        // Are there any apes for the current taxonomy?
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
            watchdog('musth_rules', 'W5N001 No apes to delete. Taxonomy: (!t)',
                array('!t' => print_r($taxonomy_we_have_apes_for, true)),
                WATCHDOG_NOTICE);
        }

    }

    return TRUE;
}
