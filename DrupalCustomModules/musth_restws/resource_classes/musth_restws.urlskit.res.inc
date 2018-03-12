<?php
/**
 * @file musth_restws.urlskit.res.inc
 *
 * @brief The class URLsKit is defined here. It's the object we send back to angular
 * when it requests the signed urls it has to use to play videos
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:40
 */

class URLsKit {

    public $system_title;
    public $segment_no;
    public $track_no;
    public $movie_url;
    public $subtitles_url;
    public $preview_url;
    public $preview_subtitles_url;

    public function __construct($system_title,
                                $segment_no = 0,
                                $track_no = 0,
                                $movie_url = 'No movie url',
                                $subtitles_url = 'No subtitles url',
                                $preview_url = 'No preview url',
                                $preview_subtitles_url = 'No preview subtitles url') {

        $this->system_title = $system_title;
        $this->segment_no = $segment_no;
        $this->track_no = $track_no;
        $this->movie_url = $movie_url;
        $this->subtitles_url = $subtitles_url;
        $this->preview_url = $preview_url;
        $this->preview_subtitles_url = $preview_subtitles_url;

    }
}
