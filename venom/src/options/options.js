var changeLoginState
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-197007778-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function loggedOutState(e){
    // Remove all event listeners

    button = document.getElementById("loginSpotifyButton")
    notification = document.getElementById("notification")

    changeLoginState = () => {
        _gaq.push(['_trackEvent', "login"]);

        chrome.runtime.sendMessage({ message: {
            title: 'login'
        } }, function (response) {
            notification.hidden = false;
            if (response.success){
                spotifyToggle = document.getElementById("spotifyToggle")

                spotifyToggle.checked = true
                notification.className = "alert alert-success"
                notification.innerText = "Successfully logged into Spotify"

                button.innerText = "Logout of Spotify"
                loggedInState()
            } else {
                notification.className = "alert alert-danger"
                if (response.error){
                    notification.innerText = `Failed to login to Spotify: ${response.error}`
                } else {
                    notification.innerText = "Failed to login to Spotify."
                }
            }
        });
    };
}

function loggedInState(e) {
    // Remove all event listeners

    button = document.getElementById("loginSpotifyButton")
    notification = document.getElementById("notification")


    changeLoginState = () => {
        _gaq.push(['_trackEvent', "logout"]);

        chrome.runtime.sendMessage({ message: {
            title: 'logout'
        } }, function (response) {
            console.log(response)
            spotifyToggle = document.getElementById("spotifyToggle")

            spotifyToggle.checked = false

            notification.hidden = false;
            notification.className = "alert alert-success"

            notification.innerText = "Logged out of Spotify."
        
            button.innerText = "Login to Spotify"
            
            loggedOutState()
        });
    }

}

function listener(){
    changeLoginState();
}


document.addEventListener("DOMContentLoaded", function(){  
    chrome.storage.sync.get(['spotifyCredentials'], function(result) {
        button = document.getElementById("loginSpotifyButton")

        button.addEventListener('click', listener)

        result.spotifyCredentials ? loggedInState() : loggedOutState()
        button.innerText = result.spotifyCredentials ? "Logout of Spotify" : "Login to Spotify"

    })

    chrome.storage.sync.get(['spotifyEnabled', 'youtubeEnabled', 'soundcloudEnabled', 'notificationsEnabled'], function(result) {
        spotifyEnabled = (result.spotifyEnabled == undefined) ? false : result.spotifyEnabled
        youtubeEnabled = (result.youtubeEnabled == undefined) ? true : result.youtubeEnabled
        soundcloudEnabled = (result.soundcloudEnabled == undefined) ? true : result.soundcloudEnabled

        notificationsEnabled = (result.notificationsEnabled == undefined) ? false : result.notificationsEnabled



        spotifyToggle = document.getElementById("spotifyToggle")
        spotifyToggle.checked = spotifyEnabled
        spotifyToggle.addEventListener('change', (e) => {
            chrome.storage.sync.set({'spotifyEnabled': e.target.checked}, function(result) {})
        })

        youtubeToggle = document.getElementById("youtubeToggle")
        youtubeToggle.checked = youtubeEnabled
        youtubeToggle.addEventListener('change', (e) => {
            chrome.storage.sync.set({'youtubeEnabled': e.target.checked}, function(result) {})
        })

        soundcloudToggle = document.getElementById("soundcloudToggle")
        soundcloudToggle.checked = soundcloudEnabled
        soundcloudToggle.addEventListener('change', (e) => {
            chrome.storage.sync.set({'soundcloudEnabled': e.target.checked}, function(result) {})
        })

        notificationsToggle = document.getElementById("notificationsToggle")
        notificationsToggle.checked = notificationsEnabled
        notificationsToggle.addEventListener('change', (e) => {
            chrome.storage.sync.set({'notificationsEnabled': e.target.checked}, function(result) {})
        })

    })

}, true);


