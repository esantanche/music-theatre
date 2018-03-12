/**
 * @ngdoc overview
 * @name Producthelper
 * @description Service that helps with loading Commerce products
 * Everything that has to be done with products should be done by using this service
 * We don't cache products because we might end up with old prices
 */

var producthelperServices = angular.module('producthelperServices', ['productServices']);

/**
 * @ngdoc service
 * @name Producthelper.service:Producthelper
 * @description First thing, here we load products. Other functions related to
 * products may come
 * @requires Product.service:Product
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
producthelperServices.service('Producthelper', [ '$q',
    'Product', 'Clientexceptionhelper',
    function($q, Product, Clientexceptionhelper) {

        /**
         * @ngdoc method
         * @name load_products_and_key_them_by_tid
         * @description fixme @todo We load the product(s) whose sku is given.
         * If a partial sku is given, many products will be returned.
         * If the sku is a full one, there will be only one product with that sku
         *
         * @attention This function works well if there is one and one only product for each track.
         * It will have to be revised when there will be many products for each track
         *
         * @todo fix this documentation because I guess I'm going to fetch all products for a track, not one only
         *
         * @methodOf Producthelper.service:Producthelper
         * @param {string} sku Sku of the product or partial sku if many products are wanted
         * @returns {promise} This method returns a list of products.
         * The method returns a promise, actually, whose payload will be that list.
         * See Angular promise/deferred implementation ($q service)
         */
        this.load_products_and_key_them_by_tid = function(sku) {
            var deferred = $q.defer();

            //console.debug('DBG-9IJS load_products_and_key_them_by_tid sku: ' + sku);

            // The products we get come sorted by sku. The REST api cares about
            // this sorting
            // We need to have the products sorted because the function load_all_products_for_a_programme
            // in the controller TagViewCtrl assumes them sorted

            Product.get({ sku: sku },
                function(products) {

                    if (products) {

                        //
                        // @todo Even if we asked for a single product, we get a list

                        //<price_amount>331</price_amount>
                        //    <price_currency>GBP</price_currency>
                        //    <sku>V10330100-S-e02d</sku>
                        //    <tid>837</tid>
                        //    <title>Verdi's Nabucco at Piacenza - Nabucco (25) seg 1 track 0</title>

                        var products_by_tid = {};

                        if (typeof(products.list) != 'undefined') {

                            //products_by_tid[products.list[product_iter].tid] = [];

                            // @todo fix documentation, we have an array of prices even if there is only one of the for
                            // a given track

                            for (var product_iter = 0;
                                 product_iter < products.list.length;
                                 product_iter++) {

                                if (typeof(products_by_tid[products.list[product_iter].tid]) == "undefined")
                                    products_by_tid[products.list[product_iter].tid] = [];

                                products_by_tid[products.list[product_iter].tid].push(products.list[product_iter]);

                            }

                        }

                        // Return the list (keyed by tid)
                        deferred.resolve(products_by_tid);

                    } else {

                        console.error('W3E143 Empty response when getting products');
                        Clientexceptionhelper.send_client_exception('W3E143 Empty response when getting products');
                        deferred.reject('Empty response when getting products');

                    }

                },
                function(err) {

                    console.error('W3E144 Error in querying products. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E144 Error in querying products. Reason: ' + err.status);
                    deferred.reject('Error in querying products. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

    }]);
