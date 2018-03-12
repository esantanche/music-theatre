<?php
/**
* This snippet loads a custom page-user.tpl.php layout file when
* users click through to the login, request password or register pages
* EMS Inserted to make custom login page 2015-11-02
*/

function hybridauththeme_theme() {
    $items = array();
    // create custom user_login.tpl.php
    $items['user_login'] = array(
        'render element' => 'form',
        'path' => drupal_get_path('theme', 'HybridAuthTheme') . '/templates',
        'template' => 'user_login',
        'preprocess functions' => array(
            'HybridAuthTheme_preprocess_user_login'
        ),
    );

    //    watchdog('HybridAuthTheme', 'W7D001 ahy3ahghu9Ew9ha (!p) ',
    //        array('!p' => print_r(drupal_get_path('theme', 'HybridAuthTheme'), true),
    //        ), WATCHDOG_DEBUG);

    return $items;
}

