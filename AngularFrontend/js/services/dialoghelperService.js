/**
 * @ngdoc overview
 * @name Dialoghelper
 * @description Service that provides dialogs to show messages to the user. It provides as well
 * dialogs used to ask for confirmation of action such as delete, submit, flag as abusive, etc.
 * There is a dialog to use in case of exception when calling REST api or other functions
 * @todo doc to do
 *
 * @todo wait to document this service because it may change
 *
 */

var dialoghelperServices = angular.module('dialoghelperServices', [  ] );

/**
 * @ngdoc service
 * @name Dialoghelper.service:Dialoghelper
 * @description fixme
 */
dialoghelperServices.service('Dialoghelper', [ 'ngDialog', 'Clientexceptionhelper', '$filter',
    function(ngDialog, Clientexceptionhelper, $filter) {

        var i, len;

        this.list_of_messages = [
            { message_code: 'REVIEW_SAVED', message_text: 'Review saved, to edit or submit it go to your user profile' },
            { message_code: 'USER_DETAILS_UPDATED', message_text: 'User details updated' },
            { message_code: 'AVATAR_UPLOADED', message_text: 'Avatar uploaded' },
            { message_code: 'GROUP_SAVED', message_text: 'Group saved' },
            { message_code: 'GROUP_HELD', message_text: 'Group saved, waiting for moderation' },
            { message_code: 'GROUP_FLAGGED', message_text: 'Group flagged successfully' },
            { message_code: 'COMMENT_FLAGGED', message_text: 'Comment flagged successfully' },
            { message_code: 'COMMENT_HELD', message_text: 'Comment held for moderation' },
            { message_code: 'POST_HELD', message_text: 'Post held for moderation' },
            { message_code: 'POST_FLAGGED', message_text: 'Post flagged successfully' },
            { message_code: 'PRODUCT_ADDED', message_text: 'The product has been added to the shopping cart' },
            { message_code: 'MESSAGE_SENT', message_text: 'Message sent' },
            { message_code: 'CONFIRM_COMMENT_DELETE', message_text: 'Do you really want to delete the comment?' },
            { message_code: 'CONFIRM_COMMENT_FLAGGING', message_text: 'Do you really want to flag this comment?' },
            { message_code: 'CONFIRM_POST_FLAGGING', message_text: 'Do you really want to flag this post?' },
            { message_code: 'CONFIRM_GROUP_FLAGGING', message_text: 'Do you really want to flag this group?' },
            { message_code: 'CONFIRM_REVIEW_SUBMIT', message_text: 'Do you really want to submit this review?' },
            { message_code: 'CONFIRM_REVIEW_DELETE', message_text: 'Do you really want to delete this review?' },
            { message_code: 'CONFIRM_GROUP_DELETE', message_text: 'Do you really want to delete this group? People worked so hard to write posts!' },
            { message_code: 'CONFIRM_POST_DELETE', message_text: 'Do you really want to delete this post?' },
            { message_code: 'CONFIRM_USE_ORDER_AS_CART', message_text: 'Do you really want to replace your current cart, if any, with this order?' },
            { message_code: 'NO_CUSTOMER_PROFILE', message_text: 'No customer profile found, cannot populate the form' },
            { message_code: 'NO_ORDERS', message_text: 'No orders found' },
            { message_code: 'WRITE_SOMETHING', message_text: 'Please write something!' },
            { message_code: 'GIVE_A_TITLE', message_text: 'Please give it a title or click cancel!' },
            { message_code: 'LOGIN_AGAIN', message_text: 'Something went wrong, please login again' }
        ];

        this.message_lookup = {};
        for (i = 0, len = this.list_of_messages.length; i < len; i++) {
            this.message_lookup[this.list_of_messages[i].message_code] = this.list_of_messages[i].message_text;
        }

        /**
         * @ngdoc method
         * @name standard_dialog_for_message
         * @methodOf Dialoghelper.service:Dialoghelper
         * @description fixme Standard dialog showing a message
         */
        this.standard_dialog_for_message = function(message_code) {

            if (typeof(this.message_lookup[message_code]) === 'undefined') {

                // @todo fix excpt hndlng

                console.error('W3Exxxx242 Message code wrong');
                Clientexceptionhelper.send_client_exception('W3Exxx242 Message code wrong');

                return;
            }

            console.debug('@dialoghelperService::standard_dialog_for_message ' + message_code);

            ngDialog.open({ template: '/dialogs/messagedialog.html',
                className: 'ngdialog-theme-musictheatre',
                data: { message: this.message_lookup[message_code] },
                showClose: false,
                overlay: false,
                disableAnimation: false
                //appendTo: 'tagring-pane-container'
            });

        };

        /**
         * @ngdoc method
         * @name standard_dialog_for_action_confirmation
         * @methodOf Dialoghelper.service:Dialoghelper
         * @description fixme
         * @return {object} fixme returns a promise
         */
        this.standard_dialog_for_action_confirmation = function(message_code, info_about_object_of_the_action) {

            // @todo add a safety check on message_code

            if (typeof(this.message_lookup[message_code]) === 'undefined') {

                console.error('W3Exxxx242 Message code wrong');
                Clientexceptionhelper.send_client_exception('W3Exxx242 Message code wrong');

                return null;
            }

            // We return the return value of ngDialog.openConfirm, which is a promise that is
            // triggered when the user chooses if to delete or not the object
            // The controller calling this method will know what to do in both cases

            return ngDialog.openConfirm({ template: '/dialogs/actionconfirmdialog.html',
                className: 'ngdialog-theme-musictheatre',
                data: { message: this.message_lookup[message_code],
                        info_about_object_of_the_action: $filter('truncate')(info_about_object_of_the_action, 60) },
                showClose: false,
                overlay: false,
                disableAnimation: false
            });
        };

        /**
         * @ngdoc method
         * @name standard_dialog_for_remote_api_call_exception
         * @methodOf Dialoghelper.service:Dialoghelper
         * @description fixme
         */
        this.standard_dialog_for_remote_api_call_exception = function(reason) {

            ngDialog.open({ template: '/dialogs/exceptiondialog.html',
                className: 'ngdialog-theme-musictheatre',
                data: { reason: reason },
                showClose: false,
                overlay: false,
                disableAnimation: false
            });

        };

    }]);



