/**
 * @ngdoc overview
 * @name SocialViewCtrl
 * @description @todo fix me This is the controller associated to the view tagview
 * We have here, as well, the service Tagviewstatusvalue used to keep information through
 * controller initialisations. The information is used to process tagring event that would
 * otherwise go lost.
 * There are the three famous functions onPlayPreviewClick, onInfoClick and onPlayMovieClick
 * that the tagring calls to tell us that the corresponding button has been clicked.
 */

'use strict';

// @todo do you need all the dependencies below?

/**
 * @ngdoc controller
 * @name SocialViewCtrl.controller:SocialViewCtrl
 * @description This is the controller associated to the view @todo fixme tagview
 *
 * @todo doc
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
  controller('SocialViewCtrl', ['$scope',
                             'Programme',
                             'URLsKit',
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
                             'Flagginghelper',
                             'Permalinkhelper',
                             'Settings',
                             '$window', // Used to do downloads, refresh scrollbars, do redirects
                             '$timeout',
                             '$routeParams',
                             '$location',
                             '$rootScope',
                             '$q',
        function($scope, Programme, URLsKit,
                 Programmehelper, Urlskithelper, Downloadableurlhelper,
                 Videoplayerhelper, Clientexceptionhelper, Userhelper,
                 Orderhelper, Tagringhelper, Producthelper,
                 Votesaggregatehelper, Votehelper, Tagviewstatusvalue,
                 Grouphelper, Posthelper, Commenthelper, Dialoghelper,
                 Flagginghelper, Permalinkhelper,
                 Settings, $window, $timeout,
                 $routeParams, $location, $rootScope, $q) {

            $scope.controller_init = function() {

                console.info('@SocialViewCtrl::controller_init');
                console.info('   $location.path: ' + $location.path());
                console.info('   $routeParams');
                console.info($routeParams);

                // Every controller should set this variable
                // The login form (LoginFormCtrl.js) uses it to know which controller
                // is currently working and changes its behaviour accordingly

                // @todo fix everything

                $scope.controller_name = 'SocialViewCtrl';

                // @todo this is ok if we are displaying the groups function, otherwise no,
                // it should be something else
                //$scope.section_to_show = 'newgroup';

                // Programme-loading variables initialisation

                $scope.programme_loaded = false;
                $scope.loaded_programme_nid = 0;

                // Info panel variables initialisation

                $scope.infopanelinfo = { show: false,
                                         show_loading: false,
                                         show_play_track_button: false,
                                         no_prices: false };

                $scope.tabs_horizontal_menu_info = {
                    menu_to_show: '',
                    active_item: '',
                    group_link: ''
                };

                // Setting the date format for bio info

                // @todo need this?
                $scope.date_format_for_bio_info = Settings.default_date_format;

                //console.debug('DBG-i78hbg date_format_for_bio_info ' + $scope.date_format_for_bio_info);

                // Video player variables initialisation

                $scope.showvideoplayer = false; // @todo guess I need this

                // Tagring variables initialisation

                $rootScope.show_tagring = false; // @todo guess I need this


                // @todo fix groupsinfo? what?
                // @todo newpost needs the avatar
                $scope.groupsinfo = { nid: 0, // @todo ???
                    section_to_show: 'browsegroups',
                    page_in_groups_list: 0,
                    page_in_single_post_comments_list: 0,
                    page_in_single_group_posts_list: 0,
                    page_in_single_group_members_list: 0,
                    more_pages_of_groups_available: false,
                    more_pages_of_comments_to_post_available: false,
                    more_pages_of_posts_in_group_available: false,
                    more_pages_of_members_in_group_available: false,
                    groups_filter: '',
                    single_group_to_show: 0,
                    single_group: {},
                    single_post_to_show: 0,
                    single_post: {},
                    user_is_admin_for_the_current_group: false,
                    user_is_member_of_the_current_group: false,
                    posts_of_current_single_group: [],
                    members_of_current_single_group: [],
                    groups: [],
                    newgroup: { title: '',
                        description: '' },
                    newpost: { nid: 0,
                        body: '',
                        avatar: '',
                        gid: 0,
                        uid: 0 } // @todo this has to be completed/fixed
                };

                $scope.load_groups();

                $scope.text_validation_regex_pattern = Settings.regex_for_text_validation;

                // User info initialisation

                // In case this controller got reinitialised when a user was logged in
                // We don't want the user to login again if the page is refreshed or
                // this controller reinitialised

                // @todo need this? probably yes

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

                //                        $scope.user.avatar = user.avatar;

                var logged_in_info = Userhelper.logged_in_user_info();

                if (logged_in_info.uid) {

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

                    // @todo for now we don't have votes in the social view, but let's wait for things to settle down
                    // because maybe we need votes after all
                    // Consider that this is another rest call and run asynchronously
                    Votehelper.load_votes(logged_in_info.uid); // @todo sure? maybe if we need them elsewhere?

                    //console.debug('DBG-9ijuhy before creating group uid: ' + logged_in_info.uid);

                    $scope.loading_single_groups_and_posts_specified_in_url();

                } else {

                    //console.debug('DBG-(TWC init) about to run fetch_user_details');

                    // Otherwise, let's fetch it

                    $scope.reload_user_details().then(
                        function(post) {

                            $scope.loading_single_groups_and_posts_specified_in_url();

                        },
                        function(reason) {

                            // @todo fix here

                            console.error('W3Exxx273 egei4Hue7A . Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx273 egei4Hue7A . Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                    //loading_single_groups_and_posts_specified_in_url

                }

                // Header info variables initialisation

                $scope.headerinfo = { current_menu_item: 'Lounge' };

                if (typeof $routeParams.section !== "undefined") {

                    if ($routeParams.section == 'browse') {

                        $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                        $scope.tabs_horizontal_menu_info.active_item = 'browse';

                        $scope.groupsinfo.section_to_show = 'browsegroups';
                        $scope.load_groups();
                        //$scope.refresh_scrollbar(); // @todo Now this is doing nothing, it will come at hand when
                        // we actually have scrollbars here

                    } else if ($routeParams.section == 'mygroups') {

                        //console.debug('@SocialViewCtrl::controller_init if ($routeParams.section == mygroups)');

                        $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                        $scope.tabs_horizontal_menu_info.active_item = 'mygroups';

                        $scope.groupsinfo.section_to_show = 'mygroups';

                        $scope.reload_user_details();
                        //$scope.refresh_scrollbar(); // @todo Now this is doing nothing, it will come at hand when
                        // we actually have scrollbars here

                    }

                } else if (typeof $routeParams.item == "undefined") {

                    // Only if both section and item are undefined we are in a general url like
                    // /social/en

                    // @attention this has to change when there are more social functions
                    // For now there is only 'groups' as social function

                    $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                    $scope.tabs_horizontal_menu_info.active_item = 'browse';

                    $scope.groupsinfo.section_to_show = 'browsegroups';

                    $scope.load_groups();
                    //$scope.refresh_scrollbar(); // @todo Now this is doing nothing, it will come at hand when

                }

                // Got to tell Tagringhelper that we have no tagring here so that it will
                // initialise the tagring when the user goes to another view (tagview typically)
                Tagringhelper.initialise_tagring('notagring');

            }; // end of controller_init

            /* @todo maybe we need this? do we need to redirect? maybe it's useful when redirecting
            to the payment gateway
            $scope.test_redirect = function() {

                $window.location="http://dev-hybridauth.gotpantheon.com/test";

            }
            */

            $scope.loading_single_groups_and_posts_specified_in_url = function () {

                $scope.social_function = 'groups';

                if (typeof $routeParams.socialfunction !== "undefined") {

                    if ($routeParams.socialfunction != "groups") {

                        console.error('ahthohphe9 Social function not supported: ' + $routeParams.socialfunction);
                        Clientexceptionhelper.send_client_exception('ahthohphe9 Social function not supported: ' + $routeParams.socialfunction);

                        return;
                    }
                }

                //$routeProvider.when('/social/en/groups/:item/:id',
                //    {
                //        templateUrl: '/partials/socialview.html',
                //        controller: 'SocialViewCtrl',
                //        title: 'MusicTheatre - Social - :socialfunction'
                //    });

                var new_path = '';
                var current_path = '';

                if ((typeof $routeParams.item !== "undefined") && (typeof $routeParams.id !== "undefined"))  {

                    if ($routeParams.item == "group") {

                        new_path = "/social/en/groups/group/" + $routeParams.id;

                        current_path = $location.path();

                        // We change the url only if it's actually different from the current one so that
                        // we force a reinitialisation of this controller only if really necessary
                        if (current_path != new_path) {

                            console.info('   About to change url');
                            console.info('   current_path: ' + current_path);
                            console.info('   new_path: ' + new_path);

                            //$location.replace();
                            $location.path(new_path);

                            // No use going on because this controller will be initialised again
                            return;
                        }

                        $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                        $scope.tabs_horizontal_menu_info.active_item = 'singlegroup';
                        $scope.tabs_horizontal_menu_info.group_link = '/social/en/groups/group/' + $routeParams.id;

                        //$scope.groupsinfo.section_to_show = 'browsegroups';

                        $scope.groupsinfo.single_group_to_show = $routeParams.id;
                        $scope.groupsinfo.section_to_show = 'singlegroup';
                        $scope.groupsinfo.newpost.gid = $routeParams.id;
                        $scope.groupsinfo.newpost.uid = $scope.user.uid; // @todo isn't it uid? does this work?
                        $scope.groupsinfo.newpost.avatar = $scope.user.avatar;
                        // @todo doesn't newpost need the avatar?
                        $scope.load_single_group_with_posts($routeParams.id);

                        //<button ng-click="groupsinfo.single_group_to_show = group.id;
                        //    groupsinfo.section_to_show = 'singlegroup';
                        //    groupsinfo.newpost.gid = group.id;
                        //    groupsinfo.newpost.uid = user.uid;
                        //    load_single_group_with_posts(group.id)">Go to single group</button>

                    } else if ($routeParams.item == "post") {

                        new_path = "/social/en/groups/post/" + $routeParams.id;

                        current_path = $location.path();

                        // We change the url only if it's actually different from the current one so that
                        // we force a reinitialisation of this controller only if really necessary
                        if (current_path != new_path) {

                            console.info('   About to change url');
                            console.info('   current_path: ' + current_path);
                            console.info('   new_path: ' + new_path);

                            //$location.replace();
                            $location.path(new_path);

                            // No use going on because this controller will be initialised again
                            return;
                        }

                        $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                        $scope.tabs_horizontal_menu_info.active_item = 'singlepost';

                        // @todo I need to load the group this post belongs to because I want to
                        // display the group's title

                        Posthelper.load_post($routeParams.id).then(
                            function(post) {

                                $scope.groupsinfo.single_post = post;
                                $scope.groupsinfo.single_post_to_show = $routeParams.id;
                                $scope.groupsinfo.section_to_show = 'singlepost';
                                $scope.groupsinfo.single_post.newcomment = {
                                    body: '',
                                    cid: 0,
                                    name: '',
                                    nid: $routeParams.id,
                                    subject: '',
                                    uid: $scope.user.uid,
                                    avatar: $scope.user.avatar };

                                $scope.groupsinfo.user_is_member_of_the_current_group =
                                    Userhelper.user_is_member(post.gid);

                                $scope.tabs_horizontal_menu_info.group_link = '/social/en/groups/group/' + post.gid;

                                // Adding user profile permalink to post
                                // It's the link that will go to the profiles of the post's author
                                $scope.groupsinfo.single_post.user_profile_permalink =
                                    Permalinkhelper.make_user_profile_permalink($scope.groupsinfo.single_post.uid,
                                        $scope.groupsinfo.single_post.name);

                                // @todo here it doesn't work because $scope.user.uid is zero and
                                // it is so because user details have not been loaded yet

                                //console.debug('DBG-0987 load_post');
                                //console.debug($scope.groupsinfo.single_post);
                                //console.debug('    user.uid: ' + $scope.user.uid);

                                $scope.get_comments_and_add_them_to_post($scope.groupsinfo.single_post);

                            },
                            function(reason) {

                                // @todo fix here

                                console.error('W3Exxx273 Aiyifohng3 . Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx273 Aiyifohng3 . Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                        //$scope.load_single_group_with_posts($routeParams.id);

                        //<button ng-click="groupsinfo.single_post_to_show = post.nid;
                        //    groupsinfo.single_post = post;
                        //    groupsinfo.single_post.newcomment = { body: '', cid: 0, name: '',
                        //        nid: post.nid, subject: '', uid: user.uid };
                        //    groupsinfo.section_to_show = 'singlepost';
                        //    get_comments_and_add_them_to_post(groupsinfo.single_post)">Go to post</button>

                    }

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
             * @todo doc to do
             * @ngdoc method
             * @name reload_user_details
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
            $scope.reload_user_details = function () {
                var deferred = $q.defer();

                //console.debug('DBG-nhyg SocialViewCtrl::reload_user_details ');

                Userhelper.fetch_user_details().then(function(user) {

                        //console.debug('DBG-7cgtt fetch_user_details in controller_init in TagViewCtrl');

                        $scope.user.uid = user.uid;
                        $scope.user.name = user.name;
                        $scope.user.language = user.language;
                        $scope.user.licenses = user.licenses;
                        $scope.user.groups = user.groups;
                        $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                        $scope.user.first_name = user.first_name;
                        $scope.user.middle_names = user.middle_names;
                        $scope.user.family_name = user.family_name;
                        $scope.user.avatar = user.avatar;

                        //console.debug('DBG-8r76vhgf SocialViewCtrl::controller_init fetch_user_details');
                        //console.debug(user);
                        //console.debug(Userhelper.logged_in_user_info());

                        $timeout($scope.refresh_scrollbar);

                        deferred.resolve(user);
                    },
                    function(reason) {

                        // @todo fix here

                        console.error('W3Exxx273 ahRiFaith4 User details not fetched. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx273 ahRiFaith4 User details not fetched. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        deferred.reject('Error when querying an user. Reason: ' + reason);
                    }
                );

                return deferred.promise;
            };

            /**
             * @todo doc to do
             * @ngdoc method
             * @name load_reviews
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
            $scope.load_groups = function (title, page) {

                //console.debug('DBG-nhyg SocialViewCtrl::load_groups title: ' + title +
                //              ' page: ' + page);

                // @todo really need this?

                if (typeof(page) === 'undefined') {
                    page = 0;
                    $scope.groupsinfo.page_in_groups_list = 0;
                } else {
                    $scope.groupsinfo.page_in_groups_list = page;
                }

                // If nid_of_the_programme_to_ask_reviews_about != 0,
                // we are getting the reviews for the programme of node id nid

                // If nid_of_the_programme_to_ask_reviews_about == 0,
                // we are getting the reviews for the logged in user

                // Grouphelper

                Grouphelper.load_groups(0, title, page).then(
                    function(groups) {

                        $scope.groupsinfo.groups = groups;

                        //console.debug('DBG-y5467fhg load_groups');
                        //console.debug(groups);

                        $scope.groupsinfo.more_pages_of_groups_available = Grouphelper.more_pages_available();

                        // frontends/angular/app/js/controllers/SocialViewCtrl.js:638

                        //console.debug('@SocialViewCtrl::load_groups $scope.groupsinfo.more_pages_of_groups_available: ' + $scope.groupsinfo.more_pages_of_groups_available);

                        $timeout($scope.refresh_scrollbar);

                        //console.debug('DBG-nsb655cc load_reviews ReviewsFormCtrl.js:103 reviews');
                        //console.debug($scope.reviewsforminfo.reviews);

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @todo doc to do
             * @ngdoc method
             * @name load_reviews
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
             * @param {int} nid Node id of the group to load
             */
            $scope.load_single_group_with_posts = function (nid, page_of_posts, page_of_group_members) {

                // @todo refactor the name of this function to load_single_group_with_posts_and_members

                //console.debug('DBG-nhyg SocialViewCtrl::load_single_group_with_posts nid: ' + nid);

                // @todo loading page zero of posts

                if (typeof(page_of_posts) === 'undefined') page_of_posts = 0;
                if (typeof(page_of_group_members) === 'undefined') page_of_group_members = 0;

                if (page_of_posts == 0)
                    $scope.groupsinfo.page_in_single_group_posts_list = 0;

                if (page_of_group_members == 0)
                    $scope.groupsinfo.page_in_single_group_members_list = 0;

                // @todo check on nid

                // groupsinfo.page_in_single_group_members_list

                $scope.groupsinfo.user_is_admin_for_the_current_group = Userhelper.user_is_admin(nid);
                $scope.groupsinfo.user_is_member_of_the_current_group = Userhelper.user_is_member(nid);

                // user_is_member
                // If nid_of_the_programme_to_ask_reviews_about != 0,
                // we are getting the reviews for the programme of node id nid

                // If nid_of_the_programme_to_ask_reviews_about == 0,
                // we are getting the reviews for the logged in user

                // Grouphelper

                Grouphelper.load_groups(nid).then(
                    function(groups) {

                        //$scope.groupsinfo.groups = groups;

                        //console.debug('DBG-7uhdghff load_single_group_with_posts');
                        //console.debug(groups);

                        $scope.groupsinfo.single_group = groups[0];

                        $timeout($scope.refresh_scrollbar);

                        //$scope.groupsinfo.more_pages_available = Grouphelper.more_pages_available();

                        //$scope.reviewsforminfo.reviews = reviews;

                        //$scope.reviewsforminfo.page = page;

                        //$scope.reviewsforminfo.more_pages_available = Reviewhelper.more_pages_available();

                        //console.debug('DBG-nsb655cc load_reviews ReviewsFormCtrl.js:103 reviews');
                        //console.debug($scope.reviewsforminfo.reviews);

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

                Posthelper.load_posts(nid, page_of_posts).then(
                    function(posts) {

                        //$scope.groupsinfo.groups = groups;

                        //console.debug('DBG-kd888d load_single_group_with_posts load_posts');
                        //console.debug(posts);

                        $scope.groupsinfo.posts_of_current_single_group = posts;

                        $scope.groupsinfo.more_pages_of_posts_in_group_available =
                            Posthelper.more_pages_available();

                        $timeout($scope.refresh_scrollbar);

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

                Userhelper.return_members_of_a_group(nid, page_of_group_members).then(
                    function(members) {

                        //console.debug('DBG-g555ttgg load_single_group_with_posts return_members_of_a_group');
                        //console.debug(members.list);

                        $scope.groupsinfo.members_of_current_single_group = members.list;

                        $scope.groupsinfo.more_pages_of_members_in_group_available =
                            Userhelper.more_pages_of_group_members_available();

                        // Adding user profile permalink to members
                        // These are the links that will go to the profiles of the group's members
                        for (var member_iter = 0;
                             member_iter < $scope.groupsinfo.members_of_current_single_group.length;
                             member_iter++) {

                            $scope.groupsinfo.members_of_current_single_group[member_iter].user_profile_permalink =
                                Permalinkhelper.make_user_profile_permalink($scope.groupsinfo.members_of_current_single_group[member_iter].uid,
                                    $scope.groupsinfo.members_of_current_single_group[member_iter].name);

                        }

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @todo doc to do
             * @todo is this method used at all?
             * @ngdoc method
             * @name load_reviews
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
             * @param {int} nid Node id of the group to load
             */
            $scope.load_single_post_with_comments = function (nid) {

                //console.debug('DBG-nhyg SocialViewCtrl::load_single_post_with_comments nid: ' + nid);

                //SocialViewCtrl

                // @todo loading page zero of posts

                // @todo check on nid

                //$scope.groupsinfo.user_is_admin_for_the_current_group = Userhelper.user_is_admin(nid);
                //$scope.groupsinfo.user_is_member_of_the_current_group = Userhelper.user_is_member(nid);

                // user_is_member
                // If nid_of_the_programme_to_ask_reviews_about != 0,
                // we are getting the reviews for the programme of node id nid

                // If nid_of_the_programme_to_ask_reviews_about == 0,
                // we are getting the reviews for the logged in user

                // Grouphelper

                Grouphelper.load_groups(nid).then(
                    function(groups) {

                        //$scope.groupsinfo.groups = groups;

                        //console.debug('DBG-7uhdghff load_single_group_with_posts');
                        //console.debug(groups);

                        $scope.groupsinfo.single_group = groups[0];

                        //$scope.groupsinfo.more_pages_available = Grouphelper.more_pages_available();

                        //$scope.reviewsforminfo.reviews = reviews;

                        //$scope.reviewsforminfo.page = page;

                        //$scope.reviewsforminfo.more_pages_available = Reviewhelper.more_pages_available();

                        //console.debug('DBG-nsb655cc load_reviews ReviewsFormCtrl.js:103 reviews');
                        //console.debug($scope.reviewsforminfo.reviews);

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

                //this.load_posts = function(gid, page) {

                //posts_of_current_single_group

                Posthelper.load_posts(nid, 0)   .then(
                    function(posts) {

                        //$scope.groupsinfo.groups = groups;

                        //console.debug('DBG-kd888d load_single_group_with_posts load_posts');
                        //console.debug(posts);

                        $scope.groupsinfo.posts_of_current_single_group = posts;

                        $timeout($scope.refresh_scrollbar);

                        //$scope.groupsinfo.more_pages_available = Grouphelper.more_pages_available();

                        //$scope.reviewsforminfo.reviews = reviews;

                        //$scope.reviewsforminfo.page = page;

                        //$scope.reviewsforminfo.more_pages_available = Reviewhelper.more_pages_available();

                        //console.debug('DBG-nsb655cc load_reviews ReviewsFormCtrl.js:103 reviews');
                        //console.debug($scope.reviewsforminfo.reviews);

                    },
                    function(reason) {

                        // @todo fix

                        console.error('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx264 xxx not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @todo is this method still used?
             * @name fixme
             * @methodOf fixme.controller:UserViewCtrl
             * @description fixme We don't get a order's line items together with the order. We get
             * them later, when the user wants them, and we do this with this function.
             * @param {object} order The order whose line items we have to get.
             */
            $scope.get_comments_and_add_them_to_post = function(post, page) {

                //console.debug('@get_line_items_and_add_them_to_order');

                if (typeof(page) === 'undefined') page = 0;


                //this.load_comments = function(nid, page) {

                Commenthelper.load_comments(post.nid, page).then(
                    function(comments) {

                        //console.debug('DBG-9187tgfr user_orders_list');
                        //console.debug($scope.user.user_orders_list);
                        //console.debug('DBG-7sw3 get_line_items_and_add_them_to_order line_items');
                        //console.debug(line_items);
                        //console.debug(line_items.length);

                        // Attaching the line items to the order

                        if (typeof comments === "undefined") {
                            comments = [];
                        }

                        post.comments = comments;

                        // @todo fix this
                        //
                        $scope.groupsinfo.more_pages_of_comments_to_post_available = Commenthelper.more_pages_available();

                        $timeout($scope.refresh_scrollbar);

                        // Adding user profile permalink to comments
                        // These are the links that will go to the profiles of the comment's author
                        for (var comment_iter = 0;
                             comment_iter < post.comments.length;
                             comment_iter++) {

                            post.comments[comment_iter].user_profile_permalink =
                                Permalinkhelper.make_user_profile_permalink(post.comments[comment_iter].uid,
                                    post.comments[comment_iter].name);

                        }

                    },
                    function (reason) {

                        // @todo exception handling

                        console.error('iecaed7Thoozu4a Line items not loaded. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('iecaed7Thoozu4a Line items not loaded. ' +
                        'Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };

            /**
             * @ngdoc method
             * @name fixme
             * @methodOf fixme.controller:UserViewCtrl
             * @description fixme We don't get a order's line items together with the order. We get
             * them later, when the user wants them, and we do this with this function.
             * @param {object} group_id The order whose line items we have to get.
             */
            $scope.join_or_leave_a_group = function(group_id) {

                // @todo if the change doesn't work, we end up with an inconsistent situation

                Userhelper.add_or_remove_user_from_group(group_id).then(
                    function(response) {

                        //console.debug('DBG-hf677dyd7y join_or_leave_a_group add_or_remove_user_from_group');

                        // @todo check on no_problems_in_preconditions?

                        // @todo is it better to do another query to see if the user actually changed their membership?
                        // the problem is that we should put this more query after the one above

                        //$scope.reload_user_details();

                        Userhelper.fetch_user_details().then(
                            function(user) {

                                //console.debug('DBG-7fgh7h join_or_leave_a_group fetch_user_details');
                                //console.debug(user);

                                $scope.user.uid = user.uid;
                                $scope.user.name = user.name;
                                $scope.user.language = user.language;
                                $scope.user.licenses = user.licenses;
                                $scope.user.groups = user.groups;
                                $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                                $scope.user.first_name = user.first_name;
                                $scope.user.middle_names = user.middle_names;
                                $scope.user.family_name = user.family_name;

                                // @todo fix

                                $scope.groupsinfo.user_is_member_of_the_current_group = Userhelper.user_is_member(group_id);

                                $scope.load_single_group_with_posts(group_id);

                                //! $scope.groupsinfo.user_is_member_of_the_current_group;

                            },
                            function(reason) {

                                // @todo I copied and pasted this exception from TagViewCtrl.js
                                // maybe we want to change the error number

                                console.error('W3Exxx273 y6y6y6y778778 sho7go3iecheiTh User details not fetched. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx273 y6y6y6y778778 sho7go3iecheiTh User details not fetched. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                        //! $scope.groupsinfo.user_is_member_of_the_current_group;

                    },
                    function(reason) {

                        // @todo I copied and pasted this exception from TagViewCtrl.js
                        // maybe we want to change the error number

                        console.error('W3Exxx273  ca7Waidie4. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx273 ca7Waidie4 . Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };


            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} review Review to save
             */
            $scope.create_new_group = function () {

                //console.debug('DBG-vbu777 SocialViewCtrl create_new_group');
                //console.debug($scope.groupsinfo.newgroup);

                // @todo checks on values?

                Grouphelper.create_group({ uid: $scope.user.uid,
                                           title: $scope.groupsinfo.newgroup.title,
                                           description: $scope.groupsinfo.newgroup.description }).then(
                    function(new_group_id) {

                        // We are not interested in the id of the newly created review


                        if (typeof new_group_id == "string" &&
                            new_group_id == "GROUP_HELD_FOR_MODERATION") {

                            Dialoghelper.standard_dialog_for_message('GROUP_HELD');

                            //alert('Comment held for moderation');
                        } else {

                            // @todo this has to change
                            // maybe we have to say that they have to logoff and login?
                            Dialoghelper.standard_dialog_for_message('GROUP_SAVED');

                            $scope.reload_user_details();


                            //Userhelper.fetch_user_details().then(function(user) {
                            //
                            //        //console.debug('DBG-7cgtt fetch_user_details in controller_init in TagViewCtrl');
                            //
                            //        $scope.user.uid = user.uid;
                            //        $scope.user.name = user.name;
                            //        $scope.user.language = user.language;
                            //        $scope.user.licenses = user.licenses;
                            //        $scope.user.groups = user.groups;
                            //        $scope.user.subscriber = Userhelper.is_user_a_subscriber();
                            //        $scope.user.first_name = user.first_name;
                            //        $scope.user.middle_names = user.middle_names;
                            //        $scope.user.family_name = user.family_name;
                            //
                            //        console.debug('DBG-quai3reHu4 SocialViewCtrl::create_new_group fetch_user_details');
                            //        console.debug(user);
                            //        //console.debug(Userhelper.logged_in_user_info());
                            //
                            //    },
                            //    function(reason) {
                            //
                            //        // @todo fix here
                            //
                            //        console.error('W3Exxx273 eith9Uz7va User details not fetched. Reason: ' + reason);
                            //        Clientexceptionhelper.send_client_exception('W3Exxx273 eith9Uz7va User details not fetched. Reason: ' + reason);
                            //        // @todo What do we say to the user?
                            //        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);
                            //
                            //    }
                            //);
                        }

                        //$scope.groupsinfo = { nid: 0, // @todo ???
                        //    page: 0,
                        //    more_pages_available: false,
                        //    groups_filter: '',
                        //    groups: [],
                        //    newgroup: { title: '',
                        //        description: '' }
                        //};

                        // @todo more to reset here?
                        $scope.groupsinfo.newgroup = { title: '',
                                                       description: '' };

                    },
                    function(reason) {

                        // @todo group have to pass through Mollom so here we have to manage the case
                        // in which they are held for moderations

                        console.error('W3Exxx265 Group not created. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3Exxx265 Group not created.' +
                        ' Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            };


            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.update_group = function (group) {

                //console.debug('DBG-7ujnhy SocialViewCtrl update_group');
                //console.debug(group);

                // @todo checks on values?

                Grouphelper.update_group(group).then(
                    function(response) {

                        // @todo fix this Checking if the comment we just updated has been held for moderation

                        if (typeof response == "string" && response == "GROUP_HELD_FOR_MODERATION") {
                            Dialoghelper.standard_dialog_for_message('GROUP_HELD');

                            // @todo here you have to go to the top level

                            //$scope.load_comments(0);

                            $scope.reload_user_details();

                            $scope.load_groups();

                            //HERE YOU NEED to go back to the top level

                            $scope.groupsinfo.page_in_groups_list = 0;

                            $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';

                            //console.debug('@SocialViewCtrl::update_group current_top_level_section: ' +
                            //    $scope.groupsinfo.current_top_level_section);

                            var new_path = '/social/en/groups/browse';

                            //if ($scope.groupsinfo.current_top_level_section == 'browsegroups')
                            //    new_path = '/social/en/groups/browse';
                            //else if ($scope.groupsinfo.current_top_level_section == 'mygroups')
                            //    new_path = '/social/en/groups/mygroups';

                            //var new_path = "/social/en/groups/group/" + $routeParams.id;

                            var current_path = $location.path();

                            // We change the url only if it's actually different from the current one so that
                            // we force a reinitialisation of this controller only if really necessary
                            if (current_path != new_path) {

                                console.info('   About to change url');
                                console.info('   current_path: ' + current_path);
                                console.info('   new_path: ' + new_path);

                                //$location.replace();
                                $location.path(new_path);

                            }

                        } else {

                            $scope.reload_user_details();

                            // @todo this has to change
                            // maybe we have to say that they have to logoff and login?
                            Dialoghelper.standard_dialog_for_message('GROUP_SAVED');

                            // @todo here it's ok because it's just an edit and it has not been held
                            // for moderation
                        }

                    },
                    function(reason) {

                        console.error('W3E256 Comment not updated. Reason: ' + reason);
                        Clientexceptionhelper.send_client_exception('W3E256 Comment not updated. Reason: '
                        + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

                //Grouphelper.create_group({ uid: $scope.user.uid,
                //    title: $scope.groupsinfo.newgroup.title,
                //    description: $scope.groupsinfo.newgroup.description }).then(
                //    function(new_group_id) {
                //
                //        // We are not interested in the id of the newly created review
                //
                //        // @todo this has to change
                //        // maybe we have to say that they have to logoff and login?
                //        Dialoghelper.standard_dialog_for_message('GROUP_SAVED');
                //
                //        //$scope.groupsinfo = { nid: 0, // @todo ???
                //        //    page: 0,
                //        //    more_pages_available: false,
                //        //    groups_filter: '',
                //        //    groups: [],
                //        //    newgroup: { title: '',
                //        //        description: '' }
                //        //};
                //
                //        // @todo more to reset here?
                //        $scope.groupsinfo.newgroup = { title: '',
                //            description: '' };
                //
                //    },
                //    function(reason) {
                //
                //        // @todo group have to pass through Mollom so here we have to manage the case
                //        // in which they are held for moderations
                //
                //        console.error('W3Exxx265 Group not created. Reason: ' + reason);
                //        Clientexceptionhelper.send_client_exception('W3Exxx265 Group not created.' +
                //        ' Reason: ' + reason);
                //        // @todo What do we say to the user?
                //        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);
                //
                //    }
                //);

            };

            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.delete_group = function (group) {

                //console.debug('DBG-7ujnhy SocialViewCtrl delete_group');
                //console.debug(group);

                // @todo checks on values?

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_GROUP_DELETE',
                    group.title).then(
                    function(value) {

                        //console.debug('deleting the group');

                        Grouphelper.delete_group(group).then(
                            function(response) {

                                //console.debug('DBG- ');
                                //console.debug(comments);

                                // We load page zero instead of the page where the deleted comment was because
                                // now that page may be empty.
                                // Imagine that the deleted comment was the only one left in its page.
                                // When we delete the comment, the page is empty.
                                // So, we load page zero where there should be something. Maybe even page zero
                                // is empty but of course we can't do anything more in that case.

                                //$scope.load_comments(0);

                                $scope.reload_user_details();

                                $scope.load_groups();

                                //HERE YOU NEED to go back to the top level

                                $scope.groupsinfo.page_in_groups_list = 0;

                                $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';

                                //console.debug('@SocialViewCtrl::update_group current_top_level_section: ' +
                                //    $scope.groupsinfo.current_top_level_section);

                                var new_path = '/social/en/groups/browse';

                                var current_path = $location.path();

                                // We change the url only if it's actually different from the current one so that
                                // we force a reinitialisation of this controller only if really necessary
                                if (current_path != new_path) {

                                    console.info('   About to change url');
                                    console.info('   current_path: ' + current_path);
                                    console.info('   new_path: ' + new_path);

                                    //$location.replace();
                                    $location.path(new_path);

                                }


                            },
                            function(reason) {

                                console.error('W3E258 Comment not deleted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E258 Comment not deleted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);


                            }
                        );

                    },
                    function(value) {

                        //console.debug('not deleting the group');

                    }
                );

            };

            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.save_post = function (post) {

                //console.debug('DBG-7ujnhy SocialViewCtrl save_post');
                //console.debug(post);

                // this is for both new posts and posts to update

                // @todo completely to be fixed
                //$scope.groupsinfo.newpost = { nid: 0,
                //    body: '',
                //    gid: 0 };

                //console.debug('DBG-656d6f post');
                //console.debug(comment);

                // Remember that we are not allowing html markup in comments

                if (post.nid == 0) {

                    // In this case we have a brand new comment to create

                    //console.debug('DBG-98r78 post this is a new comment');

                    Posthelper.create_post(post).then(
                        function(new_post_nid) {

                            // Checking if the comment we just created has been held for moderation

                            if (typeof new_post_nid == "string" &&
                                new_post_nid == "POST_HELD_FOR_MODERATION") {

                                Dialoghelper.standard_dialog_for_message('POST_HELD');

                                //alert('Comment held for moderation');
                            }

                            //console.debug('DBG-3h7j post create_comment new_comment_cid; ' + new_comment_cid);
                            //console.debug(comments);

                            // deleteme Dialoghelper.standard_dialog_for_remote_api_call_exception('tesgdf 5677788');

                            // Reloading comments after the new one created to refresh the comments list
                            //???? @todo fixme $scope.load_comments(0);

                            $scope.load_single_group_with_posts($scope.groupsinfo.single_group_to_show);

                        },
                        function(reason) {

                            // @todo fix excpt

                            console.error('W3Exxx255  aeF3quiesaeph4v ??????Comment not created. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx255  aeF3quiesaeph4v Comment not created. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            //alert('Error in connecting to the server. Please, check your internet connection.');

                        }
                    );

                    // I clean the always-on-edit field where the user can create comments.
                    // It has to be clean for the next comment

                    $scope.groupsinfo.newpost = { nid: 0,
                                                  body: '',
                                                  gid: $scope.groupsinfo.single_group_to_show,
                                                  uid: $scope.user.uid }; // @todo this has to be completed/fixed

                } else {

                    // Here we update the comment. The comment has already been created since we have cid != 0

                    Posthelper.update_post(post).then(
                        function(response) {

                            // Checking if the comment we just updated has been held for moderation

                            if (typeof response == "string" && response == "POST_HELD_FOR_MODERATION") {
                                Dialoghelper.standard_dialog_for_message('POST_HELD');

                                // @todo what do we do now?
                                // I guess we go back to the group the post belonged to
                                $scope.groupsinfo.section_to_show = 'singlegroup';
                                $scope.load_single_group_with_posts($scope.groupsinfo.single_group_to_show);

                            }

                            //console.debug('DBG-89ss post update_comment response: ' + response);
                            //console.debug(comments);

                            // Reloading comments after the update to refresh the comments list
                            // We reload page zero because the updated comment will be there
                            // This because comments are displayed in order of last change beginning with
                            // the newest
                            //$scope.load_comments(0);
                            //$scope.load_single_group_with_posts($scope.groupsinfo.single_group_to_show);

                        },
                        function(reason) {

                            // @todo fix

                            console.error('W3Exxx256 teiso3aijaiH3ez xxxx not updated. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx256 teiso3aijaiH3ez Comxxxment not updated. Reason: '
                                + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }

                // @todo this has to work for both new and existing posts like
                // frontends/angular/app/js/controllers/CommentsFormCtrl.js:172
                // post method in CommentsFormCtrl

                // @todo checks on values?

                //Grouphelper.create_group({ uid: $scope.user.uid,
                //    title: $scope.groupsinfo.newgroup.title,
                //    description: $scope.groupsinfo.newgroup.description }).then(
                //    function(new_group_id) {
                //
                //        // We are not interested in the id of the newly created review
                //
                //        // @todo this has to change
                //        // maybe we have to say that they have to logoff and login?
                //        Dialoghelper.standard_dialog_for_message('GROUP_SAVED');
                //
                //        //$scope.groupsinfo = { nid: 0, // @todo ???
                //        //    page: 0,
                //        //    more_pages_available: false,
                //        //    groups_filter: '',
                //        //    groups: [],
                //        //    newgroup: { title: '',
                //        //        description: '' }
                //        //};
                //
                //        // @todo more to reset here?
                //        $scope.groupsinfo.newgroup = { title: '',
                //            description: '' };
                //
                //    },
                //    function(reason) {
                //
                //        // @todo group have to pass through Mollom so here we have to manage the case
                //        // in which they are held for moderations
                //
                //        console.error('W3Exxx265 Group not created. Reason: ' + reason);
                //        Clientexceptionhelper.send_client_exception('W3Exxx265 Group not created.' +
                //        ' Reason: ' + reason);
                //        // @todo What do we say to the user?
                //        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);
                //
                //    }
                //);

            };

            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.delete_post = function (post) {

                //console.debug('DBG-i8iurrr SocialViewCtrl delete_post');
                //console.debug(post);

                // @todo checks on values?

                //return;

                if (post.nid == 0) {

                    console.error('W3Exxx257 keiRo3shie post.nid cant be zero when deleting a post');
                    Clientexceptionhelper.send_client_exception('W3Exxx257 keiRo3shie post.nid cant be zero when deleting a post');

                    return;
                }

                // @todo fix here

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_POST_DELETE',
                    post.body).then(
                    function(value) {

                        //console.debug('deleting the post');

                        Posthelper.delete_post(post).then(
                            function(response) {

                                //console.debug('DBG- ');
                                //console.debug(comments);

                                // We load page zero instead of the page where the deleted comment was because
                                // now that page may be empty.
                                // Imagine that the deleted comment was the only one left in its page.
                                // When we delete the comment, the page is empty.
                                // So, we load page zero where there should be something. Maybe even page zero
                                // is empty but of course we can't do anything more in that case.

                                // @todo what do we do now?

                                // @todo this is zero: $scope.groupsinfo.single_group_to_sho
                                //console.debug('@SocialViewCtrl.js::delete_post post.gid:' + post.gid);

                                // I guess we go back to the group the post belonged to
                                $scope.groupsinfo.section_to_show = 'singlegroup';
                                $scope.tabs_horizontal_menu_info.menu_to_show = 'social/groups';
                                $scope.tabs_horizontal_menu_info.active_item = 'singlegroup';
                                $scope.tabs_horizontal_menu_info.group_link = '/social/en/groups/group/' + post.gid;

                                $scope.load_single_group_with_posts(post.gid);

                                var new_path = "/social/en/groups/group/" + post.gid;

                                var current_path = $location.path();

                                // We change the url only if it's actually different from the current one so that
                                // we force a reinitialisation of this controller only if really necessary
                                if (current_path != new_path) {

                                    console.info('   About to change url');
                                    console.info('   current_path: ' + current_path);
                                    console.info('   new_path: ' + new_path);

                                    //$location.replace();
                                    $location.path(new_path);

                                    // No use going on because this controller will be initialised again

                                }

                            },
                            function(reason) {

                                console.error('W3Exxx258 Authu9iCoa Post not deleted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx258 Authu9iCoa Post not deleted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);


                            }
                        );

                    },
                    function(value) {

                        //console.debug('not deleting the post');

                    }
                );

            };



            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.mark_post_as_abusive = function (post) {

                //console.debug('DBG-9090909 SocialViewCtrl mark_post_as_abusive');
                //console.debug(post);

                // @todo checks on values?

                if (post.nid == 0) {

                    console.error('W3Exxx259 semu3shois nid cant be zero when flagging a post as abusive');
                    Clientexceptionhelper.send_client_exception('W3Exxx259 semu3shois nid cant be zero when flagging a post as abusive');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_POST_FLAGGING',
                    post.body).then(
                    function(value) {

                        //console.debug('flagging the post');

                        // @todo it isn't abusive_comment, it's abusive_post
                        Flagginghelper.create_flagging('abusive_post', post.nid).then(
                            function(response) {

                                //console.debug('DBG-ewuhuff abuse create_flagging response: ' + response);

                                // I don't have to refresh any page of comments after the flagging done

                                Dialoghelper.standard_dialog_for_message('POST_FLAGGED');

                            },
                            function(reason) {

                                console.error('W3Exxx260 kik4eeyahV Post not marked as abusive. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx260 kik4eeyahV Post not marked as abusive. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                    },
                    function(value) {

                        //console.debug('not flagging the post');

                    }
                );

            };




            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.mark_group_as_abusive = function (group) {

                //console.debug('DBG-9090909 SocialViewCtrl mark_group_as_abusive');
                //console.debug(group);


                // Object {nid: "955", uid: "40", title: "Group by emanuele", description: "A group to test Mandrill"}

                //return;
                // @todo checks on values?

                if (group.nid == 0) {

                    console.error('W3Exxx259 ahx7Chohwa nid cant be zero when flagging a group as abusive');
                    Clientexceptionhelper.send_client_exception('W3Exxx259 ahx7Chohwa nid cant be zero when flagging a group as abusive');

                    return;
                }

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_GROUP_FLAGGING',
                    group.title).then(
                    function(value) {

                        //console.debug('flagging the group');

                        // @todo it isn't abusive_comment, it's abusive_post
                        Flagginghelper.create_flagging('abusive_group', group.nid).then(
                            function(response) {

                                //console.debug('DBG-ewuhuff abuse create_flagging response: ' + response);

                                // I don't have to refresh any page of comments after the flagging done

                                Dialoghelper.standard_dialog_for_message('GROUP_FLAGGED');

                            },
                            function(reason) {

                                console.error('W3Exxx260 iCo9uz9aic Group not marked as abusive. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx260 iCo9uz9aic Group not marked as abusive. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );

                    },
                    function(value) {

                        //console.debug('not flagging the post');

                    }
                );

            };




            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} comment
             */
            $scope.save_comment = function (comment, post) {

                //console.debug('DBG-7ujnhy SocialViewCtrl save_comment');
                //console.debug(comment);
                //console.debug(comment.body);

                // @todo completely to be fixed
                // This is just for safety because the new comment has to be recreated every time a
                //$scope.groupsinfo.single_post.newcomment = { body: '' };


                //<button ng-click="groupsinfo.single_post_to_show = post.nid;
                //groupsinfo.single_post = post;
                //groupsinfo.single_post.newcomment = { body: '', cid: 0, name: '',
                //    nid: post.nid, subject: '', uid: user.uid };
                //groupsinfo.section_to_show = 'singlepost';
                //get_comments_and_add_them_to_post(groupsinfo.single_post)">Go to post</button>


                // @todo this has to work for both new and existing posts like
                // frontends/angular/app/js/controllers/CommentsFormCtrl.js:172
                // post method in CommentsFormCtrl


                if (comment.cid == 0) {

                    // In this case we have a brand new comment to create

                    //console.debug('DBG-98r78 post this is a new comment');

                    Commenthelper.create_comment(comment).then(
                        function(new_comment_cid) {

                            // Checking if the comment we just created has been held for moderation

                            if (typeof new_comment_cid == "string" &&
                                new_comment_cid == "COMMENT_HELD_FOR_MODERATION") {

                                Dialoghelper.standard_dialog_for_message('COMMENT_HELD');

                                //alert('Comment held for moderation');
                            }

                            //console.debug('DBG-3h7j post create_comment new_comment_cid; ' + new_comment_cid);
                            //console.debug(comments);

                            // deleteme Dialoghelper.standard_dialog_for_remote_api_call_exception('tesgdf 5677788');

                            // Reloading comments after the new one created to refresh the comments list
                            //$scope.get_comments_and_add_them_to_post = function(post, page) {
                            $scope.get_comments_and_add_them_to_post(post);

                            $scope.groupsinfo.single_post.newcomment.body = '';


                        },
                        function(reason) {

                            console.error('W3Exxx255 mah4Chogha Comment not created. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx255 mah4Chogha Comment not created. Reason: ' + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            //alert('Error in connecting to the server. Please, check your internet connection.');

                        }
                    );

                    // I clean the always-on-edit field where the user can create comments.
                    // It has to be clean for the next comment


                } else {

                    // Here we update the comment. The comment has already been created since we have cid != 0

                    Commenthelper.update_comment(comment).then(
                        function(response) {

                            // Checking if the comment we just updated has been held for moderation

                            if (typeof response == "string" && response == "COMMENT_HELD_FOR_MODERATION") {
                                Dialoghelper.standard_dialog_for_message('COMMENT_HELD');
                            }

                            //console.debug('DBG-89ss post update_comment response: ' + response);
                            //console.debug(comments);

                            // Reloading comments after the update to refresh the comments list
                            // We reload page zero because the updated comment will be there
                            // This because comments are displayed in order of last change beginning with
                            // the newest
                            //$scope.load_comments(0);
                            $scope.get_comments_and_add_them_to_post(post);

                        },
                        function(reason) {

                            console.error('W3Exxx256 uifeeWee9p Comment not updated. Reason: ' + reason);
                            Clientexceptionhelper.send_client_exception('W3Exxx256 uifeeWee9p Comment not updated. Reason: '
                            + reason);
                            // @todo What do we say to the user?
                            Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                        }
                    );

                }

                // @todo checks on values?

            };

            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.delete_comment = function (comment, post) {

                //console.debug('DBG-xxx8898sjjs SocialViewCtrl delete_comment');
                //console.debug(comment);

                // @todo checks on values?


                if (comment.cid == 0) {

                    console.error('W3Exxx257 eetaiMa3oh comment.cid cant be zero when deleting a comment');
                    Clientexceptionhelper.send_client_exception('W3Exxx257 eetaiMa3oh comment.cid cant be zero when deleting a comment');

                    return;
                }

                // @todo fix here

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_COMMENT_DELETE',
                    comment.body).then(
                    function(value) {

                        //console.debug('deleting the comment');

                        Commenthelper.delete_comment(comment).then(
                            function(response) {

                                //console.debug('DBG- ');
                                //console.debug(comments);

                                // We load page zero instead of the page where the deleted comment was because
                                // now that page may be empty.
                                // Imagine that the deleted comment was the only one left in its page.
                                // When we delete the comment, the page is empty.
                                // So, we load page zero where there should be something. Maybe even page zero
                                // is empty but of course we can't do anything more in that case.

                                //$scope.load_comments(0);
                                $scope.get_comments_and_add_them_to_post(post);


                            },
                            function(reason) {

                                console.error('W3E258 Comment not deleted. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3E258 Comment not deleted. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);


                            }
                        );

                    },
                    function(value) {

                        //console.debug('not deleting the comment');

                    }
                );

            };


            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.mark_comment_as_abusive = function (comment) {

                //console.debug('DBG-1255ggg SocialViewCtrl mark_comment_as_abusive');
                //console.debug(comment);

                // @todo checks on values?



                if (comment.cid == 0) {

                    console.error('W3Exxx259 thaeX4ohM4 cid cant be zero when flagging a comment as abusive');
                    Clientexceptionhelper.send_client_exception('W3Exxx259 thaeX4ohM4 cid cant be zero when flagging a comment as abusive');

                    return;
                }

                // CONFIRM_COMMENT_FLAGGING

                Dialoghelper.standard_dialog_for_action_confirmation('CONFIRM_COMMENT_FLAGGING',
                    comment.body).then(
                    function(value) {

                        //console.debug('flagging the comment');

                        Flagginghelper.create_flagging('abusive_comment', comment.cid).then(
                            function(response) {

                                //console.debug('DBG-ewuhuff abuse create_flagging response: ' + response);

                                // I don't have to refresh any page of comments after the flagging done

                                Dialoghelper.standard_dialog_for_message('COMMENT_FLAGGED');

                            },
                            function(reason) {

                                console.error('W3Exxx260 baizu9jiex Comment not marked as abusive. Reason: ' + reason);
                                Clientexceptionhelper.send_client_exception('W3Exxx260 baizu9jiex Comment not marked as abusive. Reason: ' + reason);
                                // @todo What do we say to the user?
                                Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                            }
                        );


                    },
                    function(value) {

                        //console.debug('not flagging the comment');

                    }
                );


            };



            /**
             * @ngdoc method
             * @name @todo doc
             * @methodOf ReviewsFormCtrl.controller:ReviewsFormCtrl
             * @description Function called by the ngReview directive to save a new review to the server.
             * It's used to save edited reviews as well for the server to store the changes.
             * @param {object} group Review to save
             */
            $scope.reply_to_comment = function (comment) {

                //console.debug('DBG-ikvg666 SocialViewCtrl reply_to_comment');
                //console.debug(comment);

                // @todo checks on values?


                //$scope.groupsinfo.single_post.newcomment.body = '';

                // Copying the name of the author of the comment to the new-comment field
                $scope.groupsinfo.single_post.newcomment.body += '@' + comment.name + ' ';

                // Giving focus to the new-comment field
                //$scope.commentsforminfo.movefocustopostfield = true;

            };



            /**
             * @ngdoc method
             * @name chan
             * @methodOf TagViewCtrl.controller:TagViewCtrl
             * @description We have to (re)initialise the tagring because the content type has changed.
             * If requested so, we also update the url to reflect the new content type             *
             * @param {string} content_type 'video', 'audio' or 'library'
             * @param {bool} reset_location True if we have to update the url according to the new content type
             */
            //$scope.change_tagring_content_type_and_initialise_the_tagring = function(content_type, reset_location) {
            //
            //    $scope.tagring_content_type_selector = content_type;
            //
            //    //console.debug('@change_tagring_content_type_and_initialise_the_tagring');
            //    //console.debug('   tagring_content_type_selector: ' + $scope.tagring_content_type_selector);
            //
            //    if (typeof reset_location === "undefined")
            //        reset_location = true;
            //
            //    if (reset_location) {
            //
            //        var first_letter_of_new_tagring_content_type_selector =
            //            $scope.tagring_content_type_selector.substring(0,1);
            //
            //        var new_path = '/en/' + first_letter_of_new_tagring_content_type_selector;
            //
            //        var current_path = $location.path();
            //
            //        if (current_path != new_path) {
            //            //console.debug('DBG-clatct9845 changing path ');
            //            //console.debug('   new_path: ' + new_path + ', current-path: ' + current_path);
            //            //console.debug('   about to call $location.path(new_path) new_path: ' + new_path);
            //
            //            var array_current_path_split = current_path.split('/');
            //
            //            // We want to replace the current path if it is something like
            //            // the home ('/') or anyway if it has less than 2 parts ('/en' for example)
            //            // This because, if we leave both '/' and 'en/v', for example in the history,
            //            // when the user clicks the back button, they go from '/en/v' to '/' where
            //            // this same controller rewrites the path to '/en/v' and we have a loop.
            //            // The user will never be able to go further back
            //            // If the current path has already at least two parts (like '/en/v'), there is no
            //            // possibility of loop
            //            if (typeof array_current_path_split[2] == "undefined")
            //                $location.replace();
            //
            //            $location.path(new_path);
            //        }
            //
            //        //console.debug('DBG-ctct8rft called change_location_according_to_content_type');
            //    }
            //
            //    Tagringhelper.initialise_tagring(content_type);
            //};


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

                // Replacing . _ ~ : / ? # [ ] @ ! $ & ' ( ) * + , ; = with -
                // Replacing whitespace characters like tab, carriage return, new line, form feed with -
                var cleaned_display_title = programme.display_title.replace(/[\s\._~:\/\?#\[\]@!\$&\'\(\)\*\+,;=]/g, "-");

                // Replacing one or more instances of - with a single -
                cleaned_display_title = cleaned_display_title.replace(/-+/g, "-");

                // Trimming away any trailing '-'
                cleaned_display_title = cleaned_display_title.replace(/-$/, "");

                // Our new url is composed by:
                // * language (for now 'en' only)
                // * content type ('v' for video, 'a' for audio, 'l' for library)
                // * programme's node id
                // * cleaned display title

                var new_path = '/en/' + $scope.tagring_content_type_selector.substring(0,1) + '/'  +
                    programme.nid + '/' + cleaned_display_title;

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

                                if ($scope.user.uid)
                                    vote_given_to_the_current_track_by_the_logged_in_user =
                                        Votehelper.vote_user_gave_to_node($scope.user.uid,
                                                                          $scope.programme.tracks[track_iter].tid);

                                // If the user didn't vote yet, we create an empty user vote so that the voting
                                // mechanism can work and the user can vote the track if they want
                                if (typeof vote_given_to_the_current_track_by_the_logged_in_user == "undefined")
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

                        }

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
             * @param {int} nid Node id of the programme we want the votes aggregate about
             */
            $scope.load_votes_aggregate_for_a_programme = function (nid) {

                if (!nid) {

                    // @todo exception handling waiting for things to settle down

                    console.error('Eis4Aiz9ahrcccqwwww nid cant be zero when loading votes aggregate for programme');
                    Clientexceptionhelper.send_client_exception('Eis4Aiz9ahrcccqwwww nid cant be zero ' +
                        'when loading votes aggregate for programme');

                    return;
                }

                Votesaggregatehelper.load_votes_aggregate(nid).then(
                    function(votesaggregate) {

                        //console.debug('DBG-31414141 Votesaggregatehelper.load_votes_aggregate ctrl votesaggregate');
                        //console.debug(votesaggregate);

                        if (votesaggregate != null) {

                            $scope.programmevotepanelinfo.nid = nid;
                            $scope.programmevotepanelinfo.average = votesaggregate.average;
                            $scope.programmevotepanelinfo.sum = votesaggregate.sum;
                            $scope.programmevotepanelinfo.count = votesaggregate.count;

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

                //console.debug('@play_track');
                //console.debug('   tid: ' + track_to_play.tid);
                //console.debug('   track_to_play:');
                //console.debug(track_to_play);

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

                        if (track_to_play.price == 0)
                            track_is_free = true;

                        //console.debug('DBG-I7RF track_to_play.price ' + track_to_play.price);

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