<?php
/**
 * @file musth_restws.post.ctrl.inc
 *
 * @brief This file is about the PostResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Post resource
 *
 * Here posts are created and associated to a specific group.
 *
 * Posts are also updated and deleted.
 *
 * Posts belong to group, so group rules apply to them.
 *
 * Group admins, and in the future moderators as well, can edit and delete any post in the group.
 *
 * It's possible to query all posts belonging to a group and a single post as well.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// How many posts in a page, which means how many posts are sent at the same time when a query call is performed
define('MUSICTHEATRE_POSTS_PAGE_LENGTH', 10);

class PostResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //        watchdog('musth_restws', 'W7D001 PostResourceController __construct',
        //            array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Post this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource
     */
    public function propertyInfo() {

        return array(
            'nid' => array(
                'type' => 'int',
                'label' => t('Post node id'),
            ),
            'gid' => array(
                'type' => 'int',
                'label' => t('Node id of the group this post belongs to'),
            ),
            'uid' => array( // We need both uid and name, the uid is needed to check if a user owns a post
                'type' => 'int',
                'label' => t('User id of the user who created the post'),
            ),
            'name' => array( // Username or real name of the author
                'type' => 'text',
                'label' => t('Made-up user name, or real name, of the user who created the post'),
            ),
            'avatar' => array( // Avatar url
                'type' => 'text',
                'label' => t('Avatar'),
            ),
            'published' => array( // true if the post is published
                'type' => 'boolean',
                'label' => t('true if the post is published'),
            ),
            'body' => array( // Post body
                'type' => 'text',
                'label' => t('Post body'),
            ),
            'numcomments' => array( // Number of comments this post has
                'type' => 'int',
                'label' => t('Number of comments'),
            ),
            'changed' => array( // Unix timestamp the post was last changed
                'type' => 'int',
                'label' => t('Last change unix timestamp'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Post resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Post id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $post_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_post',
            $post_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * Actually, in the case of this api, we have paging in place. This means that the count method
     * is called before this one.
     *
     * If the count method returns zero, this method won't be called. Or at least so it should work.
     * It looks like RESTws module is a bit buggy.
     *
     * This method gets one parameter only. It's the node id of the group we want the posts of.
     * It returns all published posts associated to the given group.
     *
     * It's possible to pass the node id of a post if we are interested in a single post.
     *
     * @restfulness Yes. Posts are public
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array We use the page meta control to deliver a single page of the results
     * @throws RestWSException
     * @return array Array containing the ids of the posts we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        // Do we need to check if the user is logged-in or not?
        // Posts are public. We need the user to be logged-in when we create, edit or delete posts,
        // but not when we query them.

        /*watchdog('musth_restws', 'W7D001 PostResourceController::query <br> filters (!f)',
            array('!f' => print_r($filters, true)),
            WATCHDOG_DEBUG);*/

        // Implemented filters:
        // 1) all posts in a group with paging
        //    sorting by date of creation, newest first
        //    both published and unpublished posts are returned (see below)
        // 2) Single post query

        // Why this method returns both published and unpublished posts?
        // It's because we query og_membership objects. These objects represent the fact that a post
        // belongs to a group. We have to use them to find posts belonging to a group
        // But we don't query all og_membership objects in one go. We do paging.
        // We query just, say, 10 og_membership objects. Done this, we load each og_membership object
        // and we discover that some refer to published posts and some refer to unpublished ones.
        // But at that point the 10-og_membership-objects page has already been loaded.
        // We can't load more og_membership objects to find more published posts if we want to
        // discard the unpublished ones.
        // We keep the unpublished posts and send them to Angular after removing their bodies.
        // A more complicated query that fetches a page with published posts only would be possible, it
        // will be for another time.

        $node_ids_of_posts_to_return = array();

        if (!empty($filters['gid'])) {

            // If we have the node id of a group, we have to send back all posts related to that group
            $group_id = $filters['gid'];

            // It may happen that we find no posts because the group of nid $group_id doesn't exist
            // and not because there are no posts. We are not checking this.

            // Managing the paging by calculating the starting point from which to begin to send back results
            // If it's zero, the first page of results will be sent back. Otherwise a following page will be sent.

            if (isset($meta_controls['page']))
                $start = intval($meta_controls['page']) * MUSICTHEATRE_POSTS_PAGE_LENGTH;
            else
                $start = 0;

            //watchdog('musth_restws', 'W7D001 CMMT-Q g56sdft comment query <br> filters (!f) <br> start (!s) <br> meta (!m) ',
            //    array('!f' => print_r($filters, true),
            //          '!s' => print_r($start, true),
            //          '!m' => print_r($meta_controls, true)
            //    ), WATCHDOG_DEBUG);

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            // @attention Problem: what if there are many different types of nodes that can be associated
            // to a group as content?
            // Now we are assuming that there is one content type only associated to groups
            // Only Posts are associated to groups. If another content type is created that can be
            // associated to groups, this query won't be able to distinguish between them

            // We filter OG_STATE_ACTIVE memberships. Actually memberships of posts to groups are
            // always created active. This is just a safety filter in case any non-active membership
            // gets in the way

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'og_membership')
                ->propertyCondition('group_type', 'node', '=')
                ->propertyCondition('gid', $group_id, '=')
                ->propertyCondition('entity_type', 'node', '=') // Posts are node and we assume that only Posts
                                                                // are associated to groups
                ->propertyCondition('state', OG_STATE_ACTIVE, '=')
                ->propertyOrderBy('created', 'DESC') // Newest members first
                ->range($start, MUSICTHEATRE_POSTS_PAGE_LENGTH)  // Serving only the requested page
                ->execute();

            if (!empty($result['og_membership'])) {

                // We have to actually load the membership objects to find what is the post
                // each membership object is about
                $og_memberships = og_membership_load_multiple(array_keys($result['og_membership']));

                // We extract node ids of the group posts
                foreach ($og_memberships as $og_membership) {

                    // The property etid of the membership object $og_membership actually is
                    // the node id of the post
                    // We collect these post ids in the array $node_ids_of_posts_to_return
                    $node_ids_of_posts_to_return[] = $og_membership->etid;
                }
            }

            //            watchdog('musth_restws', 'W7D001 PostResourceController::query node_ids_of_posts_to_return ' .
            //                ' <br> group (!f) <br> node ids of posts (!m) <br> - (!u) ',
            //                array('!f' => print_r($group_id, true),
            //                      '!m' => print_r($node_ids_of_posts_to_return, true),
            //                      '!u' => print_r('', true),
            //                ), WATCHDOG_DEBUG);

        } else if (!empty($filters['nid'])) {

            $post_id = $filters['nid'];

            // We want to know if the post exists before passing its node id to the read method

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'post')
                ->propertyCondition('status', 1) // get the post only if it's published
                ->propertyCondition('nid', $post_id)
                ->execute();

            if (isset($result['node'])) {

                $node_ids_of_posts_to_return = array($post_id);

            } else {

                // We return an empty result to angular

                $node_ids_of_posts_to_return = array();

                watchdog('musth_restws',
                    'W3E365 The requested post does not exist or is not published (!n)',
                    array('!n' => print_r($post_id, true)),
                    WATCHDOG_ERROR);

            }

        } else {

            // No gid given, nothing to return
            // It's an angular bug

            watchdog('musth_restws',
                'W3E308 No group id given [query] (!v)',
                array('!v' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No group id given, Angular bug', 412);
        }

        return $node_ids_of_posts_to_return;
    }

    /**
     * To create a post:
     * * you send a POST http query
     * * you must authenticate because anonymous users can't create posts
     * * send:
     * ** gid (node id of the group the post is about)
     * ** uid (user id of the post author)
     * ** body (the body of the comment as plain text, no html is recognized)
     * * send the fields in json format
     *
     * Posts are checked for spam by using Mollom.
     * If Mollom doesn't work for any reason, posts are all held for moderation.
     *
     * Permissions
     *
     * The logged-in user can create a post. They can't if they are not logged in.
     * We check that the given user id ($values['uid']) is the same as the id of the
     * logged-in user. The user id has to be given explicitly to respect the REST model.
     *
     * The logged-in user has to be a member of the group the post will belong to
     *
     * @see RestWSResourceControllerInterface::create()
     * @restfulness Yes. Uid given explicitly
     * @param array $values Properties to be used to create the post
     * @throws RestWSException
     * @return int Id of the new post
     */
    public function create(array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 CMMT-C 1st comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($values, true),
        //        '!o' => print_r('', true),
        //        '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        if (!$user->uid) {

            // We don't create posts for not logged-in users

            watchdog('musth_restws',
                'W3E309 Anonymous users cannot create posts (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Only logged-in users can create posts', 403);
        }

        // To create a post:
        // nid will be returned
        // gid, sure we need to know which group the new post belongs to
        // uid, pass it explicitly, we will check that it is the same as $user->uid
        // body, we need it

        //watchdog('musth_restws', 'W7D001 CMMT-C uua76763 comment create values (!v) ',
        //   array('!v' => print_r($values, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['gid'])) {

            $group_id_of_the_group_the_post_will_belong_to = $values['gid'];

            if (!og_is_group('node', $group_id_of_the_group_the_post_will_belong_to)) {

                // The group doesn't exist or it exists as a node but it is not a group

                // This is an Angular bug because it should send the id of an existing group
                // It may be that the group has been deleted just a second ago

                watchdog('musth_restws', 'W3E310 The group does not exist or it exists as a node but it is not a group (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The given group is not a group or does not exist at all', 412);

            }

        } else {
            // We need a gid to create a post because a post has to belong to a group

            watchdog('musth_restws',
                'W3E311 No gid provided, we cannot create a post about no group (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No gid provided, cannot create a post with no group', 412);
        }

        if (!empty($values['uid'])) {

            $user_id_of_the_post_author = $values['uid'];

            if ($user_id_of_the_post_author != $user->uid) {

                // The user id of the post author has to be given explicitly to respect the
                // REST model. It is $user_id_of_the_post_author.
                // It also has to be the same as the id of the logged-in user

                watchdog('musth_restws',
                    'W3E312 The logged-in user is not the same as the post creator specified in the given values (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The post author has to be logged-in to post', 403);

            }

            if (!og_is_member('node', // Our groups are all nodes
                $group_id_of_the_group_the_post_will_belong_to, // Group id of the group the user wants to post to
                'user', // We want to check membership for a user
                $user, // The user we want to check membership of
                array(OG_STATE_ACTIVE) // Please consider the user as member only if active
                )) {

                // To be able to create a post the logged-in user has to be member of the group the post
                // will belong to
                // Users who are pending or blocked members of a group cannot post

                watchdog('musth_restws',
                    'W3E313 Post author is not a member of the group the post would belong to (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Post author is not a member of the group the post would belong to', 403);

            }

        } else {

            // The user id of the post author has to be given explicitly to respect the
            // REST model.

            watchdog('musth_restws',
                'W3E314 No uid specified. We need the uid of the post author explicitly specified (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No uid specified. We need the uid of the post author explicitly specified', 412);

        }

        if (!empty($values['body'])) {

            $body = $values['body'];

        } else {

            // We need the post's body of course

            watchdog('musth_restws',
                'W3E315 No body provided, we cant create a post with no body (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No body provided, we cant create a post with no body', 412);
        }

        // Determining if the post is spammy by using Mollom
        // Only 'ham' posts will be published. Any other post will be held for moderation

        $post_may_be_spammy = musth_helper_functions_this_text_is_spammy($body);

        if ($post_may_be_spammy)
            $new_post_status = NODE_NOT_PUBLISHED;
        else
            $new_post_status = NODE_PUBLISHED;

        // Let's invent a title for our post because otherwise in Drupal admin backend
        // you would have posts with no title in the content view

        $post_title = truncate_utf8($body, 29, TRUE);

        $post_properties = array(
            'type' => 'post',
            'uid' => $user_id_of_the_post_author,
            'status' => $new_post_status,
            'comment' => 1, // Comments are allowed for posts
            'promote' => 0, // Posts don't go to the Drupal front page (not that we care...)
        );
        // We create the post
        $post = entity_create('node', $post_properties);

        $post_wrapper = entity_metadata_wrapper('node', $post);

        // By using the wrapper, we do not have to worry about telling Drupal
        // what language we are using. The Entity API handles that for us.
        $post_wrapper->title->set($post_title);

        // For the field body we set only the value. We don't use the summary or the format fields
        $post_wrapper->body->set(array('value' => $body));

        try {

            $post_wrapper->save();

            //throw new Exception('Just a test exception W3E316.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E316 Error when saving a post [create]. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a new post', 500);
        }

        // Adding the post to its group

        $values_for_og_group_function = array(
            'entity_type' => 'node',  // The entity we want to add to the group is a node (the post is a node)
            'entity' => $post,        // This is it
        );

        try {

            // The membership is created active. The post becomes an active member of the group immediately
            // The membership is active either the post is published or not

            og_group('node', // Our groups are all nodes
                $group_id_of_the_group_the_post_will_belong_to, // Group id
                $values_for_og_group_function);

            //throw new Exception('Just a test exception W3E317 .');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E317 Error when assigning a post to a group. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error when adding a post to a group', 500);

        }

        //watchdog('musth_restws', 'W7D001 CMMT-C comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($new_comment_status, true),
        //          '!o' => print_r($comment_may_be_spammy, true),
        //          '!p' => print_r($result, true)),
        //    WATCHDOG_DEBUG);

        if ($post_may_be_spammy) {

            // This is not a true exception because it may happen to have spammy posts
            // We send back to Angular a 406 error so that Angular can tell the user that
            // their post has been held for moderation

            throw new RestWSException('Post saved but held for moderation', 406);

        }

        return $post->nid;
    }

    /**
     * We implement paging in this case.
     *
     * When we do, this method is the first called. The RESTws module will come here first to
     * see if there is something to return. If the count method returns a non-zero result, it
     * will call the query method. If the count method returns zero, the query method won't be
     * called at all (maybe, if RESTws module behaves).
     *
     * If there are no posts for the given group (the one with node id $filters['gid'])
     * or if the group doesn't exist at all, we have that the count method returns zero and
     * the RESTws module will send back a 404 and won't call the query method (maybe).
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * Actually the filters are passed to this method first
     * @throws RestWSException
     * @return int Number of resources to be sent back
     */
    public function count($filters = array()) {

        //watchdog('musth_restws', 'W7D001 CMMT-CNT hy6 comment count <br> filters (!f) <br> ',
        //    array('!f' => print_r($filters, true)), WATCHDOG_DEBUG);

        $count_of_posts_in_the_given_group = 0;

        if (!empty($filters['gid'])) {

            $group_id = $filters['gid'];

            try {

                // If this query returns zero posts, it may be because the group of id $group_id
                // does not exist and not because it has no posts
                // We are not differentiating between these two cases

                // See the query method for more comments about this query

                $query = new EntityFieldQuery();
                $count_of_posts_in_the_given_group = $query->entityCondition('entity_type', 'og_membership')
                    ->propertyCondition('group_type', 'node', '=')
                    ->propertyCondition('gid', $group_id, '=')
                    ->propertyCondition('entity_type', 'node', '=')
                    ->propertyCondition('state', OG_STATE_ACTIVE, '=')
                    ->count()
                    ->execute();

                //throw new Exception('Just a test exception W3E318.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E318 Error in counting posts. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting posts', 500);
            }

        } else if (!empty($filters['nid'])) {

            // We just return 1 here. The query method will check if the requested post
            // actually exists

            return 1;

        } else {

            // No gid given, nothing to return
            // It's an angular bug

            watchdog('musth_restws',
                'W3E308 No group id given [count] (!v)',
                array('!v' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No group id given, Angular bug', 412);
        }

        /*watchdog('musth_restws', 'W7D001 eegheej9ko post count <br> filters (!f) <br> count (!c) ',
            array('!f' => print_r($filters, true),
                  '!c' => print_r($count_of_posts_in_the_given_group, true)),
            WATCHDOG_DEBUG);*/

        return $count_of_posts_in_the_given_group;
    }

    /**
     * We do paging and we send maximum MUSICTHEATRE_POSTS_PAGE_LENGTH at a time.
     * Our page is that long.
     *
     * @param int $client_limit Ignored
     * @return int Maximum MUSICTHEATRE_POSTS_PAGE_LENGTH resources sent in a page
     */
    public function limit($client_limit = NULL) {

        return MUSICTHEATRE_POSTS_PAGE_LENGTH;
    }

    /**
     * This is the function that sends back information about a post
     *
     * If the post is unpublished, we don't send back its body.
     * Why? Because the query method may call the read method about an unpublished post
     * and we decided that Angular will get them anyway. The read method sends unpublished posts
     * without their body, so they are just placeholders. Angular decides if to display them or not.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $id Id of the post we have to send back info about
     * @throws RestWSException
     * @return Post Object containing the information described by the properties (propertyInfo)
     */
    public function read($id) {

        // Should this function check if the logged in user is a member of the group the post belongs to?
        // No, posts are public

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        try {

            $post = node_load($id);

            //throw new Exception('Just a test exception W3E319.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E319 Error in loading post. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in loading post', 500);
        }

        if ($post) {

            $post_wrapper = entity_metadata_wrapper('node', $post);

            // We fetch field_first_name, field_middle_names and field_family_name from the
            // user profile and we send them as real name of the user to be displayed
            // as author of the post.
            // If these three fields are all empty we make a name from the username. The
            // musth_helper_functions_make_username_nice_to_display function helps us with this

            $post_author_user_profile = user_load($post->uid);

            if (isset($post_author_user_profile->field_first_name[LANGUAGE_NONE])) {
                $first_name = $post_author_user_profile->field_first_name[LANGUAGE_NONE][0]['value'];
            } else {
                $first_name = '';
            }

            if (isset($post_author_user_profile->field_middle_names[LANGUAGE_NONE])) {
                $middle_names = $post_author_user_profile->field_middle_names[LANGUAGE_NONE][0]['value'];
            } else {
                $middle_names = '';
            }

            if (isset($post_author_user_profile->field_family_name[LANGUAGE_NONE])) {
                $family_name = $post_author_user_profile->field_family_name[LANGUAGE_NONE][0]['value'];
            } else {
                $family_name = '';
            }

            $composed_real_name = musth_helper_functions_compose_real_name($first_name, $middle_names, $family_name);

            // Usernames created by the registration process are like this one: firstname.surname_156
            // 156 is the user id and we don't want it to show up, it's ugly.
            // For this reason we use the function musth_helper_functions_make_username_nice_to_display that manipulate
            // the username to make it nicer. It cuts the uid part.

            if (empty($composed_real_name))
                $name_to_display_as_post_author =
                    musth_helper_functions_make_username_nice_to_display($post_author_user_profile->name);
            else
                $name_to_display_as_post_author = $composed_real_name;

            $avatar_file_info = $post_author_user_profile->picture;

            //$avatar_image_object = image_load($avatar_file_info->uri);

            if ($avatar_file_info)
                $avatar_url = file_create_url($avatar_file_info->uri);
            else
                $avatar_url = '';

            // In our architecture a post belongs to one group and to one group only
            // This function returns the node id of that group
            // Any exception handling is inside the function
            $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

            // Now we count the comments that have been created about the post

            try {

                $query = new EntityFieldQuery();
                $number_of_comments_to_the_post = $query->entityCondition('entity_type', 'comment')
                    ->propertyCondition('nid', $id)
                    ->propertyCondition('status', 1) // Count published comments only
                    ->count()
                    ->execute();

                //throw new Exception('Just a test exception W3E320.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E320 Error in counting comments. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting comments', 500);
            }

            // The line
            // $post_wrapper->body->value()['value']
            // should be
            // $post_wrapper->body->value()['safe_value']
            // if we allow html in posts.
            // Now we don't, so we use 'value' because 'safe_value' contains html markup even if the
            // original post doesn't

            // About the number of comments when the post is unpublished
            // If the post is unpublished, we tell Angular that there are no comments
            // even if there actually are some. This is to prevent Angular from querying for
            // comments for an unpublished post
            // We will have to refuse to send Angular comments for unpublished nodes anyway

            $post_to_return = new Post($id,
                $group_id_of_the_group_the_post_belongs_to,
                $post_author_user_profile->uid,
                $name_to_display_as_post_author,
                $avatar_url,
                $post->status == 1 ? true : false, // Sending true if the post is published
                $post->status == 1 ? $post_wrapper->body->value()['value'] : '', // Sending the post body only if published
                $post->status == 1 ? intval($number_of_comments_to_the_post) : 0,
                $post->changed
            );

        } else {

            // The post has not been found
            // We throw a 404, but this shouldn't happen. In our client applications we don't
            // call the read method directly. We call the query method.
            // A hacker may use the read method directly or we may use it for debugging purposes.

            watchdog('musth_restws', 'W3E321 Post not found, what is going on? Post id: ' . $id,
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('Post not found, what is going on? Post id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 DFGT LIR-2 LineItemResourceController read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r($line_item, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Post object

        return $post_to_return;
    }

    /**
     * An update is a PUT http query. You use the url: http://musictheatre-production/musth_restws_post/99
     * where 99 is the id of the post you want to update.
     *
     * Any property you want to update has to be in a json object sent in the body of the PUT call.
     *
     * The id of the post we have to update is in the url and is passed to this method as the parameter
     * $id.
     *
     * The array $values may contain:
     * * body: new body of the post
     *
     * The owner of a post can update it. Admins, moderator and anyone who has the permission
     * 'update any post content' can too.
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Yes. User id doesn't participate to this method because the post's owner
     * cannot be changed by using this method.
     * @param int $id Id of the post we have to update
     * @param array $values Associative array of the properties we have to change. In our case we change only the
     * body of the post
     * @throws RestWSException
     */
    public function update($id, array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 8923tytyt CommentResourceController::update comment update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($cid, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['body'])) {

            $body = $values['body'];

        } else {

            watchdog('musth_restws',
                'W3E322 No body provided, a post must have a non-empty one (!c) (!v)',
                array('!c' => print_r($id, true),
                      '!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No body provided, a post must have a non-empty one', 412);

        }

        // Checking if the post exists

        try {

            $post = node_load($id);

            //throw new Exception('Just a test exception W3E323.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E323 Error in loading post [update]. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in loading post', 500);
        }

        if ($post) {

            if ($post->uid != $user->uid) {

                // The logged-in user doesn't own the post
                // We have to check if they have permission to update any post
                // at least for the group the post belongs to

                $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

                if (!og_user_access('node',
                                   $group_id_of_the_group_the_post_belongs_to,
                                   'update any post content',
                                   $user)) {
                    // The user does not own the post and does not have a permission to
                    // update any post content
                    // We refuse to let the user update the post

                    watchdog('musth_restws',
                        'W3E324 A user wants to update a post but they have no permission ' .
                        '<br> post id (!i) <br> user id (!u)',
                        array('!i' => print_r($id, true),
                              '!u' => print_r($user->uid, true)
                        ),
                        WATCHDOG_ERROR);

                    throw new RestWSException('The user has no permission to update the post. Id: ' . $id, 403);

                }

            }

            // Now updating the post, but first we check if it's a spammy post

            $post_may_be_spammy = musth_helper_functions_this_text_is_spammy($body);

            if ($post_may_be_spammy)
                $new_post_status = NODE_NOT_PUBLISHED;
            else
                $new_post_status = NODE_PUBLISHED;

            // Updating the timestamp of last change because we want the updated post to show up at the top
            // of the results
            $post->changed = time();
            $post->status = $new_post_status;

            $post_wrapper = entity_metadata_wrapper('node', $post);

            // By using the wrapper, we do not have to worry about telling Drupal
            // what language we are using. The Entity API handles that for us.

            // For the field body we set only the value. We don't use the summary or the format fields
            $post_wrapper->body->set(array('value' => $body));

            // Let's update the title as well. It's useful for editors

            $post_title = truncate_utf8($body, 29, TRUE);

            $post_wrapper->title->set($post_title);

            try {

                node_save($post);

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E316 Error when saving a post [update]. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in updating a post', 500);
            }

            // This is not a true exception because it may happen to have spammy posts
            // We send back to Angular a 406 error so that Angular can tell the user that
            // their post has been held for moderation

            if ($post_may_be_spammy)
                throw new RestWSException('Post updated but held for moderation', 406);

        } else {

            watchdog('musth_restws', 'W3E325 Post not found when updating (!c) (!f) ',
                array('!c' => print_r($id, true),
                      '!f' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Post not found, post id: ' . $id, 404);
        }

        //watchdog('musth_restws', 'W7D001 8765 line item update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, an update call returns nothing if it's successful
    }

    /**
     * This api deletes a post given its id.
     *
     * The owner can delete a post. Admins, moderator and anyone who has the permission
     * 'delete any post content' can too.
     *
     * @see RestWSResourceControllerInterface::delete()
     *
     * @restfulness Yes. User id is used for checking only
     * @param int $id Id of the post to delete
     * @throws RestWSException
     */
    public function delete($id) {

        global $user;

        try {

            $post = node_load($id);

            //throw new Exception('Just a test exception W3E323.');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E323 Error in loading post [delete]. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in loading post', 500);
        }

        if ($post) {

            if ($post->uid != $user->uid) {

                // The logged-in user doesn't own the post
                // We have to check if they have permission to delete any post
                // at least for the group the post belongs to

                $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

                if (!og_user_access('node',
                    $group_id_of_the_group_the_post_belongs_to,
                    'delete any post content',
                    $user)) {
                    // The user does not own the post and does not have a permission to
                    // update any post content in the group of id $group_id_of_the_group_the_post_belongs_to
                    // We refuse to let the user update the post

                    watchdog('musth_restws',
                        'W3E326 A user wants to delete a post but they have no permission ' .
                        '<br> post id (!c) <br> user id (!u)',
                        array('!c' => print_r($id, true),
                              '!u' => print_r($user->uid, true)
                        ),
                        WATCHDOG_ERROR);

                    throw new RestWSException('The user has no permission to delete the post. Id: ' . $id, 403);

                }

            }

            // Now deleting the post

            try {

                node_delete($id);

                //throw new Exception('Just a test exception W3E327.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E327 Error when deleting a post. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in deleting a post', 500);
            }

        } else {

            watchdog('musth_restws', 'W3E328 Post not found when deleting (!c) (!f) ',
                array('!c' => print_r($id, true),
                    '!f' => print_r('', true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Post not found, post id: ' . $id, 404);
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

        return 'musth_restws_post';
    }

}

/**
 * This function finds the group a post belongs to.
 *
 * In our architecture a post belongs to one group and to one group only.
 *
 * If this function finds that a post belongs to two or more groups, it takes the first group
 * it finds as the one the post belongs to.
 *
 * @param $post Post Post we want to know the group it belongs to
 * @return int Id of the group the post belongs to or zero if none
 * @throws RestWSException
 */
function musth_restws_find_post_group($post) {

    $group_id_of_the_group_the_post_belongs_to = 0;

    // This is example of $array_of_groups_the_post_is_a_member_of
    // In this case the post is member of two groups, those of id 932 and 936
    // This is wrong, of course, because in our model a post can be member of one group only
    // The indexes 20 and 36 and the ids of the og_membership objects that store the membership
    // of the post to its groups
    //    Array (
    //        [node] => Array (
    //            [20] => 932
    //            [36] => 936
    //        )
    //    )
    // We will get one group only and ignore any other

    try {

        $array_of_groups_the_post_is_a_member_of = og_get_entity_groups('node', $post);

        //throw new Exception('Just a test exception W3E329.');

    }
    catch (Exception $e) {

        watchdog('musth_restws', 'W3E329 Error when calling og_get_entity_groups. Error message: (!e)',
            array('!e' => print_r($e->getMessage(), true)),
            WATCHDOG_ERROR);

        // Get out of here!
        throw new RestWSException('Error when calling og_get_entity_groups', 500);
    }

    if (!empty($array_of_groups_the_post_is_a_member_of)) {
        if (isset($array_of_groups_the_post_is_a_member_of['node'])) {

            $group_ids_of_groups_the_post_is_a_member_of =
                array_values($array_of_groups_the_post_is_a_member_of['node']);

            if (count($group_ids_of_groups_the_post_is_a_member_of) > 0)
                $group_id_of_the_group_the_post_belongs_to = intval($group_ids_of_groups_the_post_is_a_member_of[0]);

            if (count($group_ids_of_groups_the_post_is_a_member_of) > 1) {
                // The post $post seems to belongs to more than one group
                // This shouldn't happen in our architecture

                watchdog('musth_restws', 'W3E330 Found a post that belongs to two or more groups. ' .
                                          'It should not happen. Post: (!p) ',
                    array('!p' => print_r($post, true)),
                    WATCHDOG_ERROR);

            }

            //
            //            watchdog('musth_restws', 'W7D001 musth_restws_find_post_group <br> group_ids_of_groups_the_post_is_a_member_of (!v) <br> og_get_entity_groups (!i) ',
            //                array('!v' => print_r($group_ids_of_groups_the_post_is_a_member_of, true),
            //                    '!i' => print_r($array_of_groups_the_post_is_a_member_of, true)),
            //                WATCHDOG_DEBUG);

        }

    }

    return $group_id_of_the_group_the_post_belongs_to;
}

