/**
 * @ngdoc overview
 * @name Product
 * @description Standard resource that calls the `musth_restws_product` rest api
 * @see musth_restws.product.ctrl.inc
 */

var productServices = angular.module('productServices', ['ngResource']);

/**
 * @ngdoc service
 * @name Product.service:Product
 * @description We retrieve commerce products here
 */
productServices.factory('Product', ['$resource',
    function($resource) {

        return $resource('/musth_restws_product?sku=:sku', {}, {
            /**
             * @ngdoc method
             * @name query
             * @methodOf Product.service:Product
             * @description Query method used to fetch one or many products given the sku.
             * If the sku is fully given, one product only will be returned. If the sku is given
             * partially, many products are likely to be returned
             * @param {string} sku The sku of the product to be returned or part of it if many
             * products are wanted.
             * @returns {object} List of products. It will always be a list even if there is only one product
             * in it.
             */
            query: { method: 'GET',
                     params: { sku: '' },
                     isArray: false,
                     withCredentials: false,
                     responseType: 'json' }
        });

    }]);
