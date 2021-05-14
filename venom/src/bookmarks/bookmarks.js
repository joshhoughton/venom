var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-197007778-1']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

document.addEventListener("DOMContentLoaded", function(){  
    document.getElementById("exportCSVButton").onclick =  (e) => {
        _gaq.push(['_trackEvent', "export", 'csv'])     

        chrome.storage.local.get(['timestamps'], function(result) {
            document.getElementById("exportSpinner").hidden = false

            timestamps = result.timestamps

            if (timestamps == undefined){
                return
            }
    
    
            // Sort timestamps by creation timestamp
            timestamps.sort((a,b) => (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0))
    
            for (let index = 0; index < timestamps.length; index++) {
                const element = timestamps[index];
                // Convert timestamp to date string
                timestamps[index][0] = element[0].replaceAll('#', '')

                timestamps[index][2] = new Date(element[2]).toLocaleString().replace(/,/g, '-')
                timestamps[index][3] = encodeURIComponent(timestamps[index][3])            
            }
    
    
            // Create csv from timestamps array
            timestamps = timestamps.map(v => v.join(',')).join('\n')
    
            chrome.downloads.download({    
                url: "data:text/csv;charset=utf-8,Title,Timestamp,Date,Link\n" + timestamps,
                filename: "VenomBookmarks.csv",
            });
            
            setTimeout(() => {
                document.getElementById("exportSpinner").hidden = true
            }, 1500)
            
        });
    };

    document.getElementById("exportSpotifyButton").onclick = (e) => {
        _gaq.push(['_trackEvent', "export", 'spotify']);

        chrome.storage.local.get(['timestamps'], function(result) {
            timestamps = result.timestamps

            if (timestamps == undefined){
                return
            }
    
            // Sort timestamps by creation timestamp
            timestamps.sort((a,b) => (a[2] < b[2]) ? 1 : ((b[2] < a[2]) ? -1 : 0))

            // Get first 100 Spotify links
            spotifyBookmarks = timestamps.filter(e => e[3].includes("spotify.com")).slice(0,99)

            // Convert Song URL to spotify:track:ID
            uris = spotifyBookmarks.map(e => `spotify:track:${e[3].split("/").reverse()[0]}`)

            console.log(uris)
            document.getElementById("exportSpinner").hidden = false

            chrome.runtime.sendMessage({ message: {
                title: 'saveToPlaylist',
                uris: uris
            } }, function (response) {
                setTimeout(function(){
                    document.getElementById("exportSpinner").hidden = true
                }, 2000);
            }); 
        });
    };


    var tableBody = document.getElementById("bookmarkTableBody")

    timestamps = chrome.storage.local.get(['timestamps'], (result) => {
        timestamps = result.timestamps

        if (timestamps == undefined){
            row = tableBody.insertRow();

            cell = row.insertCell();

            cell.setAttribute("colspan", "5")
            cell.className = "text-center"
            text = document.createTextNode("Nothing to see here yet! Get started at the Options page.");

            cell.appendChild(text)
            row.appendChild(cell)
        
            return

        }
    
        // Sort timestamps by creation timestamp
        timestamps.sort((a,b) => (a[2] < b[2]) ? 1 : ((b[2] < a[2]) ? -1 : 0))
    
        for (let index = 0; index < timestamps.length; index++) {
            const element = timestamps[index];
            // Convert timestamp to date string
            //timestamps[index][2] = moment(element[2]).fromNow() //new Date(element[2]).toLocaleString()
            
            if (element[3].toLowerCase().includes('spotify.com')) {
                sourceLogoPath = "/icons/sources/spotify.svg"
            }  
            if (element[3].toLowerCase().includes('youtube.com')){
                sourceLogoPath = "/icons/sources/youtube.svg"
            }  
            if (element[3].toLowerCase().includes('soundcloud.com')) {
                sourceLogoPath = "/icons/sources/soundcloud.svg"
            }
    
            let row = tableBody.insertRow();

            let cell = row.insertCell();

            let img = document.createElement('img')
            img.src = sourceLogoPath
            img.style = "height: 1.1em; text-align: center;"
            cell.appendChild(img);

            cell = row.insertCell();

            let aTag = document.createElement('a');
            aTag.setAttribute('href', element[3]);
            aTag.innerText = element[0];
            cell.appendChild(aTag);



            cell = row.insertCell();
            text = document.createTextNode(element[1]);
            cell.appendChild(text);

            cell = row.insertCell();
            text = document.createTextNode(moment(element[2]).fromNow());
            cell.appendChild(text);


            cell = row.insertCell();

            img = document.createElement('img')
            img.src = "/icons/delete.svg"
            img.style = "height: 1em; text-align: center;"

            button = document.createElement('button');
            button.className = "btn btn-outline-danger btn-sm"

            button.onclick = e => {
                row.hidden = true
                chrome.runtime.sendMessage({ message: {
                    title: 'deleteTimestamp',
                    timestamp: element[2]
                } }, function (response) {
                });
            }
            button.appendChild(img);

            cell.appendChild(button);

            /*cell = row.insertCell();

            img = document.createElement('img')
            img.src = "/icons/delete.svg"
            img.style = "height: 1.1em; text-align: center;"

            aTag = document.createElement('a');
            aTag.onclick = e => {
                chrome.runtime.sendMessage({ message: {
                    title: 'deleteTimestamp',
                    timestamp: element[2]
                } }, function (response) {
                    row.hidden = true
                });
            }
            aTag.appendChild(img);

            cell.appendChild(aTag);*/

        }
    })

}, false);