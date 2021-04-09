var url;
var nonce = ''
var codeChallenge;
var spotifyApi = new SpotifyWebApi();

const SPOTIFY_CLIENT_ID = "f319265e92254279b9f28d543794ef84"
const SPOTIFY_REDIRECT_URI = chrome.identity.getRedirectURL("spotify")
const SPOTIFY_SCOPE = "user-read-playback-state"



function saveTimestamp(result) {
    /*
        Method to write a video object to Chrome's local 
        storage. 
    */
    if (url.includes("youtube.com")){
        [title, timestampString, url] = Parser.parseYouTube(result)
    } else if (url.includes("soundcloud.com")) {
        [title, timestampString, url] = Parser.parseSoundCloud(result)
    } else if (url.includes("spotify.com")){
        [title, timestampString, url] = Parser.parseSpotify(result)
    }

    // Create video object
    video = [
        title,
        timestampString,
        new Date().getTime(),
        url
    ]

    chrome.storage.local.get(['timestamps'], function(result) {

        timestamps = result.timestamps
        
        if (timestamps === undefined){
            chrome.storage.local.set({timestamps: []}, function() {});
        } else {
            timestamps.push(video)
            chrome.storage.local.set({timestamps: timestamps}, function() {});
        }
    });

    Badge.getBadge((result) => {
        badge = result.badge

        if (badge === ''){
            badge = 0;
        }

        Badge.setBadge(badge + 1)
    })

    // Notify of success
    chrome.notifications.create('', {
        title: 'Bookmarked',
        message: `${timestampString} - ${title}`,
        type: 'basic',
        iconUrl: 'icons/icon128.png'
    });
}

// Listens for hotkey
chrome.commands.onCommand.addListener(function(command) {
    if (command === "record-timestamp"){

        // Find tabs that are audible YouTube videos or Soundcloud songs
        chrome.tabs.query({
            audible: true,
            url: [
                "*://*.youtube.com/watch?v=*",
                "*://*.soundcloud.com/*"
            ]
        }, (tabs) => {
            if (tabs.length > 0){
                url = tabs[0].url
                if (url.includes("youtube.com")){
                    code = `[document.getElementsByTagName("video")[0].currentTime, document.getElementsByTagName('title')[0].text]`
                } else if (url.includes("soundcloud.com")){
                    code = `[document.getElementsByClassName("playbackTimeline__timePassed")[0].children[1].innerText
                    , document.getElementsByTagName('title')[0].text, document.getElementsByClassName("playbackSoundBadge__titleLink sc-truncate")[0].href]`
                }

                var executing = chrome.tabs.executeScript(
                    tabs[0].id,
                    {code: code},
                    saveTimestamp,
                );
            } else {
                chrome.storage.sync.get(['spotifyCredentials'], function(result) {
                    spotifyCredentials = result.spotifyCredentials
                    console.log(spotifyCredentials)
        
                    if (spotifyCredentials){
                        if (spotifyCredentials.expires < new Date().getTime()){
                             params = new URLSearchParams({
                                client_id: SPOTIFY_CLIENT_ID,
                                grant_type: "refresh_token",
                                refresh_token: spotifyCredentials.refresh_token
                            })
        
                            console.log(new URLSearchParams(params).toString())
            
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
                                console.log(data)
                            })
                        }
        
                        spotifyApi.setAccessToken(spotifyCredentials.access_token)
                        spotifyApi.getMyCurrentPlaybackState().then((data) => {
                            if (data) {
                                url = data.item.external_urls.spotify
                                saveTimestamp(data)
                            } else {
                                chrome.notifications.create('', {
                                    title: 'Error',
                                    message: `Cannot find a playing instance of YouTube, SoundCloud or Spotify.`,
                                    type: 'basic',
                                    iconUrl: 'icons/icon128.png'
                                })
                            }
                        })
                    } else {
                        chrome.notifications.create('', {
                            title: 'Error',
                            message: `Cannot find a playing YouTube or SoundCloud tab.`,
                            type: 'basic',
                            iconUrl: 'icons/icon128.png'
                        });
                    }
                    
                });
            }
        })
    }
});


chrome.browserAction.onClicked.addListener(function(tab) {
    Badge.setBadge("");
    chrome.tabs.create({url: chrome.runtime.getURL("src/bookmarks/bookmarks.html")})
});




chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.message.title === 'login') {
        
        // Generate Nonce
        for (let i=0; i<6; i++){
            nonce += Math.random().toString(36).substring(2, 15)
        }
        
        Encrypt.sha256(nonce).then((hashed) => {
            codeChallenge = Encrypt.base64urlencode(hashed)
        })

        setTimeout(function(){

            chrome.identity.launchWebAuthFlow({
                url: Endpoint.create_auth_endpoint(SPOTIFY_CLIENT_ID, SPOTIFY_SCOPE, SPOTIFY_REDIRECT_URI),
                interactive: true
            }, function (redirect_uri) {
                if (chrome.runtime.lastError || redirect_uri.includes('access_denied')) {
                    chrome.notifications.create('', {
                        title: 'Error',
                        message: `Failed to login to Spotify: ${chrome.runtime.lastError.message}`,
                        type: 'basic',
                        iconUrl: 'icons/icon128.png'
                    });
                } else {
                    url = new URL(redirect_uri)
                    
                    code = url.searchParams.get('code')
    
                
                    params = new URLSearchParams({
                        client_id: SPOTIFY_CLIENT_ID,
                        grant_type: "authorization_code",
                        code: code,
                        redirect_uri: SPOTIFY_REDIRECT_URI,
                        code_verifier: nonce
                    })

                    console.log(new URLSearchParams(params).toString())
    
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
                        chrome.storage.sync.set({spotifyCredentials: data}, function() {});
                        chrome.notifications.create('', {
                            title: 'Spotify Linked',
                            message: `Your Spotify account is now linked with Venom!`,
                            type: 'basic',
                            iconUrl: 'icons/icon128.png'
                        });
                        console.log(data)
                    })

            }});
        }, 1000);

        return true;
    } else if (request.message.title === 'logout') {
        chrome.storage.sync.remove(['spotifyCredentials'], () => {})
        sendResponse('success');
        console.log('logged out')
    } else if (request.message.title === 'changePlatform') {
        changes = request.message.data

        chrome.storage.sync.set(changes, function() {});

    }
        
});