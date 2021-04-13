var url;
var tab;
var returnData;
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

    url = result.url || ""
    
    if (url.includes("youtube.com")){
        [title, timestampString, url] = Parser.parseYouTube(result)
    } else if (url.includes("soundcloud.com")) {
        [title, timestampString, url] = Parser.parseSoundCloud(result)
    } else if (url.includes("spotify.com")){
        [title, timestampString, url] = Parser.parseSpotify(result)
    } else {
        return
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
            chrome.storage.local.set({timestamps: [video]}, function() {});
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
        iconUrl: 'icons/icon.png'
    });
}

// Listens for hotkey
chrome.commands.onCommand.addListener(function(command) {
    if (command === "record-timestamp"){
        chrome.storage.sync.get(['spotifyEnabled', 'youtubeEnabled', 'soundcloudEnabled', 'spotifyCredentials'], async function(result) {
            spotifyCredentials = result.spotifyCredentials

            console.log(spotifyCredentials)

            platforms = {
                spotifyEnabled: (result.spotifyEnabled == undefined) ? false : result.spotifyEnabled, 
                youtubeEnabled: (result.youtubeEnabled == undefined) ? true : result.youtubeEnabled,
                soundcloudEnabled: (result.soundcloudEnabled == undefined) ? true : result.soundcloudEnabled 
            }
            

            if (Object.values(platforms).every((s) => !s)){
                chrome.notifications.create('', {
                    title: 'Error',
                    message: `No platforms are selected! See Venom -> Options.`,
                    type: 'basic',
                    iconUrl: 'icons/icon.png'
                });

                return
            }

            Promise.all([
                (platforms.spotifyEnabled) ? Spotify.getSpotifyPlaying(spotifyCredentials) : {}, 
                (platforms.youtubeEnabled) ? YouTube.getYouTubePlaying() : {}, 
                (platforms.soundcloudEnabled) ? Soundcloud.getSoundcloudPlaying() : {}
            ]).then((values) => {
                console.log(values)

                // If user has already been given a notification about linking Spotify account.
                if (values [0] == -1){
                    return
                }

                values = values.filter(obj => obj && Object.keys(obj).length !== 0 && obj.constructor === Object)
                
                if (values.length > 0){
                    saveTimestamp(values[0])
                } else {
                    noMusicFound(platforms)
                }
            })
            
 
        }) 
    }
});


chrome.browserAction.onClicked.addListener(function(tab) {
    Badge.setBadge("");
    chrome.tabs.create({url: chrome.runtime.getURL("src/bookmarks/bookmarks.html")})
});




chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.message.title === 'login') {
        console.log("attempting to login")
        
        // Generate Nonce
        nonce = ""
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
                        iconUrl: 'icons/icon.png'
                    });
                    sendResponse({success: false, error: chrome.runtime.lastError.message})

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
                        if (data.error != undefined){
                            sendResponse({
                                success: false, 
                                error: [data.error, data.error_description].join(" - ")
                            })
                        } else {
                            data.expires = new Date().getTime() + data.expires_in * 1000
                            chrome.storage.sync.set({
                                spotifyCredentials: data,
                                spotifyEnabled: true
                            }, function() {});
                            chrome.notifications.create('', {
                                title: 'Spotify Linked',
                                message: `Your Spotify account is now linked with Venom!`,
                                type: 'basic',
                                iconUrl: 'icons/icon.png'
                            });
                            console.log('success')
                            sendResponse({success: true})
                        }
                    })
            }});
        }, 200);
        
        return true

    } else if (request.message.title === 'logout') {
        chrome.storage.sync.remove(['spotifyCredentials'], () => {})
        chrome.storage.local.set({'spotifyEnabled': false}, (result) => {})
        sendResponse({success: true})

    } else if (request.message.title === 'deleteTimestamp') {
        timestamp = request.message.timestamp

        chrome.storage.local.get(['timestamps'], (result) => {
            chrome.storage.local.set({
                'timestamps': result.timestamps.filter((t) => t[2] != timestamp)
            }, (result) => {})
        })


    }
        
});