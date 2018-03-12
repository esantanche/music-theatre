<?php
/**
 * Created by PhpStorm.
 * User: www-data
 * Date: 22/10/14
 * Time: 17:30
 */


//header("Location: http://musictheatre-production-ng/en/v?test=test455");
//?sessionid=" + session_id());
//die();
?>
<html>
<head>
<script type="text/javascript">
    function onload() {
        console.debug('@callback4loginpage user: ' + document.getElementById("UserIdOfLoggedInUser").value);
        console.debug('@callback4loginpage window.location.href: ' + window.location.href);

        parent.iframeCallback(document.getElementById("UserIdOfLoggedInUser").value);
        // This replace is to avoid that the iframe gets stuck on the callback4login page
        window.location.replace("/backend/user?destination=callback4login");
    }
</script>
</head>
<body onload="onload();">

<div <?php print $attributes; ?>>

    <div class="content clearfix"<?php print $content_attributes; ?>>
        <?php
        print render($page['content']);
        ?>
    </div>

    <?php
        // With this hidden input field we tell javascript the user id of the logged in user,
        // which will be zero if we just performed a logout
        print "<input type=\"hidden\" id=\"UserIdOfLoggedInUser\" value=\"" . $user->uid .   "\"/>";
    ?>

</div>

</body>
</html>