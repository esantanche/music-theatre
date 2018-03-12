/**
 * @ngdoc overview
 * @name Order
 * @description Standard resource that calls the `musth_restws_order` rest api
 * @see musth_restws.order.ctrl.inc
 */

var orderServices = angular.module('orderServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Order.service:Order
 * @description Query, create, update are called for an order
 * The query method can be used to query the 'cart' order for the logged in user and
 * all orders for an user
 */
orderServices.factory('Order', ['$resource',
    function($resource){

        return $resource('/musth_restws_order', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Order.service:Order
             * @description Query method used to fetch an order given the id, or to fetch the 'cart'
             * order for the logged in user or to fetch all orders for the logged in user
             * @param {int} order_id Id of the order to fetch
             * @param {string} status If status is 'cart' and there is no order id, the cart order
             * for the logged in user is fetched
             * @returns {object} order(s)
             */
            query: { method: 'GET',
                     url: '/musth_restws_order?order_id=:order_id&status=:status',
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf Order.service:Order
             * @description Create method used to create a 'cart' order
             * No parameters are needed to create an order because its status will be 'cart' and
             * it will be associated to the logged in user or it will be anonymous if no user is
             * logged in
             * @returns {int} Id of the new order
             */
            create: { method: 'POST',
                url: '/musth_restws_order',
                isArray: false,
                withCredentials: false,
                responseType: 'json' },
            /**
             * @ngdoc method
             * @name update
             * @methodOf Order.service:Order
             * @description method used to update an existing order
             * @param {int} order_id Id of the order to update
             * @param {object} Parameters The parameters used to update the order are passed at call time
             * and are sent in the body of the PUT message.
             * We use the parameters 'status', the status we want the order to move to,
             * 'mail', the email address of the user, and 'customer_profile_id',
             * the id of the user's customer profile.
             */
            update: { method: 'PUT',
                // the order id is got from the post message body (@order_id)
                url: '/musth_restws_order/:order_id',
                isArray: true,
                withCredentials: false,
                responseType: 'text' } // the update method return http status code only
        });

    }]);
