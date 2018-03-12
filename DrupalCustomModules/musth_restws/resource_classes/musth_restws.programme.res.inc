<?php
/**
 * @file musth_restws.programme.res.inc
 *
 * @brief The class Programme is defined here. It's the object we send back to angular
 * when it requests a programme
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class Programme {

    // These fields of a programme are not sent to angular (at least for now):
    // catalogue_no, system_title, field_tagring_tooltip, field_tagring_icon_filename
    // field_recording_year, field_related_programmes, field_related_audio_cds
    // field_programme_licensor, field_licensor_reference_no, field_stream_media_to
    // field_countries_list

    public $nid;
    public $display_title;
    public $display_sub_title;
    public $system_title;
    public $summary_panel_image;
    public $summary;
    public $synopsis;
    public $sleeve_notes;
    public $body;

    public $credits_elements;
    public $tracks;

    public $bio_info;

    public $partner_details;

    public function __construct($nid,
                                $display_title = 'Missing display title',
                                $display_sub_title = 'Missing display sub title',
                                $system_title = 'Missing system title',
                                $summary_panel_image = 'Missing summary panel image url',
                                $summary = 'Missing summary',
                                $synopsis = 'Missing synopsis',
                                $sleeve_notes = 'Missing sleeve notes',
                                $body = '',
                                $credits_elements = array(),
                                $tracks = array(),
                                $bio_info = array(),
                                $partner_details = array()) {
        $this->nid = $nid;
        $this->display_title = $display_title;
        $this->display_sub_title = $display_sub_title;
        $this->system_title = $system_title;
        $this->summary_panel_image = $summary_panel_image;
        $this->summary = $summary;
        $this->synopsis = $synopsis;
        $this->sleeve_notes = $sleeve_notes;
        $this->body = $body;
        $this->credits_elements = $credits_elements;
        $this->tracks = $tracks;
        $this->bio_info = $bio_info;
        $this->partner_details = $partner_details;

    }
}

/**
 * Class Credits_element
 *
 * Instances of this class contain the credits elements and will form
 * the array credits_elements in the class Programme (see above)
 */
class Credits_element {

    public $label;
    public $role_title;
    public $is_a_principle;

    public function __construct($label, $role_title, $is_a_principle) {
        $this->label = $label;
        $this->role_title = $role_title;
        $this->is_a_principle = $is_a_principle;
    }

}

/**
 * Class Track
 *
 * Instances of this class contain the tracks and will form
 * the array tracks in the class Programme (see above)
 *
 * Note that the catalogue no of a track will be computed using the first four
 * digits of the system title of the programme and the segment and track numbers
 */
class Track {

    // The catalogue no of a track will be computed using the first four
    // digits of the system title of the programme and the segment and track numbers

    public $tid; // Track id (actually the node id of the node containing the track)
    public $title;
    public $segment_no;
    public $track_no;
    public $track_tooltip;
    public $time_in;
    public $time_out;
    public $credits_elements;

    public function __construct($tid,
                                $title,
                                $segment_no,
                                $track_no,
                                $track_tooltip,
                                $time_in,
                                $time_out,
                                $credits_elements) {
        $this->tid = $tid;
        $this->title = $title;
        $this->segment_no = $segment_no;
        $this->track_no = $track_no;
        $this->track_tooltip = $track_tooltip;
        $this->time_in = $time_in;
        $this->time_out = $time_out;
        $this->credits_elements = $credits_elements;
    }

}

/**
 * Class Bio_info
 *
 * Instances of this class contain the biographic info of a programme
 * that is actually a biography.
 * A list of instances of this class forms the member $bio_info in the class
 * Programme above.
 */
class Bio_info {

    public $birthdate;
    public $deathdate;

    public function __construct($bio_info_array) {

        foreach ($bio_info_array as $property_name => $property_value)
            $this->$property_name = $property_value;

    }

}

/**
 * Class @todo fix this
 *
 * @todo fix this
 *
 * Instances of this class contain the biographic info of a programme
 * that is actually a biography.
 * A list of instances of this class forms the member $bio_info in the class
 * Programme above.
 */
class Partner_details {

    //public $birthdate;
    //public $deathdate;
    public $partner_type; // person or organisation
    public $first_name;
    public $middle_names;
    public $family_name;
    public $website;
    //public

    public function __construct($partner_details_array) {

        foreach ($partner_details_array as $property_name => $property_value)
            $this->$property_name = $property_value;

    }

}