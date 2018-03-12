<html>
<head>
</head>
<body>

<?php

$errors_in_form_array = form_get_errors();

// array(1) { ["name"]=> string(145) "Sorry, unrecognized username or password. Have you forgotten your password?" }
// array(1) { ["name"]=> string(181) "Sorry, there have been more than 5 failed login attempts for this account. It is temporarily blocked. Try again later or request a new password." }

if (isset($errors_in_form_array["name"])) {

    if (preg_grep('/login attempts|unrecognized username or password/', $errors_in_form_array)) {

        print $messages;

    }

}

//watchdog('@page--user--login.tpl.php', 'W7D001 fa7ienahh4oonae9imei session (!s) ',
//   array('!s' => print_r($_SESSION, true)), WATCHDOG_DEBUG);

//var_dump($_SESSION);
//var_dump(form_get_errors());
//var_dump(drupal_get_messages());

?>

<?php
    $user_login_form = drupal_get_form('user_login');
    print drupal_render($user_login_form);
?>

<div class="user-login-links">
    <span class="password-link"><a href="/backend/user/password">Forgot your password?</a></span>
</div>

</body>
</html>