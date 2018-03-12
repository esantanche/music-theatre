/**
 * @ngdoc overview
 * @name Clientexceptionhelper
 *
 * @description Service that sends an error message to Drupal so that
 * it can report it in a watchdog
 */

var clientexceptionhelperServices = angular.module('clientexceptionhelperServices',
    [ 'clientexceptionServices' ] );

/**
 * @ngdoc service
 * @name Clientexceptionhelper.service:Clientexceptionhelper
 * @description Service that sends an error message to Drupal so that
 * it can report it in a watchdog. It uses the ClientException
 * service.
 * @requires ClientException.service:ClientException
 */
clientexceptionhelperServices.service('Clientexceptionhelper', [ 'ClientException',
    function(ClientException) {

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
        this.send_client_exception = function(exceptionmessage) {

            console.info('Sending client exception: ' + exceptionmessage);

            // Calling the api through the ClientException service
            // @see clientexceptionService.js
            ClientException.get({ message: exceptionmessage },
                function(clientexceptions) {

                },
                function(err) {

                    console.error('Message NOT sent to server. Error: ' + err.status);

                    // no pop ups for the user, the user doesn't need to know

                }
            );

        };

    }]);
