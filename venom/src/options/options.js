document.addEventListener("DOMContentLoaded", function(){  
    button = document.getElementById("loginSpotifyButton")
    
    chrome.storage.sync.get(['spotifyCredentials'], function(result) {
        spotifyCredentials = result.spotifyCredentials
        if (spotifyCredentials){
            button.innerText = "Logout of Spotify"
            button.title = "Spotify account is already linked"

            button.addEventListener('click', () => {
                chrome.runtime.sendMessage({ message: {
                    title: 'logout'
                } }, function (response) {
                    console.log("LOGGED OUT")
                    button.disabled = true
                    document.getElementById("signOutNotification").hidden = false;
                });
            });
        } else {
            button.innerText = "Login to Spotify"

            button.addEventListener('click', () => {
                chrome.runtime.sendMessage({ message: {
                    title: 'login'
                } }, function (response) {
                    button.disabled = true

                    location.reload()
                });
            });

        }
    })

    chrome.storage.sync.get(['spotifyEnabled', 'youtubeEnabled', 'soundcloudEnabled'], function(result) {
        spotifyEnabled = (result.spotifyEnabled == undefined) ? false : result.spotifyEnabled
        youtubeEnabled = (result.youtubeEnabled == undefined) ? true : result.youtubeEnabled
        soundcloudEnabled = (result.soundcloudEnabled == undefined) ? true : result.soundcloudEnabled


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


    })

}, true);


