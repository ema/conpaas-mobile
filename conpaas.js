/*
var ENDPOINT = "http://ec2-107-21-172-31.compute-1.amazonaws.com";
*/
var ENDPOINT = "http://localhost:5000";

(function($) {
    var updateIfConfigured = function() {
        // Build the service list page
        // If the settings have been configured already
        if (localStorage.getItem("username") !== null) {
            updateServiceList();
        }
    }

    var methods = {
        initServiceListPage : function() {
            var $page = $("#pageServiceList");

            //localStorage.removeItem("username");

            if (localStorage.getItem("username") !== null) {
                updateIfConfigured();
            }

            $page.bind("pageshow", function(event, ui) {
                updateIfConfigured();
            });
        },

        initSettingsPage : function() {
            var $page = $("#pageSettings");

            var $uname = $page.find("#username");
            var $pass  = $page.find("#password");
    
            $uname.val(localStorage.getItem("username"));
            $pass.val(localStorage.getItem("password"));
            
            // Update localStorage with the specified username and password
            $uname.change(function() {
                var newVal = $(this).val();
                localStorage.setItem("username", newVal);
            });

            $pass.change(function() {
                var newVal = $(this).val();
                localStorage.setItem("password", newVal);
            });
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

            if (data === false) {
                $page.find(".content").html("<p>Authentication failed.</p><p>Please <a href='#pageSettings'>check your credentials</a>.");
                return;
            }

            if (data.length === 0) {
                $page.find(".content").html("<p>No running services!</p>");
                return;
            }

            var username = localStorage.getItem("username");

            // Create a new list
            $page.find(".content").html("<ul></ul>");
            $list = $page.find(".content ul");

            // Add list header
            var strHtml = '<li data-role="divider">' + username + '\'s running services</li>';
            $list.append($(strHtml));

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

var authUser = function() {
    // really use localStorage !
    localStorage.setItem("username", $("#username").val());
    localStorage.setItem("password", $("#password").val());

    var login_url = ENDPOINT + "/login";
    $.ajax({ 
        url: login_url,
        data: { 
            "username": localStorage.getItem("username"), 
            "password": localStorage.getItem("password")
        }, 
        type: 'POST',
        success: function(res) { 
            if (eval(res)) {
                // authentication succeeded
                console.log("auth ok");
                $.mobile.changePage("#ServiceListPage", "fade", true, false);
            }
            else {
                console.log("auth ko");
                $.mobile.changePage("#SettingsPage", "fade", true, false);
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
});
