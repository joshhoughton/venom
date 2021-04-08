document.addEventListener("DOMContentLoaded", function(){  
    button = document.getElementById("loginSpotifyButton")
    console.log(button)

    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ message: 'login' }, function (response) {
            console.log(response)
        });
    });

}, false);


