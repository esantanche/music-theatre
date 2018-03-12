<?php
/**
 * @file musth_rules.programmes_sitemap_generation.inc
 *
 * @brief This action creates the sitemap that lists the urls of all programmes
 *
 * @ingroup musthrules
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 22/04/14
 * Time: 18:19
 */

/**
 * You find this action in Configuration->Workflow->Rules->Components.
 *
 * This action scan all programmes and produces the sitemap that tells
 * serch engines about our programmes.
 *
 * We have four types of programmes:
 *
 * * Video ('V')
 * * Audio ('A')
 * * Library ('L')
 * * Partner ('P')
 *
 * This action generates urls for all of them.
 *
 * The generated sitemap will be here: /backend/sites/default/files/sitemap_programmes.xml
 *
 * You will have to gzip it and move it to: /frontends/angular/app
 *
 * It's final filename will be: sitemap_programmes.xml.gz
 *
 * This sitemap is one of the two we use.
 *
 * You find them listed in: /frontends/angular/app/sitemap.xml
 *
 * This action should be run, and the sitemap update, every time a new programme
 * is added. In practice once a month will be fine.
 *
 * @param $settings array Ignored
 * @return bool TRUE on success
 */
function musth_rules_action_programmes_sitemap_generation($settings) {

    //watchdog('musth_rules', 'W7D001 ATGFT musth_rules_action_products_creation (!s)',
    //    array('!s' => print_r($settings, true)),
    //    WATCHDOG_DEBUG);

    // We want to generate a sitemap where there are the urls of all programmes
    // We have these four types of programme:
    // * Video ('V')
    // * Audio ('A')
    // * Library ('L')
    // * Partner ('P')

    $media_prefixes = array( 'V', 'A', 'L', 'P' );

    // $sitemap_content_string will be the sitemap
    $sitemap_content_string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

    foreach ($media_prefixes as $media_prefix) {

        // Now we load all programmes of the type given by $media_prefix

        $query = new EntityFieldQuery();
        $result = $query->entityCondition('entity_type', 'node')
            ->propertyCondition('status', 1)   // only published programmes
            ->fieldCondition('field_system_title', 'value', $media_prefix, 'STARTS_WITH')
            ->execute();

        if (isset($result['node'])) {
            $programmes_nids = array_keys($result['node']);

            // Loading the actual programmes, all of them
            $programmes = entity_load('node', $programmes_nids);
        } else {
            // No programmes? Something is wrong!

            watchdog('musth_rules', 'W3E366 No programmes found for the given media type',
            array(),
            WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

        // Now scanning each programme of the current media type
        foreach ($programmes as $programme) {

            // If a programme has no display title, there is a bug somewhere or someone forgot
            // to enter it. We ignore the programme

            if (isset($programme->field_display_title[LANGUAGE_NONE]))
                $display_title = $programme->field_display_title[LANGUAGE_NONE][0]['value'];
            else
                continue;

            // Same thing if the display title is empty

            if (empty($display_title))
                continue;

            // Now we generate the url for the programme
            // Something like http://musictheatre.tv/en/v/26/Donizetti-s-Don-Pasquale-at-Ravenna-Festival

            $programme_url = musth_rules_generate_url_for_programme($media_prefix, $programme->nid, $display_title);

            // Now we generate the part of the sitemap that relates to the current programme

            $sitemap_content_string .= "   <url>\n";

            $sitemap_content_string .= "      <loc>" . $programme_url . "</loc>\n";

            $date = new DateTime();
            $date->setTimestamp($programme->changed);
            $sitemap_content_string .= "      <lastmod>" . $date->format('Y-m-d\TH:i:sP') . "</lastmod>\n";

            $sitemap_content_string .= "   </url>\n";

            //            watchdog('musth_rules', 'W7D001 9in9ijn musth_rules_action_programmes_sitemap_generation (!i) (!t) ',
            //                array('!i' => print_r($programme_url, true), '!t' => print_r($display_title, true)),
            //                WATCHDOG_DEBUG);

        }

    }

    $sitemap_content_string .= "</urlset>\n";

    // You find the created sitemap here:
    // /backend/sites/default/files/sitemap_programmes.xml
    // You have to gzip it and move it to:
    // /frontends/angular/app
    // Its name will be sitemap_programmes.xml.gz after zipping

    file_save_data($sitemap_content_string, 'public://sitemap_programmes.xml', FILE_EXISTS_REPLACE);

    return TRUE;
}

/**
 * This function composes the url of a programme.
 *
 * It composes it in the same way Angular does in make_programme_permalink, permalinkhelperService.js
 *
 * Any change to the function make_programme_permalink should be reflected here.
 *
 * @param $media_prefix string It's the type of programme ('V', 'A', 'L', 'P')
 * @param $nid int Programme's node id
 * @param $display_title string Programme's display title
 * @return bool TRUE on success
 */
function musth_rules_generate_url_for_programme($media_prefix, $nid, $display_title) {

    // Replacing strange chars with '-' in display title
    $cleaned_display_title = preg_replace('/[\s\._~:\/\?#\[\]@!\$&\'\(\)\*\+,;=]/', '-', $display_title);

    // Removing multiple consecutive occurrences of '-'
    $cleaned_display_title = preg_replace('/-+/', '-', $cleaned_display_title);

    // Removing trailing '-'
    $cleaned_display_title = preg_replace('/-$/', '', $cleaned_display_title);

    $programme_url = 'http://musictheatre.tv/en/' . strtolower($media_prefix) . '/' . $nid . '/' . $cleaned_display_title;

    return $programme_url;
}