<?php
/**
 * @file musth_restws.product.ctrl.inc
 *
 * @brief This file is about the ProductResourceController, that is the implementation of
 * the class RestWSQueryResourceControllerInterface that controls the Product resource
 *
 * Query api
 * You can query all products whose sku begins with the given partial one.
 * If the given sku is 'V1033', all products whose skus begin by 'V1033'
 * are returned.
 *
 * We don't create, update or delete products by using this api
 *
 * @ingroup musthrestwsservice
 *
 * Created by PhpStorm.
 * User: www-data
 * Date: 12/03/14
 * Time: 16:33
 */

class ProductResourceController implements RestWSQueryResourceControllerInterface {

    public function __construct() {

        //watchdog('musth_restws', 'W7D001 75PL ProductResourceController __construct',
        //    array(), WATCHDOG_DEBUG);

    }

    /**
     * This method implements the interface method RestWSResourceControllerInterface::propertyInfo
     * and defines the properties of the resource Product this class controls
     *
     * @see hook_entity_property_info()
     * @see RestWSResourceControllerInterface::propertyInfo()
     *
     * @return array Definition of the properties of the resource Product
     */
    public function propertyInfo() {

        /*
        Table: commerce_product
        Columns:
        product_id	int(10) UN PK AI
        revision_id	int(10) UN
        sku	varchar(255)
        title	varchar(255)
        type	varchar(255)
        language	varchar(32)
        uid	int(11)
        status	tinyint(4)
        created	int(11)
        changed	int(11)
        data	longblob
        */

        return array(
            'sku' => array(
                'type' => 'text',
                'label' => t('Product SKU'),
            ),
            'title' => array( // This is the product description you find in orders
                'type' => 'text',
                'label' => t('Title'),
            ),
            'price_amount' => array( // Price in hundredths (pence, cents, ...)
                'type' => 'int',
                'label' => t('Price amount'),
            ),
            'price_currency' => array( // Currency the price is expressed in
                'type' => 'text',
                'label' => t('Price currency'),
            ),
            'tid' => array( // Many of our products are related to a track
                'type' => 'int',
                'label' => t('Track node id'),
            ),
        );
    }

    /**
     * Metadata wrapper for the Product resource
     *
     * @see RestWSResourceControllerInterface::wrapper()
     *
     * @param $id int Product id
     * @return EntityMetadataWrapper The metadata object
     */
    public function wrapper($id) {
        $product_resource_obj_to_be_wrapped = $this->read($id);
        $metadata = $this->propertyInfo();

        return entity_metadata_wrapper('musth_restws_product',
            $product_resource_obj_to_be_wrapped,
            array('property info' => $metadata));
    }

    /**
     * This is the entry point of the api. When the api is called, RESTws calls this function
     * passing the filters to be used to perform the query.
     *
     * For now the only filter implemented is on the sku.
     * A sku, or part of it, is given and all products that have matching skus
     * will be returned
     *
     * @attention We retrieve only products of type 'track' for now
     *
     * @restfulness Yes. Products are public.
     * @param $filters array Associative array containing the filters we have to apply
     * to the query.
     * @param $meta_controls array Not used in this context
     * @throws RestWSException
     * @return array Array containing the product ids of the products to be sent back
     */
    public function query($filters = array(), $meta_controls = array()) {

        // We retrieve only products of type 'track' for now

        if (isset($filters['sku'])) {
            // We need a sku to return the product(s)
            // The sku we get here can be only the first part
            // of an actual sku and in this case we send back
            // all products whose sku begins with the given
            // partial sku
            $sku = $filters['sku'];
        } else {

            watchdog('musth_restws', 'W3E140 Angular passed no sku. (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('Angular passed no sku', 412);
        }

        // Now fetching the products we have to return
        // We fetch only products of type 'track'
        // We sort the products by sku because Angular needs them sorted
        // We fetch only active products

        // @todo fix documentation here, we are using a LIKE condition
        // so that we can ask for products like 'A1262%D%'
        // These are the products related to downloadable tracks only
        // If there are any shipped products, they will be filtered away
        // @todo actually it's not sure that we need a LIKE condition
        // @todo maybe we leave this LIKE condition just in case for future
        // needs

        // ->propertyCondition('sku', $sku, 'STARTS_WITH')

        $query = new EntityFieldQuery();
        $query->entityCondition('entity_type', 'commerce_product')
              ->entityCondition('bundle', 'track')
              ->propertyCondition('sku', $sku, 'LIKE')
              ->propertyCondition('status', 1) // Get the product only if it's active
              ->propertyOrderBy('sku');

        $result = $query->execute();

        if (isset($result['commerce_product'])) {
            $product_ids = array_keys($result['commerce_product']);
        } else {
            // No product found? Throw an exception
            // Every track should have a product associated even if the price is zero
            // Maybe there are no tracks for a given programme but this is an exception too
            // Maybe Angular sent a wrong sku (even if partial) but this is an exception too

            watchdog('musth_rules', 'W3E141 No products found for the given sku (!f) ',
                array('!f' => print_r($filters, true)),
                WATCHDOG_ERROR);

            // Get out of here!
            throw new RestWSException('No products found', 404);
        }

        return $product_ids;
    }

    /**
     * @param array $values
     * @return int|string|void
     * @throws RestWSException
     */
    public function create(array $values) {

        throw new RestWSException('Not implemented', 501);
    }

    /**
     * This method is used to implement paging. But we don't do paging here.
     *
     * @param array $filters The filters passed to the query method are passed to this method as well
     * @return int Maximum 1000 resources will be sent
     */
    public function count($filters = array()) {

        return 1000;
    }

    /**
     * This function has to be implemented but it's actually useless in this context.
     * It's needed to perform paging, but we don't have paging here.
     *
     * @param int $client_limit Ignored
     * @return int Maximum 1000 resources sent
     */
    public function limit($client_limit = NULL) {

        return 1000;
    }

    /**
     * This is the function that sends back information about a single product
     *
     * @see RestWSResourceControllerInterface::read()
     * @param int $product_id Id of the product we have to return
     * @throws RestWSException
     * @return Product Object containing the information described by the properties (propertyInfo)
     */
    public function read($product_id) {

        //watchdog('musth_restws', 'W7D001 NBVC ProductResourceController start read (!i) (!p) ',
        //    array('!i' => print_r($product_id, true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        $product_as_array = entity_load('commerce_product', array($product_id));
        $product = $product_as_array[$product_id];

        // In case there is no track id, there is a problem
        // track products are about tracks

        $track_id = 0;

        if (isset($product->field_track[LANGUAGE_NONE]))
            $track_id = $product->field_track[LANGUAGE_NONE][0]['target_id'];

        if ($track_id == 0) {

            // Either the track field is not filled-in at all for this product
            // or it's filled-in but it's zero
            // We have a track product that links to no track
            // We create a watchdog and throw an exception because the price may be wrong

            watchdog('musth_rules', 'W3E142 We found a product that is about no track (!p) ',
                array('!p' => print_r($product, true)),
                WATCHDOG_ERROR);

            throw new RestWSException('We found a product that is about no track', 500);
        }

        // We need a wrapper to get the product's price
        $product_wrapper = entity_metadata_wrapper('commerce_product', $product);

        $product_to_return = new Product($product->sku,
                                         $product->title,
                                         $product_wrapper->commerce_price->amount->value(),
                                         $product_wrapper->commerce_price->currency_code->value(),
                                         $track_id);

        //watchdog('musth_restws', 'W7D001 7171 OrderResourceController read (!i) (!p) ',
        //    array('!i' => print_r('', true),
        //          '!p' => print_r('', true)),
        //    WATCHDOG_DEBUG);

        // Sending back the Product object

        return $product_to_return;
    }

    /**
     * @param int|string $id
     * @param array $values
     * @throws RestWSException
     */
    public function update($id, array $values) {

        throw new RestWSException('Not implemented', 501);
    }

    /**
     * @param int|string $id
     * @throws RestWSException
     */
    public function delete($id) {

        throw new RestWSException('Not implemented', 501);
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

        return 'musth_restws_product';
    }

}
