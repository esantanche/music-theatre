/**
 * @ngdoc overview
 * @name LineItem
 * @description Standard resource that calls the `musth_restws_line_item` rest api
 * @see musth_restws.lineitem.ctrl.inc
 */

var lineitemServices = angular.module('lineitemServices', ['ngResource']);

/**
 * @ngdoc service
 * @name LineItem.service:LineItem
 * @description Query, create, update and delete are called for a line item, or many
 */
lineitemServices.factory('LineItem', ['$resource',
    function($resource){

        return $resource('/musth_restws_line_item', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf LineItem.service:LineItem
             * @description Query method used to fetch a line item given the id, or to fetch all line items
             * for an order
             * @param {int} line_item_id Id of the line item to fetch
             * @param {int} order_id Id of the order whose line items we want to fetch
             * @returns {object} line item(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_line_item?line_item_id=:line_item_id&order_id=:order_id',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf LineItem.service:LineItem
             * @description Create method used to create a single line item
             * @param {object} Parameters The parameters used to create the line item are passed at call time
             * and are sent in the body of the POST message
             * @returns {int} Id of the new line item
             */
            create: { method: 'POST',
                      url: '/musth_restws_line_item',
                      isArray: false,
                      withCredentials: false,
                      responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf LineItem.service:LineItem
             * @description Not currently used
             * @param {int} line_item_id Id of the line item to update
             * @param {object} Parameters The parameters used to update the line item are passed at call time
             * and are sent in the body of the PUT message
             * @returns {object} FIXME
             */
            //update: { method: 'PUT',
            //          // the line item id is got from the post message body (@line_item_id)
            //          url: 'http://musictheatre-production/musth_restws_line_item/@line_item_id',
            //          isArray: true,
            //          withCredentials: false,
            //          responseType: 'text' }, // the update method return http status code only
            /**
             * @ngdoc method
             * @name delete
             * @methodOf LineItem.service:LineItem
             * @description Delete method used to delete a single line item
             * @param {int} line_item_id Id of the line item to delete
             */
            delete: { method: 'DELETE',
                      url: '/musth_restws_line_item/:line_item_id',
                      isArray: true,
                      withCredentials: false,
                      responseType: 'text' } // the delete method returns http status code only
        });

    }]);
