//
// Core Functions Commonly used across multiple applications
//

coreFunctions = {
 
    //
    // Get the query string parameters in pairs
    // of name and value.
    //

    getUrlVars: function () {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }

    ,
    
    //
    // Get the anchor on the current url
    // of name and value.
    //

    getUrlAnchor: function () {
    	var anchor;
    	if (window.location.href.indexOf('#')!= -1) {
          anchor = window.location.href.substr(window.location.href.indexOf('#'), window.location.href.length);
    	}
        return anchor;
    }

    ,


    //
    // Get the current time from client.
    // returns a friendly string format.
    //

    getTimeString: function () {

        var lastUpdate = new Date();
        var hours = lastUpdate.getHours();
        var minutes = lastUpdate.getMinutes();
        var seconds = lastUpdate.getSeconds();
        var result = hours + " : " + minutes + " : " + seconds;
        return result;
    }

    ,

    //
    // Generate a time stamp. Use this to prevent 
    // caching on the requested urls.
    //

    getTimeStamp: function () {

        return new Date().getTime();
    }

    ,

    //
    // Check if a variable is defined.
    // The variable is defined if is not undefined,
    // not null and has a non empty string value.
    //

    isDefined: function (variable) {

        return (typeof variable != 'undefined') && (variable != null) && (variable != "");
    }

    ,

    //
    // Share on Facebook
    //
    


    PopupWindow: function popupwindow(url, title, w, h) {
        var left = (screen.width / 2) - (w / 2);
        var top = (screen.height / 2) - (h / 2);
        return window.open(url, "", 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
    },

    GetCurrentURLForFB: function getCurrentUrlFB() {
        return "https://www.facebook.com/sharer/sharer.php?u=" + document.URL;
    },

    //
    // GetScrollBarWidth
    //
    GetScrollBarWidth: function getScrollbarWidth() {
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = "scroll";

        // add innerdiv
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);        

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    },

    
    //
    // Resolve an url.
    // Uses the application path to resolve urls that
    // start with the ~ caracter.
    //

    ResolveUrl: function (url) {

        if (url.indexOf("~/") == 0) {
            url = this.BASE_URL + url.substring(2);
        }
        return url;
    }

    
}