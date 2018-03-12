/**
 * @ngdoc overview
 * @name Userhelper
 * @description Service that fetches the details of the logged-in user. No login is performed here.
 * We use iframes for that.
 *
 * Additionally we:
 *
 * * fetch user public profiles
 * * update users' real names
 * * add and remove users to/from groups
 * * fetch group members
 * * check is a user is a subscriber on controllers' request
 *
 */

var userhelperServices = angular.module('userhelperServices', ['userServices', 'uservalueServices']);

/**
 * @ngdoc service
 * @name Userhelper.service:Userhelper
 * @description This service performs no login. An iframe does it. Here
 * we retrieve the details of the logged-in user.
 *
 * This service keeps the logged-in user's details and offers methods that can be used to
 * query those details.
 *
 * By using this service it's possible to update a user's profile by changing details like
 * the real name or others.
 *
 * The headers that are needed when doing the REST calls are set by using methods defined in
 * this service.
 *
 * Even if the login cookie is sent automatically by the browser, we have to send the token.
 * I'm talking about the session token that REST apis want when we do POST, PUT or DELETE operations.
 *
 * So, this service provides methods that take care of sending the required http headers when
 * calling REST apis.
 *
 * Additionally, this service fetches users' public profiles. It also adds or removes users to/from groups.
 *
 * It provides the list of members of a group.
 *
 * @see https://www.drupal.org/node/1890216
 *
 * @requires Userhelper.service:Uservalue
 * @requires base64.service:base64
 * @requires User.service:User
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
userhelperServices.service('Userhelper', [ '$q', 'User', 'Uservalue', '$http', '$base64',
                                           'Clientexceptionhelper', 'Orderhelper', 'Votehelper',
    function($q, User, Uservalue, $http, $base64,
             Clientexceptionhelper, Orderhelper, Votehelper) {

        var self = this;

        /**
         * @ngdoc method
         * @name fetch_user_details
         * @description This method does not perform a login. We use iframes for that.
         * After a login done, this method asks the server for details about the logged-in
         * user.
         *
         * The url /restws/session/token/ is queried to get the RESTws token associated to the
         * session that has been open when doing the login.
         * This token is needed when calling REST apis that write (PUT, POST, DELETE).
         *
         * Additionally, this method converts any anonymous shopping cart should exist.
         *
         * To convert a shopping cart means to associate it to the logged-in user so that it's
         * no longer anonymous.
         *
         * All votes ever given by the user are fetched as well.
         *
         * If the parameter uid is passed, this method fetches the public profile of that user.
         * In this case the Augular value Uservalue is not updated because it's used to store
         * the details of the logged-in user only.
         *
         * @methodOf Userhelper.service:Userhelper
         * @param {int} uid User id of the user we want the public profile of. If it's not given, the
         * private profile of the logged-in user will be returned.
         * @returns {promise} This method returns the user object, which is the resource
         * provided by the REST api `musth_restws_user`. It tells us about
         * a user's details like Drupal user id, full name, preferred language,
         * user roles.
         * The method returns a promise, actually, whose payload will be the user object.
         */
        this.fetch_user_details = function(uid) {
            var deferred = $q.defer();

            // Calling the rest api to fetch the logged-in user details, if no uid is passed.
            // If uid is passed, we return the public profile of that user
            // The browser will automatically send the cookie it got when the user logged in
            // by using the iframe process

            var get_call_parameters = {};
            var we_are_fetching_public_profile = false;

            // If uid is defined, we want the public profile of the user whose user id is uid
            // Otherwise we want the full profile of the logged-in user
            if (typeof(uid) != 'undefined') {
                get_call_parameters = { uid: uid };
                we_are_fetching_public_profile = true;
            }

            User.get(get_call_parameters,
                function(user) {

                    if (user) {

                        // We got a reply. returned_user.uid may be zero if no user
                        // is logged in

                        var returned_user = user.list[0];

                        if (we_are_fetching_public_profile) {
                            // We don't change Uservalue, which is about the logged-in user only
                            deferred.resolve(returned_user);
                            return;
                        }

                        Uservalue.uid = returned_user.uid; // Drupal user id (it's a number)
                        Uservalue.name = returned_user.name; // This is the username
                        Uservalue.mail = returned_user.mail; // Email address
                        Uservalue.language = returned_user.language;
                        Uservalue.roles = returned_user.roles; // This is a list of objects
                        Uservalue.licenses = returned_user.licenses; // This is a list of objects
                        Uservalue.groups = returned_user.groups; // This is a list of objects
                        Uservalue.first_name = returned_user.first_name;
                        Uservalue.middle_names = returned_user.middle_names;
                        Uservalue.family_name = returned_user.family_name;
                        Uservalue.avatar = returned_user.avatar;

                        // No token will be available for fetching if the user is not logged in
                        if (returned_user.uid == 0) {
                            deferred.resolve(returned_user);
                            return;
                        }

                        //console.debug('DBG-67y6 Userhelper.fetch_user_details  before load_votes');
                        Votehelper.load_votes(Uservalue.uid);

                        //console.debug('DBG-(userhelperServices fetch_user_details) Uservalue and returned_user');
                        //console.debug(Uservalue);
                        //console.debug(returned_user);
                        //console.debug(user);

                        // This http call is to retrieve the token that RESTws needs when
                        // we do the authentication by using a cookie as it is our case now

                        /*
                         Cheatsheet for success and error function in $http query
                         data – {string|Object} – The response body transformed with the transform functions.
                         status – {number} – HTTP status code of the response.
                         headers – {function([headerName])} – Header getter function.
                         config – {Object} – The configuration object that was used to generate the request.
                         statusText – {string} – HTTP status text of the response.
                         */

                        $http.get('/restws/session/token/').
                            success(function(data, status, headers, config) {

                                // This callback will be called asynchronously
                                // when the response is available

                                //console.debug('DBG-8uhygtfgf restws/session/token');
                                //console.debug(data);

                                // This is the famous token
                                Uservalue.xcsrftoken = data;

                                // We need to send the token here because we are about to perform a PUT
                                // (update) and restws wants a token for this
                                // This function will put the token in the http headers
                                // Anyway, the standard is to call this function before any REST api that
                                // is supposed to check for permissions and before any REST api that writes
                                // (update, create, delete). This even if the function does nothing.

                                self.prepare_for_call_with_credentials();

                                // Since we logged the user in, any anonymous shopping order has to
                                // be converted to an authenticated one
                                // This method of Orderhelper will do the job
                                // If the shopping cart has already been converted, there will be no
                                // exception and no harm done (this may happen if we use this fetch_user_details
                                // function to refresh the details later)

                                Orderhelper.convert_the_current_shopping_order();

                                // Loading all votes the logged-in user ever gave
                                // @attention Here we are not checking for exceptions. After all the Votehelper
                                // service will do that and the worst that can happen is that no votes will be
                                // shown

                            }).
                            error(function(data, status, headers, config) {

                                // Called asynchronously if an error occurs
                                // or server returns response with an error status.

                                console.error('W3E247 Error when getting the RESTws token. Status: ' + status);
                                Clientexceptionhelper.send_client_exception('W3E247 Error when getting the RESTws token. Status: ' + status);
                                deferred.reject('W3E247 Error when getting the RESTws token');

                                // We didn't get the token, let's make sure that it's empty
                                Uservalue.xcsrftoken = '';

                            });

                        deferred.resolve(returned_user);

                    } else {

                        console.error('W3E037 User not returned, empty response');
                        Clientexceptionhelper.send_client_exception('W3E037 User not returned, empty response');
                        deferred.reject('User not returned, empty response');

                    }

                },
                function(err) {

                    console.error('W3E038 User not loaded. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E038 User not loaded. Reason: ' + err.status);
                    deferred.reject('Error when querying an user. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name return_members_of_a_group
         * @description We want all members of a group.
         * @methodOf Userhelper.service:Userhelper
         * @param {int} group_id The node id of the group we want the members of
         * @param {int} page Number of page to return. Defaults to zero.
         * @returns {promise} The returned object is an array of user objects.
         * The method returns a promise, actually, whose payload will be that array.
         */
        this.return_members_of_a_group = function(group_id, page) {
            var deferred = $q.defer();

            if (typeof(page) === 'undefined') page = 0;

            User.get({ groups: group_id, page: page },
                function(group_members) {

                    if (group_members) {

                        Uservalue.more_pages_of_group_members_available = ! (typeof(group_members.next) === 'undefined');

                        /*console.debug('DBG-u8u8u ');
                        console.debug(group_members);*/

                        deferred.resolve(group_members);

                    } else {

                        console.error('W3E348 Empty response when fetching group members');
                        Clientexceptionhelper.send_client_exception('W3E348 Empty response when fetching group members');
                        deferred.reject('W3E348 Empty response when fetching group members');

                    }

                },
                function(err) {

                    if (err.status == 404) {
                        Uservalue.more_pages_of_group_members_available = false;
                        deferred.resolve([]);
                    } else {
                        Clientexceptionhelper.send_client_exception('W3E349 Group members not returned. Reason: ' + err.status);
                        console.error('W3E349 Group members not returned. Reason: ' + err.status);
                        deferred.reject('W3E349 Group members not returned. Status code: ' + err.status);
                    }

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name more_pages_of_group_members_available
         * @description Function that tells if there are more pages to load when loading a group's members
         * This information is acquired when a page of members is loaded by calling the method return_members_of_a_group
         * If a controller calls this method before calling the method return_members_of_a_group,
         * it gets a 'false', which is the starting value.
         * So, it makes no sense to call this method before calling return_members_of_a_group
         * @methodOf Grouphelper.service:Grouphelper
         * @returns {bool} True if there are more pages to load
         */
        this.more_pages_of_group_members_available = function() {

            return Uservalue.more_pages_of_group_members_available;
        };

        /**
         * @ngdoc method
         * @name reload_user_details
         * @description FIXME This function is used to reload user details, especially the licenses, after
         * the completion of an order checkout.
         * @todo this function has still to be tested
         * @todo do we need this function any more? can't we use the above fetch_user_details?
         * @todo the problem with the function fetch_user_details is that it gets the session token
         * and there is no need to do it more than once
         * @methodOf Userhelper.service:Userhelper
         * @returns {promise} This method returns just a message to tell that the
         * reload has been successful.
         * The method returns a promise, actually, whose payload will be that message.
         */
        /*
        this.reload_user_details = function() {
            var deferred = $q.defer();

            // If uid is zero, it means that no login has been performed
            // and there are no user details to reload

            alert('reload_user_details This function may not work!!');
            alert('It has never been tested!!');

            if (Uservalue.uid > 0) {

                console.debug('DBG-HAYI reload_user_details about to reload');

                // Actually setting the http header for it to be used in the call
                this.prepare_for_call_with_credentials();

                // Calling the rest api
                // RESTws will catch the header we set above (in prepare_for_call_with_credentials),
                // decode it, retrieve userid and password and use them to perform a
                // regular Drupal login
                User.get({  },
                    function(user) {

                        if (user) {

                            // We got a reply. returned_user.uid may be zero if the login
                            // was unsuccessful.

                            var returned_user = user.list[0];

                            // We don't reload the user id because it can't have changed
                            // Uservalue.uid = returned_user.uid; // Drupal user id (it's a number)
                            // We reload the rest because it may have changed
                            Uservalue.name = returned_user.name; // Let's recall that this is the username
                            Uservalue.mail = returned_user.mail; // Email address
                            Uservalue.language = returned_user.language;
                            Uservalue.roles = returned_user.roles; // This is a list of objects
                            Uservalue.licenses = returned_user.licenses; // This is a list of objects
                            Uservalue.first_name = returned_user.first_name;
                            Uservalue.middle_names = returned_user.middle_names;
                            Uservalue.family_name = returned_user.family_name;

                            //console.debug('DBG-JJJJ Uservalue inside reload_user_details');
                            //console.debug(Uservalue);

                            deferred.resolve('User details successfully updated');

                        } else {

                            console.error('W3E145 Empty response when reloading user details');
                            Clientexceptionhelper.send_client_exception('W3E145 Empty response when reloading user details');
                            deferred.reject('Empty response when reloading user details');

                        }

                    },
                    function(err) {

                        console.error('W3E146 Error in reloading user details. Reason: ' + err.status);
                        Clientexceptionhelper.send_client_exception('W3E146 Error in reloading user details. Reason: ' + err.status);
                        deferred.reject('Error in reloading user details. Status code: ' + err.status);

                    }
                );

            } else {

                deferred.resolve('User not logged in, no details to update');

            }

            return deferred.promise;
        };
        */

        /**
         * @ngdoc method
         * @name logged_in_user_info
         * @description This method returns an user object containing the details
         * of the currently logged-in user. If no login has been performed, uid will be
         * zero.
         * @methodOf Userhelper.service:Userhelper
         * @returns {object} User object
         */
        this.logged_in_user_info = function() {

            return { uid: Uservalue.uid,
                     name: Uservalue.name,  // Let's recall that this is the username
                     mail: Uservalue.mail,  // Email address
                     language: Uservalue.language,
                     roles: Uservalue.roles,
                     licenses: Uservalue.licenses,
                     groups: Uservalue.groups,
                     first_name: Uservalue.first_name,
                     middle_names: Uservalue.middle_names,
                     family_name: Uservalue.family_name,
                     avatar: Uservalue.avatar };

        };

        /**
         * @ngdoc method
         * @name user_update
         * @description With this method we change first name, middle name and family name
         * of the logged-in user. We replace only the fields that have been explicitly passed
         * @param {string} first_name First name that has to replace the existing one
         * @param {string} middle_names Middle name field that has to replace the existing one
         * @param {string} family_name Family name that has to replace the existing one
         * @methodOf Userhelper.service:Userhelper
         * @returns {bool} true on success
         */
        this.user_update = function(first_name, middle_names, family_name) {

            console.debug('DBG-8uji entering user_update');

            if (!first_name && !middle_names && !family_name) {

                // This is a bug. This function shouldn't be called if there is nothing
                // to change

                console.error('W3E164 No details are given when updating a user profile');
                Clientexceptionhelper.send_client_exception('W3E164 No details are given when updating a user profile.');

                return false;
            }

            if (Uservalue.uid == 0) {

                // This is a bug. This function shouldn't be called if the user is not
                // logged in

                console.error('W3E165 User not logged in when updating their profile');
                Clientexceptionhelper.send_client_exception('W3E165 User not logged in when updating their profile.');

                return false;
            }

            var properties_to_update = {  };

            if (first_name)
                properties_to_update['first_name'] = first_name;

            if (middle_names)
                properties_to_update['middle_names'] = middle_names;

            if (family_name)
                properties_to_update['family_name'] = family_name;

            // We don't wait for the response, we send it asynchronously and just throw an exception
            // if something goes wrong

            User.update({ uid: Uservalue.uid },
                properties_to_update,
                function(response) {

                    // Everything fine, the update was successful
                    //console.debug('DBG-9i9i9i user_update update successful');

                },
                function(err) {

                    console.error('W3E166 Error in updating a user account. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E166 Error in updating a user account. Reason: ' + err.status);

                }
            );

            return true;
        };

        /**
         * @ngdoc method
         * @name add_or_remove_user_from_group
         * @description Method that adds a user to a group. Our groups are open, so the user becomes a member
         * immediately. If the logged-in user is already a member, this method will remove them from the group.
         * If the user is the admin of the group, they cannot leave the group.
         * @param {int} group_id The node id of the group we want to add the logged-in user to, or that the
         * user wants to leave.
         * @methodOf Userhelper.service:Userhelper
         * @returns {bool} true on success (actually you get false only if there is a problem with parameters
         * or with the logged-in user)
         */
        this.add_or_remove_user_from_group = function(group_id) {
            var deferred = $q.defer();

            //console.debug('DBG-by767asd6d6 entering add_or_remove_user_from_group');

            if (!group_id) {

                // This is a bug. We need the group id, of course

                console.error('W3E350 Group id not specified');
                Clientexceptionhelper.send_client_exception('W3E350 Group id not specified');

                deferred.reject('W3Exxxxxx228 Group id not specified');
                return deferred.promise;
            }

            if (Uservalue.uid == 0) {

                // This is a bug. This function shouldn't be called if the user is not
                // logged in

                console.error('W3E351 User not logged in');
                Clientexceptionhelper.send_client_exception('W3E351 User not logged in');

                deferred.reject('W3E351 User not logged in');
                return deferred.promise;
            }

            // If the logged-in user is the admin of the group, they cannot leave the group

            if (this.user_is_admin(group_id)) {

                // This is a bug because controllers shouldnt allow admins to remove themselves from a
                // group. They can delete the group, but not remove themselves from the group
                // In the future there may be the possibility for admins to become simple members provided
                // that there is at least one admin. Now we don't have the possibility to have many admins

                console.error('W3E352 Cannot remove a group admin from the group');
                Clientexceptionhelper.send_client_exception('W3E352 Cannot remove a group admin from the group');

                deferred.reject('W3E352 Cannot remove a group admin from the group');
                return deferred.promise;
            }

            // We don't wait for the response, we send it asynchronously and just throw an exception
            // if something goes wrong

            User.update({ uid: Uservalue.uid },
                { groups: group_id },
                function(response) {

                    // Everything fine, the update was successful
                    console.debug('DBG-7juyhy userhelperService add_or_remove_user_from_group group join/leave successful');

                    deferred.resolve('User successfully added or removed to/from group.');
                },
                function(err) {

                    console.error('W3E353 User not added or removed from group. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E353 User not added or removed from group. Reason: ' + err.status);

                    // @todo here we may want to tell the user to logoff and login because user info may be in
                    // inconsistent status

                    deferred.reject('W3E353 Error in adding or removing user to/from group.');
                }
            );

            return deferred.promise;
        };

        //just_a_test_of_avatar_upload(userviewinfo.user_profile_to_show.croppedavatar);

        /**
         * @ngdoc method
         * @todo this is just a test method
         * @name just_a_test_of_avatar_upload
         * @description With this method we change first name, middle name and family name
         * of the logged-in user. We replace only the fields that have been explicitly passed
         * @param {string} first_name First name that has to replace the existing one
         * @param {string} middle_names Middle name field that has to replace the existing one
         * @param {string} family_name Family name that has to replace the existing one
         * @methodOf Userhelper.service:Userhelper
         * @returns {bool} true on success
         */
        this.just_a_test_of_avatar_upload = function(croppedavatar) {

            console.debug('DBG-78uuuuss8r776fvv entering just_a_test_of_avatar_upload');


            //if (Uservalue.uid == 0) {
            //
            //    // This is a bug. This function shouldn't be called if the user is not
            //    // logged in
            //
            //    console.error('W3Exxxx165 User not logged in when updating their profile');
            //    Clientexceptionhelper.send_client_exception('W3Exxxx165 User not logged in when updating their profile.');
            //
            //    return false;
            //}


            // just_a_test_of_avatar_upload

            //var encodedcroppedavatar = $base64.encode(croppedavatar);

            var properties_to_update = {  };

            properties_to_update['avatar'] = croppedavatar;


            User.update({ uid: Uservalue.uid },
                properties_to_update,
                function(response) {

                    // Everything fine, the update was successful
                    console.debug('DBG-7uhyyyy just_a_test_of_avatar_upload upload successful');

                },
                function(err) {

                    console.error('W3Exxx166 Uy4booHa4k Error in updating a user account. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3Exxx166 Uy4booHa4k Error in updating a user account. Reason: ' + err.status);

                }
            );

            return true;
        };



        /**
         * @ngdoc method
         * @name user_is_member
         * @description This method tells us if the logged-in user is member of the group
         * whose id is given
         * @param {int} group_id The node id of the group we want to know if the logged-in user is member of
         * @methodOf Userhelper.service:Userhelper
         * @returns {bool} true if the user is member
         */
        this.user_is_member = function(group_id) {

            //console.debug('DBG-by767asd6d6 entering add_or_remove_user_from_group');

            if (!group_id) {

                // This is a bug. We need the group id, of course

                // @todo error W3E354 to be fixed

                console.error('W3E354 Group id not specified [user_is_member]');
                Clientexceptionhelper.send_client_exception('W3E354 Group id not specified [user_is_member]');

                return false;
            }

            if (Uservalue.uid == 0) {

                // This is a bug. This function shouldn't be called if the user is not
                // logged in

                // @todo error W3E355 to be fixed

                console.error('W3E355 User not logged in [user_is_member]');
                Clientexceptionhelper.send_client_exception('W3E355 User not logged in [user_is_member]');

                return false;
            }

            //console.debug('DBG-0o0o0 Uservalue.groups');
            //console.debug(Uservalue.groups);
            //console.debug(Uservalue.groups[0]); // does not work

            var user_is_member = false;

            // Scanning the list of groups the logged-in user is member of (Uservalue.groups)
            // to find if the user is member of the given group (group_id)

            for (var group_iter = 0;
                 group_iter < Uservalue.groups.length;
                 group_iter++) {

                /*console.debug('DBG-uhyh user_is_admin');
                 console.debug(Uservalue.groups[group_iter]);*/

                if (Uservalue.groups[group_iter].id == group_id) {
                    user_is_member = true;
                }

            }

            return user_is_member;
        };

        /**
         * @ngdoc method
         * @name user_is_admin
         * @description This method tells us if the logged-in user is the admin of the group
         * whose id is given
         * @param {int} group_id The node id of the group we want to know if the logged-in user is admin of
         * @methodOf Userhelper.service:Userhelper
         * @returns {bool} true if the user is admin
         */
        this.user_is_admin = function(group_id) {

            //console.debug('DBG-by767asd6d6 entering add_or_remove_user_from_group');

            if (!group_id) {

                // This is a bug. We need the group id, of course

                console.error('W3E354 Group id not specified');
                Clientexceptionhelper.send_client_exception('W3E354 Group id not specified');

                return false;
            }

            if (Uservalue.uid == 0) {

                // This is a bug. This function shouldn't be called if the user is not
                // logged in

                console.error('W3E355 User not logged in');
                Clientexceptionhelper.send_client_exception('W3E355 User not logged in');

                return false;
            }

            //console.debug('DBG-0o0o0 Uservalue.groups');
            //console.debug(Uservalue.groups);
            //console.debug(Uservalue.groups[0]); // does not work

            var user_is_admin = false;

            // Scanning the list of groups the logged-in user is member of (Uservalue.groups)
            // to find if the user is member of the given group (group_id)
            // If they are, we check if they are admins of it

            for (var group_iter = 0;
                 group_iter < Uservalue.groups.length;
                 group_iter++) {

                /*console.debug('DBG-uhyh user_is_admin');
                console.debug(Uservalue.groups[group_iter]);*/

                if (Uservalue.groups[group_iter].id == group_id) {
                    if (Uservalue.groups[group_iter].role == 'ADMIN') {
                        user_is_admin = true;
                        break;
                    }
                }

            }

            return user_is_admin;
        };

        /**
         * @ngdoc method
         * @name prepare_for_anonymous_call
         * @description This function does nothing now, but we keep it because maybe our authentication strategy changes and
         * we may need to do something before calling a REST api. In this case the 'something' that we may want to do is
         * to remove any credentials sent in http headers before performing a rest call that doesn't need them.
         * Maybe credentials sent when not needed are harmless, but they may trigger checks on urls and decrease performances
         *
         * So, it's mandatory to call this function before any rest call that doesn't need credentials.
         * Call this function if the user is not logged in.
         *
         * @methodOf Userhelper.service:Userhelper
         */
        this.prepare_for_anonymous_call = function() {

            // delete $http.defaults.headers.common.Authorization;

        };

        /**
         * @ngdoc method
         * @name prepare_for_call_with_credentials
         * @description The actual credentials we have to send to the server are contained in a cookie that
         * the browser sends automatically.
         *
         * So, why this function? We need it because the RESTws module wants an additional token
         * to guard against CSRF attacks (see https://www.drupal.org/node/1890216)
         *
         * The token is needed only when performing writing queries like update, delete and create.
         * But we send it anyway when the user is logged in. This is for simplicity.
         *
         * There is no need to send the token when the user is not logged in, and there would be no token
         * in that case anyway.
         *
         * This function has to be called before every rest call when the user is logged in.
         *
         * @methodOf Userhelper.service:Userhelper
         */
        this.prepare_for_call_with_credentials = function() {

            //console.debug('DBG-4567vvvv prepare_for_call_with_credentials Uservalue.xcsrftoken: '
            //              + Uservalue.xcsrftoken);

            // We set the http header with the token the RESTws module requires when doing writing calls
            // Writing calls are update, delete and create

            // For simplicity, we send the token when doing read-only calls as well

            $http.defaults.headers.common['X-CSRF-Token'] = Uservalue.xcsrftoken;
        };

        /**
         * @ngdoc method
         * @name forget_user_details
         * @description We forget user details after a logout. The logout is
         * done by using an iframe. When the iframe finishes doing the logout, this function is called for
         * Angular to forget the details.
         * @methodOf Userhelper.service:Userhelper
         */
        this.forget_user_details = function() {

            //console.debug('DBG-74exxed forget_user_details');

            Uservalue.uid = 0;
            Uservalue.name = '';
            Uservalue.mail = '';
            Uservalue.language = 'en';
            Uservalue.roles = [];
            Uservalue.licenses = [];
            Uservalue.groups = [];
            Uservalue.first_name = '';
            Uservalue.middle_names = '';
            Uservalue.family_name = '';
            Uservalue.xcsrftoken = '';
            Uservalue.avatar = '';

            //console.debug(Uservalue);

            // We reset the shopping order because the user logged out
            // We don't want another user or an anonymous user to be shown this user's shopping
            // cart

            Orderhelper.reset_shopping_order();

        };

        /**
         * @ngdoc method
         * @name is_user_a_subscriber
         * @description This function checks the licenses the logged in user owns to see if
         * she owns a subscriber license.
         * If no user is logged in, false is returned.
         * @methodOf Userhelper.service:Userhelper
         * @returns {boolean} True if the logged in user is a subscriber, false if no user is logged
         * in or if the logged-in user is not a subscriber
         */
        this.is_user_a_subscriber = function() {

            if (Uservalue.uid == 0) {

                // A user who is not logged in is, as far as we know, an anonymous user
                // An anonymous user is not a subscriber
                // We return false

                return false;
            }

            //console.debug('DBG-767868 is_user_a_subscriber');

            for (var license_iter = 0; license_iter < Uservalue.licenses.length; license_iter++) {

                //console.debug('DBG-0101 Uservalue.licenses[license_iter].sku');
                //console.debug(Uservalue.licenses[license_iter].sku[0]);

                // If we find just one subscriber license, we return true
                // Any subscriber license makes the user a subscriber

                if (Uservalue.licenses[license_iter].sku[0] == 'S') {

                    // The user is a subscriber
                    return true;
                }

            }

            // No subscriber license has been found
            return false;
        }

}]);

/**
 * @ngdoc service
 * @name Userhelper.service:Uservalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about the user we logged in by using the REST api `musth_restws_user`
 * Only the Userhelper service should use this service.
 */
var uservalueServices = angular.module('uservalueServices', [ ]);

uservalueServices.value('Uservalue', { uid: 0, // Drupal userid
                                       name: '', // Let's recall that this is the username
                                       mail: '', // Email address
                                       first_name: '',
                                       middle_names: '',
                                       family_name: '',
                                       language: 'en',
                                       roles: [],
                                       licenses: [],
                                       groups: [],
                                       avatar: '',
                                       xcsrftoken: '', // Token needed by RESTws when performing
                                                       // writing calls on behalf of logged-in users
                                       more_pages_of_group_members_available: false
                                     }
);
