/**
 * @ngdoc overview
 * @name PaymentTransactionhelper
 * @description Service that helps with creating payment transaction
 * @todo it's a work in progress whilst we wait for the payment gateway to be defined
 */

var paymenttransactionhelperServices = angular.module('paymenttransactionhelperServices',
    ['paymenttransactionServices', 'paymenttransactionvalueServices']);

// @todo aren't we missing clientexception?

/**
 * @ngdoc service
 * @name PaymentTransactionhelper.service:PaymentTransactionhelper
 * @description First thing, here we create a payment transaction, which is automatically created
 * as 'pending' by the server.
 * @todo this is a work in progress, we will have to do more, like updating the transaction
 * @requires PaymentTransaction.service:PaymentTransaction
 * @requires PaymentTransactionhelper.service:Paymenttransactionvalue
 */
paymenttransactionhelperServices.service('PaymentTransactionhelper', [ '$q', 'PaymentTransaction',
    'Paymenttransactionvalue', 'Clientexceptionhelper',
    function($q, PaymentTransaction, Paymenttransactionvalue, Clientexceptionhelper) {

        console.debug('DBG-pths8182 paymenttransactionhelperServices');

        /**
         * @ngdoc method
         * @name create_transaction
         * @description We create a transaction associated to a given order and for a given
         * amount. The currency has to be specified even if, for now, only GBP is allowed.
         * @methodOf PaymentTransactionhelper.service:PaymentTransactionhelper
         * @param {int} order_id Id of the order the transaction has to be associated to
         * @param {int} amount Transaction amount in pence (or cents).
         * @param {string} currency_code Three letters currency code (for now only GBP)
         * @returns {promise} This method returns the id of the new transaction.
         * The method returns a promise, actually, whose payload will be that id.
         */
        this.create_transaction = function(order_id, amount, currency_code) {
            var deferred = $q.defer();

            console.debug('DBG-ct8192 create_transaction ' + order_id + '/' + amount + '/' + currency_code);

            // What we need to create a transaction:
            // order_id: needed
            // amount: needed
            // currency_code: needed

            PaymentTransaction.create({ order_id: order_id, amount: amount, currency_code: currency_code },
                function(payment_transaction_id_response) {

                    if (payment_transaction_id_response) {

                        console.debug('DBG-ct9182 payment_transaction_id_response.id = ' +
                            payment_transaction_id_response.id);

                        // Saving the id of the new transaction for future use

                        Paymenttransactionvalue.transaction_id = payment_transaction_id_response.id;

                        //console.debug(Paymenttransactionvalue);

                        // Returning the id of the new transaction
                        deferred.resolve(payment_transaction_id_response.id);

                    } else {

                        console.error('W3E131 Empty response when creating a payment transaction');
                        Clientexceptionhelper.send_client_exception('W3E131 Empty response when creating a payment transaction');
                        deferred.reject('Empty response when creating a payment transaction');

                    }

                },
                function(err) {

                    console.error('W3E132 Error when creating a payment transaction. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E132 Error when creating a payment transaction. Reason: ' +
                        err.status);
                    deferred.reject('Error when creating a payment transaction. Status code: ' + err.status);

                }

            );

            return deferred.promise;
        };

    }]);

/**
 * @ngdoc service
 * @name PaymentTransactionhelper.service:Paymenttransactionvalue
 * @description This is an Angular value service. It's similar to a cache.
 * It stores the information about the payment transaction we created using the method
 * create_transaction.
 * It stores the id of the transaction and the payload. We need the id to update the transaction
 * and maybe we need the payload.
 * Only the PaymentTransactionhelper service should use this service.
 * @todo this is work in progress, we are waiting for the payment gateway to be defined
 */
var paymenttransactionvalueServices = angular.module('paymenttransactionvalueServices', [ ]);

paymenttransactionvalueServices.value('Paymenttransactionvalue', { transaction_id: 0, payload: '' });
