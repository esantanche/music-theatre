/**
 * @ngdoc overview
 * @name PaymentTransaction
 * @description Standard resource that calls the `musth_restws_payment_transaction` rest api
 * @see musth_restws.paymenttransaction.ctrl.inc
 */

var paymenttransactionServices = angular.module('paymenttransactionServices', ['ngResource']);

/**
 * @ngdoc service
 * @name PaymentTransaction.service:PaymentTransaction
 * @description Query, create, update are called for a payment transaction
 */
paymenttransactionServices.factory('PaymentTransaction', ['$resource',
    function($resource) {

        return $resource('/musth_restws_payment_transaction', {}, {
            // Never used yet
            //query: { method: 'GET',
            //         url: 'http://musictheatre-production/musth_restws_payment_transaction?transaction_id=:transaction_id',
            //         isArray: false,
            //         withCredentials: false,
            //         responseType: 'json' },
            /**
             * @ngdoc method
             * @name create
             * @methodOf PaymentTransaction.service:PaymentTransaction
             * @description Create method used to create a 'pending' transaction
             * To create a new transaction we need the order id, the amount and the currency code
             * @returns {int} Id of the new transaction
             */
            create: { method: 'POST',
                url: '/musth_restws_payment_transaction',
                isArray: false,
                withCredentials: false,
                responseType: 'json' }
            // Never used yet
            //update: { method: 'PUT',
            //    url: 'http://musictheatre-production/musth_restws_payment_transaction/:transaction_id',
            //    isArray: true,
            //    withCredentials: false,
            //    responseType: 'text' } // the update method return http status code only
        });

    }]);
