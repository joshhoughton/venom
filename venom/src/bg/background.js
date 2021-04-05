var url;

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
        if (!url.includes('t=')){
            url += "&t=" + Math.floor(timestamp)
        }

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
    }
});



chrome.browserAction.onClicked.addListener(function(tab) {
    setBadge("");
    chrome.tabs.create({url: chrome.runtime.getURL("src/popup/popup.html")})

    `chrome.storage.local.get(['timestamps'], function(result) {
        timestamps = result.timestamps


        // Sort timestamps by creation timestamp
        timestamps.sort((a,b) => (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0))

        for (let index = 0; index < timestamps.length; index++) {
            const element = timestamps[index];
            // Convert timestamp to date string
            timestamps[index][2] = new Date(element[2]).toLocaleString().replace(/,/g, '-')
            timestamps[index][3] = encodeURIComponent(timestamps[index][3])            
        }


        // Create csv from timestamps array
        timestamps = timestamps.map(v => v.join(',')).join('\n')

        console.log(timestamps)
        chrome.downloads.download({    
            url: "data:text/csv;charset=utf-8,Title,Timestamp,Date,Link\n" + timestamps,
            filename: "VenomBookmarks.csv",
        });

        
    });`
});