/**
 * @ngdoc overview
 * @name TagViewCtrl
 * @description This is the controller associated to the view tagview
 * We have here, as well, the service Tagviewstatusvalue used to keep information through
 * controller initialisations. The information is used to process tagring event that would
 * otherwise go lost.
 * There are the three famous functions onPlayPreviewClick, onInfoClick and onPlayMovieClick
 * that the tagring calls to tell us that the corresponding button has been clicked.
 */

'use strict';

/**
 * @ngdoc controller
 * @name TagViewCtrl.controller:TagViewCtrl
 * @description This is the controller associated to the view tagview
 *
 * * What happens here?
 *
 * * The tagview view is initialised
 * * The tagring is initialised differently for each content type (video, audio, library)
 * * Tagring events are processed
 * * The videoplayer is initialised by using the videoplayer helper service to play videos
 * * Audio tracks are downloaded if the user has permission
 * * Prices are loaded
 * * Votes aggregates are loaded for the displayed programme
 * * If the user is logged in, we show the vote they gave to the programme, if any
 * * The browser url is changed according to the displayed programme
 */
angular.module('MusicTheatreApp.controllers').
  controller('TagViewCtrl', ['$scope',
                             'Programme',
                             'URLsKit',
                             'Permalinkhelper',
                             'Programmehelper',
                             'Urlskithelper',
                             'Downloadableurlhelper',
                             'Videoplayerhelper',
                             'Clientexceptionhelper',
                             'Userhelper',
                             'Orderhelper',
                             'Tagringhelper',
                             'Producthelper',
                             'Votesaggregatehelper',
                             'Votehelper',
                             'Tagviewstatusvalue',
                             'Grouphelper',
                             'Posthelper',
                             'Commenthelper',
                             'Dialoghelper',
                             'Messagehelper',
                             'Settings',
                             '$window', // Used to do downloads, refresh scrollbars, do redirects
                             '$timeout',
                             '$routeParams',
                             '$location',
                             '$rootScope',
        function($scope, Programme, URLsKit, Permalinkhelper,
                 Programmehelper, Urlskithelper, Downloadableurlhelper,
                 Videoplayerhelper, Clientexceptionhelper, Userhelper,
                 Orderhelper, Tagringhelper, Producthelper,
                 Votesaggregatehelper, Votehelper, Tagviewstatusvalue,
                 Grouphelper, Posthelper, Commenthelper, Dialoghelper,
                 Messagehelper,
                 Settings, $window,
                 $timeout, $routeParams, $location,
                 $rootScope) {

            $scope.controller_init = function() {

                console.info('@TagViewCtrl::controller_init');
                console.info('    $location.path: ' + $location.path());

                //$log.debug('see this');
                //console.debug('see this');

                //Dialoghelper.standard_dialog_for_remote_api_call_exception('test reason');

                //Dialoghelper.standard_dialog_for_message('this is worng');

                //throw new Error("emanuele was here 525 6yhn7ujm");

                // Every controller should set this variable
                // The login form (LoginFormCtrl.js) uses it to know which controller
                // is currently working and changes its behaviour accordingly

                $scope.controller_name = 'TagViewCtrl';

                // Programme-loading variables initialisation

                $scope.programme_loaded = false;
                $scope.loaded_programme_nid = 0;

                // Info panel variables initialisation

                $scope.infopanelinfo = { show: false,
                                         show_loading: false,
                                         show_play_track_button: false,
                                         no_prices: false };

                // Setting the date format for bio info

                $scope.date_format_for_bio_info = Settings.default_date_format;

                //console.debug('DBG-i78hbg date_format_for_bio_info ' + $scope.date_format_for_bio_info);

                // Video player variables initialisation

                $scope.showvideoplayer = false;

                // Tagring variables initialisation

                $rootScope.show_tagring = true;

                // User info initialisation

                // In case this controller got reinitialised when a user was logged in
                // We don't want the user to login again if the page is refreshed or
                // this controller reinitialised

                // This is just a first initialisation we have to do to prevent errors whilst we
                // wait for the actual data
                $scope.user = { uid: 0,
                                name: '',
                                mail: '',
                                language: '',
                                subscriber: false,
                                licenses: [],
                                groups: [],
                                first_name: '',
                                middle_names: '',
                                family_name: '',
                                avatar: '' };

                var logged_in_info = Userhelper.logged_in_user_info();

                if (logged_in_info.uid) {

                    //console.debug('    (tagviewctrl) logged_in_info');
                    //console.debug(logged_in_info);

                    // If we are already logged in and have the logged-in user's info,
                    // let's use it

                    $scope.user = { uid: logged_in_info.uid,
                                    name: logged_in_info.name,
                                    mail: logged_in_info.mail,
                                    language: logged_in_info.language,
                                    subscriber: Userhelper.is_user_a_subscriber(),
                                    licenses: logged_in_info.licenses,
                                    groups: logged_in_info.groups,
                                    first_name: logged_in_info.first_name,
                                    middle_names: logged_in_info.middle_names,
                                    family_name: logged_in_info.family_name,
                                    avatar: logged_in_info.avatar };

                    Votehelper.load_votes(logged_in_info.uid).then(
                        function(response) {

                            //console.debug('DBG-7cgtt fetch_user_details in controller_init in TagViewCtrl');

                            //console.debug('    (tagviewctrl) before $broadcast 1');

                            $scope.$broadcast('onTagViewCtrlInitComplete');

                            //console.debug('DBG-(TWC init fetch_user_details) this is for the logged-in user');
                            //console.debug(user);
                            //console.debug(Userhelper.logged_in_user_info());

                        },
                        function(reason) {

                            // @todo do we need this exception?

                            console.error('W3Exxx273  User details not fetched. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx273 User details not fetched. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                    //$scope.$broadcast('onTagViewCtrlInitComplete');

                    // @todo broadcast event here?

                    //console.debug('DBG-9ijuhy before creating group uid: ' + logged_in_info.uid);

                } else {


                    //console.debug('DBG-(TWC init) about to run fetch_user_details');

                    // Otherwise, let's fetch it

                    Userhelper.fetch_user_details().then(
                        function(user) {

                            //console.debug('@TagViewCtrl::controller_init fetch_user_details if uid==0');
                            //console.debug(user);

                            $scope.user.uid = user.uid;
                            $scope.user.name = user.name;
                            $scope.user.mail = user.mail;
                            $scope.user.language = user.language;
                            $scope.user.licenses = user.licenses;
                            $scope.user.groups = user.groups;
                            $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                            $scope.user.first_name = user.first_name;
                            $scope.user.middle_names = user.middle_names;
                            $scope.user.family_name = user.family_name;
                            $scope.user.avatar = user.avatar;

                            //console.debug('    (tagviewctrl) fetch_user_details uid: ' + user.uid);
                            //console.debug('    (tagviewctrl) before $broadcast 2');

                            // $scope.$broadcast('onTagViewCtrlInitComplete');

                            //console.debug('DBG-(TWC init fetch_user_details) this is for the logged-in user');
                            //console.debug(user);
                            //console.debug(Userhelper.logged_in_user_info());

                        },
                        function(reason) {

                            console.error('W3E273 User details not fetched. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E273 User details not fetched. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }

                // Login panel variables initialisation

                $scope.loginpanelinfo = { show: false,
                                          section_to_show: '' };

                // Header info variables initialisation

                $scope.headerinfo = { current_menu_item: '' };

                // Footer info variables initialisation

                $scope.footerinfo = { show_footer_panel: false,
                                      section_to_show: ''};

                // Shopping order panel variables initialisation

                $scope.shoppingorderinfo = { show: false,
                                             section_to_show: '',
                                             track_to_buy: null };

                // User panel variables initialisation
                // @todo do we need section_to_show? are there many sections?
                // I guess there will be sections in the user panel, just waiting for them to be defined

                $scope.userviewinfo = { show: false,
                                        section_to_show: '' };

                // Comment form variables initialisation

                $scope.commentsforminfo = { nid: 0,
                                            page: 0,
                                            do_refresh: false, // Used to prevent comments from being
                                                               // refreshed if not shown
                                            more_pages_available: false,
                                            comments: [] };

                // Reviews form variables initialisation

                $scope.reviewsforminfo = { nid: 0,
                                           page: 0,
                                           showing_user_reviews: false,
                                           more_pages_available: false,
                                           reviews: [] };

                // Programme vote panel variables initialisation

                $scope.programmevotepanelinfo = { nid: 0,
                                                  average: 0,
                                                  count: 0,
                                                  user_vote: { value: 0, value_type: 'percent' }
                                                };

                // Fans tab variables initialisation

                $scope.programmefanstabinfo = {
                    nid: 0,
                    number_of_fans: 0,
                    fanslist: [],
                    user_vote: { value: 0, value_type: 'percent' }
                };

                // Information about applying schema.org RDFa markup to help google with understanding what
                // our website is about

                // @todo variables to the completed and used

                // @todo for partners: programme.partner_details[0].partner_type == 'organisation'

                $scope.schemamarkupinfo = {
                    type_of_object: '', // VideoObject, AudioObject, Article, Person, Organization
                    caption_used: false, // Does the object have a caption property?
                    provide_rating_property: false, // If the object has a rating
                    programme_url: '',
                    thumbnail_url: '' // Its' the summary panel image
                };

                // $scope.programmevotepanelinfo.user_vote = { value: 0, value_type: 'percent' };

                // We initialise the tagring according to the content type,
                // which can be video, audio or library
                // Here it is where the tagring is actually inserted in the
                // page and initialised
                // The content type is the second parameter in the url, the first
                // being the language
                // It's 'v' for video, 'a' for audio and 'l' for library
                // @todo and partners

                if (typeof $routeParams.tagringcontenttype !== "undefined") {

                    var tagringcontenttype = $routeParams.tagringcontenttype;

                    var content_type_for_tagring_helper = '';

                    if (tagringcontenttype == 'v') {
                        $scope.headerinfo.current_menu_item = 'Video';
                        $scope.schemamarkupinfo.type_of_object = 'VideoObject';
                        $scope.schemamarkupinfo.provide_rating_property = true;
                        content_type_for_tagring_helper = 'video';
                    }
                    else if (tagringcontenttype == 'a') {
                        $scope.headerinfo.current_menu_item = 'Audio';
                        $scope.schemamarkupinfo.type_of_object = 'AudioObject';
                        $scope.schemamarkupinfo.provide_rating_property = true;
                        content_type_for_tagring_helper = 'audio';
                    }
                    else if (tagringcontenttype == 'l') {
                        $scope.headerinfo.current_menu_item = 'Library';
                        $scope.schemamarkupinfo.type_of_object = 'Article';
                        $scope.schemamarkupinfo.provide_rating_property = true;
                        content_type_for_tagring_helper = 'library';
                    }
                    else if (tagringcontenttype == 'p') {
                        $scope.headerinfo.current_menu_item = 'Partners';
                        $scope.schemamarkupinfo.provide_rating_property = false;
                        content_type_for_tagring_helper = 'partners';
                    }

                    if (typeof $routeParams.nid !== "undefined") {

                        $scope.change_tagring_content_type_and_initialise_the_tagring(content_type_for_tagring_helper,
                                                                                      false,
                                                                                      $routeParams.nid);

                    } else {

                        $scope.change_tagring_content_type_and_initialise_the_tagring(content_type_for_tagring_helper,
                                                                                      false);

                    }

                } else {
                    // By default we initialise a 'video' tagring
                    // We do this default initialisation if no tagring content type
                    // is specified in the url

                    $scope.change_tagring_content_type_and_initialise_the_tagring('video', true);
                }

                // We got a tagring event to process even if the controller has just been
                // initialised
                // This happens when, because of a tagring button having been clicked,
                // there is a change of url and this controller is reinitialised
                // When this reinitialisation happens, the event the tagring sent to be
                // processed is lost. That's why we store it in Tagviewstatusvalue.
                // This latter, being a service, is not reinitialised and can keep the event
                // that we now are about to process

                if (Tagviewstatusvalue.event_from_tagring_to_be_processed != '') {

                    $scope.event_from_tagring(Tagviewstatusvalue.event_from_tagring_to_be_processed,
                                              Tagviewstatusvalue.nid_of_programme_to_be_loaded);

                    // Resetting the event to be processed for the next go
                    // Let's recall that Tagviewstatusvalue is persistent:
                    // it doesn't reset when controllers reinitialise
                    Tagviewstatusvalue.event_from_tagring_to_be_processed = '';
                    Tagviewstatusvalue.nid_of_programme_to_be_loaded = 0;

                    // No need to continue
                    return;
                }

                // If there is no tagring event to process, by default
                // we check the 'nid' part of the url, if any, and use it to
                // display the infopanel for the programme whose nid is given

                if (typeof $routeParams.nid !== "undefined") {

                    var nid = $routeParams.nid;

                    //console.debug('DBG-init7282 about to run event_from_tagring for node: ' + nid);

                    // isNaN returns true if a number is an illegal one
                    if (!isNaN(nid)) {
                        $scope.event_from_tagring('onInfoClick', nid);
                    }
                }

            }; // end of controller_init

            /* @todo maybe we need this? do we need to redirect? maybe it's useful when redirecting
            to the payment gateway
            $scope.test_redirect = function() {

                $window.location="http://dev-hybridauth.gotpantheon.com/test";

            }
            */

            /**
             * @ngdoc method
             * @name change_tagring_content_type_and_initialise_the_tagring
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description We have to (re)initialise the tagring because the content type has changed.
             * If requested so, we also update the url to reflect the new content type             *
             * @param {string} content_type 'video', 'audio' or 'library'
             * @param {bool} reset_location True if we have to update the url according to the new content type
             */
            $scope.change_tagring_content_type_and_initialise_the_tagring = function(content_type,
                                                                                     reset_location,
                                                                                     programme_id) {

                $scope.tagring_content_type_selector = content_type;

                //console.debug('@change_tagring_content_type_and_initialise_the_tagring');
                //console.debug('   tagring_content_type_selector: ' + $scope.tagring_content_type_selector);

                if (typeof reset_location === "undefined")
                    reset_location = true;

                if (reset_location) {

                    var first_letter_of_new_tagring_content_type_selector =
                        $scope.tagring_content_type_selector.substring(0,1);

                    var new_path = '/en/' + first_letter_of_new_tagring_content_type_selector;

                    var current_path = $location.path();

                    if (current_path != new_path) {
                        //console.debug('DBG-clatct9845 changing path ');
                        //console.debug('   new_path: ' + new_path + ', current-path: ' + current_path);
                        //console.debug('   about to call $location.path(new_path) new_path: ' + new_path);

                        var array_current_path_split = current_path.split('/');

                        // We want to replace the current path if it is something like
                        // the home ('/') or anyway if it has less than 2 parts ('/en' for example)
                        // This because, if we leave both '/' and 'en/v', for example in the history,
                        // when the user clicks the back button, they go from '/en/v' to '/' where
                        // this same controller rewrites the path to '/en/v' and we have a loop.
                        // The user will never be able to go further back
                        // If the current path has already at least two parts (like '/en/v'), there is no
                        // possibility of loop
                        if (typeof array_current_path_split[2] == "undefined")
                            $location.replace();

                        $location.path(new_path);
                    }

                    //console.debug('DBG-ctct8rft called change_location_according_to_content_type');
                }

                Tagringhelper.initialise_tagring(content_type, programme_id);
            };

            /**
             * @ngdoc method
             * @name event_from_tagring
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description
             *
             * Here events from the tagring are processed
             *
             * There are three events:
             *
             * - onInfoClick: Display the infopanel
             * - onPlayPreviewClick: Play the preview of the current programme
             * - onPlayMovieClick: Play the full movie for the current programme
             *
             * @param {string} event_name Name of the tagring event
             * @param {int} nid Node if of the current programme
             */
            $scope.event_from_tagring = function (event_name, nid) {

                console.info('@event_from_tagring');
                console.info('   event: ' + event_name + ', nid: ' + nid);

                if (event_name != 'onInfoClick' &&
                    $scope.tagring_content_type_selector != 'video') {
                    // We have a problem here
                    // The tagring shouldn't send to us any other event than onInfoClick
                    // if we aren't in the video section

                    // @todo exception handling waiting for things to settle down

                    console.error('W3E aeph7tahN3 In the library or audio sections the ' +
                        'tagring should send only onInfoClick events');
                    Clientexceptionhelper.send_client_exception('W3E aeph7tahN3 In the library or audio sections ' +
                        'the tagring should send only onInfoClick events');

                    // Refusing to process the event
                    return;
                }

                // If the requested programme, the one whose node id is nid, has already been
                // loaded, and the event is onInfoClick, just show the infopanel

                if ($scope.loaded_programme_nid == nid &&
                    event_name == 'onInfoClick' &&
                    !$scope.infopanelinfo.show) {

                    // @todo is it ok that the section is summary for library and partners?
                    $scope.section_to_show = 'summary';

                    $scope.infopanelinfo.show = true;
                    $scope.$apply();

                    //console.debug('DBG-19YG-5 in if show_infopanel: ' + $scope.show_infopanel);

                    return;
                }

                // Now we can have:
                // * The event is not onInfoClick
                // or
                // * The programme has not been loaded
                // or both

                // Here the programme has not been loaded yet, so we show the loading wheel

                if ($scope.loaded_programme_nid != nid) {
                    // The programme has not been loaded and the event is any of the three
                    // We show the loading wheel
                    $scope.infopanelinfo.show_loading = true;
                    $scope.programme_loaded = false;
                    $scope.loaded_programme_nid = 0; // for safety
                    $scope.commentsforminfo.nid = 0;
                    $scope.reviewsforminfo.nid = 0;

                    $scope.infopanelinfo.show = false; // Hide the infopanel until we load the programme
                } else {
                    // The programme has been loaded and the event is not onInfoClick
                    // We have just to display the infopanel
                    $scope.infopanelinfo.show = true;
                }

                // We are going to load the programme even if it may already be in cache
                // This is to keep the code simple

                // The call can be anonymous because programmes are public
                Userhelper.prepare_for_anonymous_call();

                Programmehelper.load_programme(nid).then(function(programme) {
                        $scope.programme = programme;
                        $scope.programme_loaded = true;
                        $scope.loaded_programme_nid = nid;
                        $scope.commentsforminfo.nid = nid;
                        $scope.reviewsforminfo.nid = nid;
                        $scope.infopanelinfo.show = true;
                        $scope.section_to_show = 'summary'; // @todo ok for library and partners?

                        // When we load a programme, the url will change, unless we are reloading
                        // the same programme as the one currently displayed
                        var url_will_change = $scope.set_url_for_current_programme(programme);

                        if (url_will_change) {

                            // The url is about to change

                            // This means that this controller (TagViewCtrl)
                            // will be reinitialised

                            // Let's not waste time by going on
                            // Let's return here

                            // Just let's store the event and the node id so that
                            // the controller, when it reinitialises, calls this
                            // function (event_from_tagring) again and this time
                            // the results of the queries below (ex. load_urlskit) won't go wasted
                            // because of any reinitialisation

                            Tagviewstatusvalue.event_from_tagring_to_be_processed = event_name;
                            Tagviewstatusvalue.nid_of_programme_to_be_loaded = nid;

                            //console.debug('DBG-1IJF event_from_tagring Tagviewstatusvalue');
                            //console.debug(Tagviewstatusvalue);

                            return;
                        }

                        // @todo do this

                        // If the programme we just loaded is actually a Partner, we want to know if
                        // it's a Person or an Organization because we need to choose the proper
                        // type of object for schema.org markup

                        // We need to determine the type of object only if this has not been done yet
                        if (!$scope.schemamarkupinfo.type_of_object) {

                            // Defaults to Person in case anything is wrong
                            $scope.schemamarkupinfo.type_of_object = 'Person';

                            if (typeof $scope.programme.partner_details[0] != "undefined") {

                                // Yes, partner_type is organisation with 's', type_of_object is
                                // Organization with 'z'
                                if ($scope.programme.partner_details[0].partner_type == 'organisation') {

                                    $scope.schemamarkupinfo.type_of_object = 'Organization';

                                }
                            }

                        }

                        $scope.schemamarkupinfo.programme_url = $location.absUrl();

                        $scope.schemamarkupinfo.thumbnail_url = $window.location.origin + $scope.programme.summary_panel_image;

                        // When we load the info panel, as we are doing now, one of the scrollbars of the info panel
                        // becomes visible. We have to refresh that scrollbar so that the scrollbar script
                        // can calculate the correct values of the scrollbar's sizes. It couldn't do so
                        // when the scrollbar was invisible
                        $scope.refresh_scrollbar();

                        // We need to know if the user is a subscriber to avoid showing prices to them

                        $scope.user.subscriber = Userhelper.is_user_a_subscriber();

                        // We load products here, the ones that have prices for the current programme's
                        // tracks, and copy the tracks' prices from products
                        // to the tracks array in the programme object we just loaded

                        // Show prices if the user is not a subscriber or if the programmes we are
                        // showing here are not video programmes
                        // Don't show prices if the "programmes" we are showing are library ones.

                        $scope.infopanelinfo.no_prices = ($scope.user.subscriber &&
                            $scope.programme.system_title.substring(0,1) == 'V') ||
                            $scope.tagring_content_type_selector == 'library' ||
                            $scope.tagring_content_type_selector == 'partners';

                        if (!$scope.infopanelinfo.no_prices)
                            $scope.load_all_products_for_a_programme($scope.programme);

                        // Now loading the votes aggregate, if any, for the programme
                        // The votes aggregate information will be put in $scope.programmevotepanelinfo

                        //console.debug('DBG-0998787 1');

                        $scope.load_votes_aggregate_for_a_programme($scope.programme.nid);

                        //console.debug('DBG-0998787 2');

                        // @todo ok?
                        // Here we load the number of fans for this programme
                        $scope.load_votes_aggregate_for_a_programme($scope.programme.nid, 'fan');

                        //console.debug('DBG-0998787 3');

                        // Loading voting info for tracks
                        // We load votes aggregates (average and count) for all tracks and
                        // the vote, if any, given to tracks by the logged-in user
                        $scope.load_voting_info_for_all_tracks_in_a_programme($scope.programme);

                        //console.debug('DBG-ysys-before programmevotepanelinfo user.uid: ' +
                        //    $scope.user.uid);

                        // Getting the vote, if any, the logged-in user gave to the programme
                        // It will be displayed in programme_vote_panel.html
                        if ($scope.user.uid) {

                            // Initialising the node id for the programme vote panel
                            // so that the user can rate the programme
                            $scope.programmevotepanelinfo.nid = $scope.programme.nid;

                            //console.debug('DBG-0998787 4 ' + $scope.user.uid + '/' + $scope.programme.nid);

                            $scope.programmevotepanelinfo.user_vote =
                                Votehelper.vote_user_gave_to_node($scope.user.uid, $scope.programme.nid);

                            // If the logged-in user gave no vote to the programme, let's set the initial values
                            // so that the code in programme_vote_panel.html can still work
                            if (typeof $scope.programmevotepanelinfo.user_vote == 'undefined')
                                $scope.programmevotepanelinfo.user_vote = { value: 0, value_type: 'percent' };

                            if ($scope.programmevotepanelinfo.user_vote == null)
                                $scope.programmevotepanelinfo.user_vote = { value: 0, value_type: 'percent' };

                            // @todo here we need to populate $scope.programmefanstabinfo

                            //console.debug('DBG-0998787 5');
                            //console.debug($scope.programmevotepanelinfo);

                            //$scope.programmefanstabinfo

                            $scope.programmefanstabinfo.nid = $scope.programme.nid;

                            $scope.programmefanstabinfo.user_vote =
                                Votehelper.vote_user_gave_to_node($scope.user.uid, $scope.programme.nid, 'fan');

                            if (typeof $scope.programmefanstabinfo.user_vote == 'undefined')
                                $scope.programmefanstabinfo.user_vote = { value: 0, value_type: 'percent' };

                            if ($scope.programmefanstabinfo.user_vote == null)
                                $scope.programmefanstabinfo.user_vote = { value: 0, value_type: 'percent' };

                            //$scope.programmefanstabinfo = {
                            //    nid: $scope.programme.nid,
                            //    number_of_fans: 0,
                            //    user_vote: { value: 0, value_type: 'percent' }
                            //};

                            //console.debug('DBG-45rff programmevotepanelinfo');
                            //console.debug($scope.programmevotepanelinfo);
                        }

                        // When the user hover on the info button they get on the left side of a track line,
                        // they can see a tooltip showing the track tooltip and the track credits list
                        // Here we are going to compose the credits list line that will be shown

                        $scope.add_displayable_credits_list_to_tracks($scope.programme);

                        //console.debug('DBG-6677 programmevotepanelinfo');
                        //console.debug($scope.programmevotepanelinfo);

                        // If we have to play a preview or a movie, we need the signed url
                        if (event_name != 'onInfoClick') {

                            // Only when we play the full movie we need credentials
                            // If the user is not logged in, we have no credentials to send
                            // Maybe the user can still play the movie if it's a free one
                            // See the function prepare_for_call_with_credentials for information
                            // about the new login system based on iframes
                            if (event_name == 'onPlayMovieClick' && $scope.user.uid != 0)
                                Userhelper.prepare_for_call_with_credentials();

                            // Calling the URLsKit REST api to get the signed urls
                            Urlskithelper.load_urlskit($scope.programme.system_title).then(
                                function(urlskit) {

                                    $scope.urlskit = urlskit;

                                    //console.debug('DBG-7654 urlskit');
                                    //console.debug(urlskit);

                                    // It looks like the user has no permission to play the full movie
                                    // We bring up the shopping panel
                                    if (!$scope.urlskit.movie_url && event_name == 'onPlayMovieClick') {
                                        $scope.bring_up_shopping_order_panel('buy_or_subscribe');
                                        return;
                                    }

                                    // What happens here if it's an audio programme?
                                    // Simply we don't get here because for audio programmes,
                                    // at least for now, we have only onInfoClick events
                                    // There is a check above to prevent events other than onInfoClick
                                    // from being processed for audio programmes

                                    if (event_name == 'onInfoClick' ||
                                        $scope.tagring_content_type_selector != 'video') {
                                        // We have a bug here
                                        // We are about to bring up the video player because
                                        // we should be about to play a preview or a full movie
                                        // and we should be in the video section
                                        // It looks like a bug in an another part of the code
                                        // brought us to this situation

                                        // The tagring shouldn't send us any other event than onInfoClick
                                        // if we aren't in the video section

                                        // @todo exception handling waiting for things to settle down

                                        console.error('W3E??? MohW4ruumi3oofo We have a bug here just before ' +
                                            'starting the video player');
                                        Clientexceptionhelper.send_client_exception('W3E??? MohW4ruumi3oofo We have a bug here just before ' +
                                            'starting the video player');

                                        // Refusing to proceed
                                        return;
                                    }

                                    $scope.showvideoplayer = true;

                                    // Initialising the video player in order for it to
                                    // play the preview or the movie
                                    Videoplayerhelper.initialise_player(event_name,
                                        $scope.urlskit,
                                        $scope.programme.tracks);

                                },
                                function(reason) {

                                    console.error('W3E031 Urlskit not loaded. Reason: ' + reason);
                                    Clientexceptionhelper.send_client_exception('W3E031 Urlskit not loaded. Reason ' +
                                        reason);
                                    // @todo What do we say to the user?
                                    Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                                }
                            );
                        } // end if (event_name != 'onInfoClick')

                    },
                    function(reason) {

                        console.error('W3E032 Programme not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E032 Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            }; // end of event_from_tagring function

            /**
             * @ngdoc method
             * @name set_url_for_current_programme
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description When a programme is chosen in the tagring and any button clicked (Preview, Info or
             * Movie), we bring up the infopanel and change the url according to the programme.
             * This function sets the new url for the programme by using the programme's display title.
             * It adds the url to the browser history or replaces it when it's needed to avoid loops when
             * using the back button. If this function doesn't replace the url instead of adding it to the history
             * when it has to, when the user clicks on 'back', they can't go back because the url will be
             * retransformed into the current url.
             * @param {object} programme Just loaded programme we have to set the url after
             */
            $scope.set_url_for_current_programme = function (programme) {

                //console.debug('@set_url_for_current_programme');

                // In the url there is a part that corresponds to the programme's display title
                // Since the latter can include characters that we don't want in the url, here we clean up
                // those characters

                var new_path =
                    Permalinkhelper.make_programme_permalink(programme.nid,
                                                             programme.system_title,
                                                             programme.display_title);

                // If there is a review id, we have to keep it in the url otherwise it
                // would go lost and the review wouldn't be shown

                var current_path = $location.path();

                //console.debug('DBG-8888 set_url_for_current_programme');
                //console.debug('   new_path: ' + new_path + ', current_path: ' + current_path);

                // We change the url only if it's actually different from the current one
                if (current_path != new_path) {

                    // Calculating old node id
                    var array_current_path_split = current_path.split('/');

                    var programme_node_id_in_current_path;
                    if (array_current_path_split.length >= 3)
                        programme_node_id_in_current_path = parseInt(array_current_path_split[3]);
                    else
                        programme_node_id_in_current_path = 0;

                    //console.debug('   about to add or replace the path');
                    //console.debug('   current path: ' + current_path);

                    // If the path has a defined node id and this node id is different from the
                    // one found in the previous path, this means that we are changing programme
                    // but the previous path was already well-formed
                    // In this case we add the path to the history

                    // If the previous path had no node id or the same node id as the new path,
                    // it means that here we are rewriting the path to make it nicer and we don't want
                    // to keep the previous one in the history because it's not nice and because
                    // there would be loops.
                    // In this case we replace the path instead of adding it

                    if (programme_node_id_in_current_path != parseInt(programme.nid) &&
                        programme_node_id_in_current_path != 0) {

                        //console.debug('   adding the path: ' + new_path);
                        $location.path(new_path);

                    } else {

                        //console.debug('   replacing the path: ' + new_path);

                        $location.replace();
                        $location.path(new_path);

                    }

                    return true; // true because we actually changed the url
                } else {

                    return false; // false because the url stayed the same
                }

            };

            /**
             * @ngdoc method
             * @name bring_up_shopping_order_panel
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description A 'buy' button has been clicked and we have to show the shopping panel
             * where the user will be able to buy a subscription or a programme or a track.
             * The shopping panel is /partials/shoppingorderpanel.html and its
             * controller is ShoppingOrderPanelCtrl
             * @param {string} section_to_bring_up Section in shoppingorderpanel.html we have to show
             * @param {object} track_to_buy Track to buy, defined when the user clicked on 'buy track'
             * or something
             */
            $scope.bring_up_shopping_order_panel = function (section_to_bring_up, track_to_buy) {

                // For now only the section 'buy_or_subscribe' is supported here
                // To find said section see /partials/shoppingorderpanel.html

                if (section_to_bring_up != 'buy_or_subscribe') {

                    // @todo exception here waiting for things to settle down

                    // We have a bug here because this function supports only the section buy_or_subscribe

                    console.error('eif4thaiGhae7bo bring_up_shopping_order_panel wrong section ' + section_to_bring_up);
                    Clientexceptionhelper.send_client_exception('eif4thaiGhae7bo bring_up_shopping_order_panel wrong section ' +
                                                                section_to_bring_up);

                    return;
                }

                // Bringing up the shopping panel
                $scope.shoppingorderinfo.show = true;
                // Showing the requested section of it
                $scope.shoppingorderinfo.section_to_show = section_to_bring_up;

                // If we are bringing up the shopping panel for a track, let's give the track
                // to the panel

                if (track_to_buy != null)
                    $scope.shoppingorderinfo.track_to_buy = track_to_buy;
                else
                    $scope.shoppingorderinfo.track_to_buy = null;

                //console.debug('DBG-0O0O shoppingorderinfo');
                //console.debug($scope.shoppingorderinfo);

            };

            /**
             * @ngdoc method
             * @name load_all_products_for_a_programme
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description Here we load all products for all tracks in the given programme.
             * We want the prices.
             *
             * @todo wait for things to settle down before completing this documentation
             *
             * @todo documentation to review, now we have many products for a track.
             * Actually we manage many products only for the first track, the one that represents
             * the full programme
             *
             * Consider that each track is allowed one price only for now even if many products
             * are present for a track.
             *
             * @attention This function works well if there is one and one only product for each track.
             * It will have to be revised when there will be many products for each track
             *
             * @attention We don't write 'Free' as a price for tracks the user bought
             * We have the information because we have the active licenses the logged in user
             * owns, but we don't use this information because we want to keep things simple
             *
             * @param {object} programme Programme whose tracks need a price
             */
            $scope.load_all_products_for_a_programme = function (programme) {

                // @todo sure it's ok to have no price shown at all if there are more than one?
                // @todo Wait to comment this function until you are sure about this

                // We get the first part of the system title and make a partial sku of it
                // so that we can fetch all products whose sku begins with that
                // partial sku
                // By doing this we get prices for all tracks in the programme
                // Why do we need a '%'? It's because we are using a LIKE condition
                // If we send the first part of the sku only, we get nothing back
                var sku = programme.system_title.substring(0,5) + '%';

                // @todo if we are in the audio section, we may have programmes that can be both shipped and
                // downloaded. So we have two prices
                // In the track list we want the download price only
                // we need to filter prices so that we get the download prices only

                Producthelper.load_products_and_key_them_by_tid(sku).then(
                    function(products) {

                        //console.debug('DBG-t18d6 load_all_products_for_a_programme products');
                        //console.debug(products);

                        // @todo this comment is obsolete
                        // The products object is keyed by track id
                        // so, products[874] is the product associated to the track whose id is 874
                        // This means that we have one product only for each track

                        //console.debug('DBG-6AJU load_products_and_key_them_by_tid load_all_products_for_a_programme');
                        //console.debug(products);

                        for (var track_iter = 0; track_iter < $scope.programme.tracks.length; track_iter++) {

                            //console.debug('DBG-lapfap current track tid: ' + $scope.programme.tracks[track_iter].tid);
                            //console.debug('products');
                            //console.debug(products[$scope.programme.tracks[track_iter].tid]);

                            if (typeof products[$scope.programme.tracks[track_iter].tid] != "undefined") {

                                // @todo we have many products here

                                var array_products_associated_to_current_track =
                                    products[$scope.programme.tracks[track_iter].tid];

                                if (array_products_associated_to_current_track.length == 1) {
                                    // Actually we have one product only for this track ($scope.programme.tracks[track_iter])

                                    // Copying the price from the product to the track
                                    $scope.programme.tracks[track_iter].price =
                                        array_products_associated_to_current_track[0].price_amount;

                                } else {
                                    // In this case we have many products for the current track

                                    // @todo Is it ok to have no price shown if there are many of them?

                                    // No price shown at all in the track list if there is more than one of them
                                    $scope.programme.tracks[track_iter].price = null;

                                }

                                // Whether there is one or many products for the current track,
                                // if it's track 0000 we are talking about, we attach the products to the
                                // programme

                                // The condition track_iter == 0 would be enough. We add the other two for safety

                                if (track_iter == 0 &&
                                    $scope.programme.tracks[track_iter].track_no == 0 &&
                                    $scope.programme.tracks[track_iter].segment_no == 0) {

                                    $scope.programme.array_products_track_0000 =
                                        array_products_associated_to_current_track;

                                    // We don't support full programmes that are free (maybe for download only)
                                    // Why? Because, now, if the programme is free it shows up as a zero-priced
                                    // line item in the order and no download is offered
                                    // This happens if the programme has many associated products
                                    // If there is one product only, free programmes still work

                                    if (array_products_associated_to_current_track.length > 1) {

                                        for (var product_iter = 0;
                                             product_iter < array_products_associated_to_current_track.length;
                                             product_iter++) {

                                            if (array_products_associated_to_current_track[product_iter].price_amount == 0) {
                                                // We are not supporting zero prices for the full programme
                                                // because they show up as zero price in the line item
                                                // We are not offering to download the full programme if it's free
                                                // and we are not offering free streaming
                                                // This only if the programmes has many associated products
                                                // Programmes with one product only still work

                                                console.error('seiC5QuuiGh0kai Free full programmes not supported. sku: ' +
                                                    array_products_associated_to_current_track[product_iter].sku);
                                                Clientexceptionhelper.send_client_exception('seiC5QuuiGh0kai Free full programmes not supported. sku: ' +
                                                    array_products_associated_to_current_track[product_iter].sku);

                                            }

                                        }

                                    }

                                }

                            } else {

                                // @todo exception handling waiting for things to settle down
                                // Do we need to consider the case of many products for a track?

                                // We can't find the product associated to the current track, but every track
                                // should have a product! Even just a product with zero price!

                                console.error('Cheeghohngeit3o product missing for track tid: ' +
                                    $scope.programme.tracks[track_iter].tid);
                                Clientexceptionhelper.send_client_exception('Cheeghohngeit3o product missing for track tid: ' +
                                    $scope.programme.tracks[track_iter].tid);

                                $scope.programme.tracks[track_iter].price = 0;

                            }

                        }

                        //console.debug('DBG-h6tff load_all_products_for_a_programme');
                        //console.debug($scope.programme);

                        //console.debug($scope.programme.tracks);

                    },
                    function(reason) {

                        // @todo exception handling waiting for things to settle down

                        console.error('ogietahgai9IeBa loading products. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('ogietahgai9IeBa loading products. Reason ' +
                                                                    reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );
            };

            /**
             * @ngdoc method
             * @name load_voting_info_for_all_tracks_in_a_programme
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description We need votes aggregates for all tracks in a programme.
             * This means that for each track we want to know the average vote and the vote count.
             * We will show this information as hearts in the tracks list
             * We fetch, as well, the vote, if any, the logged-in user gave to each track
             * @param {object} programme Programme whose tracks need votes aggregates and user votes
             */
            $scope.load_voting_info_for_all_tracks_in_a_programme = function (programme) {

                //console.debug('DBG-lvifatiap load_voting_info_for_all_tracks_in_a_programme');

                // We use a tag to fetch the votes aggregates related to all tracks in a programme
                // These votes aggregates are about tracks, but they don't know that tracks belong to a
                // programme. This is why we have to use tags to group them

                // We get the first part of the programme's system title because we have to compose the tag

                // The programme catalogue no includes the first letter, which is 'V' for video programmes, etc.
                var programme_catalogue_no = programme.system_title.substring(0,5);

                // Here it is our tag: TR stands for track and than there is the programme's catalogue no (just the
                // first part of it, the one that identifies the programme univocally)
                var tag = 'TR-' + programme_catalogue_no;

                // With this tag we load all votes aggregates for all tracks in the given programme

                Votesaggregatehelper.load_votes_aggregates_by_tag(tag).then(
                    function(votesaggregates) {

                        // votesaggregates is keyed by node id of the voted node, in our case the track

                        //console.debug('DBG-uyhgt load_voting_info_for_all_tracks_in_a_programme/load_votes_aggregates_by_tag');
                        //console.debug(votesaggregates);

                        // We copy the information in votesaggregates to the votinginfo object of each track
                        // We copy the logged-in user vote as well (if any)

                        for (var track_iter = 0; track_iter < $scope.programme.tracks.length; track_iter++) {

                            //console.debug('DBG-lapfap current track tid: ' + $scope.programme.tracks[track_iter].tid);
                            //console.debug('products');
                            //console.debug(products[$scope.programme.tracks[track_iter].tid]);

                            if (typeof votesaggregates[$scope.programme.tracks[track_iter].tid] != "undefined") {

                                var votes_aggregate_associated_to_current_track =
                                    votesaggregates[$scope.programme.tracks[track_iter].tid];

                                var vote_given_to_the_current_track_by_the_logged_in_user;

                                //console.debug('DBG-199292 frontends/angular/app/js/controllers/TagViewCtrl.js:1502 before vote_user_gave_to_node');

                                if ($scope.user.uid)
                                    vote_given_to_the_current_track_by_the_logged_in_user =
                                        Votehelper.vote_user_gave_to_node($scope.user.uid,
                                                                          $scope.programme.tracks[track_iter].tid);

                                //console.debug('DBG-199292 frontends/angular/app/js/controllers/TagViewCtrl.js:1502 aftyer vote_user_gave_to_node');
                                //console.debug(vote_given_to_the_current_track_by_the_logged_in_user);

                                // If the user didn't vote yet, we create an empty user vote so that the voting
                                // mechanism can work and the user can vote the track if they want
                                if (!vote_given_to_the_current_track_by_the_logged_in_user)
                                    vote_given_to_the_current_track_by_the_logged_in_user = {
                                        value: 0,
                                        value_type: 'percent'
                                    };

                                $scope.programme.tracks[track_iter].votinginfo = {
                                    average: votes_aggregate_associated_to_current_track.average,
                                    count: votes_aggregate_associated_to_current_track.count,
                                    user_vote: vote_given_to_the_current_track_by_the_logged_in_user,
                                    mouse_over_button_no: 0
                                };

                                // user_vote is an object with two members:
                                // * value, the actual vote 0 to 100
                                // * value_type, 'percent'

                            } else {

                                // If we have no votes aggregate for the current track (track_iter)
                                // we need an empty votinginfo object anyway just in case the user
                                // wants to vote the track

                                $scope.programme.tracks[track_iter].votinginfo = {
                                    average: 0,
                                    count: 0,
                                    user_vote: {
                                        value: 0,
                                        value_type: 'percent'
                                    },
                                    mouse_over_button_no: 0
                                };

                            }

                            //console.debug('@TagViewCtrl.controller:TagViewCtrl.load_voting_info_for_all_tracks_in_a_programme $scope.programme.tracks[track_iter].votinginfo');
                            //console.debug($scope.programme.tracks[track_iter].votinginfo);

                        }

                        //console.debug('    $scope.programme.tracks');
                        //console.debug($scope.programme.tracks);

                    },
                    function(reason) {

                        // @todo exception handling waiting for things to settle down

                        console.error('nooFai4aev load_voting_info_for_all_tracks_in_a_programme. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('nooFai4aev load_voting_info_for_all_tracks_in_a_programme. Reason ' +
                            reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );
            };

            /**
             * @ngdoc method
             * @name load_votes_aggregate_for_a_programme
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description We need the aggregated results of voting done on a programme. Like
             * average rating and number of votes.
             * @todo doc to fix
             * @param {int} nid Node id of the programme we want the votes aggregate about
             * @param {string} tag FIXME
             */
            $scope.load_votes_aggregate_for_a_programme = function (nid, tag) {

                if (!nid) {

                    // @todo exception handling waiting for things to settle down

                    console.error('Eis4Aiz9ahrcccqwwww nid cant be zero when loading votes aggregate for programme');
                    Clientexceptionhelper.send_client_exception('Eis4Aiz9ahrcccqwwww nid cant be zero ' +
                        'when loading votes aggregate for programme');

                    return;
                }

                if (typeof tag == "undefined")
                    tag = 'vote';

                Votesaggregatehelper.load_votes_aggregate(nid, tag).then(
                    function(votesaggregate) {

                        //console.debug('DBG-31414141 Votesaggregatehelper.load_votes_aggregate ctrl votesaggregate');
                        //console.debug(votesaggregate);

                        if (votesaggregate != null) {

                            if (tag == 'vote') {

                                $scope.programmevotepanelinfo.nid = nid;
                                $scope.programmevotepanelinfo.average = votesaggregate.average;
                                $scope.programmevotepanelinfo.sum = votesaggregate.sum;
                                $scope.programmevotepanelinfo.count = votesaggregate.count;

                            } else if (tag == 'fan') {

                                $scope.programmefanstabinfo.nid = nid;
                                $scope.programmefanstabinfo.number_of_fans = votesaggregate.count;

                            }

                        }

                        //console.debug('DBG-pvpi-5644 programmevotepanelinfo ');
                        //console.debug($scope.programmevotepanelinfo);

                    },
                    function(reason) {

                        // @todo exception handling waiting for things to settle down

                        console.error('W3E??? sheey7ohChah4ig votesaggregate not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E??? sheey7ohChah4ig votesaggregate not loaded. ' +
                                        'Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name add_displayable_credits_list_to_tracks
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description @todo fixme
             *
             * @todo wait to document until it's sure that we use this method to display credits lists
             *
             * @param {object} programme Programme whose tracks need fixme
             */
            $scope.add_displayable_credits_list_to_tracks = function (programme) {

                for (var track_iter = 0; track_iter < programme.tracks.length; track_iter++) {

                    //programme.tracks[track_iter].displayable_credits_list = "title " + programme.tracks[track_iter].title;

                    // Track 0000 (segment zero and track no zero) is, actually, the full programme

                    programme.tracks[track_iter].displayable_credits_list = "";

                    if (typeof programme.tracks[track_iter].credits_elements != "undefined") {

                        var array_credits_strings_keyed_by_role = [];

                        for (var credits_element_iter = 0;
                             credits_element_iter < programme.tracks[track_iter].credits_elements.length;
                             credits_element_iter++) {

                            var role_title_of_current_credits_element =
                                programme.tracks[track_iter].credits_elements[credits_element_iter].role_title;

                            if (typeof array_credits_strings_keyed_by_role[role_title_of_current_credits_element]
                                != "undefined")
                                array_credits_strings_keyed_by_role[role_title_of_current_credits_element] += ", " +
                                    programme.tracks[track_iter].credits_elements[credits_element_iter].label;
                            else
                                array_credits_strings_keyed_by_role[role_title_of_current_credits_element] =
                                    programme.tracks[track_iter].credits_elements[credits_element_iter].label;


                            //if (credits_element_iter > 0)
                            //    programme.tracks[track_iter].displayable_credits_list += " ";
                            //
                            //programme.tracks[track_iter].displayable_credits_list +=
                            //    programme.tracks[track_iter].credits_elements[credits_element_iter].role_title + "/" +
                            //    programme.tracks[track_iter].credits_elements[credits_element_iter].label + ";";

                        }

                        var displayable_credits_list = "";

                        for (var role_title in array_credits_strings_keyed_by_role) {

                            if (array_credits_strings_keyed_by_role.hasOwnProperty(role_title)) {
                                //console.debug('DBG-7whg role_title in array_credits_strings_keyed_by_role');
                                //console.debug(array_credits_strings_keyed_by_role[role_title]);

                                if (displayable_credits_list.length > 0)
                                    displayable_credits_list += "; ";

                                displayable_credits_list += role_title + "(s): " +
                                    array_credits_strings_keyed_by_role[role_title];

                            }

                        }

                        if (displayable_credits_list.length == 0)
                            displayable_credits_list = "";

                        programme.tracks[track_iter].displayable_credits_list = displayable_credits_list;

                    }

                }

                // @todo do we use this solution? it was about showing the role for each credits element, not just once
                // for all elements that have the same role
                // @todo don't delete until we are sure that we won't use it
                //for (var credits_element_iter = 0;
                //     credits_element_iter < programme.tracks[track_iter].credits_elements.length;
                //     credits_element_iter++) {
                //
                //    if (credits_element_iter > 0)
                //        programme.tracks[track_iter].displayable_credits_list += " ";
                //
                //    programme.tracks[track_iter].displayable_credits_list +=
                //        programme.tracks[track_iter].credits_elements[credits_element_iter].role_title + "/" +
                //        programme.tracks[track_iter].credits_elements[credits_element_iter].label + ";";
                //
                //}

            };

            /**
             * @ngdoc method
             * @name rate_programme
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description The user voted the programme and we want to send the vote to the server,
             * which will store the vote in its database.
             * @param {int} uid Voter user id
             * @param {int} nid Node id of the programme being voted
             * @param {int} vote_0_to_100 Actual vote
             */
            $scope.rate_programme = function (uid, nid, vote_0_to_100) {

                // Let's imagine that this function gets called after a login done
                // We may not have uid and nid properly initialised

                // Let's try and set them if we can

                if (!uid)
                    uid = $scope.user.uid;

                if (!nid)
                    nid = $scope.programme.nid;

                // Safety checks
                // uid should be non-zero and the same for nid
                // vote_0_to_100 should be between 0 and 100

                if (!uid) {
                    // The user is not logged-in
                    // We throw exception because the partial should disable the click event
                    // on the hearts when the user is not logged in

                    console.error('Ais4Uwoo4I user not logged in when rating programme');
                    Clientexceptionhelper.send_client_exception('Ais4Uwoo4I user not logged in when rating programme');

                    return;
                }

                if (!nid) {
                    // How can it be that we are asked to rate node zero?

                    console.error('pie7OhCoo4 How can it be that we are asked to rate node zero?');
                    Clientexceptionhelper.send_client_exception('pie7OhCoo4 How can it be that we ' +
                        'are asked to rate node zero?');

                    return;
                }

                if (vote_0_to_100 < 0 || vote_0_to_100 > 100) {

                    // @todo exception handling to do

                    console.error('Fe3aeJoo7aeZeiv Votes can be only between 0 and 100');

                    return false;
                }

                //console.debug('DBG-7654 rate_programme');
                //console.debug('uid, nid, vote_0_to_100: ' + uid + "," + nid + "," + vote_0_to_100);

                // These variables are used in /partials/programme_vote_panel.html
                // We updated them for the panel to reflect the new vote
                $scope.programmevotepanelinfo.user_vote.value = vote_0_to_100;
                $scope.programmevotepanelinfo.user_vote.value_type = 'percent';

                // Calling vote_a_node so that the vote the user gave can be stored in the server
                Votehelper.vote_a_node(nid, uid, 'percent', vote_0_to_100);

            };



            /**
             * @ngdoc method
             * @name rate_track
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description The user voted a track and we want to send the vote to the server,
             * which will store the vote in its database.
             * @param {int} uid Voter user id
             * @param {object} track The track being voted
             * @param {int} vote_0_to_100 Actual vote
             * @param {string} programme_system_title From the programme system title we get the
             * first part of the catalogue no and we use it to make the tag we need to mark
             * the vote as belonging to the programme. We need to do this because there would be
             * no association track - programme in the vote and we couldn't fetch all votes
             * given to all tracks in a programme.
             * @return bool true if there are no problems with the parameters
             */
            $scope.rate_track = function (uid, track, vote_0_to_100, programme_system_title) {

                // Safety checks
                // uid should be non-zero
                // track should be defined and track.tid should be non-zero
                // vote_0_to_100 should be between 0 and 100
                // programme_system_title should be at least 5 chars long

                if (!uid) {
                    // The user is not logged-in
                    // We throw exception because the partial should disable the click event
                    // on the hearts when the user is not logged in

                    console.error('oy4zaiF3oX user not logged in when rating programme');
                    Clientexceptionhelper.send_client_exception('oy4zaiF3oX user not logged in when rating programme');

                    return false;
                }

                if (vote_0_to_100 < 0 || vote_0_to_100 > 100) {

                    // @todo exception handling to do

                    console.error('ohXai4ohseevezi Votes can be only between 0 and 100');
                    Clientexceptionhelper.send_client_exception('ohXai4ohseevezi Votes can be only between 0 and 100');

                    return false;
                }

                if (programme_system_title.length < 5) {

                    // @todo exception handling to do

                    console.error('wohkaij6Ca programme system title is too short');
                    Clientexceptionhelper.send_client_exception('wohkaij6Ca programme system title is too short');

                    return false;
                }

                if (typeof track == "undefined") {

                    // @todo exception handling to do

                    console.error('Aeg3jei3ra6yooz undefined track');
                    Clientexceptionhelper.send_client_exception('Aeg3jei3ra6yooz undefined track');

                    return false;
                }

                if (!track.tid) {

                    // @todo exception handling to do

                    console.error('sibeeThibee0sho tid is zero');
                    Clientexceptionhelper.send_client_exception('sibeeThibee0sho tid is zero');

                    return false;
                }

                // Calculating the tag (example: 'TR-V1036')

                var tag = 'TR-' + programme_system_title.substr(0, 5);

                // Calling vote_a_node so that the vote the user gave can be stored in the server
                Votehelper.vote_a_node(track.tid, uid, 'percent', vote_0_to_100, tag);

                // To update the user's vote in the tracks' list
                track.votinginfo.user_vote.value = vote_0_to_100;

                return true;
            };

            /**
             * @ngdoc method
             * @name play_track
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description When a play-track button is pressed, this function gets the signed url and
             * starts the video player. If it's an audio track, we download it.
             * Permissions are checked. If the user has no permissions, we bring up the shopping panel.
             * @param {object} track_to_play Track to play
             */
            $scope.play_track = function (track_to_play) {

                console.debug('@play_track');
                console.debug('   tid: ' + track_to_play.tid);
                console.debug('   track_to_play:');
                console.debug(track_to_play);

                if ($scope.tagring_content_type_selector != 'video' &&
                    $scope.tagring_content_type_selector != 'audio') {

                    // We have a bug here. This function play_track shouldn't be called
                    // if we aren't either in the video or in the audio sections

                    // @todo exception handling

                    console.error('8sd666 Function play_track called not for video or audio');
                    Clientexceptionhelper.send_client_exception('8sd666 Function play_track called ' +
                        'not for video or audio');

                    return;
                }

                var track_is_free = false;

                if ($scope.tagring_content_type_selector == 'audio' || $scope.user.uid == 0) {

                    // Here it's about audio or anonymous users

                    // In the audio section there is no playing tracks actually
                    // There is only downloading them
                    // So, we bring up the shopping panel for the user to buy the track

                    // In the case of anonymous user, sure we bring up the shopping panel

                    // @todo we will need a different button in the audio section for the
                    // play-track button. It should be a download-track button

                    // Here we can expect to have the price because if the user clicked on
                    // play track, prices are there

                    // If the price is not zero because it's null, it's not free for our purposes
                    // A track with null price is a track with many prices and it's not free

                    if (typeof track_to_play.price !== "undefined") {

                        console.debug('@TagViewCtrl.controller:TagViewCtrl.play_track track_to_play.price ' + track_to_play.price);

                        if (track_to_play.price == 0)
                            track_is_free = true;

                        console.debug('@TagViewCtrl.controller:TagViewCtrl.play_track track_to_play.price ' + track_to_play.price + '/' + track_is_free);

                    }

                    //console.debug('DBG-85TG track_is_free: ' + track_is_free);

                    // Of course we bring up the shopping panel only for non-free tracks
                    if (!track_is_free) {

                        //console.debug('DBG-85TG 76TTg about to bring up the order panel');

                        if (track_to_play.segment_no == 0 && track_to_play.track_no == 0) {
                            // Its' the full programme!
                            $scope.bring_up_shopping_order_panel('buy_or_subscribe');
                        } else {
                            // It's just a track
                            $scope.bring_up_shopping_order_panel('buy_or_subscribe', track_to_play);
                        }

                        return;
                    }

                }

                // Safety check

                // We can get here if we are about to do something with the current track
                // which is free and is an audio track
                var safety_check_passed = $scope.tagring_content_type_selector == 'audio' && track_is_free;

                // We can be here also if we are about to play a free video track for an anonymous user
                safety_check_passed |= $scope.tagring_content_type_selector == 'video'
                    && $scope.user.uid == 0 && track_is_free;

                // We can be here if it's a video track and the user is logged in
                // Maybe the user bought the track (or the programme) and we will know
                // this when we do the URLsKit call
                safety_check_passed |= $scope.tagring_content_type_selector == 'video' && $scope.user.uid != 0;

                if (!safety_check_passed) {

                    // @todo excpt handling
                    console.error('ufeTai4gooxo3ee safety check not passed in play_track');
                    Clientexceptionhelper.send_client_exception('ufeTai4gooxo3ee safety check not passed in play_track');

                }

                // If the user is logged in, we send their credentials
                // so that, if they have permission to play or download, it can be checked
                // See function prepare_for_call_with_credentials for details about the new login
                // process based on iframes

                if ($scope.user.uid != 0)
                    Userhelper.prepare_for_call_with_credentials();

                // Thanks to the checks done above, the following if statement is about a free audio track
                // We download it

                if ($scope.tagring_content_type_selector == 'audio') {

                    // We have to calculate the catalogue no of the track we want to download
                    // because we have the system title of the programme, which contains the
                    // catalogue no of the programme, but we don't have the catalogue no
                    // of the track, only its segment no and track no

                    var track_catalogue_no = $scope.programme.system_title.substring(0, 5);

                    track_catalogue_no += ( track_to_play.segment_no < 10 ? '0' : '' ) + track_to_play.segment_no;
                    track_catalogue_no += ( track_to_play.track_no < 10 ? '0' : '' ) + track_to_play.track_no;

                    // The Downloadableurlhelper service will get the signed url we need to download the track

                    Downloadableurlhelper.load_downloadableurl(track_catalogue_no).then(
                        function(downloadableurl) {

                            //console.debug('DBG-19UHY load_downloadableurl');
                            //console.debug(downloadableurl);

                            if (downloadableurl.url) {

                                // We start the download
                                // See script /lib/downloadfile/downloadfile.js
                                $window.downloadFile(downloadableurl.url);

                            } else {

                                // @todo exception the track we want to download should be free
                                // so, why the Downloadableurl api is not giving us the url?

                                console.error('1m85d url to download free track not received');
                                Clientexceptionhelper.send_client_exception('1m85d url to download ' +
                                        'free track not received');

                            }

                        },
                        function(reason) {

                            // @todo exception to do

                            console.error('4b5crf Downloadableurl not received. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('4b5crf Downloadableurl not received. ' +
                                'Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                } else if ($scope.tagring_content_type_selector == 'video') {

                    // In this case we have a video track that may be free or not

                    // We need to call the urlskit rest api to get fresh urls because the old
                    // ones may have expired

                    // The musth_restws_urls_kit REST api will check permissions for the track and then
                    // for the programme. If the user can play the programme, they can play the track as well
                    // It will check if the user is a subscriber as well

                    Urlskithelper.load_urlskit($scope.programme.system_title,
                                               track_to_play.segment_no,
                                               track_to_play.track_no).then(
                        function(urlskit) {

                            $scope.urlskit = urlskit;

                            console.debug('@TagViewCtrl.controller:TagViewCtrl.play_track urlskit');
                            console.debug(urlskit);

                            if (!$scope.urlskit.movie_url) {

                                // The user doesn't appear to have permissions to play the track
                                // We bring up the shopping panel

                                //console.debug('DBG-1978yu $scope.urlskit.movie_url' + $scope.urlskit.movie_url);

                                if (track_to_play.segment_no == 0 && track_to_play.track_no == 0) {
                                    // Its' the full programme!
                                    $scope.bring_up_shopping_order_panel('buy_or_subscribe');
                                } else {
                                    // It's just a track
                                    $scope.bring_up_shopping_order_panel('buy_or_subscribe', track_to_play);
                                }

                                //$scope.bring_up_shopping_order_panel('buy_or_subscribe', track_to_play);
                                return;
                            }

                            // We have permission, let's bring up the video player

                            $scope.showvideoplayer = true;

                            Videoplayerhelper.initialise_player('ngPlayTrack',
                                $scope.urlskit,
                                $scope.programme.tracks,
                                track_to_play);

                        },
                        function(reason) {

                            console.error('W3E033 Urlskit not loaded. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3E033 Urlskit not loaded. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }
            };

            /**
             * @ngdoc method
             * @name refresh_scrollbar
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function refreshes the scrollbar.
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

                //console.debug('DBG-rs617tyg inside refresh_scrollbar');

                // Why are we using $timeout?
                // If we call $window.ssb.refresh without using $timeout, it may be called
                // when the scrollbar is still invisible.
                // $timeout calls $window.ssb.refresh after the event that makes the scrollbar
                // visible has been processed.
                // Doing so we are sure that the scrollbar is visible

                if (typeof $window.ssb != "undefined") {
                    //console.debug('    now refreshing');

                    $timeout($window.ssb.refresh);
                }

            };

            /**
             * @todo doc to do
             * @ngdoc method
             * @name go_to_url
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Loading reviews for the node whose node id is $scope.reviewsforminfo.nid
             * The Tag View controller sets $scope.reviewsforminfo.nid. The page to be loaded is specified
             * as parameter. Page length is set on the server.
             * This happens when displaying reviews in the infopanel.
             *
             * This are different when we display reviews in the user profile.
             *
             * In this case $scope.reviewsforminfo.showing_user_reviews is true and we use our local page
             * length instead of the server's default.
             *
             * @param {int} page Page to load
             */
            $scope.go_to_url = function (path) {

                $location.path(path);

            };

            /**
             * @ngdoc method
             * @name event_from_videoplayer
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description @todo we will use this function to catch events from the video player
             * we will process in particular end of clip events to display a panel to
             * ask for a review
             * @param {string} event_name Name of the event produced by the videoplayer
             */
            $scope.event_from_videoplayer = function (event_name) {

                //console.debug('@event_from_videoplayer');
                //console.debug('   Event name: ' + event_name);

            };

            /**
             * @ngdoc method
             * @name start_new_tagring_search
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description This function is used when the 'New Search' button is clicked in the info panel
             * We have to tell the tagring to start a new search and clean up the jukebox
             */
            $scope.start_new_tagring_search = function () {

                Tagringhelper.start_new_tagring_search();

                // We close the info panel
                $scope.infopanelinfo.show = false;

            };

            $scope.controller_init();

}]); // end of controller TagViewCtrl

/**
 * @ngdoc service
 * @name TagViewCtrl.service:Tagviewstatusvalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores any tagring event that the Tag View controller will forget because of being
 * reinitialised. When the controller goes through the second initialisation, it gets
 * the tagring event from this service and processes it.
 * The tagring event to process is defined by the event name, event_from_tagring_to_be_processed,
 * and the node id of the programme, nid_of_programme_to_be_loaded.
 * Search for "if (Tagviewstatusvalue.event_from_tagring_to_be_processed != '') {". It's the
 * point where this information is used.
 * Only the TagViewCtrl controller should use this service.
 */
var tagviewstatusvalueServices = angular.module('tagviewstatusvalueServices', [ ]);

tagviewstatusvalueServices.value('Tagviewstatusvalue', { event_from_tagring_to_be_processed: '',
                                                         nid_of_programme_to_be_loaded: 0 }
);