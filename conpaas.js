var ENDPOINT = "http://ec2-50-19-61-92.compute-1.amazonaws.com:5000";

(function($) {
    var updateServiceListIfConfigured = function() {
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
                updateServiceListIfConfigured();
            }

            $page.bind("pageshow", function(event, ui) {
                updateServiceListIfConfigured();
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

        initServiceDetailPage : function() {
            updateServiceDetail();

            /*
            var $page = $("#pageServiceDetail");

            $page.bind("pageshow", function(event, ui) {
                updateServiceDetail();
            });*/
        },

        initAddServicePage : function() {
            var $page = $("#pageAddService");
            $page.find(".addService").each(function(idx, el) {
                $(el).click(function() { createService(el) });
            });

            var $page = $("#pageAddServiceWeb");
            $page.find(".addService").each(function(idx, el) {
                $(el).click(function() { createService(el) });
            });
        },

        initAll : function() {
            $().initApp("initServiceListPage");
            $().initApp("initSettingsPage");
            $().initApp("initServiceDetailPage");
            $().initApp("initAddServicePage");
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
            
            //strHtml += '<span class="ul-li-count ui-btn-up-c ui-btn-corner-all">' + data.length + '</span></li>';
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
                $("#pageServiceDetail").data("serviceJSON", $this.data("serviceJSON"));
            });
        },
        error: function() {
            showError("Service listing failed", 
                "We were unable to list the currently running services. Please try again.");
        }
    });
}

var updateServiceDetail = function() {
    var $page = $("#pageServiceDetail");

    // Every time this page shows, we need to display a service detail
    $page.bind("pageshow", function(event, ui) {
        var service = JSON.parse($page.data("serviceJSON"));

        // Set service name
        //var strHtml = "<img src='images/" + service.type + ".png'>" + service.name;
        $page.find(".serviceName").html(service.name);

        // Set the manager vm id
        $page.find(".managerVmid").html(service.vmid);

        // Set the manager IP
        $page.find(".managerIP").html(service.manager);

        // Get more info from the manager
        var url = ENDPOINT + "/manager";

        $.ajax({ 
            url: url,
            data: { "sid": service.sid, "method": 'get_service_info' }, 
            type: 'GET',
            success: function(res) {
                res = JSON.parse(res);

                var state = res['result']['state'];
                $page.find(".serviceStatus").html(state);

                if (state === "RUNNING") {
                    /* If the service is running it makes no sense to start it up */
                    $page.find(".startupService").remove();

                    /* Add the 'stop' button if necessary */
                    if ($page.find(".stopService").length === 0) {
                        $page.find(".serviceButtons").prepend('<a href="#" class="stopService" data-role="button" data-icon="arrow-r" data-iconpos="left">Stop</a>');
                    }

                    $page.find(".stopService").click(function() {
                        alert("Stopping the service");
                    });

                    $page.trigger("pagecreate");
                }
            },
            error: function() {}
        });

        // Set instance count
        // TODO: get the number of agents from the master and sum it up
        $("#nInstances").html(1 + 0);
    });

    $page.find(".startupService").click(function() {
        var service = JSON.parse($page.data("serviceJSON"));
        startupService(service.sid);
    });

    var $pageConfirm = $("#pageConfirmTermination");
    // Service termination button
    $pageConfirm.find(".terminateService").click(function() {
        var service = JSON.parse($page.data("serviceJSON"));
        terminateService(service.sid);
    });
}

var showError = function(title, message) {
    // Get the error page
    var $page = $("#pageError .content");
    // Build an error message
    var strHtml = "<h3>" + title + "</h3>";
    strHtml += "<p>" + message + "</p>"
    // Place the message in the error dialog
    $page.html(strHtml);
    // Show the dialog
    $("#show-error-page").click();
}

// Function to post data to the ConPaaS director and create a new
// service
var createService = function(elem) {
    // Show the page loading dialog
    $.mobile.showPageLoadingMsg();

    var serviceType = $(elem).attr("name");

    var url = ENDPOINT + "/start/" + serviceType;

    $.ajax({ 
        url: url,
        data: { 
            "username": localStorage.getItem("username"), 
            "password": localStorage.getItem("password")
        }, 
        type: 'POST',
        success: function(res) { 
            if (res === false) {
                showError("Service creation failure", 
                    "Authentication failed. Please check your credentials.");
            }
            else {
                $.mobile.changePage("#pageServiceList", "fade", true, false);
            }
        },
        error: function() { 
            showError("Service creation failure", 
                "Error creating a new service. Please try again.");
        }
    });
}

// Function to post data to the ConPaaS director and terminate a running
// ConPaaS service
var terminateService = function(serviceId) {
    // Show the page loading dialog
    $.mobile.showPageLoadingMsg();

    var url = ENDPOINT + "/stop/" + serviceId;

    $.ajax({ 
        url: url,
        data: { 
            "username": localStorage.getItem("username"), 
            "password": localStorage.getItem("password")
        }, 
        type: 'POST',
        success: function(res) { 
            if (res === false) {
                showError("Service termination error", 
                    "Authentication failed. Please check your credentials.");
            }
            else {
                $.mobile.changePage("#pageServiceList", "fade", true, false);
            }
        },
        error: function() { 
            showError("Service termination error", 
                "Error terminating the service. Please try again.");
        }
    });
}

// Function to post data to the ConPaaS director and startup a new ConPaaS
// service
var startupService = function(serviceId) {
    // Show the page loading dialog
    $.mobile.showPageLoadingMsg();

    var url = ENDPOINT + "/manager";

    $.ajax({ 
        url: url,
        data: { 
            /*
            "username": localStorage.getItem("username"), 
            "password": localStorage.getItem("password"),
            */
            "sid": serviceId,
            "method": 'startup'
        }, 
        type: 'POST',
        success: function(res) {
            res = JSON.parse(res);

            if (res['error'] !== null) {
                showError("Service startup error", res["error"]);
            }
            else {
                $.mobile.hidePageLoadingMsg();
                // TODO
            }
        },
        error: function() { 
            showError("Service startup error", 
                "Error starting up the service. Please try again.");
        }
    });
}

$(document).ready(function() {
    $().initApp();
});
