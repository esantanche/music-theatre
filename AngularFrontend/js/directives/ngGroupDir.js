/**
 * @ngdoc overview
 * @name ngGroupDir
 * @description @todo doc
 *
 * The ngReviewDir directive renders a review wherever needed.
 * It controls creating, editing, submitting, rating and deleting it. Actually these functions are started here, but
 * performed by the controller. Only editing is completely controlled here.
 * The template /frontends/angular/app/templates/review.html provides the html markup to be used
 * to render a review.
 * This directive is used in the info panel to show all reviews about a programme and to create a new review.
 * It's used in the user profile as well to show all reviews the user created and to edit or submit them.
 */

'use strict';

var ngGroupDir = angular.module('ngGroupDir', []);

/**
 * @ngdoc directive
 * @name ngGroupDir.directive:ngGroupDir
 * @restrict E
 * @description @todo doc
 *
 * When rendering a review there are many things to control.
 *
 * They are:
 *
 * * editing, we make the review editable or not
 * * cancelling, we allow for cancelling the changes done and go back to the review as it was before the changes
 * * saving, we call the function in the controller that will save the review to the server for it to store it
 * The user will be able to edit the review from their user panel
 * * deleting, we call the function in the controller that will delete the review by calling the appropriate
 * rest api. This applies only to reviews that are in 'draft' status. Submitted or published reviews can't be
 * edited.
 * * focusing, no focusing is done here
 * * submitting, the user can submit the review for moderation. they won't be able to edit it amy more
 * Editors will moderate the review and publish it
 * * rating, in the template the user can rate the review by giving thumbs-up or thumbs-down. Then a function in
 * the directive, do_rate(), is called that calls a function in the controller that send the rating to the server.
 *
 * @example
 *    <pre>
 *
         <div ng-review
         review="review"
         user="user"
         on-rate="rate(review)">
         </div>

         <div ng-review
         review="reviewsforminfo.newreview"
         user="user"
         oneditmode="true"
         alwaysonedit="true"
         on-save="save(reviewsforminfo.newreview)">
         </div>

 *    </pre>
 */
ngGroupDir.directive('ngGroup', [ 'Dialoghelper',
                                  '$timeout',
                                  'Settings', function(Dialoghelper,
                                                       $timeout,
                                                       Settings) {
    return {
        restrict: 'A',
        scope: {
            group: '=',  // The group object
            user: '=',  // The user that will be the author of the group
            oneditmode: '@', // (read-only) start in edit mode, the user can edit the
                             // group as soon as it's rendered
            // @todo doc that we use '=' to make bools get through correctly
            alwaysonedit: '@', // (read-only) never exit edit mode
            totalnumberofcolumns: '@', // The total number of grid columns the group has to use
            save: '&onSave', // function to call when saving a group
            abuse: '&onAbuse', // function to call when marking a group as abusive
            delete: '&onDelete' // function to call when deleting a group
        },
        templateUrl: '/templates/group.html',
        link: function(scope, elem, attr) {

            scope.directive_init  = function() {

                //console.debug('DBG-muhun ngReviewDir begin ......');

                //console.debug('DBG-8u8u Inside ngGroup directive');
                //console.debug(scope.oneditmode);
                //console.debug(scope.alwaysonedit);
                //console.debug(typeof scope.oneditmode);

                scope.oneditmode = (scope.oneditmode === 'true');
                scope.alwaysonedit = (scope.alwaysonedit === 'true');

                if (scope.alwaysonedit)
                    scope.oneditmode = true;

                if (typeof scope.totalnumberofcolumns === 'undefined')
                    scope.totalnumberofcolumns = 30;

                scope.date_time_format_for_group_creation_timestamp = Settings.default_short_date_format;

            };

            $timeout(scope.directive_init);

            // Initialising the object scope.review.rating if it happens to not be defined

            //if (typeof scope.review.rating === 'undefined')
            //    scope.review.rating = {};

            //if (typeof scope.review.vote_user_gave_to_review === 'undefined')
            //    scope.review.vote_user_gave_to_review = {};
            //
            //if (typeof scope.review.vote_user_gave_to_review.value === 'undefined') {
            //    scope.review.vote_user_gave_to_review.value = 0;
            //    scope.review.vote_user_gave_to_review.value_type = 'points';
            //}

            // This object contains a variable, mouse_over_thumb, that will be true when
            // the mouse pointer is over the thumb
            // It's an object and not a plain variable because of the prototype inheritance
            // problem in javascript
            //scope.voteinfo = {
            //    mouse_over_thumb: false
            //};

            // Entering edit mode
            scope.do_edit_mode = function() {

                // Saving the review in case the user wants to cancel their changes
                scope.old_title = scope.group.title;
                scope.old_description = scope.group.description;

                scope.oneditmode = true;

            };

            // Calling the function that the controller provides to delete the review
            scope.do_delete = function() {

                // The controller will ask for confirmation
                scope.delete();

                // This is actually for safety because the delete button shouldn't show up
                // if we are in alwaysonedit mode
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

            };

            // Calling the controller function that saves the review after having made sure that
            // it's not empty
            scope.do_save = function() {

                scope.group.title = scope.group.title.trim();
                scope.group.description = scope.group.description.trim();

                if (scope.group.title.length < 3) {

                    // @todo we want a diferent message here
                    Dialoghelper.standard_dialog_for_message('GIVE_A_TITLE');

                    return;
                }

                if (scope.group.description.length < 10) {

                    // @todo we want a diferent message here
                    Dialoghelper.standard_dialog_for_message('WRITE_SOMETHING');

                    return;
                }

                // After saving, we exit edit mode unless we are in always-on-edit mode
                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

                // Calling the controller function that does the actual saving
                scope.save();

            };

            // Calling the controller function that submits the review
            // This happens only in the user panel
            //scope.do_submit = function() {
            //
            //    // The controller will ask for confirmation
            //    scope.submit();
            //
            //    // This is actually for safety because the submit button shouldn't show up
            //    // if we are in alwaysonedit mode
            //    if (!scope.alwaysonedit)
            //        scope.oneditmode = false;
            //
            //};

            // Reverting to the old review if the user wants to cancel the changes they made
            scope.do_cancel = function() {

                if (typeof scope.old_title !== 'undefined')
                    scope.group.title = scope.old_title;
                else
                    scope.group.title = '';

                if (typeof scope.old_description !== 'undefined')
                    scope.group.descriptiony = scope.old_description;
                else
                    scope.group.description = '';

                //                 scope.old_description = scope.group.description;

                // After saving, we exit edit mode unless we are in always-on-edit mode
                // Actually, in this case, since we are cancelling, we shouldn't be in
                // always-on-edit mode. But let's check it anyway


                if (!scope.alwaysonedit)
                    scope.oneditmode = false;

                //if (!scope.alwaysonedit)
                //    scope.oneditmode = false;

            };

            // Calling the controller function that saves the rating the user gave
            // (thumbs-up or thumbs-down)
            //scope.do_rate = function() {
            //
            //    //console.debug('DBG-dh77 ngReview::do_rate');
            //    //console.debug(scope.review.vote_user_gave_to_review.value);
            //
            //    // The controller will save the rating by sending it to the server
            //    scope.rate();
            //
            //    // This is actually for safety because the rate button (thumbs-up or down) shouldn't show up
            //    // if we are in edit mode
            //    scope.oneditmode = false;
            //
            //};

        }
    };
}]);