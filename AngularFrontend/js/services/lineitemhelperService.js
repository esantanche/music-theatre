/**
 * @ngdoc overview
 * @name LineItemhelper
 * @description Service that helps with creating line items, loading them, deleting them,
 * finding the SKU of a product, which we need to create a line item, and adding products
 * to the cart.
 */

var lineitemhelperServices = angular.module('lineitemhelperServices', ['lineitemServices']);

/**
 * @ngdoc service
 * @name LineItemhelper.service:LineItemhelper
 * @description Helper service for line items
 * @requires LineItem.service:LineItem
 * @requires Orderhelper.service:Orderhelper
 *
 * @todo maybe we have to refactor LineItemhelper to Lineitemhelper
 */
lineitemhelperServices.service('LineItemhelper', [ '$q', 'LineItem', 'Orderhelper', 'Clientexceptionhelper',
    function($q, LineItem, Orderhelper, Clientexceptionhelper) {

        // We have to use this variable to refer to the service itself when
        // we are inside the callback part of a REST api call
        // In that case 'this' wouldn't work whilst 'self' does
        var self = this;

        //console.debug('DBG-9N9N lineitemhelperServices');

        /**
         * @ngdoc method
         * @name load_line_items
         * @description This method loads the line items that belong to a given order
         * @methodOf LineItemhelper.service:LineItemhelper
         * @param {int} order_id The order id of the order whose line items we have to return
         * @returns {promise} The returned object is an array of line item objects.
         * The method returns a promise, actually, whose payload will be that list.
         */
        this.load_line_items = function(order_id) {
            var deferred = $q.defer();

            console.debug('DBG-97H1 load_line_items order id: ' + order_id);

            // We call the method 'query' of the service LineItem, which performs
            // the actual REST api call
            LineItem.query({ order_id: order_id },
                function(line_items) {

                    if (line_items) {

                        console.debug('DBG-97H1 load_line_items line_items not empty order id: ' + order_id);
                        console.debug(line_items);

                        // If the line items response object is not empty, we return
                        // it as it is. Precisely we return the list of line items,
                        // which may be empty
                        deferred.resolve(line_items.list);

                    } else {

                        // In this case the response is empty and there isn't even an empty list
                        // of line items in it, it would be something

                        console.error('W3E111 Empty response when loading the line items of an order');
                        Clientexceptionhelper.send_client_exception('W3E111 Empty response when loading the line items of an order');
                        deferred.reject('Empty response when loading the line items of an order');
                    }

                },
                function(err) {

                    console.error('W3E112 Error when loading the line items of an order. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E112 Error when loading the line items of an order. Reason: ' + err.status);
                    deferred.reject('Error when loading the line items of an order. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        };

        /**
         * @ngdoc method
         * @name create_line_item
         * @methodOf LineItemhelper.service:LineItemhelper
         * @description Here we create a line item attached to an order
         * @param {int} order_id The id of the order to which the line item will be attached
         * @param {string} sku The SKU of the product the line item is about
         * @param {int} quantity Quantity (It's generally 1)
         * @returns {promise} The returned object is the id of the newly created line item.
         * The method returns a promise, actually, whose payload will be that id.
         */
        this.create_line_item = function(order_id, sku, quantity) {
            var deferred = $q.defer();

            // What do we need to create a line item?
            // order_id (if no order id is given, the cart for the logged in user is fetched)
            // line_item_label (SKU)
            // quantity (defaults to 1)
            // product_id (in alternative to the SKU)

            // The service LineItem will make the REST api call

            LineItem.create({ order_id: order_id, line_item_label: sku, quantity: quantity },
                function(line_item_creation_object) {

                    if (line_item_creation_object) {

                        // Returning the id of the new line item
                        deferred.resolve(line_item_creation_object.id);

                    } else {

                        console.error('W3E113 Empty response when creating a line item');
                        Clientexceptionhelper.send_client_exception('W3E113 Empty response when creating a line item');
                        deferred.reject('Empty response when creating a line item');

                    }

                },
                function(err) {

                    console.error('W3E114 Error when creating a line item. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E114 Error when creating a line item. Reason: ' + err.status);
                    deferred.reject('Error when creating a line item. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @name build_the_sku
         * @methodOf LineItemhelper.service:LineItemhelper
         * @description To create a line item that refers to a product,
         * we need the SKU of the product. This function returns the SKU given
         * the programme or the track the user wants to buy.
         * The programme has always to be provided because it contains information
         * we need even if the user wants to buy a single track.
         * The track has to be provided only if the user wants to buy it
         * @param {object} programme The programme object
         * @param {object} track The track, if the user wants to buy a single track
         * @param {bool} for_shipping True if the programme has to be delivered as physical DVD
         * @returns {string} sku of the product we will create a line item about
         */
        this.build_the_sku = function(programme, track, for_shipping) {

            var programme_system_title = programme.system_title;

            // The first character of the system title is 'V' for video programmes
            // and 'A' for audio programmes
            // Only the latter can be shipped for now, that's why we need to know
            // if it's a video or an audio programme
            var programme_media_type = programme_system_title[0];

            var sku = '';

            if (track) {
                // We are building the sku for a track

                sku = programme_system_title.substring(0, 5) +
                    String("00" + track.segment_no).slice(-2) +
                    String("00" + track.track_no).slice(-2);

            } else {
                // We are building the sku for the entire programme

                sku = programme_system_title.substring(0, 9);
            }

            if (programme_media_type == 'V') {
                // Video programmes can only be streamed, not shipped, and the license lasts for
                // two days

                sku += '-S-e02d';

            } else {
                // Audio programmes can be shipped or downloaded

                if (for_shipping) {

                    // This is a safety check
                    if (track) {

                        console.error('Cant ship a track! (build_the_sku)');
                        Clientexceptionhelper.send_client_exception('W3E115 Cant ship a track');

                        return '';
                    }

                    // P=Physical (shipping)

                    sku += '-P';

                } else {

                    // D=Download

                    sku += '-D';

                }

            }

            return sku;
        }

        /**
         * @ngdoc method
         * @name add_programme_or_track_to_the_cart
         * @methodOf LineItemhelper.service:LineItemhelper
         * @description Given a programme and an optional track, we create a line item
         * attached to the current cart order.
         * If the track is given, the line item is about buying that track. If it is not,
         * the line item is about buying the programme.
         * The programme is always needed because we need the information in it when
         * a track is bought as well.
         * We create a sku here and than we use the function add_product_by_sku_to_the_cart
         * @param {object} programme The programme to buy if the track is not given
         * @param {object} track The track to buy
         * @param {boolean} for_shipping If the product is bought for shipping or for downloading
         * @returns {boolean} False on error
         */
        this.add_programme_or_track_to_the_cart = function(programme, track, for_shipping) {

            // To add a line item to our cart order and buy a product we need an SKU

            var sku = this.build_the_sku(programme, track, for_shipping);

            console.debug('DBG-87uhygyttt add_programme_or_track_to_the_cart sku: ' + sku);

            this.add_product_by_sku_to_the_cart(sku);

            // Here we return true but something may go wrong in the REST api calls above
            return true;
        };

        /**
         * @ngdoc method
         * @name add_product_by_sku_to_the_cart
         * @description Add a product to the cart given its SKU
         * @methodOf LineItemhelper.service:LineItemhelper
         * @param {string} sku SKU of the product we have to put in the cart
         * @returns {boolean} False on error
         */
        this.add_product_by_sku_to_the_cart = function(sku) {

            //console.debug('DBG-2345 add_product_by_sku_to_the_cart sku: ' + sku);

            // Safety check. sku shouldn't be empty
            // If it is, it means that the function build_the_sku got
            // a problem
            if (!sku) {

                // sku can't be empty, it's a bug

                console.error('W3E116 The SKU cant be empty');
                Clientexceptionhelper.send_client_exception('W3E116 The SKU cant be empty');

                return false;
            }

            // Now we create a cart order if it doesn't exist yet
            // and we add a line item to it

            Orderhelper.get_shopping_order_id_or_create_it().then(
                function(cart_order_id) {

                    //console.debug('DBG-HBHBH get_shopping_order_id_or_create_it');
                    //console.debug(cart_order_id);

                    // The order has been created or we got the id of the existing one if any
                    // We are ready to add the line item to it

                    // So we create a new line item attached to the order whose id is cart_order_id
                    // and specify the SKU sku and the quantity 1

                    self.create_line_item(cart_order_id, sku, 1).then(
                        function(new_line_item_id) {

                            // No check for empty response here because the function
                            // create_line_item has done it already

                            //console.debug('DBG-665TG line_item_creation_object');
                            //console.debug(new_line_item_id);

                        },
                        function(reason) {

                            // Exception handling done by the function create_line_item
                            // @todo Controllers won't know that something went wrong
                            // @todo we may want to add a message or use a deferred implementation in this case too

                        }
                    );

                },
                function(reason) {

                    // Exception handling done by the function get_shopping_order_id_or_create_it
                    // @todo Controllers won't know that something went wrong
                    // @todo we may want to add a message or use a deferred implementation in this case too

                }

            );

            return true;
        };

        /**
         * @ngdoc method
         * @name remove_line_item
         * @methodOf LineItemhelper.service:LineItemhelper
         * @description This method deletes a line item given its id
         * @param {int} line_item_id Id of the line item to delete
         * @returns {promise} If the line item is successfully deleted, the response
         * is just the string 'Line item successfully removed'. Otherwise we throw
         * an exception.
         */
        this.remove_line_item = function(line_item_id) {
            var deferred = $q.defer();

            LineItem.delete({ line_item_id: line_item_id },
                function(response) {

                    // A delete returns nothing if it's successful.
                    // It throws an exception if something went wrong

                    deferred.resolve('Line item successfully removed');
                },
                function(err) {

                    console.error('W3E117 Error when deleting a line item. Reason: ' + err.status);
                    Clientexceptionhelper.send_client_exception('W3E117 Error when deleting a line item. Reason: ' + err.status);
                    deferred.reject('Error when deleting a line item. Status code: ' + err.status);

                }
            );

            return deferred.promise;
        }

    }]);
