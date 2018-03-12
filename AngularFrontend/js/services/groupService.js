/**
 * @ngdoc overview
 * @name Group
 * @description Standard resource that calls the `musth_restws_group` rest api
 * @see musth_restws.group.ctrl.inc
 */

var groupServices = angular.module('groupServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Group.service:Group
 * @description Query, create, update and delete are called for a group, or many
 */
groupServices.factory('Group', ['$resource',
    function($resource){

        return $resource('/musth_restws_group', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Group.service:Group
             * @description Query method used to fetch groups given their title, or part of it.
             * It's also possible to get a single group by giving its id and all existing groups
             * @param {int} nid Id of the group we want, if we want just one of them
             * @param {string} title Title of the wanted group, or part of it to fetch many groups
             * @param {int} page Number of the page to fetch
             * @returns {object} group(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_group?nid=:nid&title=:title&page=:page',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Group.service:Group
             * @description Create method used to create a group
             * @param {object} Parameters The parameters used to create a group are passed at call time
             * and are sent in the body of the POST message. They are the uid of the group creator and the title
             * and description of the new group. The group creator has to be the same as the logged-in user.
             * @returns {int} Id of the new group
             */
            create: { method: 'POST',
                      url: '/musth_restws_group',
                      isArray: false,
                      withCredentials: false,
                      responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf Group.service:Group
             * @description Update method used to update a group
             * @param {int} nid Id of the group to update
             * @param {object} Parameters The parameters used to update the group are passed at call time
             * and are sent in the body of the PUT message. They are title and description.
             */
            update: { method: 'PUT',
                      // the group id is got from the post message body (@id)
                      url: '/musth_restws_group/:nid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' }, // An update method return http status code only
            /**
             * @ngdoc method
             * @name delete
             * @methodOf Group.service:Group
             * @description Delete method used to delete a single group
             * @param {int} nid Id of the group to delete
             */
            delete: { method: 'DELETE',
                      url: '/musth_restws_group/:nid',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' } // A delete method returns http status code only
        });

    }]);
