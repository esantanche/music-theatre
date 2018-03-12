/**
 * @ngdoc overview
 * @name CustomerProfilehelper
 *
 * @description This service helps with operating on customer profiles.
 * We are talking about Commerce customer profiles, which are added to orders to provide
 * information like the delivery address.
 */

var customerprofilehelperServices =
    angular.module('customerprofilehelperServices', ['customerprofileServices', 'customerprofilevalueServices']);

/**
 * @ngdoc service
 * @name CustomerProfilehelper.service:CustomerProfilehelper
 * @description Helper service for customer profiles. Through this service, controllers
 * can create customer profiles.
 * @requires CustomerProfile.service:CustomerProfile
 * @requires CustomerProfilehelper.service:Customerprofilevalue
 *
 * @todo maybe we have to refactor CustomerProfilehelper to Customerprofilehelper
 */
customerprofilehelperServices.service('CustomerProfilehelper', [ '$q', 'CustomerProfile',
    'Customerprofilevalue', '$base64', 'Clientexceptionhelper', 'Userhelper',
    function($q, CustomerProfile, Customerprofilevalue, $base64, Clientexceptionhelper,
             Userhelper) {

        //console.debug('DBG-18NH orderhelperServices');

        /**
         * @ngdoc method
         * @name create_customer_profile
         * @description This method creates a customer profile by using the CustomerProfile
         * service, which calls a REST api
         * @methodOf CustomerProfilehelper.service:CustomerProfilehelper
         * @param {object} info_for_customer_profile Object that contains the information
         * to be used to create the profile.
         * @returns {promise} See Angular promise/deferred implementation ($q service)
         */
        this.create_customer_profile = function(info_for_customer_profile) {
            var deferred = $q.defer();

            //console.debug('DBG-ccp8282 create_customer_profile ' + info_for_customer_profile.name_line);

            // The security token is a string produced by encoding the user name and the current timestamp
            // It's unique and we store it in the value service Customerprofilevalue.
            // When we want to retrieve information about the profile, we have to send to the server
            // this security token otherwise the server won't send back to us the profile for privacy
            // reasons.
            // This is needed for anonymous users. Logged in users are protected by their credentials.

            var current_timestamp = Date.now(); // Milliseconds from the epoch (1 January 1970 00:00:00 UTC)

            var security_token = $base64.encode(info_for_customer_profile.name_line + '#' + current_timestamp);

            //console.debug(security_token);

            info_for_customer_profile.security_token = security_token;

            // Storing the security token to use it when we have to retrieve information about a profile
            Customerprofilevalue.security_token = security_token;

            CustomerProfile.create(info_for_customer_profile,
                function(customer_profile_id_response) {

                    if (customer_profile_id_response) {

                        //console.debug('DBG-ccp7167 customer_profile_id_response.id = ' + customer_profile_id_response.id);

                        // The profile has been created, let's save the profile id
                        // It's an anonymous profile so the server won't remember the id

                        Customerprofilevalue.profile_id = customer_profile_id_response.id;

                        //console.debug(Customerprofilevalue);

                        // We return the id of the freshly created profile
                        deferred.resolve(customer_profile_id_response.id);

                    } else {

                        console.error('W3E109 Customer profile not created, empty response');
                        Clientexceptionhelper.send_client_exception('W3E109 Customer profile not created, empty response');
                        deferred.reject('Customer profile not created, empty response');

                    }

                },
                function(err) {

                    console.error('W3E110 Customer profile not created. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E110 Customer profile not created. Reason: ' + err.status);
                    deferred.reject('Customer profile not created. Status code: ' + err.status);

                }

            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name load_most_recent_customer_profile_for_logged_in_user
         * @description This method loads the last customer profile
         * a user entered by using the CustomerProfile
         * service, which calls a REST api
         * @methodOf CustomerProfilehelper.service:CustomerProfilehelper
         * @returns {promise} See Angular promise/deferred implementation ($q service)
         */
        this.load_most_recent_customer_profile_for_logged_in_user = function() {
            var deferred = $q.defer();

            //console.debug('DBG-lmrcpfliu001 Entering load_most_recent_customer_profile_for_logged_in_user');

            // Safety check: if the user is not logged in, throw an exception and return

            var logged_in_info = Userhelper.logged_in_user_info();

            if (!logged_in_info.uid) {

                console.error('W3E154 We retrieve the last customer profile for logged in users only');
                Clientexceptionhelper.send_client_exception('W3E154 We retrieve the last customer ' +
                    'profile for logged in users only');

                deferred.reject('User not logged in');
                return deferred.promise;
            }

            CustomerProfile.query({ },
                function(customer_profiles) {

                    if (customer_profiles) {

                        //console.debug('DBG-lmrcpfliu001 customer profile array not empty, ok');
                        //console.debug(customer_profiles);

                        var most_recent_customer_profile_for_logged_in_user = null;

                        if (typeof customer_profiles.list != "undefined") {
                            if (customer_profiles.list.length > 0)
                                most_recent_customer_profile_for_logged_in_user = customer_profiles.list[0];
                        }

                        // We return the most recent customer profile for the logged in user
                        deferred.resolve(most_recent_customer_profile_for_logged_in_user);

                    } else {

                        // We can have an empty list of customer profiles if the user has no customer
                        // profiles, but we don't get here in such a case
                        // Even with no profiles, we should get a non-null customer_profiles list
                        // and we should end up in the other branch of the if statement

                        console.error('W3E155 Customer profile not returned, empty response');
                        Clientexceptionhelper.send_client_exception('W3E155 Customer profile not returned, empty response');
                        deferred.reject('Customer profile not returned, empty response');

                    }

                },
                function(err) {

                    console.error('W3E156 Error in fetching the last customer' +
                        ' profile entered by a user. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E156 Error in fetching the last customer ' +
                        'profile entered by a user. Reason: ' + err.status);
                    deferred.reject('W3E156 Error in fetching the last customer profile ' +
                        'entered by a user. Status code: ' + err.status);

                }

            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name CustomerProfilehelper.service:Customerprofilevalue
 *
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about the customer profile we created using the method
 * create_customer_profile.
 *
 * It stores the id of the profile and the security token we have to send to the server
 * whenever we want to retrieve the customer profile.
 *
 * Only the CustomerProfilehelper service should use this service.
 */
var customerprofilevalueServices = angular.module('customerprofilevalueServices', [ ]);

customerprofilevalueServices.value('Customerprofilevalue', { profile_id: 0,
                                                             security_token: '' });
