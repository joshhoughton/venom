
document.addEventListener("DOMContentLoaded", function(){  
    document.getElementById("exportButton").addEventListener("click", (e) => {
        chrome.storage.local.get(['timestamps'], function(result) {
            timestamps = result.timestamps
            console.log(timestamps)

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
    
            
        });
    });


    var tableBody = document.getElementById("bookmarkTableBody")

    timestamps = chrome.storage.local.get(['timestamps'], (result) => {
        timestamps = result.timestamps

        if (timestamps == undefined){
            row = tableBody.insertRow();

            cell = row.insertCell();

            cell.setAttribute("colspan", "5")
            cell.className = "text-center"
            text = document.createTextNode("nothing to see here yet :) - get started at the Options page");

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
                    console.log("deleted")
                    console.log(chrome.runtime.lastError)
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