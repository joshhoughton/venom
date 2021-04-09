Encrypt = {
    sha256: async (plain) => {
        const encoder = new TextEncoder()
        const data = encoder.encode(plain)
      
        return crypto.subtle.digest('SHA-256', data)
    },
    base64urlencode: (a) => {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    
}


Badge = {
    getBadge: (callback) => {
        chrome.storage.local.get(['badge'], callback)
    },
    setBadge: (badge) => {
        chrome.browserAction.setBadgeText({
            text: badge.toString()
        })
        chrome.storage.local.set({badge}, () => {})
    }
}

Endpoint = {
    create_auth_endpoint: (client_id, scope, redirect_uri) => {
        let endpoint_url = [
            'https://accounts.spotify.com/authorize',
            '?response_type=code',
            '&client_id=' + encodeURIComponent(client_id),
            '&scope=' + encodeURIComponent(scope),
            '&redirect_uri=' + encodeURIComponent(redirect_uri),
            '&code_challenge_method=' + encodeURIComponent("S256"),
            '&code_challenge=' + codeChallenge
        ].join('')
    
        return endpoint_url;
    }
}

Parser = {
    parseYouTube: (result) => {
        timestamp = result[0][0]
        title = result[0][1].replace(/,/g, '.')

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

        return [
            title,
            timestampString,
            url
        ]
    },
    parseSoundCloud: (result) => {
        timestamp = result[0][0]

        title = result[0][1].replace(/,/g, '.')

        timestampString = timestamp.toString()

        url = result[0][2] + `#t=` + timestampString

        return [
            title,
            timestampString,
            url
        ]
    },
    parseSpotify: (data) => {
        timestamp = data.progress_ms / 1000
        minutes = Math.floor(timestamp / 60).toString()

        seconds = Math.floor(timestamp % 60)
        seconds = seconds < 10 ? 0 + seconds.toString() : seconds.toString()

        timestampString = minutes + ':' + seconds

        // [Track Name] - [Artist Name] 
        title = [
            data.item.name,
            data.item.artists[0].name
        ].join(" - ")

        url = data.item.external_urls.spotify

        return [
            title,
            timestampString,
            url
        ]
    }

}