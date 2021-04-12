Spotify = {
    getSpotifyPlaying: (spotifyCredentials) => {
        if (spotifyCredentials == undefined){
            chrome.notifications.create('', {
                title: 'No Spotify account linked!',
                message: `Please link a Spotify account at Venom -> Options.`,
                type: 'basic',
                iconUrl: 'icons/icon.png'
            });

            return -1
        }
          
        if (spotifyCredentials.expires < new Date().getTime()){

            params = new URLSearchParams({
                client_id: SPOTIFY_CLIENT_ID,
                grant_type: "refresh_token",
                refresh_token: spotifyCredentials.refresh_token
            })


            req = new Request("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded"
                }, 
                body: params.toString()
            })
            fetch(req)
            .then(res => res.json())
            .then(data => {
                data.expires = new Date().getTime() + data.expires_in * 1000
                spotifyCredentials = data
                chrome.storage.sync.set({spotifyCredentials: data}, function() {});
            })
        }

        
        spotifyApi.setAccessToken(spotifyCredentials.access_token)
        return spotifyApi.getMyCurrentPlaybackState().then((data => {
            data.platform = "spotify"
            if (data != ""){
                data.url = data.item.external_urls.spotify
                return data
            } else {
                return {}
            }
        }), (error) => {
            console.log(error)
        })
    }
}

YouTube = {
    getYouTubePlaying: () => {
        let returnData = undefined

        chrome.tabs.query({
            audible: true,
            url: [
                "*://*.youtube.com/watch?v=*",
            ]
        }, (tabs) => {
            if (tabs.length > 0){
                code = `[document.getElementsByTagName("video")[0].currentTime, 
                            document.getElementsByTagName('title')[0].text]`
                chrome.tabs.executeScript(
                    tabs[0].id,
                    {code: code},
                    result => {
                        if (result[0] != undefined) {
                            returnData = {
                                timestamp: result[0][0],
                                title: result[0][1],
                                platform: "youtube",
                                url: tabs[0].url
                            }
                        } else {
                            returnData = {}
                        }
                    },
                );
            } else {
                returnData = {}
            }
        })

        return new Promise(function (resolve, reject) {
            (function waitForReturnData(){
                if (returnData != undefined) {
                    return resolve(returnData)
                };
                setTimeout(waitForReturnData, 30);
            })();
        });
    }
}
Soundcloud = {
    getSoundcloudPlaying: () => {
        let returnData = undefined

        chrome.tabs.query({
            audible: true,
            url: [
                "*://*.soundcloud.com/*",
            ]
        }, (tabs) => {
            if (tabs.length > 0){
                code = `[document.getElementsByClassName("playbackTimeline__timePassed")[0].children[1].innerText,
                            document.getElementsByTagName('title')[0].text, document.getElementsByClassName("playbackSoundBadge__titleLink sc-truncate")[0].href]`               
                 
                chrome.tabs.executeScript(
                    tabs[0].id,
                    {code: code},
                    result => {
                        if (result[0] != undefined) {
                            returnData = {
                                timestamp: result[0][0],
                                title: result[0][1],
                                platform: "soundcloud",
                                url: tabs[0].url
                            }
                        } else {
                            returnData = {}
                        }
                    },
                );
            } else {
                returnData = {}
            }
        })

        return new Promise(function (resolve, reject) {
            (function waitForReturnData(){
                if (returnData != undefined) {
                    return resolve(returnData)
                };
                setTimeout(waitForReturnData, 30);
            })();
        });
    }
}
