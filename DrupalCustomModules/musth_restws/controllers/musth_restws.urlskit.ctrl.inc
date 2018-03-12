<?php
/**
 * @file musth_restws.urlskit.ctrl.inc
 *
 * @brief This file is about the URLsKitResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the URLsKit resource
 *
 * Here the urls of movie, previews and their subtitles are built from the system title
 * that is given and are signed
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// This is for Fastly CDN
//define('MUSICTHEATRE_VIDEO_MOVIE_BASE_URL', 'http://www.jazzonthe.net.global.prod.fastly.net/');
//define('MUSICTHEATRE_SRT_MOVIE_BASE_URL',   'http://www.jazzonthe.net.global.prod.fastly.net/');
//define('MUSICTHEATRE_VIDEO_TRAILER_BASE_URL', 'http://www.jazzonthe.net.global.prod.fastly.net/');
//define('MUSICTHEATRE_SRT_TRAILER_BASE_URL',   'http://www.jazzonthe.net.global.prod.fastly.net/');

// This is for Highwinds CDN when using the Amazon S3 origin
//define('MUSICTHEATRE_VIDEO_MOVIE_BASE_URL', 'http://hwcdn.net/x6w9t5c9/');/
//define('MUSICTHEATRE_SRT_MOVIE_BASE_URL',   'http://hwcdn.net/x6w9t5c9/');
//define('MUSICTHEATRE_VIDEO_TRAILER_BASE_URL', 'http://hwcdn.net/x6w9t5c9/');
//define('MUSICTHEATRE_SRT_TRAILER_BASE_URL',   'http://hwcdn.net/x6w9t5c9/');

// This is for Highwinds CDN when using the old origin they provide
// This is the host hash for the Highwinds old origin: c6j4u5n4
//define('MUSICTHEATRE_VIDEO_MOVIE_BASE_URL', 'http://hwcdn.net/x6w9t5c9/ads/MPS/Films/');
//define('MUSICTHEATRE_SRT_MOVIE_BASE_URL',   'http://hwcdn.net/x6w9t5c9/cds/srt/films/');
//define('MUSICTHEATRE_VIDEO_TRAILER_BASE_URL', 'http://hwcdn.net/x6w9t5c9/ads/MPS/Trailers/');
//define('MUSICTHEATRE_SRT_TRAILER_BASE_URL',   'http://hwcdn.net/x6w9t5c9/cds/srt/trailers/');

//define('MUSICTHEATRE_VIDEO_MOVIE_BASE_URL', 'http://hwcdn.net/c6j4u5n4/cds/MPS/Films/');
//define('MUSICTHEATRE_SRT_MOVIE_BASE_URL',   'http://hwcdn.net/c6j4u5n4/cds/srt/films/');
//define('MUSICTHEATRE_VIDEO_TRAILER_BASE_URL', 'http://hwcdn.net/c6j4u5n4/cds/MPS/Trailers/');
//define('MUSICTHEATRE_SRT_TRAILER_BASE_URL',   'http://hwcdn.net/c6j4u5n4/cds/srt/trailers/');

//http://388254354.r.worldcdn.net/www.jazzonthe.net/

define('MUSICTHEATRE_VIDEO_MOVIE_BASE_URL', 'http://388254354.r.worldcdn.net/www.jazzonthe.net/');
define('MUSICTHEATRE_SRT_MOVIE_BASE_URL',   '/subtitles/');
define('MUSICTHEATRE_VIDEO_TRAILER_BASE_URL', 'http://388254354.r.worldcdn.net/www.jazzonthe.net/');
define('MUSICTHEATRE_SRT_TRAILER_BASE_URL',   '/subtitles/');

// This is the API secret to be used to sign the urls
define('SIGNED_URLS_SECRET', 'not so secret');

// How long an url is supposed to be valid (seconds)
define('URL_SIGNATURE_TIMEOUT', 300);

class URLsKitResourceController implements RestWSQueryResourceControllerInterface {

    private $system_title;   // System title of the programme
    private $segment_no;    // Segment no and track no of the track we have to check for permission to play
    private $track_no;

    public function __construct() {

        $this->system_title = '';
        $this->segment_no = 0;
        $this->track_no = 0;

        //watchdog('musth_restws', 'W7D001 7BHG URLsKitResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource URLsKit this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Programme
     */
    public function propertyInfo() {

        return array(
            'system_title' => array(
                'type' => 'text',
                'label' => t('System title'),
            ),
            'segment_no' => array(  // Has to be passed to check for permission to play an individual track
                'type' => 'int',
                'label' => t('Track segment no'),
            ),
            'track_no' => array( // Has to be passed to check for permission to play an individual track
                'type' => 'int',
                'label' => t('Track track no'),
            ),
            'movie_url' => array(
                'type' => 'text',
                'label' => t('Movie url'),
            ),
            'subtitles_url' => array(
                'type' => 'text',
                'label' => t('Subtitles url'),
            ),
            'preview_url' => array(
                'type' => 'text',
                'label' => t('Preview url'),
            ),
            'preview_subtitles_url' => array(
                'type' => 'text',
                'label' => t('Preview subtitles url'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Programme resource
     *
     * Needed because our resource doesn't correspond perfectly to a Drupal node
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Node id for which the metadata wrapper has to be returned
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $urlskit_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_urls_kit',
            $urlskit_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is the system title of a programme. The segment no and
     * track no of the track to be played are passed as well because we need to know
     * which individual track the user wants to play so that we can check for permission.
     *
     * Angular passes the system title so that we don't have to perform any query against
     * the database.
     *
     * We check that the system title is not empty or missing and return a dummy id '1'
     * RESTws will call the method read passing that id
     *
     * The task performed by this api happens in the read method. See you there.
     *
     * @restfulness Only for anonymous. If the user is logged-in, results are different from
     * when the user is not. We may find a way to differentiate between logged-in and non-logged-in
     * users by using some query parameter.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @return array Array containing a dummy id (1)
     */
    public function query($filters = array(), $meta_controls = array()) {

        if (isset($filters['system_title'])) {
            $system_title = $filters['system_title'];
        } else {

            watchdog('musth_restws',
                'W3E030 Missing or empty system title. See filters: (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            return array();
        }

        if (empty($system_title)) {

            watchdog('musth_restws',
                'W3E030 Missing or empty system title. See filters: (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

        }

        // We need to know which particular track the user wants to play
        // to check for permission. If no segment no or track no are passed, we
        // consider them as zero

        if (isset($filters['segment_no'])) {
            $segment_no = $filters['segment_no'];
        } else {
            $segment_no = 0;
        }

        if (isset($filters['track_no'])) {
            $track_no = $filters['track_no'];
        } else {
            $track_no = 0;
        }

        //watchdog('musth_restws', 'W7D001 9SCD user uid (!f) (!m) (!n) ',
        //        array('!f' => print_r($user, true),
        //              '!m' => print_r($user->roles, true),
        //              '!n' => print_r('', true),
        //        ), WATCHDOG_DEBUG);

        // We checked if the system title is set and is not empty
        // Now we just store the system title in $this, as well as the segment no and the track no

        $this->system_title = $system_title;
        $this->track_no = $track_no;
        $this->segment_no = $segment_no;

        //throw new RestWSException('testing', 500);

        // We pass the id 1 and RESTws will call the method 'read' passing this id
        // See you at the read method...

        //watchdog('musth_restws', 'W7D001 8FCD ProgrammeResourceController query (!f) (!m) (!n) ',
        //        array('!f' => print_r($filters, true),
        //              '!m' => print_r($query_result, true),
        //              '!n' => print_r($nid, true),
        //        ), WATCHDOG_DEBUG);

        return array(1);
    }

    /**
     * We don't create programmes through this api
     *
     * @see RestWSResourceControllerInterface::create()
     */
    public function create(array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     * We send only one urlskit (or none of them)
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Maximum one urlskit will be sent
     */
    public function count($filters = array()) {
        // We always send one urlskit only and we don't care if we happen to send
        // no urlskits at all because the methods count and limit
        // are only for paging and we don't need paging here

        return 1;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here. We send one or no
     * urlskit. No need for paging.
     *
     * @param int $client_limit Ignored
     * @return int Just one, we don't send more than one urlskit.
     */
    public function limit($client_limit = NULL) {
        return 1;
    }

    /**
     * This is the function that builds and signs the urls and prepares
     * the object to send back to angular
     *
     * @attention We will need to send to angular the expiration time so that it
     * hasn't to call this api every time a play button is pressed
     *
     * @attention Now we send only the English subtitles url. We will have to send all the
     * available languages. We have to make sure that the subtitles file actually exists before
     * sending its url
     *
     * @see RestWSResourceControllerInterface::read()
     * @param $id int Dummy argument, ignored in this context
     * @return URLsKit object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        global $user; // We need the user to check for permissions

        $userid =  $user->uid;

        // $id is actually ignored because we send only the URLs

        // @todo no signed urls for now, we will reintroduce them later

        // We are going to need the catalogue no of the track or programme we are
        // calculating the urls for

        // The catalogue no of a track is composed by the first five digits of the system title
        // plus segment no and track no (the latter will be 0 if its a full programme we
        // are talking about

        // For example: V12340102

        $catalogue_no = substr($this->system_title, 0, 5) .
            sprintf("%02d%02d", $this->segment_no, $this->track_no);

        // Checking for permissions

        if ($userid == 0) {
            // No permissions for not logged in users. They will be able to play the preview only
            // We will check below if the programme or track is free

            $permission_granted = false;
        } else {

            // First let's see if the user owns a subscription license

            $permission_granted = musth_restws_check_for_subscriptions($userid);

            if (!$permission_granted) {

                // No subscription found, let's see if the user bought the track (or the segment or the entire
                // programme)

                $permission_granted = musth_helper_check_for_license($catalogue_no, $userid);

            }
        }

        // Let's see if the programme or the track is free

        if (!$permission_granted) {

            $permission_granted = musth_helper_programme_or_track_is_free($catalogue_no);

//            watchdog('musth_restws', 'W7D001 10GTF read after musth_helper_programme_or_track_is_free (!i) (!p) ',
//               array('!i' => print_r($catalogue_no, true),
//                     '!p' => print_r($permission_granted, true)),
//               WATCHDOG_DEBUG);

        }

        // Building the url for the full movie, but only if the user has permissions

        if ($permission_granted) {

            // Full movie: url of the video

            // We cut the first character of the system title because on Highwinds
            // the system title have the old catalogue no. with no leading 'V' or 'A'

            // @todo testing here, just using mp4 pseudostreaming now
            // 10330000_nabucco_piacenza_kf50_9_ca3_br1500.mp4

            // $path_of_movie = MUSICTHEATRE_VIDEO_MOVIE_BASE_URL .
            //     substr($this->system_title, 1) . "_kf50_9_ca3.smil/Manifest.f4m";

            $path_of_movie = MUSICTHEATRE_VIDEO_MOVIE_BASE_URL .
                substr($this->system_title, 1) . "_kf50_9_ca3_br1500.mp4";

            //$path_and_signature_for_movie =
            //    musth_helper_functions_add_signature_to_path($path_of_movie, SIGNED_URLS_SECRET, URL_SIGNATURE_TIMEOUT);

            //$signed_url_for_movie = MUSICTHEATRE_VIDEO_MOVIE_BASE_URL .
            //    $path_and_signature_for_movie;

            // Full movie: url of the subtitles

            $path_of_subtitles = MUSICTHEATRE_SRT_MOVIE_BASE_URL .
                substr($this->system_title, 1) . "_en.srt";

//            $path_of_subtitles = MUSICTHEATRE_SRT_MOVIE_BASE_URL .
//                  substr($this->system_title, 1) . "_en.vtt";

            //$path_and_signature_for_subtitles =
            //    musth_helper_functions_add_signature_to_path($path_of_subtitles, SIGNED_URLS_SECRET, URL_SIGNATURE_TIMEOUT);

            //$signed_url_for_subtitles = MUSICTHEATRE_SRT_MOVIE_BASE_URL .
            //    $path_and_signature_for_subtitles;

        } else {
            // No permissions, no full movie url

            $path_of_movie = '';
            $path_of_subtitles = '';
        }

        // Preview: url of the video

        // Building the url for the preview
        // @todo this url needs to be signed as well

        // @todo testing here, just using mp4 pseudostreaming now

//        $preview_url = MUSICTHEATRE_VIDEO_TRAILER_BASE_URL .
//            substr($this->system_title, 1) . '_x_kf50_9_ca3.smil/Manifest.f4m';

        // 10330000_nabucco_piacenza_x_kf50_9_ca3_br1500.mp4

        $preview_url = MUSICTHEATRE_VIDEO_TRAILER_BASE_URL .
            substr($this->system_title, 1) . '_x_kf50_9_ca3_br1500.mp4';

        // Building the url for the preview subtitles
        // @todo this url needs to be signed as well

        // Preview: url of the subtitles

        // @todo change this to vtt as well

        $preview_subtitles_url = MUSICTHEATRE_SRT_TRAILER_BASE_URL .
            substr($this->system_title, 1) . '_prv_x_en.srt';

        // @todo subtitles have to be signed as well

        $urls_kit_object_to_return = new URLsKit($this->system_title,
            $this->segment_no,
            $this->track_no,
            $path_of_movie,
            $path_of_subtitles,
            $preview_url,
            $preview_subtitles_url);

        //watchdog('musth_restws', 'W7D001 996TGBHY ProgrammeResourceController read (!i) (!p) ',
        //    array('!i' => print_r($id, true),
        //          '!p' => print_r($image_full_url, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the URLs Kit object

        return $urls_kit_object_to_return;
    }

    /**
     * Not implemented. We don't update anything through this api
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($id, array $values) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Not implemented. We don't delete anything through this api
     *
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($id) {
        throw new RestWSException('Not implemented', 501);
    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        //watchdog('musth_restws', 'W7D001 6767 ProgrammeResourceController access (!o) (!i) ',
        //    array('!o' => print_r($op, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_urls_kit';
    }

}

/**
 * This function is about subscriptions.
 *
 * We load every subscription product we can find. There may be the classic 1-month subscription
 * as well as a 2-months one or an yearly one.
 *
 * We don't care, we load them all. If the user bought any of them, she will own an active license
 * created by the order and related to that subscription.
 *
 * As long as the license is active, we don't care if it's about a monthly subscription or a 2-months
 * one or a yearly one.
 *
 * We just check that it's active.
 *
 * Even if it's a subscription to receive a monthly physical book, we still use it to allow the user
 * to stream programmes from the website.
 *
 * @attention In the future we may want to be more selective and not give streaming permissions to people
 * who bought only a subscription to receive books.
 *
 * @param $userid int User we check the existence of subscription for
 * @return bool TRUE is the user own an active license for any subscription
 */
function musth_restws_check_for_subscriptions($userid) {

    $query = new EntityFieldQuery();
    $result = $query->entityCondition('entity_type', 'commerce_product')
        ->entityCondition('bundle', 'recurring')
        ->propertyCondition('sku', 'S', 'STARTS_WITH')
        ->execute();

    if (isset($result['commerce_product'])) {
        $subscription_product_nids = array_keys($result['commerce_product']);
    } else {

        watchdog('musth_restws',
            'W3E050 No subscription product found',
            array(),
            WATCHDOG_ERROR);

        // Get out of here, but give permission (to avoid complaints)
        return TRUE;
    }

    try {
        $query = new EntityFieldQuery;
        $count_of_active_licenses = $query->entityCondition('entity_type', 'commerce_license')
            ->propertyCondition('status', COMMERCE_LICENSE_ACTIVE)
            ->propertyCondition('product_id', $subscription_product_nids, 'IN')
            ->propertyCondition('uid', $userid)
            ->count()
            ->execute();
    }
    catch (Exception $e) {

        watchdog('musth_rules', 'W3E051 Error in querying licenses associated to subscriptions. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here, but give permission (to avoid complaints)
        return TRUE;
    }

//    watchdog('musth_restws', 'W7D001 CRCFPTP-4 FGRT subscriptions count (!c) (!u) ',
//        array('!c' => print_r($count_of_active_licenses, true),
//            '!u' => print_r($subscription_product_nids, true)),
//        WATCHDOG_DEBUG);

    if ($count_of_active_licenses > 0) {
        // The user can play
        return TRUE;
    } else {
        // No active subscription licenses, the user can't play (the user may have a license for an individual track
        // but she hasn't one for a subscription)
        return FALSE;
    }
}


