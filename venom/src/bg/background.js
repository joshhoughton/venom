var url;
var nonce = ''
var codeChallenge;
var spotifyApi = new SpotifyWebApi();

const SPOTIFY_CLIENT_ID = ""
const SPOTIFY_REDIRECT_URI = chrome.identity.getRedirectURL("spotify")

let spotify_signed_in = false;


async function sha256(plain) {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
  
    return crypto.subtle.digest('SHA-256', data)
}
  
function base64urlencode(a){
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}



function getBadge(callback){
    chrome.storage.local.get(['badge'], callback)
}

function setBadge(badge){
    chrome.browserAction.setBadgeText({
        text: badge.toString()
    })
    chrome.storage.local.set({badge}, () => {})
}

getBadge((result) => {
    badge = result.badge

    if (badge == undefined || badge == NaN){
        setBadge(0)
    }
})


function saveTimestamp(result) {
    /*
        Method to write a video object to Chrome's local 
        storage. 
    */


    timestamp = result[0][0]

    // Remove commas (otherwise conflicts with .csv)
    title = result[0][1].replace(/,/g, '.')

    if (url.includes("youtube.com")){
        // Remove YouTube notification count at the start of <title>
        if (title.startsWith("(")){
            n = title.search(/\)/)
            title = title.slice(n + 1)
        }

        // Remove '- YouTube' from <title>
        if (title.endsWith(" - YouTube")){
            n = title.search(/ - YouTube/)
            title = title.slice(0, n)
        }

        // Add time argument to URL if it doesn't already exist
        url = url.replace(/&t=\d*/gm, `&t=${Math.floor(timestamp)}`)

        // Convert timestamp in seconds to "mm:ss"
        minutes = Math.floor(timestamp / 60).toString()

        seconds = Math.floor(timestamp % 60)
        seconds = seconds < 10 ? 0 + seconds.toString() : seconds.toString()

        timestampString = minutes + ':' + seconds

        
    } else if (url.includes("soundcloud.com")){
        timestampString = timestamp.toString()

        url = result[0][2] + `#t=` + timestampString
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

    getBadge((result) => {
        badge = result.badge

        if (badge === ''){
            badge = 0;
        }

        setBadge(badge + 1)
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
                chrome.notifications.create('', {
                    title: 'Error',
                    message: `Cannot find a playing YouTube or Soundcloud tab.`,
                    type: 'basic',
                    iconUrl: 'icons/icon128.png'
                });
            }
        })
    } else if (command === "record-spotify"){
        chrome.storage.sync.get(['spotifyCredentials'], function(result) {
            spotifyCredentials = result.spotifyCredentials
            console.log(spotifyCredentials)

            if (spotifyCredentials){
                spotifyApi.setAccessToken(spotifyCredentials.access_token)
                spotifyApi.getMyCurrentPlaybackState().then(
                    function (data) {
                        console.log(data)
                        // Convert timestamp in seconds to "mm:ss"
                        timestamp = data.progress_ms / 1000
                        minutes = Math.floor(timestamp / 60).toString()

                        seconds = Math.floor(timestamp % 60)
                        seconds = seconds < 10 ? 0 + seconds.toString() : seconds.toString()

                        timestampString = minutes + ':' + seconds
                        video = [
                            data.item.name,
                            timestampString,
                            new Date().getTime(),
                            data.item.external_urls.spotify
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
                    },
                );
                /*if ((new Date().getTime() - spotifyCredentials.now) > spotifyCredentials.expires_in * 1000){
                    //refreshSpotify()
                } else {
                    console.log(24)
                    
                }*/
            }
        });


 
    }
});




chrome.browserAction.onClicked.addListener(function(tab) {
    setBadge("");
    chrome.tabs.create({url: chrome.runtime.getURL("src/bookmarks/bookmarks.html")})
});



function create_auth_endpoint() {
    let endpoint_url = [
        'https://accounts.spotify.com/authorize',
        '?response_type=code',
        '&client_id=' + encodeURIComponent('f319265e92254279b9f28d543794ef84'),
        '&scope=' + encodeURIComponent('user-read-playback-state'),
        '&redirect_uri=' + encodeURIComponent(SPOTIFY_REDIRECT_URI),
        '&code_challenge_method=' + encodeURIComponent("S256"),
        '&code_challenge=' + codeChallenge
    ].join('')

    console.log(encodeURIComponent(codeChallenge))
    console.log(endpoint_url)
    return endpoint_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        for (let i=0; i<6; i++){
            nonce += Math.random().toString(36).substring(2, 15)
        }
        
        console.log(nonce.length)
        sha256(nonce).then((hashed) => {
            codeChallenge = base64urlencode(hashed)
        })

        setTimeout(function(){

            chrome.identity.launchWebAuthFlow({
                url: create_auth_endpoint(),
                interactive: true
            }, function (redirect_uri) {
                if (chrome.runtime.lastError || redirect_uri.includes('access_denied')) {
    
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
                        data.now = new Date().getTime()
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
    } else if (request.message === 'logout') {
        spotify_signed_in = false;

        sendResponse('success');
    }
});