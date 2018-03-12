<?php
/**
 * @file musth_restws.comment.ctrl.inc
 *
 * @brief This file is about the CommentResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Comment resource
 *
 * Here comments associated to a programme or a post are created, changed and deleted.
 *
 * It's possible to read a single comment and all the comments associated to a programme or post.
 *
 * Only logged-in users can create, update and delete comments.
 *
 * Everyone can read comments, but only if they are published.
 *
 * Additional permission are required to comment on a post. Users who want to comment on a post
 * have to be members of the group the post belongs to.
 *
 * If they are admins, they can edit or delete any comment created on a post that belongs to the group
 * they are admins of.
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

// How many comments in a page, which means how many comments are sent at the same time when a query call is performed
define('MUSICTHEATRE_COMMENTS_PAGE_LENGTH', 5);

class CommentResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //watchdog('musth_restws', 'W7D001 7365RF CommentResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Comment this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource LineItem
     */
    public function propertyInfo() {

        /*
        Table: comment
        Columns:
        cid	int(11) PK AI comment id
        pid	int(11) parent id for threaded comments. We don't use this field
        nid	int(11) node id of the programme the comment is about
        uid	int(11) user id of the user wrote the comment
        subject	    varchar(64)   We don't use this field
        hostname	varchar(128)
        created	int(11)
        changed	int(11)
        status	tinyint(3) UN   The published status of a comment. (0 = Not Published, 1 = Published)
        thread	varchar(255)    The "vancode" representation of the comment's place in a thread.
        name	varchar(60)     The comment author's name. We make this name up from the real name and the username of the user
        mail	varchar(64)     Not used. In our case the email is the one in the user's profile
        homepage	varchar(255)  Not used
        language	varchar(12)   Not used
        */

        return array(
            'cid' => array(
                'type' => 'int',
                'label' => t('Comment id'),
            ),
            'nid' => array(
                'type' => 'int',
                'label' => t('Node id of the node this comment is about'),
            ),
            'uid' => array( // We need both uid and name, the uid is needed to check if a user owns a comment
                'type' => 'int',
                'label' => t('User id of the user who created the comment'),
            ),
            'name' => array(
                'type' => 'text',
                'label' => t('Made-up user name, or real name, of the user who created the comment'),
            ),
            'avatar' => array( // Avatar url
                'type' => 'text',
                'label' => t('Avatar'),
            ),
            'body' => array(
                'type' => 'text',
                'label' => t('Comment body'),
            ),
            'changed' => array( // Unix timestamp the comment was last changed
                'type' => 'int',
                'label' => t('Last change unix timestamp'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Comment resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Comment id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $comment_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_comment',
            $comment_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * Actually, in the case of this api, we have paging in place. This means that the count method
     * is called before this one.
     *
     * If the count method returns zero, this method won't be called. Or maybe it will anyway
     * because RESTws module seems to be a bit buggy.
     *
     * This method gets one parameter only. It's the node id of the programme or post we want comments about.
     *
     * It returns all published comments associated to the given programme or post.
     *
     * @restfulness Completely
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array We use the page meta control to deliver a single page of results
     * @throws RestWSException
     * @return array Array containing the ids of the comments we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        // Do we need to check if the user is logged-in or not?
        // Comments are public. We need the user to be logged-in when we create, edit or delete comments,
        // but not when we query them.

//        watchdog('musth_restws', 'W7D001 CMMT-Q 78yg comment query <br> filters (!f) <br> ',
//            array('!f' => print_r($filters, true)), WATCHDOG_DEBUG);

        // Implemented filters:
        // 1) All comments for a node whose node id is given ($filters['nid'])
        //    Only published comments are returned (status==1) and they are sorted by the date and time
        //    of last change (field 'changed') so that the most recently changed ones come first.

        if (!empty($filters['nid'])) {
            // If we have the node id of a node, we have to send back all comment related to that node
            $nid = $filters['nid'];

            // Checking that the node exists and is published
            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('nid', $nid)
                ->propertyCondition('status', NODE_PUBLISHED) // Count the node only if published
                ->count()
                ->execute();

            if ($result == 0) {

                // This is likely to be an Angular bug. The node the comments are about should exist
                // and be published and Angular should know that it is
                // It may also be that the node has just been deleted or unpublished

                watchdog('musth_restws',
                    'W3E331 Angular wants comments made on a node that does not ' .
                    'exist or is unpublished (!f)',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Angular wants comments made on a node that does not exist or is unpublished', 412);

            }

            // Managing the paging by calculating the starting point from which to begin to send back results
            // If it's zero, the first page of results will be sent back. Otherwise a following page will be sent.

            if (isset($meta_controls['page']))
                $start = intval($meta_controls['page']) * MUSICTHEATRE_COMMENTS_PAGE_LENGTH;
            else
                $start = 0;

            //watchdog('musth_restws', 'W7D001 CMMT-Q g56sdft comment query <br> filters (!f) <br> start (!s) <br> meta (!m) ',
            //    array('!f' => print_r($filters, true),
            //          '!s' => print_r($start, true),
            //          '!m' => print_r($meta_controls, true)
            //    ), WATCHDOG_DEBUG);

            // No exception handling here because we did it in the count method where we performed basically
            // the same query

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'comment')
                ->propertyCondition('nid', $nid)
                ->propertyCondition('status', COMMENT_PUBLISHED) // Get published comments only
                ->propertyOrderBy('changed', 'DESC')
                ->range($start, MUSICTHEATRE_COMMENTS_PAGE_LENGTH)
                ->execute();

            if (isset($result['comment'])) {

//                watchdog('musth_restws', 'W7D001 CMMT-Q eite7veish comment query <br> filters (!f) <br> start (!s) <br> meta (!m) <br> res (!r) ',
//                    array('!f' => print_r($filters, true),
//                          '!s' => print_r($start, true),
//                          '!m' => print_r($meta_controls, true),
//                          '!r' => print_r($result['comment'], true)
//                    ), WATCHDOG_DEBUG);

                return array_keys($result['comment']);
            } else if ($start > 0) {

                // This shouldn't happen
                // RESTws should calculate pages correctly thanks to a fix done
                // We shouldn't have a situation in which we are serving an empty result set because RESTws should
                // reject queries with a too high page number before getting here
                // The fix that makes RESTws work correctly is described in a page titled "Emergency fix to RESTws"
                // in cmort-intranet
                // If RESTws module got updated, the fix has gone lost

                watchdog('musth_restws',
                    'W3E338 RESTws bug when paging <br> filters (!f) <br> start (!s) <br> meta (!m) <br> result (!r) ',
                    array('!f' => print_r($filters, true),
                          '!s' => print_r($start, true),
                          '!m' => print_r($meta_controls, true),
                          '!r' => print_r($result['comment'], true)),
                    WATCHDOG_ERROR);

                // No exception, we send back an empty result set and hope that someone sees the watchdog
            }

        } else {

            watchdog('musth_restws',
                'W3E332 No node id given (!f)',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No node id given', 412);

        }

        // No comments for the given node or the node doesn't exist or is unpublished

        return array();
    }

    /**
     * To create a comment:
     * * you send a POST http query
     * * you must authenticate because anonymous users can't create comments
     * * send: nid (node id of the node the comment is about)
     * and body (the body of the comment as plain text, no html is recognized)
     * * send the fields in json format
     *
     * Comments are checked for spam by using Mollom.
     * If Mollom doesn't work for any reason, all comments are held for moderation.
     *
     * If the comment is about a post, the user can create it only if they are members of the
     * group the post belongs to.
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @restfulness Well, we should send the uid explicitly.
     * Doing so, it's explicit who is the comment owner and we don't relay on the logged-in user info.
     * We use the latter only to check.
     * @param array $values Properties to be used to create the comment
     * @throws RestWSException
     * @return int Id of the new comment
     */
    public function create(array $values) {

        global $user;

//        watchdog('musth_restws', 'W7D001 CMMT-C 1st comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
//            array('!v' => print_r($values, true),
//                '!o' => print_r('', true),
//                '!p' => print_r('', true)),
//            WATCHDOG_DEBUG);

        if (!$user->uid) {

            // We don't create comments for not logged-in users

            watchdog('musth_restws',
                'W3E167 We dont allow anonymous users to create comments (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Only logged-in users can create comments', 403);
        }

        // To create a comment:
        // cid will be returned
        // nid, sure we need to know which node the new comment is about
        // uid, it will be $user->uid
        // subject, for now we are working with no subjects, so this is always empty
        // body, we need it

        // @attention it would be great to send the comment author's user id explicitly to
        // respect the REST model

        //watchdog('musth_restws', 'W7D001 CMMT-C uua76763 comment create values (!v) ',
        //   array('!v' => print_r($values, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['nid'])) {

            $nid = $values['nid'];

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'node')
                ->propertyCondition('nid', $nid)
                ->count()
                ->execute();

            if (!$result) {

                watchdog('musth_restws',
                    'W3E168 The node does not exist, we cant create a comment about nothing (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('The node does not exist, we cant create a comment about nothing', 412);
            }

        } else {
            // We need a nid to create a comment because a comment has to be about a programme or a post

            watchdog('musth_restws',
                'W3E169 No nid provided, we cant create a comment about nothing (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No nid provided, cant create a comment about nothing', 412);
        }

        if (!empty($values['body'])) {

            $body = $values['body'];

        } else {

            watchdog('musth_restws',
                'W3E170 No body provided, we cant create a comment with no body (!v)',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No body provided, cant create a comment with no body', 412);
        }

        // Now we check if the node the comment is about is a post because in this case the user
        // has to be member of the group the post belongs to

        try {

            $query = new EntityFieldQuery();
            $node_is_a_post = $query->entityCondition('entity_type', 'node')
                ->entityCondition('bundle', 'post')
                ->propertyCondition('nid', $nid)
                ->count()
                ->execute();

            //throw new Exception('Just a test exception W3E333???? .');

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E333 Error when checking node type. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error when checking node type', 500);
        }

        //        watchdog('musth_restws', 'W7D001 CMMT-C comment $node_is_a_post <br/> (!v) <br/> (!o) <br/> (!p) ',
        //            array('!v' => print_r($values, true),
        //                  '!o' => print_r('', true),
        //                  '!p' => print_r($node_is_a_post, true)),
        //            WATCHDOG_DEBUG);

        if ($node_is_a_post) {

            try {

                $post = node_load($nid);

                //throw new Exception('Just a test exception ???? W3E334.');

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E334 Error in loading post [create]. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in loading post', 500);
            }

            $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

            if (!og_is_member('node', // Our groups are all nodes
                $group_id_of_the_group_the_post_belongs_to, // Group id of the group the post belongs to
                'user', // We want to check membership for a user
                $user, // The user we want to check membership of
                array(OG_STATE_ACTIVE) // Please consider the user as member only if active
                )) {

                // To be able to create a comment on a post the logged-in user has to be member of the
                // group the post belongs to
                // Users who are pending or blocked members of a group cannot comment on a post

                watchdog('musth_restws',
                    'W3E335 Comment author is not a member of the group the commented post belongs to (!v)',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Comment author is not a member of the group the commented post belongs to', 403);

            }

        }

        // Determining if the comment is spammy by using Mollom
        // Only 'ham' comments will be published. Any other comment will be held for moderation

        $comment_may_be_spammy = musth_helper_functions_this_text_is_spammy($body);

        if ($comment_may_be_spammy)
            $new_comment_status = COMMENT_NOT_PUBLISHED;
        else
            $new_comment_status = COMMENT_PUBLISHED;

        // Creating the new comment object

        $new_comment = (object) array(
            'nid' => $nid,
            'cid' => 0,
            'pid' => 0,
            'uid' => $user->uid,
            'mail' => '',
            'is_anonymous' => 0,
            'homepage' => '',
            'status' => $new_comment_status,
            'subject' => '',
            'language' => LANGUAGE_NONE,
            'comment_body' => array(
                LANGUAGE_NONE => array(
                    0 => array (
                        'value' => $body,
                        'format' => 'filtered_html'
                    )
                )
            ),
        );

        try {

            // The comment is first prepared (comment_submit) and than saved
            // The preparation fills in some fields to suit the commenting system
            comment_submit($new_comment);
            comment_save($new_comment);

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E172 Error in saving a new comment. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a new comment', 500);
        }

        //watchdog('musth_restws', 'W7D001 CMMT-C comment create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //    array('!v' => print_r($new_comment_status, true),
        //          '!o' => print_r($comment_may_be_spammy, true),
        //          '!p' => print_r($result, true)),
        //    WATCHDOG_DEBUG);

        if ($comment_may_be_spammy) {

            // This is not a true exception because it may happen to have spammy comments
            // We send back to Angular a 406 error so that Angular can tell the user that
            // their comment has been held for moderation

            throw new RestWSException('Comment saved but held for moderation', 406);

        }

        return $new_comment->cid;
    }

    /**
     * We implement paging in this case.
     *
     * When we do, this method is the first called. The RESTws module will come here first to
     * see if there is something to return. If the count method returns a non-zero result, it
     * will call the query method. If the count method returns zero, the query method won't be
     * called at all.
     *
     * So, if there are no comments for the given programme or post (the one with node id $filters['nid'])
     * or if the programme or post doesn't exist at all, we have that the count method returns zero and
     * the RESTws module will send back a 404 and won't call the query method.
     *
     * Maybe this is not actually true because RESTws module seems to be a bit buggy. Did
     * they fix it?
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * Actually the filters are passed to this method first
     * @throws RestWSException
     * @return int Number of resources to be sent back
     */
    public function count($filters = array()) {

        //watchdog('musth_restws', 'W7D001 CMMT-CNT hy6 comment count <br> filters (!f) <br> ',
        //    array('!f' => print_r($filters, true)), WATCHDOG_DEBUG);

        $result = 0;

        if (!empty($filters['nid'])) {

            $nid = $filters['nid'];

            try {

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'comment')
                    ->propertyCondition('nid', $nid)
                    ->propertyCondition('status', 1) // Get published comments only
                    ->count()
                    ->execute();

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E173 Error in counting comments. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in counting comments', 500);
            }

        }

//        watchdog('musth_restws', 'W7D001 CMMT-CNT ahghieNg9a comment count <br> filters (!f) <br> count (!c) ',
//            array('!f' => print_r($filters, true),
//                  '!c' => print_r($result, true)), WATCHDOG_DEBUG);

        // If no filter 'nid' is given, sure there is no comment we can send
        return $result;
    }

    /**
     * We do paging and we send maximum MUSICTHEATRE_COMMENTS_PAGE_LENGTH at a time.
     * Our page is that long.
     *
     * @param int $client_limit Ignored
     * @return int Maximum MUSICTHEATRE_COMMENTS_PAGE_LENGTH sent in a page
     */
    public function limit($client_limit = NULL) {

        return MUSICTHEATRE_COMMENTS_PAGE_LENGTH;
    }

    /**
     * This is the function that sends back information about a comment
     *
     * @attention We may want not to send back unpublished comments. This can happen if this method is called directly.
     * The frontend is not doing this, but hackers may do it. It's not critical because the most that they can get is
     * an unpublished comment.
     *
     * It's possible to have unpublished comments. They are comments that Mollom marked as spammy and that have been
     * held for moderation.
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $cid Id of the comment we have to send back info about
     * @throws RestWSException
     * @return Comment Object containing the information described by the properties (propertyInfo)
     */
    public function read($cid) {

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // @attention this function (comment_load) gets an optional parameter about caching, do I have to use it?
        // It looks like comments are not cached, should we cache them? I don't think so

        $comment = comment_load($cid);

        if ($comment) {

            $comment_wrapper = entity_metadata_wrapper('comment', $comment);

            // We fetch field_first_name, field_middle_names and field_family_name from the
            // user profile and we send them as real name of the user to be displayed
            // as author of the comment.
            // If these three fields are all empty we make a name from the username. The
            // musth_helper_functions_make_username_nice_to_display function helps us with this

            $comment_author_user_profile = user_load($comment->uid);

            if (isset($comment_author_user_profile->field_first_name[LANGUAGE_NONE])) {
                $first_name = $comment_author_user_profile->field_first_name[LANGUAGE_NONE][0]['value'];
            } else {
                $first_name = '';
            }

            if (isset($comment_author_user_profile->field_middle_names[LANGUAGE_NONE])) {
                $middle_names = $comment_author_user_profile->field_middle_names[LANGUAGE_NONE][0]['value'];
            } else {
                $middle_names = '';
            }

            if (isset($comment_author_user_profile->field_family_name[LANGUAGE_NONE])) {
                $family_name = $comment_author_user_profile->field_family_name[LANGUAGE_NONE][0]['value'];
            } else {
                $family_name = '';
            }

            $composed_real_name = musth_helper_functions_compose_real_name($first_name, $middle_names, $family_name);

            // $comment->name is the username and it is not OK because there may be the uid at the end of the name
            // Usernames created by the registration process are like this one: firstname.surname_156
            // 156 is the user id and we don't want it to show up, it's ugly.
            // For this reason we use the function musth_helper_functions_make_username_nice_to_display that manipulate
            // the username to make it nicer. It cuts the uid part.

            if (empty($composed_real_name))
                $name_to_display_as_comment_author =
                    musth_helper_functions_make_username_nice_to_display($comment->name);
            else
                $name_to_display_as_comment_author = $composed_real_name;

            $avatar_file_info = $comment_author_user_profile->picture;

            //$avatar_image_object = image_load($avatar_file_info->uri);

            if ($avatar_file_info)
                $avatar_url = file_create_url($avatar_file_info->uri);
            else
                $avatar_url = '';

            // The line
            // $comment_wrapper->comment_body->value()['value']
            // should be
            // $comment_wrapper->comment_body->value()['safe_value']
            // if we allow html in comments.
            // Now we don't, so we use 'value' because 'safe_value' contains html markup even if the
            // original comment doesn't

            $comment_to_return = new Comment($cid,
                $comment->nid,
                $comment->uid,
                $name_to_display_as_comment_author,
                $avatar_url,
                $comment_wrapper->comment_body->value()['value'],
                $comment->changed
            );

        } else {

            // The comment has not been found
            // We throw a 404, but this shouldn't happen. In our client applications we don't
            // call the read method directly. We call the query method.
            // A hacker may use the read method directly or we may use it for debugging purposes.

            watchdog('musth_restws', 'W3E174 Comment not found, what is going on? Comment id: ' . $cid,
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('Comment not found, what is going on? Comment id: ' . $cid, 404);
        }

        //watchdog('musth_restws', 'W7D001 DFGT LIR-2 LineItemResourceController read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r($line_item, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Comment object

        return $comment_to_return;
    }

    /**
     * An update is a PUT http query. You use the url: http://musictheatre-production/musth_restws_comment/99
     * where 99 is the id of the comment you want to update.
     *
     * Any property you want to update has to be in a json object sent in the body of the PUT call.
     *
     * So, the id of the comment we have to update is in the url and is passed to this method as the parameter
     * $cid.
     *
     * The array $values may contain:
     * * body: new body of the comment
     *
     * @attention Consider that we ignore comment subjects completely. Maybe we will want to change this
     * to make it easier for editors to find comments.
     *
     * The owner of a comment can update it. Users who have the permission 'update any post content' can too, if
     * the node the comment is about is actually a post and the user has said permission for the group
     * the post belongs to.
     *
     * @see RestWSResourceControllerInterface::update()
     * @restfulness Yes. If the user is not authorised, use of this method is denied, but this doesn't make the
     * method not restful.
     * @param int $cid Id of the comment we have to update
     * @param array $values Associative array of the properties we have to change. In our case we change only the
     * body of the comment
     * @throws RestWSException
     */
    public function update($cid, array $values) {

        global $user;

        //watchdog('musth_restws', 'W7D001 8923tytyt CommentResourceController::update comment update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($cid, true)),
        //    WATCHDOG_DEBUG);

        if (!empty($values['body'])) {

            $body = $values['body'];

        } else {

            watchdog('musth_restws',
                'W3E175 No body provided, a comment must have a non-empty one (!c) (!v)',
                array('!c' => print_r($cid, true),
                      '!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No body provided, a comment must have a non-empty one', 412);

        }

        // Checking if the comment exists

        $comment = comment_load($cid);

        if ($comment) {

            if ($comment->uid != $user->uid) {

                // The logged-in user does not own the comment, but they may happen to be
                // admins for the group the post belongs to. This in case the node the comment
                // is about is actually a post

                // Checking if the node the comment is about is actually a post
                $query = new EntityFieldQuery();
                $node_comment_is_about_is_a_post = $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'post')
                    ->propertyCondition('nid', $comment->nid)
                    ->count()
                    ->execute();

                if ($node_comment_is_about_is_a_post) {

                    try {

                        $post = node_load($comment->nid);

                    }
                    catch (Exception $e) {

                        watchdog('musth_restws', 'W3E334 Error in loading post [update]. Error message: (!e)',
                            array('!e' => print_r($e->getMessage(), true)),
                            WATCHDOG_ERROR);

                        // Get out of here!
                        throw new RestWSException('Error in loading post', 500);
                    }

                    $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

                    if (!og_user_access('node',
                        $group_id_of_the_group_the_post_belongs_to,
                        'update any post content',
                        $user)) {

                        // The user does not own the comment and does not have a permission to
                        // update any post content
                        // We refuse to let the user update the comment

                        watchdog('musth_restws',
                            'W3E335 Comment author is not a member of the group the commented post belongs to ' .
                            '<br> comment id (!i) <br> user id (!u)',
                            array('!i' => print_r($cid, true),
                                  '!u' => print_r($user->uid, true)
                            ),
                            WATCHDOG_ERROR);

                        throw new RestWSException('The user has no permission to update the comment. cid: ' . $cid, 403);

                    }

                } else {

                    // The node the comment is about is not a post and the user does not own the comment
                    // Let's throw an exception

                    watchdog('musth_restws',
                        'W3E176 Only the owner of a comment can update it (!c) (!u) ',
                        array('!c' => print_r($cid, true),
                              '!u' => print_r($user, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Cannot update comment, the logged-in user does not own it. Cid: ' . $cid, 403);
                }

            }

            // Now updating the comment, but first we check if it's a spammy comment

            $comment_may_be_spammy = musth_helper_functions_this_text_is_spammy($body);

            if ($comment_may_be_spammy)
                $comment->status = COMMENT_NOT_PUBLISHED;
            else
                $comment->status = COMMENT_PUBLISHED;

            // Updating the timestamp of last change because we want the updated comment to show up at the top
            // of the results
            $comment->changed = time();

            $comment_wrapper = entity_metadata_wrapper('comment', $comment);

            $comment_wrapper->comment_body->value->set($body);

            try {

                // No comment preparation needed here (comment_submit)
                comment_save($comment);

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E177 Error in updating a comment. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in updating a comment', 500);
            }

            // This is not a true exception because it may happen to have spammy comments
            // We send back to Angular a 406 error so that Angular can tell the user that
            // their comment has been held for moderation

            if ($comment_may_be_spammy)
                throw new RestWSException('Comment updated but held for moderation', 406);

        } else {

            watchdog('musth_restws', 'W3E178 Comment not found when updating (!c) (!f) ',
                array('!c' => print_r($cid, true),
                      '!f' => print_r($values, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Comment not found, comment id: ' . $cid, 404);
        }

        //watchdog('musth_restws', 'W7D001 8765 line item update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, an update call returns nothing if it's successful
    }

    /**
     * This api deletes a comment given its id.
     *
     * The owner of a comment can delete it.
     * Users who have the permission 'delete any post content' can too, if
     * the node the comment is about is actually a post and the user has said permission for the group
     * the post belongs to.
     *
     * @see RestWSResourceControllerInterface::delete()
     * @restfulness Yes. If the user is not authorised, use of this method is denied, but this doesn't make the
     * method not restful.
     * @param int $cid Id of the comment to delete
     * @throws RestWSException
     */
    public function delete($cid) {

        global $user;

        $comment = comment_load($cid);

        if ($user->uid == 0) {

            // Got to be logged in if you want to delete a comment

            watchdog('musth_restws',
                'W3E336 User not logged in, we cant delete any comment' .
                '<br> comment id (!i) ',
                array('!i' => print_r($cid, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('A user wants to delete a comment but they are not even logged in. cid: ' . $cid, 403);

        }

        //watchdog('musth_restws', 'W7D001 7yhtggg CommentResourceController::delete values (!u) (!i) ',
        //    array('!u' => print_r($comment, true),
        //        '!i' => print_r($cid, true)),
        //    WATCHDOG_DEBUG);

        if ($comment) {

            if ($comment->uid != $user->uid) {

                // Checking if the node the comment is about is actually a post
                $query = new EntityFieldQuery();
                $node_comment_is_about_is_a_post = $query->entityCondition('entity_type', 'node')
                    ->entityCondition('bundle', 'post')
                    ->propertyCondition('nid', $comment->nid)
                    ->count()
                    ->execute();

                if ($node_comment_is_about_is_a_post) {

                    try {

                        $post = node_load($comment->nid);

                    }
                    catch (Exception $e) {

                        watchdog('musth_restws', 'W3E334 Error in loading post. Error message: (!e)',
                            array('!e' => print_r($e->getMessage(), true)),
                            WATCHDOG_ERROR);

                        // Get out of here!
                        throw new RestWSException('Error in loading post', 500);
                    }

                    $group_id_of_the_group_the_post_belongs_to = musth_restws_find_post_group($post);

                    if (!og_user_access('node',
                        $group_id_of_the_group_the_post_belongs_to,
                        'delete any post content',
                        $user)) {

                        // The user does not own the post and does not have a permission to
                        // delete any post content
                        // If they have a permission to delete any post, we allow them to delete comments
                        // on posts as well. But they don't have such a permission in this case
                        // We refuse to let the user delete the comment

                        watchdog('musth_restws',
                            'W3E337 A user wants to delete a comment but they have no permission ' .
                            '<br> comment id (!i) <br> user id (!u)',
                            array('!i' => print_r($cid, true),
                                  '!u' => print_r($user->uid, true)
                            ),
                            WATCHDOG_ERROR);

                        throw new RestWSException('The user has no permission to delete the comment. cid: ' . $cid, 403);

                    }

                } else {

                    // The node the comment is about is not a post and the user does not own the comment
                    // Let's throw an exception

                    watchdog('musth_restws',
                        'W3E176 Only the owner of a comment can delete it (!c) (!u) ',
                        array('!c' => print_r($cid, true),
                            '!u' => print_r($user, true)),
                        WATCHDOG_ERROR);

                    throw new RestWSException('Cannot delete comment, the logged-in user does not own it. Cid: ' . $cid, 403);
                }

            }

            try {

                comment_delete($cid);

            }
            catch (Exception $e) {

                watchdog('musth_restws', 'W3E180 Error in deleting a comment. Error message: (!e)',
                    array('!e' => print_r($e->getMessage(), true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Error in deleting a comment', 500);
            }

        } else {

            watchdog('musth_restws', 'W3E181 Comment not found when deleting (!c) (!u) ',
                array('!c' => print_r($cid, true),
                      '!u' => print_r($user, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Comment not found, comment id: ' . $cid, 404);
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

        return 'musth_restws_comment';
    }

}
