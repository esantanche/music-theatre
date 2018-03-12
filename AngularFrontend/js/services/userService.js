/**
 * @ngdoc overview
 * @name User
 * @description Standard resource that calls the `musth_restws_user` rest api
 * @see musth_restws.user.ctrl.inc
 */

var userServices = angular.module('userServices', ['ngResource']);

/**
 * @ngdoc service
 * @name User.service:User
 * @description Querying an User, which is the resource
 * provided by the REST api `musth_restws_user`. It tells us about
 * a user's details like Drupal user id, full name, preferred language,
 * user roles. We can query public and private profiles. We can also
 * update profile details and add/remove user to/from groups.
 * We can fetch all members of a group as well.
 */
userServices.factory('User', ['$resource',
    function($resource){

        return $resource('/musth_restws_user', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf User.service:User
             * @description Query method used to fetch the user object containing the information
             * about an user.
             * For a private profile no parameter is needed because the api will return the
             * logged-in user's details. The REST api knows who is logged in because the browser sends to
             * the api the cookie that has been created when logging in.
             * For a public profile, no cookie is needed. This method is used as well to fetch all members
             * of a group.
             * @param {int} uid Id of the user we want the public profile of. If no uid is given, the private
             * profile of the logged-in user is returned, unless the
             * @param {int} groups Id of the group we want the members of. Sorry for using a parameter called
             * groups to send a single group id.
             * @param {int} page Number of the page to fetch (optional, defaults to zero)
             * @returns {object} user(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_user?uid=:uid&groups=:groups&page=:page',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf User.service:User
             * @description Not used, accounts are created by using the standard registration procedure
             * provided by Drupal
             * @returns {int} Id of the new user account
             */
            //create: { method: 'POST',
            //    url: '/musth_restws_user',
            //    isArray: false,
            //    withCredentials: false,
            //    responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf User.service:User
             * @description Method used to update an existing user profile
             * @param {int} uid Id of the user profile to update
             * @param {object} Parameters The parameters used to update the user profile are passed at call time
             * and are sent in the body of the PUT message.
             * We update the "real" name composed by first_name, middle_names, family_name.
             * By passing the parameter groups, we add or remove the logged-in user to/from the specified group.
             */
            update: { method: 'PUT',
                // the user id is got from the post message body (@uid)
                url: '/musth_restws_user/:uid',
                isArray: true,
                withCredentials: false,
                responseType: 'text' } // the update method return http status code only
        });
    }]);
