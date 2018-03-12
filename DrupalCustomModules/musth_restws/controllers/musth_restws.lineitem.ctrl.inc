<?php
/**
 * @file musth_restws.lineitem.ctrl.inc
 *
 * @brief This file is about the LineItemResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the LineItem resource
 *
 * Here line items are created and associated to an order.
 *
 * Then it's possible to query single line items and also to get all the line items in an order
 *
 * No permission check is done because it's supposed that hackers aren't interested in what people
 * want to buy.
 *
 * We will want to update line items' quantities and to delete line items
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class LineItemResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

//        watchdog('musth_restws', 'W7D001 8CVB LineItemResourceController __construct',
//            array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource LineItem this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource LineItem
     */
    public function propertyInfo() {

        // For line items that refer to a product the user wants to buy, type = 'product'
        // There can be many other types of line items, like coupons, discounts, taxes, shipping costs and so on

        return array(
            'line_item_id' => array(
                'type' => 'int',
                'label' => t('Line item id'),
            ),
            'order_id' => array(
                'type' => 'int',
                'label' => t('Order id'),
            ),
            'type' => array( // see note above
                'type' => 'text',
                'label' => t('Line item bundle'),
            ),
            'line_item_label' => array(
                'type' => 'text',
                'label' => t('Line item label (product sku, etc)'),
            ),
            'product_title' => array(
                'type' => 'text',
                'label' => t('Product title'),
            ),
            'quantity' => array(
                'type' => 'decimal',
                'label' => t('Quantity (10.2)'),
            ),
            'product_id' => array(
                'type' => 'int',
                'label' => t('Product id'),
            ),
            'unit_price_amount' => array( // Price in pence (£12.34 is represented by the integer 1234)
                'type' => 'int',
                'label' => t('Unit price amount'),
            ),
            'unit_price_currency' => array( // 'GBP'
                'type' => 'text',
                'label' => t('Unit price currency'),
            ),
            'total_amount' => array( // Total amount for this line item in pence (£12.34 is represented by the integer 1234)
                'type' => 'int',
                'label' => t('Total amount'),
            ),
            'total_currency' => array( // 'GBP'
                'type' => 'text',
                'label' => t('Total currency'),
            ),
        );
    }

    /**
     * Metadata wrapper for the LineItem resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int LineItem id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $line_item_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_line_item',
            $line_item_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * In our case what is passed is:
     * - line_item_id if what is wanted is a single line item
     * - order_id if what is wanted is all line items for an order
     *
     * Either a line item id or an order id have to be passed.
     *
     * Here no order refresh is done. Before querying the line items of an order using
     * this api, it's good practice to query the order itself because, when you query
     * an order, it is refreshed and its line items are refreshed as well.
     *
     * So, every time you want to query an order:
     * - first query the order using the Order resource apis
     * - then use this resource to query the line items
     *
     * @attention If you edit any line item and then you use this api to load all line items again,
     * you may end up with wrong calculations. This applies to 'cart' orders only because usually line
     * items don't change any more when an order starts its check-out process. But this may not be
     * entirely correct if line items that are about shipping costs or coupons are added later.
     *
     * @attention No security token required here because we don't care if a hacker accesses people
     * orders and line items.
     *
     * @restfulness Yes. User id not used.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the ids of the line items we have to send back to Angular
     */
    public function query($filters = array(), $meta_controls = array()) {

        //        watchdog('musth_restws', 'W7D001 LIQ-1 6TGB line item query <br> filters (!f) <br> user (!u) ',
        //            array('!f' => print_r($filters, true),
        //                  '!u' => print_r('', true)
        //            ), WATCHDOG_DEBUG);

        // Implemented filters:
        // single line item line_item_id=<id>
        // all line items for an order order_id=<id>

        // We don't check if the user owns the order or the line item

        $order_id = 0;
        $line_item_id = 0;

        if (isset($filters['order_id'])) {
            // If we have the order id, we have to send back every line item for that order
            $order_id = $filters['order_id'];
        }

        if (isset($filters['line_item_id'])) {
            // If we have the line item id, we have to send back that line item only
            $line_item_id = $filters['line_item_id'];
        }

        $line_item_ids = array(); // Safety assignment

        if ($line_item_id) {

            // Just checking if the line item exists

            $line_item_as_array = entity_load('commerce_line_item', array($line_item_id));

            if (empty($line_item_as_array)) {

                watchdog('musth_restws', 'W3E060 Please, give the id of an existing line item (!f) ',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Line item not found', 404);
            }

        } elseif ($order_id) {

            // If the order is a 'cart' order, we have to refresh it
            // with current product prices. But we do it in the read api
            // of the order resource
            // @see OrderResourceController::read

            // Fetching all line items for the given order

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'commerce_line_item')
                  ->propertyCondition('order_id', $order_id)
                  ->execute();

            if (isset($result['commerce_line_item'])) {
                $line_item_ids = array_keys($result['commerce_line_item']);

            } else {
                // No line items found for the given order
                // Maybe the order id is wrong or maybe the order is empty, it has
                // no line items
                // Both cases are a bit suspicious

                // Let's watchdog a notice

                watchdog('musth_rules', 'W5N003 No line item found for the given order (!f) ',
                    array('!f' => print_r($filters, true)),
                    WATCHDOG_NOTICE);

                return array();
            }

        } else {
            // No line item id and no order id
            // Angular has to provide either a line item id or an order id

            // @attention Maybe, for logged in users, I want to fetch the 'cart' order tha user has open, if any
            // For now we just throw an exception

            watchdog('musth_restws', 'W3E061 No line item id and no order id provided (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('No line item id and no order id provided', 412);
        }

        //watchdog('musth_restws', 'W7D001 LIQ-2 8XSD line item query <br> (!f) <br> (!m) ',
        //        array('!f' => print_r($line_item_id, true),
        //              '!m' => print_r($line_item_ids, true)
        //        ), WATCHDOG_DEBUG);

        if ($line_item_id)
            return array($line_item_id);
        else
            return $line_item_ids;

    }

    /**
     * To create a line item:
     * * you send a POST http query
     * * no need to authenticate unless you want the api to find the 'cart' order of the authenticated user
     * * send: order_id, line_item_label (this is the product sku), quantity, product_id (in alternative to the sku)
     * * send the fields in json format
     *
     * If no order id is sent, the line item will be attached to the 'cart' order of the logged-in user, if any
     *
     * @attention What if there is already a line item for the given product in the order?
     * For now we leave this check to angular. Later we may want to check here as well
     *
     * @attention We don't check if the order we create a line item for belongs to the logged in user.
     * In general we don't care if hackers get access to orders and line items.
     *
     * @attention What if the order is not in the 'cart' status? For now we don't do this check, we add the line item anyway.
     *
     * @attention Now we deal with line items that are about products. Later we will have to deal with line items that
     * are about discounts, shipping costs and so on
     *
     * @see RestWSResourceControllerInterface::create()
     *
     * @restfulness No. The user id is heavily used but not explicitly given.
     * @param array $values Properties to be used to create the order
     * @throws RestWSException
     * @return bool|int|string Id of the new line item
     */
    public function create(array $values) {

        global $user;

        //throw new RestWSException('Not implemented', 501);

        // Needed values:
        // order_id (if we are not provided an order id, we get the order id of the 'cart' order
        // the logged-in user has, if any
        // line_item_label (this is the product sku)
        // quantity
        // product_id (in alternative to the sku)
        // so, check if you have: order_id, quantity, one of line_item_label or product_id; thrown an error otherwise

        //        watchdog('musth_restws', 'W7D001 0CDF line item create values (!v) ',
        //            array('!v' => print_r($values, true)),
        //            WATCHDOG_DEBUG);

        // Let's get the values we need, first the order id

        if (isset($values['order_id'])) {
            $order_id = $values['order_id'];
        } else {

            // No order id is given. We fetch the 'cart' order for the logged in user

            if ($user->uid) {
                // The user is logged in, let's see if there is a 'cart' order for them

                $query = new EntityFieldQuery();
                $result = $query->entityCondition('entity_type', 'commerce_order')
                    ->entityCondition('bundle', 'commerce_order')
                    ->propertyCondition('status', 'cart')
                    ->propertyCondition('uid', $user->uid)
                    ->execute();

                if (isset($result['commerce_order'])) {
                    $order_ids = array_keys($result['commerce_order']);
                    // There should be one 'cart' order only for a logged in user
                    // We get the first one and ignore the others
                    $order_id = $order_ids[0];
                } else {
                    // No order found?
                    // If there is no 'cart' order for the logged in user,
                    // we have no order id and we can't create the line item

                    watchdog('musth_restws',
                        'W3E062 No order id provided and no cart order found for the logged in user (!v) ',
                        array('!v' => print_r($values, true)),
                        WATCHDOG_ERROR);

                    // Get out of here!
                    throw new RestWSException('No order id provided and no cart order found for the logged in user', 412);
                }

            } else {
                // No order id given and the user is not logged in, let's throw an exception

                watchdog('musth_restws',
                    'W3E063 No order id provided and the user is not logged in (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('No order id provided and user not logged in', 412);
            } // if ($user->uid)

        } // if (isset($values['order_id']))

        // Let's get the values we need, now the product id or sku

        $product_id = 0;
        $product_sku = '';

        if (isset($values['line_item_label'])) {
            // We are provided the SKU
            $product_sku = $values['line_item_label'];
        } else {

            // We are not provided a SKU, let's see if we are provided a product id

            if (isset($values['product_id'])) {
                // yes, we have a product id
                $product_id = $values['product_id'];
            } else {

                // No, we don't have either an SKU or a product id, let's throw an exception
                // We will deal with other types of line items later

                watchdog('musth_restws',
                    'W3E064 No product id and no SKU provided (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('No product id and no SKU provided', 412);
            }
        }

        // Let's get the quantity

        // If quantity is not specified, we default to 1
        if (isset($values['quantity'])) {
            $quantity = $values['quantity'];
        } else {
            $quantity = 1;
        }

        // Now let's check if the order actually exists

        $order_as_array = entity_load('commerce_order', array($order_id));

        if (empty($order_as_array)) {

            // We need a valid order after all

            watchdog('musth_restws', 'W3E065 Please, give the id of an existing order (!v) ',
                array('!v' => print_r($values, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Please, give the id of an existing order', 412);
        } else {
            $order = $order_as_array[$order_id];
        }

        // Now let's check if the product actually exists

        if ($product_id) {

            $product_as_array = entity_load('commerce_product', array($product_id));

            if (empty($product_as_array)) {

                watchdog('musth_restws', 'W3E066 Please, give the id of an existing product (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                throw new RestWSException('Please, give the id of an existing product', 412);
            } else {
                $product = $product_as_array[$product_id];
            }

        } else {
            // Thanks to the checks done above, here we have a valid, or supposed so, product sku

            // We use EntityFieldQuery because the commerce api commerce_product_load_by_sku
            // uses entity_load with conditions, which is deprecated

            // We don't specify a bundle because we are interested only in the basic properties

            $query = new EntityFieldQuery();
            $result = $query->entityCondition('entity_type', 'commerce_product')
                  ->propertyCondition('sku', $product_sku)
                  ->propertyCondition('status', 1) // get the product only if it's active
                  ->execute();

            if (isset($result['commerce_product'])) {
                $product_ids = array_keys($result['commerce_product']);
                // There can be only one product for the given sku
                // If the array $product_ids provides many ids, we get the first one only
                $product_as_array = entity_load('commerce_product', array($product_ids[0]));
                $product = $product_as_array[$product_ids[0]];

            } else {
                // No product found? Throw an exception

                watchdog('musth_restws', 'W3E067 Please, give the sku of an existing product (!v) ',
                    array('!v' => print_r($values, true)),
                    WATCHDOG_ERROR);

                // Get out of here!
                throw new RestWSException('Please, give the sku of an existing product', 412);
            }

        } // if ($product_id)

        // Now we have an order and a product loaded

        //        watchdog('musth_restws', 'W7D001 1PSO line item create values <br/> (!v) <br/> (!o) <br/> (!p) ',
        //            array('!v' => print_r($values, true),
        //                  '!o' => print_r($order, true),
        //                  '!p' => print_r($product, true)),
        //            WATCHDOG_DEBUG);

        // We are going to create the line item

        // Wrapping the order to change its fields later
        $order_wrapper = entity_metadata_wrapper('commerce_order', $order);

        // Line items may have different types. The most important one is 'product' but there
        // are others. For example there may be line items that are about discounts, taxes, etc

        // Create the line item and associate it to the given order
        // Now we deal with 'product' line items only

        $line_item = commerce_line_item_new('product', $order_id);

        // Populating the line item with the product details (unit price, product id and sku)
        commerce_product_line_item_populate($line_item, $product);

        // We don't need to use commerce_line_item_rebase_unit_price because
        // commerce_product_line_item_populate has just set the price components in the 'data'
        // field

        // Setting the quantity
        $line_item->quantity = $quantity;

        try {

            // Saving the line item so that it gets an id
            commerce_line_item_save($line_item);

            // Add it to the order's line item reference value.
            $order_wrapper->commerce_line_items[] = $line_item;

            // Save the updated order.
            commerce_order_save($order);

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E068 Error in saving a line item. Error message: (!e)',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in saving a line item', 500);
        }

        // @attention What if there is already a line item for the given product in the order?
        // For now we leave this check to angular. Later we may want to check here as well

        //        watchdog('musth_restws', 'W7D001 7VQP line item create done <br/> (!v) <br/> (!o) <br/> (!u) ',
        //                array('!v' => print_r($values, true),
        //                      '!u' => print_r($user->uid, true),
        //                      '!o' => print_r($order, true)),
        //                WATCHDOG_DEBUG);

        // A create api returns the line item id only
        // If you want the full object, you have to call the get method

        return $line_item->line_item_id;
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Number of resources to be sent back (max)
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here.
     *
     * @param int $client_limit Ignored
     * @return int Maximum 1,000
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a line item
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int|string $line_item_id Id of the line item we have to send back info about
     * @return LineItem Object containing the information described by the properties (propertyInfo)
     */
    public function read($line_item_id) {

        //watchdog('musth_restws', 'W7D001 67GH LIR-1 LineItemResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        $line_item_as_array = entity_load('commerce_line_item', array($line_item_id));
        $line_item = $line_item_as_array[$line_item_id];

        $line_item_wrapper = entity_metadata_wrapper('commerce_line_item', $line_item);

        $line_item_to_return = new LineItem($line_item_id,
            $line_item->order_id,
            $line_item->type,
            $line_item->line_item_label,
            $line_item_wrapper->commerce_product->title->value(),
            $line_item->quantity,
            $line_item_wrapper->commerce_product->product_id->value(),
            $line_item_wrapper->commerce_unit_price->amount->value(),
            $line_item_wrapper->commerce_unit_price->currency_code->value(),
            $line_item_wrapper->commerce_total->amount->value(),
            $line_item_wrapper->commerce_total->currency_code->value()
        );

        // The total of the line item is calculated automatically.
        // No need to call any api here

        // We refresh prices only when an order is queried. Call the order query api after you
        // add or edit a line item to refresh prices and totals

        //watchdog('musth_restws', 'W7D001 DFGT LIR-2 LineItemResourceController read (!i) (!p) ',
        //    array('!i' => print_r($line_item_id, true),
        //          '!p' => print_r($line_item, true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Line Item object

        return $line_item_to_return;
    }

    /**
     * Not implemented. For now, we don't update anything through this api
     *
     * @@attention we may want to be able to update the quantity in the future
     *
     * @see RestWSResourceControllerInterface::update()
     **/
    public function update($id, array $values) {
        throw new RestWSException('Not implemented', 501);

        //watchdog('musth_restws', 'W7D001 8765 line item update values (!v) (!i) ',
        //    array('!v' => print_r($values, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // a return is ignored here
        //return TRUE;
    }

    /**
     * This api deletes a line item given its id.
     *
     * To delete the line item we use the Commerce api commerce_cart_order_product_line_item_delete
     * which needs the order as well because it has to update it.
     *
     * We know from the line item to which order it belongs.
     *
     * @restfulness Yes. User id is used for checking only
     * @see RestWSResourceControllerInterface::delete()
     */
    public function delete($line_item_id) {

        // We use commerce_cart_order_product_line_item_delete

        // We need the order the line items belongs to, so we load the line item

        if (!isset($line_item_id)) {

            watchdog('musth_restws', 'W3E105 Please, give the id of a line item',
                array(),
                WATCHDOG_ERROR);

            throw new RestWSException('No line item id given', 412);
        }

        $line_item_as_array = entity_load('commerce_line_item', array($line_item_id));

        if (empty($line_item_as_array)) {

            watchdog('musth_restws', 'W3E106 Please, give the id of an existing line item (!l) ',
                array('!l' => print_r($line_item_id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Line item not found, line item id: ' . $line_item_id, 404);
        }

        $line_item = $line_item_as_array[$line_item_id];

        // Now we know the order the line item belongs to
        $order_id = $line_item->order_id;

        // We load the order
        $order_as_array = entity_load('commerce_order', array($order_id));

        if (empty($order_as_array)) {

            // We have a big problem here. Every line item should belong to an order

            watchdog('musth_restws', 'W3E107 The order the line item belongs to doesnt exist. (!o) (!l) ',
                array('!o' => print_r($order_id, true),
                      '!l' => print_r($line_item_id, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('The order the line item belongs to doesnt exist. Order id: ' . $order_id, 404);
        }

        $order = $order_as_array[$order_id];

        //watchdog('musth_restws', 'W7D001 7G34 line item delete order (!o) (!i) ',
        //    array('!o' => print_r($order, true),
        //        '!i' => print_r($line_item_id, true)),
        //    WATCHDOG_DEBUG);

        try {

            // This function deletes the line item and updates and saves the order

            commerce_cart_order_product_line_item_delete($order, $line_item_id);

        }
        catch (Exception $e) {

            watchdog('musth_restws', 'W3E108 Error in deleting a line item. Error message: (!e) ',
                array('!e' => print_r($e->getMessage(), true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('Error in deleting a line item', 500);
        }

        //throw new RestWSException('Not implemented', 501);

        //watchdog('musth_restws', 'W7D001 ZXCV line item delete values (!v) (!i) ',
        //    array('!v' => print_r('', true),
        //        '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        // A return is ignored here, throw exceptions if there are problems
    }

    /**
     * Access granted for every operation and node id
     *
     * @see RestWSResourceControllerInterface::access()
     */
    public function access($op, $id) {

        //watchdog('musth_restws', 'W7D001 6767 ProgrammeResourceController access (!o) (!i) ',
        //    array('!o' => print_r($op, true),
        //          '!i' => print_r($id, true)),
        //    WATCHDOG_DEBUG);

        return TRUE;
    }

    /**
     * Standard function returning the name of the resource
     *
     * @see RestWSResourceControllerInterface::resource()
     */
    public function resource() {

        return 'musth_restws_line_item';
    }

}
