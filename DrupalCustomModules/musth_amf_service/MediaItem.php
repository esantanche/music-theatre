<?php
/**
 * @file MediaItem.php
 *
 * @brief Class representing a programme as the tagring sees it
 *
 * This class contains only the field that the tagring needs
 *
 * This class is used only here:
 * @see musth_amf_service_tagring_api_get_items_by_id
 *
 * @ingroup musthamfservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 28/02/14
 * Time: 14:21
 */

class MediaItem {

    // amf required type
    public $_explicitType = 'data.items.MediaItem';

    // Drupal node id
    public $id;

    public $title;  // Drupal node title. Needed to give the proper tag to the images
                    // The tag has to go with the node title, not with the display title

    public $field_display_title; // Drupal field field_display_title
    public $field_credit; // Drupal field field_credit

    public $field_tagring_tooltip; // Drupal field field_tagring_tooltip

    // URL of the image displayed on the tag ring for this programme
    // It's an URL that points to the Highwinds cdn
    public $thumbnail_url;

    // constructor
    // It simply copies the values passed as a parameter to the object properties
    public function __construct($array)
    {
        foreach($array as $key => $value)
        {
            if (property_exists('MediaItem', $key))
            {
                $this->$key = $value;
            }
        }
    }
}