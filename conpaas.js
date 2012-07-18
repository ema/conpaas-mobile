/*
var ENDPOINT = "http://ec2-107-21-172-31.compute-1.amazonaws.com";
*/
var ENDPOINT = "http://localhost:5000";

function logout() {
    localStorage.delItem("username");
    localStorage.delItem("password");
    $.mobile.changePage("#login-page", "fade", true, false);
    return false;
}

function authUser() {
    // really use localStorage !
    localStorage.setItem("username", $("#username").val());
    localStorage.setItem("password", $("#password").val());

    var login_url = ENDPOINT + "/login";
    $.ajax({ 
        url: login_url,
        data: { 
            "username": $("#username").val(), 
            "password": $("#password").val()  
        }, 
        type: 'POST',
        success: function(res) { 
            if (eval(res)) {
                // authentication succeeded
                $.mobile.changePage("#service-list-page", "fade", true, false);
            }
            else {
                $("#login-form-message").html("Authentication failed");
            }
        },
        error: function() { 
            alert("Error performing login"); 
        }
    });

    return false;
}

$(document).ready(function() {
    // login-form behavior
    $("#login-form").bind("submit", authUser);
});
