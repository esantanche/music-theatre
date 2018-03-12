/**
 * @ngdoc overview
 * @name Messagehelper
 *
 * @description fixme Service that sends an error message to Drupal so that
 * it can report it in a watchdog
 */

var messagehelperServices = angular.module('messagehelperServices',
    [ 'messageServices' ] );

/**
 * @ngdoc service
 * @name Messagehelper.service:Messagehelper
 * @description fixme Service that sends an error message to Drupal so that
 * it can report it in a watchdog. It uses the ClientException
 * service.
 * @requires ClientException.service:ClientException
 */
messagehelperServices.service('Messagehelper', [ 'Message',
    function(Message) {

        /**
         * @ngdoc method
         * @name send_client_exception
         * @methodOf Clientexceptionhelper.service:Clientexceptionhelper
         * @description This is the function that, called from anywhere in the code where
         * there has been an exception, sends the exception message to the
         * musth_restws_client_exception api in order for it to produce
         * a watchdog containing the message
         *
         * @param {string} exceptionmessage Just a string with the error message
         */
        this.send_message = function(sender_name, sender_email, body) {

            console.info('Sending message: ' + sender_name + '/' + sender_email + '/' + body);

            // Calling the api through the ClientException service
            // @see clientexceptionService.js
            Message.get({ sender_name: sender_name,
                          sender_email: sender_email,
                          body: body },
                function(message) {

                },
                function(err) {

                    console.error('Message NOT sent to server. Error: ' + err.status);

                    // no pop ups for the user, the user doesn't need to know

                }
            );

        };

    }]);
