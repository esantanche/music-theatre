/**
 * @ngdoc overview
 * @name CustomerProfile
 *
 * @description Standard resource that calls the `musth_restws_customer_profile` rest api
 *
 * @see musth_restws.customerprofile.ctrl.inc
 */

var customerprofileServices = angular.module('customerprofileServices', ['ngResource']);

/**
 * @ngdoc service
 * @name CustomerProfile.service:CustomerProfile
 *
 * @description Standard resource that calls the `musth_restws_customer_profile` rest api
 * to create or query Commerce customer profiles
 */
customerprofileServices.factory('CustomerProfile', ['$resource',
    function($resource){

        return $resource('/musth_restws_customer_profile', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf CustomerProfile.service:CustomerProfile
             * @description We use this method to get the last customer profile a user entered
             * For now we don't read a profile given its id
             * @param {int} profile_id Id of the profile to get
             * @param {string} security_token To get an anonymous customer profile we need
             * to send the same security token we used to create the profile. This is to
             * prevent anonymous users from reading other users' profiles
             * @returns {object} customer profile
             */
            query: { method: 'GET',
                     url: '/musth_restws_customer_profile' +
                          '?profile_id=:profile_id&security_token=:security_token',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf CustomerProfile.service:CustomerProfile
             * @description Creates a customer profile by calling the REST api musth_restws_customer_profile
             * The information to be used to create the profile is in the POST query body.
             *
             * @returns {int} Id of the new customer profile
             */
            create: { method: 'POST',
                url: '/musth_restws_customer_profile',
                isArray: false,
                withCredentials: false,
                responseType: 'json' }
        });

    }]);
