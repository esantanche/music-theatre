<?php
/**
 * Created by PhpStorm.
 * User: www-data
 * Date: 02/11/15
 * Time: 11:52
 */

    // split the username and password so we can put the form links were we want (they are in the "user-login-links" div bellow)

    print drupal_render($form['name']);

    print drupal_render($form['pass']);

?>

<?php
// render login button
print drupal_render($form['form_build_id']);

print drupal_render($form['form_id']);

print drupal_render($form['actions']);

$block = module_invoke('hybridauth', 'block_view', 'hybridauth');
print drupal_render($block['content']);

?>

<!-- /user-login-custom-form -->