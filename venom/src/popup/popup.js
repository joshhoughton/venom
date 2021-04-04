var table = document.getElementById("bookmarkTable")

document.addEventListener("DOMContentLoaded", function(){  
    var table = document.getElementById("bookmarkTable")

    timestamps = chrome.storage.local.get(['timestamps'], (result) => {
        timestamps = result.timestamps
    
        // Sort timestamps by creation timestamp
        timestamps.sort((a,b) => (a[2] > b[2]) ? 1 : ((b[2] > a[2]) ? -1 : 0))
    
        for (let index = 0; index < timestamps.length; index++) {
            const element = timestamps[index];
            // Convert timestamp to date string
            timestamps[index][2] = new Date(element[2]).toLocaleString()
    
            console.log(timestamps[index])
    
            let row = table.insertRow();

            let cell = row.insertCell();
            let aTag = document.createElement('a');
            aTag.setAttribute('href', element[3]);
            aTag.innerText = element[0];
            cell.appendChild(aTag);

            cell = row.insertCell();
            text = document.createTextNode(element[1]);
            cell.appendChild(text);

            cell = row.insertCell();
            text = document.createTextNode(element[2]);
            cell.appendChild(text);


        }
    })

}, false);