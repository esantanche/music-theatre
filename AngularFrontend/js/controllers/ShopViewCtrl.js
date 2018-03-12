/**
 * @file FIXME
 *
 * @todo doc
 * @todo this controller is about to be abandoned
 *
 * @brief This is the controller associated to the view tagview
 *
 * What happens here?
 * - The view tagview is initialised
 * - The tagring events are processed
 * - The videoplayer is initialised using the videoplayer helper service
 * - User credentials are sent when required
 *
 * @ingroup ngcontrollers
 */

'use strict';

// @todo do I need all these modules?
// @todo do I need URLsKit?

// @todo this controller is about to be abandoned
// The user will select programmes and everything else by using the tagring
// @todo this controller is just a pile of junk to recycle

angular.module('MusicTheatreApp.controllers').
  controller('ShopViewCtrl', ['$scope', 'Programme', 'URLsKit',
                             'Programmehelper', 'Urlskithelper',
                             'Clientexceptionhelper', 'SearchTermhelper',
                             'Userhelper', 'Orderhelper', 'LineItemhelper',
                             '$routeParams', '$location', '$rootScope', 'Tagringhelper',
        function($scope, Programme, URLsKit,
                 Programmehelper, Urlskithelper,
                 Clientexceptionhelper, SearchTermhelper,
                 Userhelper, Orderhelper, LineItemhelper,
                 $routeParams, $location, $rootScope, Tagringhelper) {

            // 'genre', 'form', 'period', 'instrument', 'film_type'
            // composer, conductor, performer, ensemble, venue
            // Got rid of film_type
            var Types = [ 'genre', 'form', 'period', 'instrument',
                          'composer', 'conductor', 'performer', 'ensemble', 'venue' ];

            // @todo this currentSearchTerm should be refactored to selected_search_term
            // @todo also refactor mouseover_on_type and mouseover_on_search_term

            $rootScope.show_tagring = false;
            Tagringhelper.reset_tagring_initialisation();

            $scope.search_term_type_menu_info = { selected_type: 'genre',
                                                  mouseover_on_type: 'none',
                                                  currentSearchTerm: null,
                                                  mouseover_on_search_term: null };

            // Loading the initial playlist to show when no choice has be done yet
            /*
            Programmehelper.load_all_programmes_for_a_tagring_playlist('shop_tagring').then(
                function(programmes) {

                    $scope.programmes = programmes;

                    console.debug('DBG-swc7787 in then for load_all_programmes_for_a_tagring_playlist');

                    //console.debug(programme.display_title.replace(/[^A-Z0-9]/ig, "-"));

                    //var no_symbols_display_title = programme.display_title.replace(/[^A-Z0-9]/ig, "-");

                    //$location.path('/en/video/opera/' + no_symbols_display_title + '-' + nid);

                    // If we have to play a preview or a movie, we need the signed url

                },
                function(reason) {

                    // @todo fix everything
                    console.error('W3E??? fixme Programme not loaded. Reason: ' + reason);
                    //Clientexceptionhelper.send_client_exception('W3E032 Programme not loaded. Reason: ' + reason);
                    // @todo What do we say to the user?
                    alert('Error in connecting to the server. Please, check your internet connection.');
                }
            );
            */

            console.debug(Types);

            $scope.Types = Types;
            //$scope.currentType = Types[0];
            $scope.controller_name = 'ShopViewCtrl';

            // @todo
            $scope.calculate_class_name_for_search_term_type = function(Type) {

                //console.debug('DBG-ccnfstt8177 calculate_class_name_for_search_term_type Type: ' + Type);
                //console.debug('DBG-ccnfstt6767 ' + $scope.search_term_type_menu_info.selected_type +
                //    '/' + $scope.search_term_type_menu_info.mouseover_on_type);

                //{ 'vertical-left-menu-parent-open-mouseover': selected_type == Type && mouseover_on_type == Type,
                //    'vertical-left-menu-parent-open-mouseout': selected_type == Type && mouseover_on_type != Type,
                //    'vertical-left-menu-parent-closed-mouseover': selected_type != Type && mouseover_on_type == Type,
                //    'vertical-left-menu-parent-closed-mouseout': selected_type != Type && mouseover_on_type != Type }

                var class_name = 'vertical-left-menu-parent-' +
                    ($scope.search_term_type_menu_info.selected_type == Type ? 'open' : 'closed') + '-' +
                    ($scope.search_term_type_menu_info.mouseover_on_type == Type ? 'mouseover' : 'mouseout');

                //console.debug('DBG-ccnfstt5652 class_name: ' + class_name);

                return class_name;
            }

            $scope.calculate_class_name_for_search_term = function(search_term) {

                var class_name = 'vertical-left-menu-parent-no-children-' +
                    ($scope.search_term_type_menu_info.mouseover_on_search_term == search_term ? 'mouseover' : 'mouseout');

                //console.debug('DBG-ccnfst9283 class_name: ' + class_name);

                    //mouseover
                return class_name;
            }

            // Sort function used to sort the tracks properly
            $scope.programmeFirstLetterPredicateFunction = function(programme) {

                //console.debug('DBG-17171 programmeFirstLetterPredicateFunction');
                //console.debug(programme.display_title);
                //console.debug($scope.currentInitial);

                var programmeDisplayTitleFirstLetter = programme.display_title[0];

                // if the current initial is empty, it means that we want all programmes

                if ($scope.currentInitial)
                    return (programmeDisplayTitleFirstLetter == $scope.currentInitial);
                else
                    return true;
            }

            // fixme Sort function used to sort the tracks properly
            //$scope.tracksSortFunction = function(track) {
            //    return track.segment_no * 100 + track.track_no;
            // }
            // ng-change="groupChanged()"

            $scope.OnTypeChanged = function(){
                //console.debug('DBG-49HN Inside OnTypeChanged');
                //$scope.currentType = $scope.currentGroup.Items[0];

                //$scope.currentInitial = '';

                SearchTermhelper.load_search_terms($scope.search_term_type_menu_info.selected_type, 'audio').then(function(search_terms) {
                        $scope.search_terms = search_terms.list;
                        //$scope.programme_loaded = true;
                        //$scope.loaded_programme_nid = nid;
                        //$scope.section_to_show = 'summary';
                        //$scope.show_infopanel = true;

                        //console.debug('DBG-1LAG ');
                        //console.debug(search_terms.list);
                        $scope.search_term_type_menu_info.currentSearchTerm = search_terms[0];

                        //$location.path('/en/video/opera/' + no_symbols_display_title + '-' + nid);

                    },
                    function(reason) {

                        console.error('W3E??? search term  not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E??? fixme Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            }

            // First call of OnTypeChanged to load the default type
            $scope.OnTypeChanged();

            $scope.OnSearchTermChanged = function() {
                //console.debug('DBG-6789 OnSearchTermChanged ' + $scope.search_term_type_menu_info.currentSearchTerm.label);

                $scope.currentInitial = '';

                // load_all_programmes_for_a_search_term

                Programmehelper.load_all_programmes_for_a_search_term($scope.search_term_type_menu_info.currentSearchTerm.type,
                        $scope.search_term_type_menu_info.currentSearchTerm.eid).then(function(programmes) {

                        $scope.programmes = programmes;
                        // @todo need this? $scope.programme_loaded = true;
                        // @todo need this? $scope.loaded_programme_nid = nid;
                        // @todo need this? $scope.section_to_show = 'summary';
                        // @todo need this? $scope.show_infopanel = true;

                        //console.debug('DBG-YUIJ in then for load_all_programmes_for_a_search_term');

                        //console.debug(programme.display_title.replace(/[^A-Z0-9]/ig, "-"));

                        //var no_symbols_display_title = programme.display_title.replace(/[^A-Z0-9]/ig, "-");

                        //$location.path('/en/video/opera/' + no_symbols_display_title + '-' + nid);

                        // If we have to play a preview or a movie, we need the signed url


                    },
                    function(reason) {

                        // @todo fix everything
                        console.error('W3E??? fixme Programme not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E032 Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        Dialoghelper.standard_dialog_for_remote_api_call_exception(reason);

                    }
                );

            }

            // First call of OnSearchTermChanged to load the default searc
            // @todo do this? $scope.OnSearchTermChanged();

            var initials = [ '' ]; // Used to go back to the no filter condition

            var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

            //alphabet.push('');

            initials = initials.concat(alphabet);

            //console.debug(initials);

            $scope.Initials = initials;
            $scope.currentInitial = ''; // Every programme is displayed initially

            $scope.OnInitialChanged = function(){
                //console.debug('DBG-89SF Inside OnInitialChanged');
                //$scope.currentType = $scope.currentGroup.Items[0];

/*
                SearchTermhelper.load_search_terms($scope.currentType, 'video').then(function(search_terms) {
                        $scope.search_terms = search_terms.list;
                        //$scope.programme_loaded = true;
                        //$scope.loaded_programme_nid = nid;
                        //$scope.section_to_show = 'summary';
                        //$scope.show_infopanel = true;

                        console.debug('DBG-1LAG ');
                        console.debug(search_terms.list);
                        $scope.currentSearchTerm = search_terms[0];

                        //$location.path('/en/video/opera/' + no_symbols_display_title + '-' + nid);

                    },
                    function(reason) {
                        console.error('W3E??? search term  not loaded. Reason: ' + reason);
                        //Clientexceptionhelper.send_client_exception('W3E??? fixme Programme not loaded. Reason: ' + reason);
                        // @todo What do we say to the user?
                        alert('Error in connecting to the server. Please, check your internet connection.');
                    }
                );
                */

            }

            $scope.ChangeInitial = function(Initial) {

                $scope.currentInitial = Initial;

                $scope.OnInitialChanged();

            }


            console.info('begin shopviewctrl');
            console.info($location.absUrl());
            //console.info('after loc');

            // These definitions may seem strange but they are needed because
            // the child controller LoginFormCtrl wouldn't be able to
            // set user.uid and the others if they were individual variables
            // instead of members of an object

            var logged_in_info = Userhelper.logged_in_user_info();

            $scope.user = { uid: logged_in_info.uid,
                name: logged_in_info.name,
                language: logged_in_info.language };

            $scope.loginpanelinfo = { show: false };

            console.debug($scope.user);

            //console.debug('DBG-8NBG $routeParams');
            //console.info($routeParams);
            //console.info($routeParams.genre);
            //console.info($routeParams.programme);

            /*
            $scope.buy_track = function(programme, track) {
                console.debug('DBG-7SDD buy track ');

                console.debug(programme);
                console.debug(programme.system_title);

                console.debug(track);
                console.debug(track.segment_no);
                console.debug(track.track_no);

                var info_about_current_shopping_order = Orderhelper.info_about_current_shopping_order();

                if (info_about_current_shopping_order.shopping_order_id != 0 &&
                    info_about_current_shopping_order.status != 'cart')
                    Orderhelper.put_order_back_in_cart_status();

                LineItemhelper.add_programme_or_track_to_the_cart(programme, track, false);

            }*/


}]); // end of controller ShopViewCtrl
