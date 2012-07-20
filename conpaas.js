/*
var ENDPOINT = "http://ec2-107-21-172-31.compute-1.amazonaws.com";
*/
var ENDPOINT = "http://localhost:5000";

(function($) {
    var methods = {
        initServiceListPage : function() {
            var $page = $("#pageServiceList");

            // Set some defaults XXX
            localStorage.setItem("username", "ema");
            localStorage.setItem("password", "prova");

            // Update the service list for the first time
            updateServiceList();

            $page.bind("pageshow", function(event, ui) {
                updateServiceList();
            });
        },

        initSettingsPage : function() {
        },

        initAddServicePage : function() {
        },

        initServiceDetailPage : function() {
        },

        initAll : function() {
            $().initApp("initServiceListPage");
            $().initApp("initSettingsPage");
            $().initApp("initAddServicePage");
            $().initApp("initServiceDetailPage");
        }
    }

    $.fn.initApp = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this,
                Array.prototype.slice.call(arguments, 1));
        } 
        else if (typeof method === 'object' || !method) {
            return methods.initAll.apply(this, arguments);
        } 
        else {
            $.error('Method ' + method + ' does not exist');
        }
    }
})(jQuery);

var updateServiceList = function() {
    // Get the page and list we need to work with
    var $page = $("#pageServiceList");

    // Build the URL to get the service list from
    var strUrl = ENDPOINT + '/list?username=';
    strUrl += localStorage.getItem("username");
    strUrl += '&password=' + localStorage.getItem("password");

    // Get the running services and append them to the list
    $.ajax({
        url: strUrl,
        dataType: 'json',
        success: function(data) {
            // Delete the existing list, if any
            $page.find(".content").empty();

            if (data.length === 0) {
                $page.find(".content").html("<p>No running services!</p>");
                return;
            }

            // Create a new list
            $page.find(".content").html("<ul></ul>");
            $list = $page.find(".content ul");

            for (var i=0; i < data.length; i++) {
                // Create a list element
                var strHtml = '<li><a data-trasition="slide" href="#pageServiceDetail">';

                strHtml += data[i].name;

                strHtml += "</a></li>";

                // Make it into a jQuery object...
                var service = $(strHtml);

                // So we can append it to our list
                $list.append(service);

                // Store the JSON data for this service as we will need it in
                // the details page
                $list.find("a:last").data("serviceJSON", JSON.stringify(data[i]));
            }

            // Call the listview widget
            $list.listview();

            // Give the detail page the data it needs to display
            $list.find("a").click(function() {
                var $this = $(this);
                $("#pageServicetDetail").data("serviceJSON", $this.data("serviceJSON"));
            });
        },
        error: function() {
            alert("Error");
        }
    });
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
    $().initApp();

    /* login-form behavior
    $("#login-form").bind("submit", authUser);
    */
});
