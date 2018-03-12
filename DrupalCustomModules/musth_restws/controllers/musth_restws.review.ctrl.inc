<?php
/**
 * @file musth_restws.review.ctrl.inc
 *
 * @brief This file is about the ReviewResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Review resource
 *
 * Here reviews are created and associated to a programme.
 *
 * Then it's possible to query all the published reviews for a programme and all the reviews for a user.
 *
 * It's also possible to update a review by changing its title and body. It's possible to mark the review as
 * submitted so that editors can publish it.
 *
 * This api is not used to vote a review. The Vote REST api is used instead.
 *
 * No update can be performed by users other than the review owner.
 *
 * The author of a review can delete it unless it's submitted or published.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// How many reviews in a page, which means how many reviews are sent at the same time when a query call is performed
// This is a default that the client can override
define('MUSICTHEATRE_REVIEWS_PAGE_LENGTH', 5);

class ReviewResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Review this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Review
     */
    public function propertyInfo() {

        return array(
            'id' => array(
                'type' => 'int',
                'label' => t('Node id of the review'),
            ),
            'nid' => array(
                'type' => 'int',
                'label' => t('Node id of the programme the review is about'),
            ),
            'uid' => array( // Author of the review
                'type' => 'int',
                'label' => t('Author of the review'),
            ),
            // We want to display the user's real name, but if the latter is not defined we display
            // the Drupal username after having removed its 'technical' part (the user id)
            'name' => array(
                'type' => 'text',
                'label' => t('Made-up user name of the user who created the review'),
            ),
            'avatar' => array( // Avatar url
                'type' => 'text',
                'label' => t('Avatar'),
            ),
            'title' => array(
                'type' => 'text',
                'label' => t('Review title'),
            ),
            'body' => array(
                'type' => 'text',
                'label' => t('Review body'),
            ),
            // Actually rating is an object with two properties:
            // * sum (sum of votes, each vote can be 1 or -1, thumbs up or thumbs down)
            // * count (number of votes)
            'rating' => array(
                'type' => 'int',
                'label' => t('Rating users gave to the review'),
            ),
            'status' => array(
                'type' => 'text',
                'label' => t('Status: draft, submitted, published'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Review resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Review id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $review_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_review',
            $review_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * Actually, in the case of this api, we have paging in place. This means that the count method
     * is called before this one.
     *
     * If the count method returns zero, this method won't be called.
     *
     * The filter 'nid' is supported. If this filter is defined, all reviews associated to the node
     * whose id is the one the filter gives are sent back.
     *
     * Only published reviews are sent back and they are sorted by date and time of last change.
     *
     * They are sorted in descending order so that the most recent ones come first.
     *
     * To get all reviews a user created the 'uid' filter has to be passed. The same user has to be logged in.
     *
     * The reviews a user created are sorted by status:
     * * first the ones in status 'draft'
     * * then the ones in status 'submitted'
     * * then the ones in status 'published'
     *
     * This is accomplished by using the field field_submitted and the property status you find in
     * the review content type because the content type doesn't have a single field with three possible
     * values 'draft', 'submitted' or 'published'. We send these values to Angular but they are not
     * in the database.
     *
     * @attention We shouldn't have reviews with field_submitted == false and status == 1. This would mean
     * that the user didn't submit the review, but it has been published anyway. This is a bug because the
     * application doesn't allow for this. But editors may change field_submitted by mistake. We may want
     * to force field_submitted = true if status == 1. Anyway the worst that can happen is that the reviews
     * won't be sorted properly.
     *
     * There is an additional sorting by date and time of last change so that the older reviews will
     * come last.
     *
     * @restfulness Yes. Uid is given explicitly.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array We use the page meta control to deliver a single page of the results
     * @throws RestWSException
     * @return array Array containing the ids of the reviews we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        global $user;

        //watchdog('musth_restws', 'W7D001 REVIEW-q bg67 review query <br> filters (!f) <br> (!m) ',
        //    array('!f' => print_r($filters, true),
        //          '!m' => print_r($meta_controls, true)
        //    ), WATCHDOG_DEBUG);

        // Implemented filters:
        // 1) all reviews for the programme whose nid is given
        //    only reviews with status == 1 (published) are returned. They are sorted by 'changed' descending
        // 2) all reviews for the given user:
        //    * first the non-submitted ones
        //    * then the submitted not published
        //    * then the published
        // all sorted by 'changed' descending
        // The reviews for a given user (the one whose user id is $filters['uid']) are served only if
        // that user is logged in

        // Let's begin with the meta controls

        // Getting the limit from the same method RESTws uses to calculate how many
        // pages it has to serve. It's the limit method you find below that I'm talking about
        $page_length = $this->limit($meta_controls['limit']);

        // Calculating the starting point of the page we are about to serve
        if (isset($meta_controls['page']))
            $start = intval($meta_controls['page']) * $page_length;
        else
            $start = 0;

        //watchdog('musth_restws', 'W7D001 REVIEW-q dbdt66 review query <br> filters (!f) <br> start (!s) <br> meta (!m) ',
        //    array('!f' => print_r($filters, true),
        //          '!s' => print_r($start, true),
        //          '!m' => print_r($meta_controls, true)
        //    ), WATCHDOG_DEBUG);

        if (!empty($filters['nid'])) {

            // If we have the node id of a programme, we have to send back all reviews related to that programme
            $nid = $filters['nid'];

            // It may happen that we find no reviews because the node of nid $nid doesn't exist and not because there are no
            // reviews. We are not checking this.

            //watchdog('musth_restws', 'W7D001 REVIEW-q us78dc review query <br> filters (!f) <br> start (!s) <br> meta (!m) ',
            //    array('!f' => print_r($filters, true),
            //          '!s' => print_r($start, true),
            //          '!m' => print_r($meta_controls, true)
            //    ), WATCHDOG_DEBUG);

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'review')
                ->propertyCondition('status', NODE_PUBLISHED) // get the review only if it's published
                ->fieldCondition('field_programme', 'target_id', $nid, '=')
                ->propertyOrderBy('changed', 'DESC')
                ->range($start, $page_length)
                ->execute();

            if (isset($result['node'])) {

                // Returning the node ids of all reviews associated to the given programme

                return array_keys($result['node']);

            } else {

                // No reviews for the given programme

                return array();
            }

        } elseif (!empty($filters['uid'])) {

            $review_author_user_id = $filters['uid'];

            if ($review_author_user_id != $user->uid) {

                watchdog('musth_restws',
                    'W3E211 Only the author can query all their reviews (!f) (!u) ',
                    array('!f' => print_r($filters, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Only the author can get all their reviews', 403);
            }

            // All reviews for the given user ($review_author_user_id):
            //  1) first the non-submitted ones
            //  2) then the submitted not published
            //  3) then the published
            // Everything is sorted by 'changed' descending
            // Always remember that there should be no non-submitted and published reviews, they would break the sorting order

            //watchdog('musth_restws', 'W7D001 REVIEW-q nwy67 review query for user <br> filters (!f) <br> start (!s) <br> meta (!m) ',
            //    array('!f' => print_r($filters, true),
            //        '!s' => print_r($start, true),
            //        '!m' => print_r($meta_controls, true)
            //    ), WATCHDOG_DEBUG);

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'review')
                ->propertyCondition('uid', $review_author_user_id)
                ->fieldOrderBy('field_submitted', 'value', 'ASC')
                ->propertyOrderBy('status', 'ASC')
                ->propertyOrderBy('changed', 'DESC')
                ->range($start, $page_length)
                ->execute();

            if (isset($result['node'])) {

                // Returning the node ids of all reviews created by the given user

                $ids = array_keys($result['node']);

                return $ids;

            } else {

                // No reviews for the given user

                return array();
            }

        } else {

            watchdog('musth_restws',
                'W3E271 No useful filter found (!f) (!u) ',
                    array('!f' => print_r($filters, true),
                          '!u' => print_r($user, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Where is the filter?', 412);
        }

    }

    /**
     * To create a review:
     * * you send a POST http query
     * * you have to authenticate because anonymous users can't create reviews
     * * you send:
     * ** uid, the user id of the review author has to be passed explicitly
     * ** nid of the programme the review is about
     * ** title of the review
     * ** body of the review
     * * all fields are sent in the body of the POST query, none in the URL
     *
     * A review is created in 'draft' status which means that it's created with field_submitted == false
     * and property status == 0 (unpublished)
     *
     * @see RestWSResourceControllerInterface::create()
     * @restfulness Yes. Uid is given explicitly.
     * @param array $values Properties to be used to create the review
     * @throws RestWSException
     * @return int Id of the new review
     */
    public function create(array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 REVIEW-create 1st comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //        '!o' => print_r('', true),
        //        '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // To create a review we need:
        // not the review id, it will be returned instead
        // nid, sure we need to know which programme the new review is about
        // uid, it has to be in $values anyway. Here we just check that the same user is logged in
        // name, it's the name we show as name of the review author. We don't need it. We will make it up when
        //       the review is queried
        // title, sure, we want a title for the review, it's mandatory
        // body, we need it as well
        // rating, not needed to create a review
        // status, not needed, we set published = false and submitted = false, which means that the review is created as 'draft'

        if (!empty($values['uid'])) {

            $review_author_user_id = intval($values['uid']);

            // The review author and the logged-in user have to be the same

            if ($user->uid != $review_author_user_id) {

                watchdog('musth_restws',
                    'W3E212 The logged-in user is not the same as the review author specified in the given values (!v) (!u) ',
                    array('!v' => print_r($values, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The logged-in user is not the same as the review author specified in the given values', 412);
            }

        } else {

            // We need the user id of the author to create a review. It has to be explicitly specified

            watchdog('musth_restws',
                'W3E213 No uid specified. We need the uid of the review author explicitly specified (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No uid specified. We need the uid of the review author explicitly specified', 412);
        }

        //watchdog('musth_restws', 'W7D001 CMMT-C uua76763 comment create values (!v) ',
        //    array('!v' => print_r($values, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['nid'])) {

            $nid = $values['nid'];

            // If we are given the node id of a programme the review is about, we check if that programme exists

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('nid', $nid)
                ->count()
                ->execute();

            if (!$result) {

                watchdog('musth_restws',
                    'W3E183 The node doesnt exist, we cant create a review about nothing (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The programme doesnt exist, cant create a review about nothing', 412);
            }

        } else {

            // We need a nid to create a review

            watchdog('musth_restws',
                'W3E184 No nid provided, we cant create a review about nothing (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No nid provided, cant create a review about nothing', 412);
        }

        if (!empty($values['title'])) {

            $title = $values['title'];

        } else {

            watchdog('musth_restws',
                'W3E185 No title provided, we cant create a review with no title (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No title provided, cant create a review with no title', 412);
        }

        if (!empty($values['body'])) {

            $body = $values['body'];

        } else {

            watchdog('musth_restws',
                'W3E186 No body provided, we cant create a review with no body (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No body provided, cant create a review with no body', 412);
        }

        // $nid is the node id of the programme the review is about

        $review_properties = array(
            'type' => 'review',
            'uid' => $review_author_user_id,
            'status' => 0,  // A review starts unpublished
            'comment' => 0, // Comments are not allowed for reviews
            'promote' => 0, // Reviews don't go to the Drupal front page (not that we care...)
        );
        // We create the review
        $review = entity_create('node', $review_properties);

        $review_wrapper = entity_metadata_wrapper('node', $review);

        // Using the wrapper, we do not have to worry about telling Drupal
        // what language we are using. The Entity API handles that for us.
        $review_wrapper->title->set($title);

        // For the field body we set only the value. We don't use the summary or the format fields
        $review_wrapper->body->set(array('value' => $body));

        // We set the reference to the programme the review is about
        // Why do we have to make an array of $nid? Because the field field_programme is multivalued
        // and can't be transformed into single value because it's used in other entities where
        // it has to be multivalued
        $review_wrapper->field_programme->set(array(intval($nid)));

        // A review is created non-submitted. The user will submit it for moderation when they are ready
        $review_wrapper->field_submitted->set(0);

        try {

            $review_wrapper->save();

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E187 Error in saving a new review. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a new review', 500);
        }

        //watchdog('musth_restws', 'W7D001 REVIEW review create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //          '!o' => print_r($review, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        return $review->nid;
    }

    /**
     * We implement paging in this case.
     *
     * When we do, this method is the first called. The RESTws module will come here first to
     * see if there is something to return. If the count method returns a non-zero result, it
     * will call the query method. If the count method returns zero, the query method won't be
     * called at all.
     *
     * So, if there are no reviews for the given programme (the one with node id $filters['nid'])
     * or if the programme doesn't exist at all, we have that the count method returns zero and
     * the RESTws module will send back a 404 and won't call the query method.
     *
     * The same if $filters['uid'] is given and we have to return a user's reviews.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * Actually the filters are passed to this method first
     * @return int Number of resources to be sent back (total)
     * @throws RestWSException
     */
    public function count($filters = array()) {

        global $user;

        // Implemented filters:
        // 1) all published reviews for the programme whose nid is given
        // 2) all reviews for the given user

        if (!empty($filters['nid'])) {

            // If we have the node id of a programme, we have to send back all reviews related to that programme
            $nid = $filters['nid'];

            // Counting all published reviews for the given programme (the one whose node id is $nid)

            try {

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'review')
                    ->propertyCondition('status', NODE_PUBLISHED) // Get published reviews only
                    ->fieldCondition('field_programme', 'target_id', $nid, '=')
                    ->count()
                    ->execute();

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E188 Error in counting reviews. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting reviews', 500);
            }

            //watchdog('musth_restws', 'W7D001 REVIEW-CNT hy6 review count <br> filters (!f) <br> count (!c) ',
            //    array('!f' => print_r($filters, true),
            //          '!c' => print_r($result, true)), WATCHDOG_DEBUG);

            return $result;

        } elseif (!empty($filters['uid'])) {

            $review_author_user_id = intval($filters['uid']);

            if ($review_author_user_id != $user->uid) {

                watchdog('musth_restws',
                    'W3E211 Only the author can query all their reviews (!f) (!u) ',
                    array('!f' => print_r($filters, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Only the author can get all their reviews', 403);
            }

            // Counting all reviews for the given user

            try {

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'review')
                    ->propertyCondition('uid', $review_author_user_id)
                    ->count()
                    ->execute();

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E189 Error in counting reviews. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting reviews', 500);
            }

            //watchdog('musth_restws', 'W7D001 REVIEW-CNT hy6 review count <br> filters (!f) <br> count (!c) ',
            //    array('!f' => print_r($filters, true),
            //          '!c' => print_r($result, true)), WATCHDOG_DEBUG);

            return $result;
        }

        return 0;
    }

    /**
     * We do paging here and we send maximum MUSICTHEATRE_REVIEWS_PAGE_LENGTH at a time.
     * Our page is that long.
     *
     * This unless the client specifies a custom limit by passing the 'limit' parameter in the query.
     *
     * If limit == 0, we ignore it and use our default.
     *
     * If the client wants unlimited results, it has to specify a very high limit like 1,000
     *
     * @param int $client_limit If specified we use it as limit
     * @return int Maximum MUSICTHEATRE_REVIEWS_PAGE_LENGTH sent in a page if no client limit is specified
     * If a client limit is specified, we use it
     */
    public function limit($client_limit = NULL) {

        //watchdog('musth_restws', 'W7D001 REVIEW-LIMIT hy6 review count <br> $client_limit (!f) <br> count (!c) ',
        //    array('!f' => print_r($client_limit, true),
        //          '!c' => print_r('', true)), WATCHDOG_DEBUG);

        if ($client_limit)
            return $client_limit;
        else
            return MUSICTHEATRE_REVIEWS_PAGE_LENGTH;
    }

    /**
     * This is the function that sends back information about a review
     *
     * @attention We may want not to send back unpublished reviews. This can happen if this method is called directly.
     * The frontend is not doing this, but hackers may do it. It's not critical because the most that they can get is
     * an unpublished review.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $id Id of the review we have to send back info about
     * @throws RestWSException
     * @return Review Object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        // @attention We may want to check that unpublished reviews are sent to their author only
        // This check is done in the query method, but someone may use this read method directly
        // and bypass that check
        // global $user; We need the logged-in user details if we want to perform the check

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        $review = node_load($id);

        if ($review) {

            $review_wrapper = entity_metadata_wrapper('node', $review);

            //watchdog('musth_restws', 'W3E???8 7sygygs $review_wrapper (!i) (!w) ',
            //    array('!i' => print_r($id, true),
            //          '!w' => print_r('', true)),
            //    WATCHDOG_DEBUG);

            // It looks like field_programme is a list.
            // This is because the field is multivalued and has to stay so
            $programmes = $review_wrapper->field_programme->value();

            $programme_id_of_the_programme_the_review_is_about = $programmes[0]->nid;

            // @attention I'm using $review->title here. Should we use the title that can be translated?
            // I don't think so, It's the user that gives the title, we are not going to translate it

            // The review status we send to Angular is not a field in the database.
            // We make it up from the review node status property (1=published, 0=unpublished)
            // and from the field field_submitted (1=submitted, 0=unsubmitted)

            $status = 'draft';

            if ($review->status == 1)
                $status = 'published';
            elseif ($review_wrapper->field_submitted->value() == 1)
                $status = 'submitted';

            // We fetch field_first_name, field_middle_names and field_family_name from the
            // user profile and we send them as real name of the user to be displayed
            // as author of the review.
            // If all of these three fields are empty we make a name from the username. The
            // musth_helper_functions_make_username_nice_to_display function helps us with this

            $review_author_user_profile = user_load($review->uid);

            if (isset($review_author_user_profile->field_first_name[LANGUAGE_NONE])) {
                $first_name = $review_author_user_profile->field_first_name[LANGUAGE_NONE][0]['value'];
            } else {
                $first_name = '';
            }

            if (isset($review_author_user_profile->field_middle_names[LANGUAGE_NONE])) {
                $middle_names = $review_author_user_profile->field_middle_names[LANGUAGE_NONE][0]['value'];
            } else {
                $middle_names = '';
            }

            if (isset($review_author_user_profile->field_family_name[LANGUAGE_NONE])) {
                $family_name = $review_author_user_profile->field_family_name[LANGUAGE_NONE][0]['value'];
            } else {
                $family_name = '';
            }

            $composed_real_name = musth_helper_functions_compose_real_name($first_name, $middle_names, $family_name);

            if (empty($composed_real_name))
                $name_to_display_as_review_author =
                    musth_helper_functions_make_username_nice_to_display($review_author_user_profile->name);
            else
                $name_to_display_as_review_author = $composed_real_name;

            $avatar_file_info = $review_author_user_profile->picture;

            //$avatar_image_object = image_load($avatar_file_info->uri);

            if ($avatar_file_info)
                $avatar_url = file_create_url($avatar_file_info->uri);
            else
                $avatar_url = '';

            // The line
            // $review_wrapper->body->value()['value']
            // should be
            // $review_wrapper->body->value()['safe_value']
            // if we allow html in reviews.
            // Now we don't, so we use 'value' because 'safe_value' contains html markup even if the
            // original review doesn't

            // Any exception handling for problems occurring in musth_helper_functions_get_voting_results
            // is performed in the function itself

            // If the review has been rated, the following function returns the average of the votes,
            // their count and the vote that the logged-in user ($user->uid) gave

            // The helper function musth_helper_functions_get_voting_results gives the votes aggregates for the review

            /*
             * This is what $voting_results may look like:
             * Array (
                [890] => Array (
                    [tag] => vote
                    [count] => 1
                    [entity_type] => node
                    [average] => 1
                    [sum] => 1
                )
             )
            */

            $voting_results = musth_helper_functions_get_voting_results('node', $id);

            // $voting_results is an array indexed by node id of the entity being voted, in our case the review
            // We have to get rid of the node id
            // You may be asking why musth_helper_functions_get_voting_results returns a array indexed on the node id
            // of the review when we are dealing with a single review here.
            // It's for compatibility with cases where we deal with many reviews in one go

            if (isset($voting_results[$id]))
                $voting_results_for_the_review = $voting_results[$id];
            else
                $voting_results_for_the_review = array();

            $review_to_return = new Review($id,
                $programme_id_of_the_programme_the_review_is_about,
                $review->uid,
                $name_to_display_as_review_author,
                $avatar_url,
                $review->title,
                $review_wrapper->body->value()['value'],
                $voting_results_for_the_review,
                $status
            );

        } else {

            watchdog('musth_restws', 'W3E190 Review not found, what is going on? (!i) ',
                array('!i' => print_r($id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Review not found, review id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 8888 ReviewResourceController::read (!i) (!p) ',
        //    array('!i' => print_r($review_to_return, true),
        //          '!p' => print_r($voting_results, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Review object

        return $review_to_return;
    }

    /**
     * An update is a PUT http query. You use the url: http://musictheatre-production/musth_restws_review/892
     * where 892 is the id of the review you want to update.
     *
     * Any property you want to update has to be in a json object sent in the body of the PUT call.
     *
     * So, the id of the review we have to update is in the url and is passed to this method as the parameter
     * $id.
     *
     * The array $values may contain:
     * * title: new title of the review
     * * body: new body of the review
     * * status: if status == 'submitted' the review will have field_submitted set to 1
     *
     * Only the owner of a review can update it and only if the review is not submitted or published.
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Yes. User id is used for checking only
     * @param int $id Id of the review to update
     * @param array $values Properties to update
     * @throws RestWSException
     */
    public function update($id, array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 n36ds6g ReviewResourceController::update review update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // Let's load the review

        $review = node_load($id);

        if ($review) {

            $review_wrapper = entity_metadata_wrapper('node', $review);

            // Now, does the logged-in user own the review?

            if ($review->uid == $user->uid) {
                // The logged-in user owns the review
                // If the review is not submitted or published, they can update title and body
                // They can also submit the review

                $review_submitted = $review_wrapper->field_submitted->value();

                if ($review_submitted || $review->status) {
                    // The user can't update a review that they submitted or that has been published

                    // This is quite a bug since Angular shouldn't allow for this to happen

                    watchdog('musth_restws',
                        'W3E191 The user cant update a review that they submitted or that has been published (!c) (!u) ',
                        array('!c' => print_r($review, true),
                              '!u' => print_r($user, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Cant update a review that has been submitted or published', 412);
                }

                if (!empty($values['title']))
                    $review_wrapper->title->set($values['title']);

                if (!empty($values['body']))
                    $review_wrapper->body->set(array('value' => $values['body']));

                if (!empty($values['status']))
                    if ($values['status'] == 'submitted')
                        $review_wrapper->field_submitted->set(1);

            }

            try {

                $review_wrapper->save();

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E194 Error in updating a review. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in updating a review', 500);
            }

        } else {

            watchdog('musth_restws', 'W3E195 Review not found when updating (!r) (!f) ',
                array('!r' => print_r($id, true),
                      '!f' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Review not found, review id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 nd767 review update values (!v) (!r) ',
        //    array('!v' => print_r($values, true),
        //          '!r' => print_r($review, true)),
        //    WATCHDOG_DEBUG);

        // a return is ignored here
    }

    /**
     * This api deletes a review given its id.
     *
     * Only the owner can delete a review.
     *
     * A review can't be deleted if it's submitted or published.
     *
     * @see RestWSResourceControllerInterface::delete()
     * @restfulness Yes. User id is used for checking only
     * @param int $id Id of the review to delete
     * @throws RestWSException
     */
    public function delete($id) {

        global $user;

        // Deleting a review, only its author can do it

        $review = node_load($id);

        if ($review) {

            if ($review->uid != $user->uid) {

                watchdog('musth_restws', 'W3E196 Only the owner of a review can delete it (!r) (!u) ',
                    array('!r' => print_r($id, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Cant delete review, user doesnt own it: ' . $id, 403);
            }

            $review_wrapper = entity_metadata_wrapper('node', $review);

            $review_submitted = $review_wrapper->field_submitted->value();

            if ($review_submitted || $review->status) {
                // The user can't delete a review that they submitted or that has been published

                // This is a bug because Angular should check, before deleting a review, that it's a draft that the user
                // wants to delete

                watchdog('musth_restws',
                    'W3E197 The user cant delete a review that they submitted or that has been published (!c) (!u) ',
                    array('!c' => print_r($review, true),
                          '!u' => print_r($user, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Cant delete a review that has been submitted or published', 412);
            }

            try {

                node_delete($id);

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E198 Error in deleting a review. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in deleting a review', 500);
            }

        } else {

            watchdog('musth_restws', 'W3E199 Review not found when deleting (!r) ',
                array('!r' => print_r($id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Review not found, review id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 ZXCV line item delete values (!v) (!i) ',
        //    array('!v' => print_r('', true),
        //        '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, throw exceptions if there are problems
    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_review';
    }

}
