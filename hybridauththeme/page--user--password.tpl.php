<html>
<head>
</head>
<body>
<?php


// @todo we will want to remove messages

//print $messages;

?>


<form action="/backend/user/login?destination=callback4login">
    <input type="submit" class="form-submit" value="Back to login form">
</form>


<?php print drupal_render(drupal_get_form('user_pass')); ?>

<!---->
<!--<div class="user-login-links">-->
<!--    <span class="password-link"><a href="/backend/user/password">Forgot your password?</a></span> | <span class="register-link"><a href="/backend/user/register">Create an account</a></span>-->
<!--</div>-->


</body>
</html>