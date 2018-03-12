/**
 * @ngdoc overview
 *
 * @name MusicTheatreApp
 *
 * @description  Here the application is defined with its dependencies
 *
 * Here you find:
 *
 * * Dependencies
 * * Routes to views
 * * Declarations of modules that span many files (you can't put these declarations in
 * one of the modules)
 * * Default exception handlers
 * * Javascript functions used to access angular from external javascript functions
 * * Functions called by the tagring
 * * Application-wide settings
 * * Callback used by the iframes doing logins and logouts
 */

'use strict';

// Declare app level module which depends on filters, and services

angular.module('MusicTheatreApp', [
    'ngRoute',
    'ngAnimate',
    'ngSanitize',
    'base64',
    'angularMoment',
    'MusicTheatreApp.controllers',
    'MusicTheatreApp.filters',
    'ngdefaultexceptionhandler',
    'clientexceptionhelperServices',
    'clientexceptionServices',
    'messagehelperServices',
    'messageServices',
    'programmehelperServices',
    'programmeServices',
    'commenthelperServices',
    'commentServices',
    'commentvalueServices',
    'reviewhelperServices',
    'reviewServices',
    'votehelperServices',
    'voteServices',
    'votevalueServices',
    'votesaggregatehelperServices',
    'votesaggregateServices',
    'reviewvalueServices',
    'programmecacheServices',
    'urlskithelperServices',
    'urlskitServices',
    'permalinkhelperServices',
    'downloadableurlhelperServices',
    'downloadableurlServices',
    'userhelperServices',
    'userServices',
    'uservalueServices',
    'videoplayerhelperServices',
    'tagringhelperServices',
    'orderServices',
    'orderhelperServices',
    'ordervalueServices',
    'lineitemServices',
    'lineitemhelperServices',
    'customerprofileServices',
    'customerprofilehelperServices',
    'customerprofilevalueServices',
    'paymenttransactionServices',
    'paymenttransactionhelperServices',
    'paymenttransactionvalueServices',
    'producthelperServices',
    'searchtermhelperServices',
    'searchtermServices',
    'searchtermcacheServices',
    'geoinfohelperServices',
    'tagviewstatusvalueServices',
    'flagginghelperServices',
    'flaggingServices',
    'grouphelperServices',
    'groupServices',
    'groupvalueServices',
    'postServices',
    'posthelperServices',
    'postvalueServices',
    'dialoghelperServices',
    'ngDialog',
    'ngLoadScriptDir',
    'ngPasswordStrengthDir',
    'ngPostDir',
    'ngReviewDir',
    'ngGroupDir',
    'ngImgCrop',
    'uppercaseDir',
    'settingsServices'
]).
    config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

        console.info('@MusicTheatreApp::config');
        console.info('   Configuring Angular routes...');

        // @todo titles are not working now, we have to fix them
        // or maybe we set them in controllers
        // Or maybe we use this solution:
        // http://sbzhouhao.net/2014/08/07/AngularJS-Change-Page-Title-Based-on-Routers-Dynamically/

        $routeProvider.when('/',
            {
                templateUrl: '/partials/tagview.html',
                controller: 'TagViewCtrl',
                title: 'MusicTheatre'
            });

        $routeProvider.when('/en/:tagringcontenttype',
            {
                templateUrl: '/partials/tagview.html',
                controller: 'TagViewCtrl',
                title: 'MusicTheatre - :tagringcontenttype'
            });

        $routeProvider.when('/en/:tagringcontenttype/:nid',
            {
                templateUrl: '/partials/tagview.html',
                controller: 'TagViewCtrl',
                title: 'MusicTheatre'
            });

        $routeProvider.when('/en/:tagringcontenttype/:nid/:programme',
            {
                templateUrl: '/partials/tagview.html',
                controller: 'TagViewCtrl',
                title: 'MusicTheatre - :programme'
            });

        // @todo is this route used?
        $routeProvider.when('/en/:tagringcontenttype/:nid/:programme/review/:review_id',
            {
                templateUrl: '/partials/tagview.html',
                controller: 'TagViewCtrl',
                title: 'MusicTheatre - :programme'
            });

        $routeProvider.when('/profile/en/:uid',
            {
                templateUrl: '/partials/userprofileview.html',
                controller: 'UserViewCtrl',
                title: 'MusicTheatre - User profile - :uid'
            });

        $routeProvider.when('/profile/en/:uid/:realname',
            {
                templateUrl: '/partials/userprofileview.html',
                controller: 'UserViewCtrl',
                title: 'MusicTheatre - User profile - :uid - :realname'
            });

        // @todo fix this frontends/angular/app/partials/socialview.html

        $routeProvider.when('/social/en',
            {
                templateUrl: '/partials/socialview.html',
                controller: 'SocialViewCtrl',
                title: 'MusicTheatre - Social'
            });

        $routeProvider.when('/social/en/:socialfunction',
            {
                templateUrl: '/partials/socialview.html',
                controller: 'SocialViewCtrl',
                title: 'MusicTheatre - Social - :socialfunction'
            });

        $routeProvider.when('/social/en/groups/:section',
            {
                templateUrl: '/partials/socialview.html',
                controller: 'SocialViewCtrl',
                title: 'MusicTheatre - Social - Groups - :section'
            });

        $routeProvider.when('/social/en/groups/:item/:id',
            {
                templateUrl: '/partials/socialview.html',
                controller: 'SocialViewCtrl',
                title: 'MusicTheatre - Social - Groups :item/:id'
            });

        $routeProvider.otherwise({redirectTo: '/'});

        // This is required to be able to change url and use the browser's back button
        // (HTML5 history api)
        $locationProvider.html5Mode(true);

    }])
    .run(['$location', '$rootScope', '$routeParams', function($location, $rootScope, $routeParams) {
        $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {

            //console.debug('@run');

            var title_from_route = current.$$route.title;

            for (var parameter_name in $routeParams) {
                //console.debug('   parameter_name:' + parameter_name);
                //console.debug('   value: ' + $routeParams[parameter_name]);

                // @todo we may want to treat the special case of the parameter tagringcontenttype
                // in a different way to avoid showing just 'v' for 'video'
                // 'video' would be nicer than 'v'

                title_from_route = title_from_route.replace(':' + parameter_name, $routeParams[parameter_name]);

            }

            $rootScope.title = title_from_route;
            //console.debug($routeParams);
        });
    }]);

/**
 * There is one module only for all controllers and one only for all filters.
 * But there are many controllers each in its own file. The same for filters.
 * For this reason the two modules 'MusicTheatreApp.controllers' and
 * 'MusicTheatreApp.filters' are defined here.
 */
angular.module('MusicTheatreApp.controllers', []);
angular.module('MusicTheatreApp.filters', []);

/**
 * This function is used by external javascript function for them to be able to call
 * angular functions defined in the Tag View controller (TagViewCtrl.js)
 *
 * See below the functions onInfoClick, onPlayPreviewClick and onPlayMovieClick
 *
 * @returns {*} Handler of the angular scope for the view #tagview
 */
function appscope_tagview() {

    //console.debug('Got in appscope_tagview');

    return angular.element(document.querySelector('#tagview')).scope();
}

/**
 * This function is used by external javascript function for them to be able to call
 * angular functions defined in the Login Form controller (LoginFormCtrl.js)
 *
 * See below the function iframeCallback
 *
 * @returns {*} Handler of the angular scope for the form #loginform
 */
function appscope_loginform() {

    //console.debug('Got in appscope_tagview');

    return angular.element(document.querySelector('#loginform')).scope();
}

/**
 * These functions are called by the tagring when the user presses the buttons 'Preview', 'Info', 'Movie'.
 * They pass the name of the event and the node id of the current programme to the function event_from_tagring
 * defined above.
 *
 * @param nid Node id of the current programme
 */
function onInfoClick(nid) {
    console.info('Tagring event: onInfoClick nid: ' + nid);
    appscope_tagview().event_from_tagring('onInfoClick', nid);
}

function onPlayPreviewClick(nid) {
    console.info('Tagring event: onPlayPreviewClick nid: ' + nid);
    appscope_tagview().event_from_tagring('onPlayPreviewClick', nid);
}

function onPlayMovieClick(nid) {
    console.info('Tagring event: onPlayMovieClick nid: ' + nid);
    appscope_tagview().event_from_tagring('onPlayMovieClick', nid);
}

/**
 * This small module called 'ngdefaultexceptionhandler' contains the default angular
 * exception handler.
 *
 * This module can't use Clientexceptionhelper because there would
 * be a circular dependency. This means that we can't send to Drupal the
 * exceptions that are caught by this handler.
 *
 * Dialoghelper can't be used either, again for dependencies problems.
 *
 * @attention We may want not to show exceptions using this handler.
 * It's better if we use try-catch structures and use a pretty exception handler
 * that sends the exceptions to Drupal
 */
var ngdefaultexceptionhandler = angular.module('ngdefaultexceptionhandler', [  ]);

ngdefaultexceptionhandler.factory('$exceptionHandler',
    function () {
        return function (exception, cause) {

            alert('Error encountered!\n' +
                  'The error has been caught by the handler ngdefaultexceptionhandler in app.js.\n\n' +
                  'Message: ' + exception.message +
                  '\nCause: ' + cause +
                  '\nFilename: ' + exception.fileName +
                  '\nLine number: ' + exception.lineNumber +
                  '\nPlease reload the page.');

            console.error('ngdefaultexceptionhandler message: ' + exception.message);
            console.error('ngdefaultexceptionhandler filename: ' + exception.fileName);
            console.error('ngdefaultexceptionhandler linenumber: ' + exception.lineNumber);
            console.error('ngdefaultexceptionhandler cause: ' + cause);
        };
});

/**
 * This error handler is used by javascript when angular is not loaded and the handler above
 * can't be used.
 *
 * It's a last resort handler. We can't send the error to Drupal from here.
 *
 * @attention We may want to show a better message and maybe ask the user to send us an email
 *
 * @param desc Error description
 * @param page Page where the error occurred
 * @param line Code line number
 * @param chr Character number
 * @returns {boolean} True if the error has been successfully handled
 */
function defaultJsExceptionHandler(desc, page, line, chr)  {

    alert('An error occurred!\n' +
          'The error has been caught by the function defaultJsExceptionHandler in app.js.\n\n' +
          'Error description: ' + desc +
          '\nPage address: ' + page +
          '\nLine number: ' + line +
          '\nChr: ' + chr +
          '\nPlease reload the page.');

    console.error('defaultJsExceptionHandler Error message: ' + desc);
    console.error('defaultJsExceptionHandler Page address: ' + page);
    console.error('defaultJsExceptionHandler Line number: ' + line);
    console.error('defaultJsExceptionHandler Chr: ' + chr);

    return false;
}

window.onerror = defaultJsExceptionHandler;
//throw new Error("emanuele was here 525 6yhn7ujm outside");

/**
 * This is an Angular constant service. It stores some settings we want to use in the application.
 */
var settingsServices = angular.module('settingsServices', [ ]);

/**
 * Here there are the settings we use in the application
 *
 * * regex_for_text_validation is the regular expression we use to validate texts
 * * default_date_time_format is our default format for dates when there is the time too
 * * default_date_format is our default format for dates when there is no time
 * * non_shopping_order_statuses is the list of order statuses that correspond to non-shopping orders,
 * which are orders that have been completed by the user and that are waiting to be processed.
 * This list of statuses has to correspond to Commerce module definitions.
 * * refresh_interval_for_comments_in_seconds is the refreshing period for comments. We use it
 * to periodically refresh comments to include the newest ones created by other users
 *
 * Let's explain regex_for_text_validation
 *
 * Any text field using that regular expression for validation will be marked as invalid if
 * it contains: . _ ~ : / ? # [ ] @ ! $ & ' ( ) * + , ; =
 * Whitespace characters like tab, carriage return, new line, form feed are invalid.
 * Spaces are allowed.
 *
 * No longer used:
 * regex_for_email_and_username_validation: /^[a-z0-9_.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i,
 *
 */
settingsServices.constant('Settings',
    { regex_for_text_validation: /^(\ |[^\s\._~:\/\?#\{\}\[\]@!\$&\'\(\)\*\+,;=])*$/,
      default_date_time_format: 'd MMMM yyyy hh:mm a',
      default_date_format: 'd MMMM yyyy',
      default_short_date_format: 'yyyy',
      non_shopping_order_statuses: [ 'pending', 'processing', 'complete' ],
      refresh_interval_for_comments_in_seconds: 60 }
);

/**
 * The iframe we use to log in and log out calls this function to tell Angular that a login or a logout have
 * been performed.
 *
 * We call the functions login() in LoginFormCtrl.js for it to fetch the user details of the logged-in user.
 *
 * This in case of login.
 *
 * In case of logout we call the function logout() in LoginFormCtrl.js that will forget
 * the logged-in user details.
 *
 * The login/logout iframe is in /includes/header.html
 *
 * The drupal template backend/sites/default/themes/hybridauththeme/page--callback4login.tpl.php
 * calls this function when the login or logout have been performed
 *
 * @param {int} userid_of_logged_in_user The user id of the logged-in user or zero after a logout
 */
function iframeCallback(userid_of_logged_in_user) {

    // If a login is unsuccessful,
    // this function is not called because the destination page callback4login is not loaded
    // But, in such a case, we have nothing to do on the Angular side. The user has to click 'login' again

    console.info('@iframeCallback');
    console.info('   userid_of_logged_in_user: ' + userid_of_logged_in_user);

    // @todo I don't think this is still actual

    if (userid_of_logged_in_user != 0)
        appscope_loginform().login();
    else
        appscope_loginform().close_login_panel();

    //else
    //    appscope_loginform().logout();
}