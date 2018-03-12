<?php
/**
 * @file musth_rules.products_creation.inc
 *
 * @brief This rule creates commerce track products from tracks if they don't already exist
 *
 * @ingroup musthrules
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 22/04/14
 * Time: 18:19
 */

// Licenses durations

define('SHORT_LICENSE_DURATION', 2); // 2 days license

/**
 * This is the rule function. It creates commerce products from tracks
 *
 * What does it do?
 * - It loads every track id (tids)
 * - It loads and scans every track using the ids loaded in the previous step
 * - For each track, it loads the programme it belongs to and gets the programme's title
 * to make the product's title
 * - For each track, it decides which products to create that are associated to the track
 * - It creates the product if it doesn't exist yet
 *
 * For CDs it creates products for shipping and for downloading.
 * For video programmes it creates products only for streaming
 *
 * For video programmes, we make one license only using the duration SHORT_LICENSE_DURATION
 *
 * @attention There are problems with the multilingual title (title_field) that it's not fully
 * supported by Commerce. See the code.
 *
 * @param $settings array Ignored
 * @return bool TRUE on success
 */
function musth_rules_action_products_creation($settings) {

    //watchdog('musth_rules', 'W7D001 ATGFT musth_rules_action_products_creation (!s)',
    //    array('!s' => print_r($settings, true)),
    //    WATCHDOG_DEBUG);

    // Step 1 Loading the track ids (node ids) of all tracks

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'node')
        ->entityCondition('bundle', 'programme_track')
        ->propertyCondition('status', 1)   // only published tracks
        ->execute();

    if (isset($result['node'])) {
        $track_tids = array_keys($result['node']);
    } else {
        // No tracks? Something is wrong!
        watchdog('musth_rules', 'W3E043 No tracks found',
            array(),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    //watchdog('musth_rules', 'W7D001 8989 (!i) (!t) ',
    //    array('!i' => print_r($track_tids, true), '!t' => print_r(0, true)),
    //          WATCHDOG_DEBUG);

    // Step 2 Loading the actual track objects and taking one at a time of them
    // to determine which products we have to create from them

    $tracks = entity_load('node', $track_tids);

    foreach ($tracks as $track) {

        // For the current track, let's find the node id of the programme the track belongs to

        if (isset($track->field_programme[LANGUAGE_NONE])) {

            $associated_programme_nid = $track->field_programme[LANGUAGE_NONE][0]['target_id'];

        } else {

            watchdog('musth_rules', 'W3E046 We discovered a track that doesnt belong to any programme (!t) ',
                array('!t' => print_r($track, true)),
                WATCHDOG_ERROR);

            return FALSE;
        }

        // For the current track, we load the programme the track belongs to

        $programme_as_array = entity_load('node', array($associated_programme_nid));

        if (empty($programme_as_array)) {

            watchdog('musth_rules', 'W3E047 Cant load a programme that should exist (!p) (!t) ',
                array('!p' => print_r($associated_programme_nid, true),
                    '!t' => print_r($track, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

        $programme = $programme_as_array[$associated_programme_nid];

        // Getting the programme's title we will use to compose the product's title

        if (isset($programme->field_display_title[LANGUAGE_NONE])) {
            $programme_title_to_use = $programme->field_display_title[LANGUAGE_NONE][0]['value'];
        } else {
            $programme_title_to_use = $programme->title;
        }

        // Getting the track's catalogue no

        $missing_or_empty_catalogue_no = true;

        if (isset($track->field_catalogue_no[LANGUAGE_NONE])) {
            $catalogue_no = $track->field_catalogue_no[LANGUAGE_NONE][0]['value'];
            if ($catalogue_no)
                $missing_or_empty_catalogue_no = false;
        }

        if ($missing_or_empty_catalogue_no) {
            watchdog('musth_rules', 'W3E044 Missing or empty catalogue no (!t) ',
                array('!t' => print_r($track, true)),
                WATCHDOG_ERROR);

            // We don't create the track product if the catalogue no is missing or empty
            continue;
        }

        // Getting the programme's media type, 'video' or 'audio'
        // We do it by checking the first letter of the catalogue no

        $media_types = array( 'V' => 'video',
                              'A' => 'audio' );

        if (isset($media_types[$catalogue_no[0]])) {

            $programme_media_type = $media_types[$catalogue_no[0]];

        } else {

            // We have a programme with no media type. It shouldn't happen

            watchdog('musth_rules', 'W3E091 We found a programme with no media type (!p) ',
                array('!p' => print_r($programme, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            return FALSE;
        }

        // Now determining how many products we have to create and their SKUs

        $skus_of_products_to_be_created = array();

        if ($programme_media_type == 'video') {
            // It's a video programme. We have to create the product for online streaming
            // It's a product with a license lasting for SHORT_LICENSE_DURATION days

            $skus_of_products_to_be_created[] = $catalogue_no . '-S-e' .
                sprintf("%02d", SHORT_LICENSE_DURATION) . 'd';

        } else {

            // It's an audio programme. We have to create a product for shipping and one
            // for downloading

            if (substr($catalogue_no, 5, 4) == '0000') {
                // The current track refers to the entire CD
                // So, we can ship it (We can't ship individual tracks)

                // So, let's add to our list of products to be created the one that
                // refers to the shipping of the CD

                $skus_of_products_to_be_created[] = $catalogue_no . '-P';
            }

            // The entire CD as well as its tracks and segments can be downloaded

            $skus_of_products_to_be_created[] = $catalogue_no . '-D';

            // If I sell a cd for shipping, does the customer get it for download as well?
            // Maybe yes, but we just sell it for shipping and the customer will get permission
            // to download it from the apis that compute permissions

        }

        // Now we create the products if they don't exist yet

        $track_product_title = $programme_title_to_use . ' - ' . $track->title;

        foreach ($skus_of_products_to_be_created as $sku_of_product_to_be_created) {

            if (!musth_rules_create_product_if_it_doesnt_exist($sku_of_product_to_be_created,
                $track_product_title, $track->nid, $programme_media_type)) {

                watchdog('musth_rules', 'W3E092 Something went wrong when creating products from tracks (!s) ',
                    array('!s' => print_r($sku_of_product_to_be_created, true)),
                    WATCHDOG_ERROR);

                return FALSE;
            }

        }

    } // end of foreach ($tracks as $track)

    return TRUE;
}

/**
 * This function creates a Commerce product if it doesn't exist yet.
 *
 * @param $sku string SKU of the product to be created
 * @param $track_product_title string Title to be given to the product to be created
 * @param $track_nid int Node id of the track the product refers to
 * @param $programme_media_type string 'video' or 'audio'
 * @return bool TRUE on success
 */
function musth_rules_create_product_if_it_doesnt_exist($sku, $track_product_title,
                                                        $track_nid, $programme_media_type) {

    // If the product already exists for the given SKU, we don't create it

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'commerce_product')
        ->propertyCondition('sku', $sku)
        ->execute();

    if (isset($result['commerce_product'])) {

        // Now we don't update the product if it exists

        return TRUE;

    }

    // We start creating the new product

    $new_product = commerce_product_new('track');

    // Giving the new product its SKU
    $new_product->sku = $sku;

    // We have to differentiate the product for downloading from the one for shipping
    // because they would have the same title otherwise

    if (substr($sku, -2) == '-P')
        $shipping_or_downloading_text = ' - Shipping';
    elseif (substr($sku, -2) == '-D')
        $shipping_or_downloading_text = ' - Downloading';
    else
        $shipping_or_downloading_text = '';

    // Giving the title
    $new_product->title = $track_product_title . $shipping_or_downloading_text;

    // The product is active
    $new_product->status = 1;

    // Entity reference to the associated track
    $new_product->field_track =
        array(LANGUAGE_NONE => array(0 => array('target_id' => $track_nid)));

    // Price zero
    $new_product->commerce_price = array(LANGUAGE_NONE => array( 0 => array(
        'amount' => 0,
        'currency_code' => 'GBP',
    )));

    // Rules are allowed to update the price
    $new_product->field_rules_can_update_price =
        array(LANGUAGE_NONE => array(0 => array('value' => 1)));

    // Now the license fields

    // Video programmes need licenses, audio programmes don't

    // At a given point the license type became 'musth_license'. It was 'musth'

    if ($programme_media_type == 'video') {

        $new_product->commerce_license_type =
            array(LANGUAGE_NONE => array(0 => array('value' => 'musth_license')));

        // Two days license, duration in seconds
        $new_product->commerce_license_duration =
            array(LANGUAGE_NONE => array(0 => array('value' => (SHORT_LICENSE_DURATION * 86400))));

    }

    //watchdog('musth_rules', 'W7D001 10ZX musth_rules_action_products_creation (!p)',
    //    array('!p' => print_r($new_product_for_the_current_track, true)),
    //    WATCHDOG_DEBUG);

    try {
        commerce_product_save($new_product);
    }
    catch (Exception $e) {

        watchdog('musth_rules', 'W3E045 Error in creating track product. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here!
        return FALSE;
    }

    //watchdog('musth_rules', 'W7D001 product created (!s) (!t) (!n) (!m) ',
    //    array('!s' => print_r($sku, true),
    //          '!t' => print_r($programme_media_type, true),
    //          '!n' => print_r($track_nid, true),
    //          '!m' => print_r($track_product_title, true)
    //    ),
    //    WATCHDOG_DEBUG);

    return TRUE;
}