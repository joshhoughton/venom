document.addEventListener("DOMContentLoaded", function(){  
    document.getElementById("exportButton").addEventListener("click", (e) => {
        chrome.storage.local.get(['timestamps'], function(result) {
            timestamps = result.timestamps
    
    
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
    
            
        });
    });


    var table = document.getElementById("bookmarkTable")

    timestamps = chrome.storage.local.get(['timestamps'], (result) => {
        timestamps = result.timestamps
    
        // Sort timestamps by creation timestamp
        timestamps.sort((a,b) => (a[2] < b[2]) ? 1 : ((b[2] < a[2]) ? -1 : 0))
    
        for (let index = 0; index < timestamps.length; index++) {
            const element = timestamps[index];
            // Convert timestamp to date string
            //timestamps[index][2] = moment(element[2]).fromNow() //new Date(element[2]).toLocaleString()
            
            console.log(element[3].toLowerCase())
            if (element[3].toLowerCase().includes('spotify.com')) {
                sourceLogoPath = "/icons/sources/spotify.svg"
            }  
            if (element[3].toLowerCase().includes('youtube.com')){
                sourceLogoPath = "/icons/sources/youtube.svg"
            }  
            if (element[3].toLowerCase().includes('soundcloud.com')) {
                sourceLogoPath = "/icons/sources/soundcloud.svg"
            }
    
            let row = table.insertRow();

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

            cell.addEventListener('mouseover', (e) => {
                e.target.innerText = new Date(element[2]).toLocaleString()
            })
            
            cell.addEventListener('mouseout', (e) => {
                e.target.innerText = moment(element[2]).fromNow()
            })

        }
    })

}, false);