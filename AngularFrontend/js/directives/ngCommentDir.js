/**
 * @ngdoc overview
 * @name ATTENTION! this directive should have been abandoned by now!!!!!
 * @description The ngCommentDir directive renders a comment wherever needed.
 * It controls editing, posting and deleting it. Actually these functions are started here, but
 * performed by the controller. Only editing is completely controlled here.
 * The template frontends/angular/app/templates/comment.html provides the html markup to be used
 * to render a comment.
 */

// @todo ATTENTION! this directive should have been abandoned by now!!!!!

'use strict';

var ngCommentDir = angular.module('ngCommentDir', []);

/**
 * @ngdoc directive
 * @name ngCommentDir.directive:ngComment
 * @restrict E
 * @description When rendering a comment there are many things to control.
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
         <div ng-comment
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
ngCommentDir.directive('ngComment', [ 'Dialoghelper', function(Dialoghelper) {
    return {
        restrict: 'A',
        scope: {
            comment: '=', // The comment object
            user: '=', // The user that will be the author of the comment
            oneditmode: '@',  // (read-only) start in edit mode, the user can edit the
                              // comment as soon as it's rendered
            alwaysonedit: '@', // (read-only) never exit edit mode
            focusonpostfield: '=', // focus on input field
            post: '&onPost',  // function to call when posting a comment
            delete: '&onDelete', // function to call when deleting a comment
            abuse: '&onAbuse', // function to call when marking a comment as abusive
            reply: '&onReply', // function to call when replying to a comment
            // These two functions are called when a comment is in edit mode to suspend refreshing
            // because refreshing would put the comment in read mode and maybe the user is still
            // typing. So we call the suspension function when we enter edit mode and the
            // restart function when we exit edit mode
            suspend_refresh: '&onSuspendRefresh',
            restart_refresh: '&onRestartRefresh'
        },
        templateUrl: '/templates/comment.html',
        link: function(scope, elem, attr) {
            //console.debug('DBG-87yh ngCommentDir begin ......');

            if (typeof scope.focusonpostfield === 'undefined')
                scope.focusonpostfield = false;

            if (typeof scope.oneditmode === 'undefined')
                scope.oneditmode = false;

            if (typeof scope.alwaysonedit === 'undefined')
                scope.alwaysonedit = false;

            // When the value of the variable focusonpostfield changes and it's true,
            // we give focus to the input field
            scope.$watch('focusonpostfield', function(value) {

                //console.debug('inside the watch value: ' + value);
                //console.debug(value);

                // value is the value of the variable focusonpostfield and it has just changed
                // because this function $watch is called precisely when it changes

                if (value === true) {

                    // Finding the textarea that is a child of elem[0], which is the root element
                    // of this directive
                    // It works because there is one textarea only inside this directive

                    var array_commentbody_textareas = elem[0].getElementsByTagName('textarea');

                    //console.debug('commentbody_textarea ' + typeof array_commentbody_textareas[0]);

                    if (typeof array_commentbody_textareas !== 'undefined') {

                        //console.debug(commentbody_input_field);
                        //console.debug('GIVING FOCUS');

                        // Giving focus to the comment textarea field
                        array_commentbody_textareas[0].focus();

                        // Now resetting for the next go
                        scope.focusonpostfield = false;

                    }

                }
            });

            // When we have to stay always in edit mode, sure scope.oneditmode has to be true as well
            if (scope.alwaysonedit)
                scope.oneditmode = true;

            // When the user clicks on 'edit' we go in edit mode
            scope.do_edit_mode = function() {

                // We save the current comment text in case the user wants to cancel changes
                scope.old_comment = scope.comment.body;

                // When the user is editing a comment, we must not refresh comments
                // otherwise the user can't type any more
                // This doesn't apply to the field where new comments are created
                // because it doesn't get refreshed
                scope.suspend_refresh();

                scope.oneditmode = true;

                // This change of the variable focusonpostfield to true will be captured by the function
                // $watch above which will give focus to the textarea
                scope.focusonpostfield = true;

            };

            // The user clicked on 'post', we have to call the function post in the controller
            // Precisely we call the function whose name has been passed as parameter to this directive
            scope.do_post = function() {

                // Getting rid of leading and trailing spaces
                scope.comment.body = scope.comment.body.trim();

                // The comment is empty
                if (scope.comment.body.length == 0) {

                    Dialoghelper.standard_dialog_for_message('WRITE_SOMETHING');

                    return;
                }

                // Exiting edit mode if not required to stay in it
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

                // When the user clicks on 'Post', we can restart refreshing comments (loading any new comment)
                scope.restart_refresh();

                // Calling the post function whose name has been given
                scope.post();

            };

            // The user clicks on 'cancel'. We discard the new comment and restore the previous one if any
            scope.do_cancel = function() {

                if (typeof scope.old_comment !== 'undefined')
                    scope.comment.body = scope.old_comment;
                else
                    scope.comment.body = '';

                // When the user clicks on 'Cancel', we can restart refreshing comments (loading any new comment)
                scope.restart_refresh();

                // This is actually for safety because the cancel button shouldn't show up
                // if we are in alwaysonedit mode
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

            };

        }
    };
}]);