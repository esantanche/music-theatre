<html>
<head>
</head>
<body>
<?php

//print $messages;

$errors_in_form_array = form_get_errors();

// (Array ( [mail] => The e-mail address charlie.williams@gmail.com is already registered. Have you forgotten your password? ) )

//watchdog('@page--user--register.tpl.php', 'W7D001 ieb4aeMae7 $errors_in_form_array (!s) ',
//   array('!s' => print_r($errors_in_form_array, true)), WATCHDOG_DEBUG);

if (isset($errors_in_form_array["mail"])) {

    if (preg_grep('/is already registered/', $errors_in_form_array)) {

        print $messages;

    }

}

?>


<?php
    $user_register_form = drupal_get_form('user_register_form');
    print drupal_render($user_register_form);
?>

<!---->
<!--<div class="user-login-links">-->
<!--    <span class="password-link"><a href="/backend/user/password">Forgot your password?</a></span> | <span class="register-link"><a href="/backend/user/register">Create an account</a></span>-->
<!--</div>-->


</body>
</html>