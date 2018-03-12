/**
 * @ngdoc overview
 * @name Checkout_checkoutFormCtrl
 *
 * @description This is the controller associated to the form checkout_checkoutForm
 *
 * The form asks the user about their address with the purpose of creating a Commerce
 * custom profile to associate to the order currently in checkout.
 *
 * We are keeping this controller even if it could be incorporated in
 * the ShoppingOrderPanelCtrl.js controller because we have a controller
 * for each form. In the future there may be more things that this controller
 * has to do
 *
 * What happens here?
 *
 * * First time, the form is initialised:
 * the regular expression pattern to use to validate text fields is set;
 * the list of countries is loaded;
 * the object that will contain the information needed to create the customer
 * profile is created empty.
 * * The function submit_checkout_checkout_info is declared, it will be called
 * when the user is ready to move forward. This function will create the customer
 * profile
 * * The function load_country_info_on_change is declared. It will change the list of
 * administrative areas and other information that changes with the country
 *
 * @see musth_restws.customerprofile.ctrl.inc
 */

'use strict';

/**
 * @ngdoc controller
 * @name Checkout_checkoutFormCtrl.controller:Checkout_checkoutFormCtrl
 * @description Controller for the form checkout_checkoutForm
 */
angular.module('MusicTheatreApp.controllers').
    controller('Checkout_checkoutFormCtrl', ['$scope', 'GeoInfohelper', 'Settings',
        'Userhelper', 'CustomerProfilehelper', 'Dialoghelper',
        function ($scope, GeoInfohelper, Settings, Userhelper, CustomerProfilehelper, Dialoghelper) {

            // First time initialisation
            $scope.checkout_checkout_info = {};

            $scope.controller_name = 'Checkout_checkoutFormCtrl';

            // This regular expression is used to validate text fields.
            // When this regular expression is used, a text field will be marked as invalid
            // if it contains: . _ ~ : / ? # [ ] @ ! $ & ' ( ) * + , ; =
            // Whitespace characters like tab, carriage return, new line, form feed are invalid.
            // Spaces are allowed.

            $scope.text_validation_regex_pattern = Settings.regex_for_text_validation;

            // Loading the list of countries by calling the function load_list_of_countries provided
            // by the service GeoInfohelper
            // The list of countries is needed for the user to enter their address

            $scope.list_of_countries = GeoInfohelper.load_list_of_countries();

            //console.debug('DBG-gih8GTH list of countries');
            //console.debug(GeoInfohelper.load_list_of_countries());

            /**
             * @ngdoc method
             * @name submit_checkout_checkout_info
             * @methodOf Checkout_checkoutFormCtrl.controller:Checkout_checkoutFormCtrl
             * @description We call the function that will create the customer
             * profile after having prepared the information it needs by using the choices the user made.
             */
            $scope.submit_checkout_checkout_info = function () {
                //console.debug('DBG-1987 logging_in_user');
                //console.debug(logging_in_user);

                // The submit button shouldn't get enabled at all if the
                // form is invalid. We do this check just in case of bugs.
                if ($scope.checkout_checkoutForm.$invalid) {

                    console.error('W3Exxx aesio7Aeph We shouldnt be here. The submit button should be disabled if the form is invalid.');
                    Clientexceptionhelper.send_client_exception('W3Exxx aesio7Aeph  ' +
                        'We shouldnt be here. The submit button should be disabled if the form is invalid.');

                    return;
                }

                // If the user is logged-in we ignore any email address entered in the checkout_checkout form and
                // we use the user's email instead
                // Actually, if the user is logged in, the email shouldn't be asked for

                if ($scope.user.uid != 0)
                    $scope.checkout_checkout_info.email = $scope.user.mail;

                // To create the customer profile we need the iso code of the country, the two-letters one.
                // From $scope.selected_country, which is the country the user selected, we get the iso code
                // and ignore the full name of the country.

                $scope.checkout_checkout_info.country = $scope.selected_country.isocode;

                // Does the selected country use administrative areas (States, regions, provinces)?
                // If yes, we have to get the administrative area to fill in the corresponding field
                // in the customer profile

                if ($scope.country_info.administrative_area_used) {

                    if ($scope.country_info.administrative_areas == null) {

                        // For the selected country we don't have a dropdown list of areas to choose
                        // from. $scope.country_info.administrative_areas is null

                        // We get the administrative area from the free text field

                        $scope.checkout_checkout_info.administrative_area =
                            $scope.checkout_checkout_info.administrative_area_free_field;

                    } else {

                        // For the selected country we do have a dropdown list of areas to choose
                        // from. $scope.country_info.administrative_areas is not null and contains
                        // the possible choices

                        // We get the administrative area, precisely its abbreviation, from the selected
                        // administrative area (administrative_area_object)

                        $scope.checkout_checkout_info.administrative_area =
                            $scope.checkout_checkout_info.administrative_area_object.abbreviation;

                    }

                }

                //console.debug('DBG-scci8TGF checkout_checkout_info');
                //console.debug($scope.checkout_checkout_info);

                // Now we are ready to call the function process_workflow_to_move_order_to_next_status
                // defined by the parent controller TagViewCtrl
                // It will create the customer profile and move on the next step in the checkout process
                $scope.process_workflow_to_move_order_to_next_status($scope.checkout_checkout_info);
            };

            /**
             * @ngdoc method
             * @name load_country_info_on_change
             * @methodOf Checkout_checkoutFormCtrl.controller:Checkout_checkoutFormCtrl
             * @description When the user selects another country we have to reload
             * the information for that country: list of administrative areas,
             * if that country uses postal codes, and so on
             */
            $scope.load_country_info_on_change = function(country_code) {

                //console.debug('DBG-lcioc8787 entering load_country_info_on_change with country_code= ' + country_code);

                // We do this just by calling the function load_geo_info_for_country provided by the
                // service GeoInfohelper

                $scope.country_info = GeoInfohelper.load_geo_info_for_country(country_code);

                //console.debug('DBG-lcioc98YH load_country_info_on_change');
                //console.debug($scope.country_info);

            };

            /**
             * @ngdoc method
             * @name populate_checkout_form_with_most_recent_customer_profile
             * @methodOf Checkout_checkoutFormCtrl.controller:Checkout_checkoutFormCtrl
             * @description When the user clicks on "Use my details", we get the last customer
             * profile the user entered, if any, and use it to populate the form's fields.
             */
            $scope.populate_checkout_form_with_most_recent_customer_profile = function() {

                //console.debug('@Checkout_checkoutFormCtrl::populate_checkout_form_with_most_recent_customer_profile');
                //console.debug($scope.user);

                if ($scope.user.uid == 0) {

                    // It's a bug, this function shouldn't be called if the user
                    // is not logged in

                    console.error('W3Exxx omo3Veihah populate_checkout_form_with_most_recent_customer_profile ' +
                        'called when the user is not logged in');
                    Clientexceptionhelper.send_client_exception('W3Exxx omo3Veihah ' +
                        'populate_checkout_form_with_most_recent_customer_profile called ' +
                        'when the user is not logged in');

                    return;
                }

                // First of all, the email we are going to use is the logged-in user's
                // Forget about anything else
                $scope.checkout_checkout_info.email = $scope.user.mail;

                Userhelper.prepare_for_call_with_credentials();

                CustomerProfilehelper.load_most_recent_customer_profile_for_logged_in_user().then(
                    function(most_recent_customer_profile_for_logged_in_user) {

                        //console.debug('DBG-y78uu8756 getting most_recent_customer_profile_for_logged_in_user');
                        //console.debug(most_recent_customer_profile_for_logged_in_user);

                        if (most_recent_customer_profile_for_logged_in_user) {

                            // Now we use the customer profile we just got to populate the form

                            // We are getting the full country object.
                            // It will be something like:
                            // { isocode: "AF", name: "Afghanistan" }
                            // To do this we use the function
                            // country_object_from_iso_code, which takes a country
                            // code like 'AF'
                            // We use the full country object to initialise $scope.selected_country
                            // which will be used in the form

                            $scope.selected_country = GeoInfohelper.country_object_from_iso_code(
                                most_recent_customer_profile_for_logged_in_user.country);

                            // With this function we display and enable the fields that,
                            // in an address, are specific to a country, like County, State, etc

                            $scope.load_country_info_on_change($scope.selected_country.isocode);

                            var properties_to_just_copy = [ 'organisation_name', 'premise',
                                'locality', 'thoroughfare', 'postal_code', 'name_line' ];

                            for (var i in properties_to_just_copy) {

                                //console.debug('DBG-76tgt property_name: ' + properties_to_just_copy[i]);

                                $scope.checkout_checkout_info[properties_to_just_copy[i]] =
                                    most_recent_customer_profile_for_logged_in_user[properties_to_just_copy[i]];
                            }

                            // Are administrative areas used by the selected country?
                            // Do they have states, provinces, counties or similar?
                            // If yes, we have to populate the administrative area field

                            if ($scope.country_info.administrative_area_used) {

                                if ($scope.country_info.administrative_areas == null) {

                                    // For the selected country we don't have a dropdown list of areas to choose
                                    // from. $scope.country_info.administrative_areas is null

                                    // The user will have entered an administrative area in a free field

                                    $scope.checkout_checkout_info.administrative_area_free_field =
                                        most_recent_customer_profile_for_logged_in_user['administrative_area'];

                                } else {

                                    // For the selected country we do have a dropdown list of areas to choose
                                    // from. $scope.country_info.administrative_areas is not null and contains
                                    // the possible choices

                                    // We have to populate the object
                                    // $scope.checkout_checkout_info.administrative_area_object
                                    // with abbreviation and full_name

                                    $scope.checkout_checkout_info.administrative_area_object =
                                        GeoInfohelper.administrative_area_object_from_country_code_and_area_abbreviation(
                                            $scope.selected_country.isocode,
                                            most_recent_customer_profile_for_logged_in_user['administrative_area']
                                        );

                                }

                            }

                            //console.debug('DBG-8656g here full_country_object');
                            //console.debug($scope.selected_country);

                        } else {

                            //console.debug('DBG-7gferd populate_checkout_form_with_most_recent_customer_profile ' +
                            //    'null customer profile');

                            Dialoghelper.standard_dialog_for_message('NO_CUSTOMER_PROFILE');

                        }

                    },
                    function(reason) {

                        console.error('W3Exxx Tie9Eirish Something wrong when calling ' +
                            'load_most_recent_customer_profile_for_logged_in_user. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx Tie9Eirish Something wrong when calling ' +
                            'load_most_recent_customer_profile_for_logged_in_user. Reason: ' + reason);
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }

                );

            };

            /**
             * @ngdoc method
             * @name refresh_scrollbar
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function refreshes the scrollbar.
             *
             * @todo doc to fix
             *
             * Why do we have to refresh it?
             *
             * The info panel has three scrollbars. One for the summary, one for the tracks and one for the
             * sleeve notes.
             *
             * The three scrollbars are created by the script scrollbar/scrollbar.js when the page is loaded.
             * At that time not all scrollbars are visible. This means that the script can't calculate elements'
             * sizes correctly.
             *
             * When a scrollbar becomes visible we have to refresh it for the script to recalculate elements'
             * sizes correctly.
             *
             * This function is called in the partial partials/tagview.html.
             */
            $scope.refresh_scrollbar = function () {

                //console.debug('@SocialViewCtrl::refresh_scrollbar');

                // Why are we using $timeout?
                // If we call $window.ssb.refresh without using $timeout, it may be called
                // when the scrollbar is still invisible.
                // $timeout calls $window.ssb.refresh after the event that makes the scrollbar
                // visible has been processed.
                // Doing so we are sure that the scrollbar is visible

                if (typeof $window.ssb != "undefined")
                    $timeout($window.ssb.refresh);

            };

        }]);
