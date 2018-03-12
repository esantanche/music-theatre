/**
 * @ngdoc overview
 * @name ngPostDir
 * @description @todo doc The ngCommentDir directive renders a comment wherever needed.
 * It controls editing, posting and deleting it. Actually these functions are started here, but
 * performed by the controller. Only editing is completely controlled here.
 * The template frontends/angular/app/templates/post.html provides the html markup to be used
 * to render a comment.
 */

'use strict';

var ngPostDir = angular.module('ngPostDir', []);

/**
 * @ngdoc directive
 * @name ngPostDir.directive:ngPost
 * @restrict E
 * @description @todo doc When rendering a comment there are many things to control.
 *
 * They are:
 *
 * * editing, we make the comment editable or not
 * * cancelling, we allow for cancelling the changes done and go back to the comment as it was before the changes
 * * posting, we call the function in the controller that will post the comment to the server for it to store it
 * * deleting, we call the function in the controller that will delete the comment by calling the appropriate
 * rest api
 * * focusing, we focus on the input field if requested to do so
 * * flagging, we call the function in the controller that will mark the comment as abusive
 * by calling the appropriate rest api
 * * replying, when the user wants to reply to a comment, they click the reply button and the name of the
 * author of the comment is copied to the field where new comments are entered. All this is done by a
 * function in the controller. Here we just call it.
 *
 * @example
 *    <pre>
         <div ng-comment @todo fix here
         comment="comment"
         user="user"
         on-post="post(comment)"
         on-delete="delete(comment)"
         on-abuse="abuse(comment)"
         on-reply="reply(comment)"
         focusonpostfield="localmovefocustopostfield"
         on-suspend-refresh="commentsforminfo.suspend_refresh = true"
         on-restart-refresh="commentsforminfo.suspend_refresh = false">
         </div>

         <div ng-comment
         comment="commentsforminfo.newcomment"
         user="user"
         oneditmode="true"
         focusonpostfield="commentsforminfo.movefocustopostfield"
         alwaysonedit="true"
         on-post="post(commentsforminfo.newcomment)">
         </div>
 *    </pre>
 */
ngPostDir.directive('ngPost', [ 'Dialoghelper',
                                '$timeout',
                                'Settings', function(Dialoghelper,
                                                     $timeout,
                                                     Settings) {
    return {
        restrict: 'A',
        scope: {
            post: '=', // The post object
            user: '=', // The user that will be the author of the post
            oneditmode: '@',  // (read-only) start in edit mode, the user can edit the
                              // comment as soon as it's rendered
            alwaysonedit: '@', // (read-only) never exit edit mode
            enablereply: '@', // @todo fix
            showfullpost: '@', // start with the full post shown
            totalnumberofcolumns: '@', // The total number of grid columns the review has to use
            focusonpostfield: '=', // focus on input field
            save: '&onSave',  // function to call when saving a post
            delete: '&onDelete', // function to call when deleting a comment
            abuse: '&onAbuse', // function to call when marking a comment as abusive
            reply: '&onReply', // function to call when replying to a post
            refresh_scrollbar: '&onRefreshScrollbar', // We need to refresh the scrollbar when we show the full post
            // These two functions are called when a comment is in edit mode to suspend refreshing
            // because refreshing would put the comment in read mode and maybe the user is still
            // typing. So we call the suspension function when we enter edit mode and the
            // restart function when we exit edit mode
            suspend_refresh: '&onSuspendRefresh',
            restart_refresh: '&onRestartRefresh'
        },
        templateUrl: '/templates/post.html',
        link: function(scope, elem, attr) {
            //console.debug('DBG-87yh ngCommentDir begin ......');

            // @todo all comments (doc) to fix

            scope.directive_init  = function() {

                //console.debug('DBG-init 88u8u8u8 Inside ngPost directive init');
                //console.debug(scope.oneditmode);
                //console.debug(scope.alwaysonedit);
                //console.debug(typeof scope.oneditmode);

                //if (typeof scope.oneditmode === 'undefined')
                //    scope.oneditmode = false;
                //
                //if (typeof scope.alwaysonedit === 'undefined')
                //    scope.alwaysonedit = false;
                //
                //if (typeof scope.enablereply === 'undefined')
                //    scope.enablereply = false;

                // We convert oneditmode, enablereply and alwaysonedit from string to
                // boolean because it's confusing otherwise

                scope.oneditmode = (scope.oneditmode === 'true');
                scope.alwaysonedit = (scope.alwaysonedit === 'true');
                scope.enablereply = (scope.enablereply === 'true');
                scope.showfullpost = (scope.showfullpost === 'true');

                // @todo does the following if work, actually??
                // When we have to stay always in edit mode, sure scope.oneditmode has to be true as well
                if (scope.alwaysonedit) {
                    scope.oneditmode = true;
                    scope.showfullpost = true;
                }

                if (typeof scope.totalnumberofcolumns === 'undefined')
                    scope.totalnumberofcolumns = 30;

                //console.debug('DBG-u88uuuuu later Inside ngPost directive');
                //console.debug(scope.oneditmode);
                //console.debug(scope.alwaysonedit);
                //console.debug(typeof scope.oneditmode);

                scope.date_time_format_for_post_last_change_timestamp = Settings.default_date_time_format;



            };

            $timeout(scope.directive_init);


            // @todo to do later
            //if (typeof scope.focusonpostfield === 'undefined')
            //    scope.focusonpostfield = 'no';



            // When the value of the variable focusonpostfield changes and it's true,
            // we give focus to the input field
            // @todo this would be nice!!!
            //scope.$watch('focusonpostfield', function(value) {
            //
            //    //console.debug('inside the watch value: ' + value);
            //    //console.debug(value);
            //
            //    // value is the value of the variable focusonpostfield and it has just changed
            //    // because this function $watch is called precisely when it changes
            //
            //    if (value === true) {
            //
            //        // fixme Finding the textarea that is a child of elem[0], which is the root element
            //        // of this directive
            //        // It works because there is one textarea only inside this directive
            //
            //        var array_postbody_textareas = elem[0].getElementsByTagName('textarea');
            //
            //        //console.debug('commentbody_textarea ' + typeof array_commentbody_textareas[0]);
            //
            //        if (typeof array_postbody_textareas !== 'undefined') {
            //
            //            //console.debug(commentbody_input_field);
            //            //console.debug('GIVING FOCUS');
            //
            //            // Giving focus to the comment textarea field
            //            array_postbody_textareas[0].focus();
            //
            //            // Now resetting for the next go
            //            scope.focusonpostfield = false;
            //
            //        }
            //
            //    }
            //});



            // When the user clicks on 'edit' we go in edit mode
            scope.do_edit_mode = function() {

                // We save the current comment text in case the user wants to cancel changes
                scope.old_post = scope.post.body;

                // When the user is editing a comment, we must not refresh comments
                // otherwise the user can't type any more
                // This doesn't apply to the field where new comments are created
                // because it doesn't get refreshed
                // @todo does this work???
                //scope.suspend_refresh();

                scope.oneditmode = true;

                // This change of the variable focusonpostfield to true will be captured by the function
                // $watch above which will give focus to the textarea
                // @todo later scope.focusonpostfield = true;

            };

            // The user clicked on 'post', we have to call the function post in the controller
            // Precisely we call the function whose name has been passed as parameter to this directive
            scope.do_save = function() {

                //console.debug('DBG-8uji Entering do_save in ngPost');

                // Getting rid of leading and trailing spaces
                scope.post.body = scope.post.body.trim();

                //console.debug('DBG-8ijjj Just after 1st statement do_save in ngPost');


                // The comment is empty
                if (scope.post.body.length == 0) {

                    // @todo is this ok?
                    Dialoghelper.standard_dialog_for_message('WRITE_SOMETHING');

                    return;
                }

                // Exiting edit mode if not required to stay in it
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

                // When the user clicks on 'Post', we can restart refreshing comments (loading any new comment)
                // @todo does this work?
                //scope.restart_refresh();

                // Calling the post function whose name has been given
                scope.save();

            };

            // The user clicks on 'cancel'. We discard the new comment and restore the previous one if any
            scope.do_cancel = function() {

                if (typeof scope.old_post !== 'undefined')
                    scope.post.body = scope.old_post;
                else
                    scope.post.body = '';

                // When the user clicks on 'Cancel', we can restart refreshing comments (loading any new comment)
                // @tdo does this work?
                scope.restart_refresh();

                // This is actually for safety because the cancel button shouldn't show up
                // if we are in alwaysonedit mode
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

            };

        }
    };
}]);