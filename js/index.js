const API_KEY = 'AIzaSyAoAkGRUX9TB05e6gmopx05henKIjD7xE8'
const CLIENT_ID = '200853775612-h6p2s02etv2h60bod1aln0eb2e1mck3d.apps.googleusercontent.com'

const content = document.querySelector('.content')
const navMenuMore = document.querySelector('.nav-menu-more')
const showMore = document.querySelector('.show-more')
const formSearch = document.querySelector('.form-search')
const subscriptionsList = document.querySelector('.subscriptions-list')
const navLinkLiked = document.querySelectorAll('.nav-link-liked')

const createCard = (dataVideo) => {
    const imgUrl = dataVideo.snippet.thumbnails.high.url
    const videoId = typeof dataVideo.id === 'string' ? dataVideo.id : dataVideo.id.videoId
    const titleVideo = dataVideo.snippet.title
    const viewCount = dataVideo.statistics && dataVideo.statistics.viewCount
    const dateVideo = dataVideo.snippet.publishedAt
    const channelTitle = dataVideo.snippet.channelTitle

    const card = document.createElement('li')
    card.classList.add('video-card')
    card.innerHTML = `    
            <div class="video-thumb">
              <a class="link-video youtube-modal" href="https://youtu.be/${videoId}">
                <img src=${imgUrl} alt="" class="thumbnail">
              </a>

            </div>
            <!-- /.video-thumb -->
            <h3 class="video-title">${titleVideo}</h3>
            <div class="video-info">
              <span class="video-counter">
                ${viewCount ? `<span class="video-views">${getViewer(viewCount)}</span>` : ''}
                <span class="video-date">${getDate(new Date(dateVideo))}</span>
              </span>
              <span class="video-channel">${channelTitle}</span>
            </div>
            <!-- /.video-info -->
            <!-- /.video-card -->          
    `
    return card
}

const createList = (listVideo, title, clear) => {

    const channel = document.createElement('section')
    channel.classList.add('channel')

    if (clear) {
        content.textContent = ''
    }

    if (title) {
        const header = document.createElement('h2')
        header.textContent = title
        channel.insertAdjacentElement('afterbegin', header)
    }

    const wrapper = document.createElement('ul')
    wrapper.classList.add('video-list')
    channel.insertAdjacentElement('beforeend', wrapper)

    listVideo.forEach(item => {
        wrapper.append(createCard(item))
    })

    content.insertAdjacentElement('beforeend', channel)
}

const createSubList = listVideo => {
    subscriptionsList.textContent = ''
    listVideo.forEach(item => {
        const {resourceId:{channelId:id}, title, thumbnails:{high:{url}}} = item.snippet
        const html = `
        <li class="nav-item">
          <a href="#" class="nav-link" data-channel-id="${id}" data-channel-title="${title}">
            <img src="${url}" alt="${title}" class="nav-image">
            <span class="nav-text">${title}</span>
          </a>
        </li>
        `
        subscriptionsList.insertAdjacentHTML('beforeend', html)
    })
}

const currentDay  = Date.parse(new Date())

const getDate = (date)=>{
    const currentDay  = Date.parse(new Date())
    const days = Math.round((currentDay-Date.parse(date))/86400000)

    if (days>30){
        if (days>60){
            if (days>365){
                if (days>730){
                    return Math.round(days/365)+' years ago'
                }
                return 'One year ago'
            }
            return Math.round(days/30)+' months ago'
        }
        return 'One month ago'
    }
    if (days>1){
        return Math.round(days)+' days ago'
    }
    return 'One day ago'
}

const getViewer = count =>{
    if(count>1000000){
        return Math.round(count/1000000)+' M views'
    }

    if(count>1000){
        return Math.round(count/1000)+' K views'
    }
    return count+' views'
}


// youtube API

const authBtn = document.querySelector('.auth-btn')
const userAvatar = document.querySelector('.user-avatar')

const handleSuccessAuth = data => {
    authBtn.classList.add('hide')
    userAvatar.classList.remove('hide')
    userAvatar.src = data.getImageUrl()
    userAvatar.alt = data.getName()

    requestSubscriptions(createSubList,12)
}

const handleNoAuth = () => {
    authBtn.classList.remove('hide')
    userAvatar.classList.add('hide')
    userAvatar.src = ''
    userAvatar.alt = ''
}

const handleAuth = () => {
    gapi.auth2.getAuthInstance().signIn()
}

const handleSignOut = () => {
    gapi.auth2.getAuthInstance().signOut()
}

const updateStatusAuth = (data) => {
    data.isSignedIn.listen(() => {
        updateStatusAuth(data)
    })
    if (data.isSignedIn.get()) {
        const userData = data.currentUser.get().getBasicProfile()
        handleSuccessAuth(userData)
    } else {
        handleNoAuth()
    }
}

function initClient() {
    gapi.client.init({
        'apiKey': API_KEY,
        'clientId': CLIENT_ID,
        'scope': 'https://www.googleapis.com/auth/youtube.readonly',
        'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest']
    })
        .then(() => {
            updateStatusAuth(gapi.auth2.getAuthInstance())
            authBtn.addEventListener('click', handleAuth)
            userAvatar.addEventListener('click', handleSignOut)
        })
        .then(loadScreen)
        .catch(e => {
            console.warn(e)
        })
}

gapi.load('client:auth2', initClient)

const getChanel = () => {
    gapi.client.youtube.channels.list({
        part: 'snippet, statistics',
        id: 'UCkEX8Z3U8TQBDwBvUCPQhoQ'
    }).execute((response) => {
        console.log(response)
    })
}

const requestVideos = (channelId, callback, maxResults = 6) => {
    gapi.client.youtube.search.list({
        part: 'snippet',
        channelId,
        maxResults,
        order: 'date'
    }).execute(response => {
        callback(response.items)
    })
}

const requestTrending = (callback, maxResults = 6) => {
    gapi.client.youtube.videos.list({
        part: 'snippet, statistics',
        chart: 'mostPopular',
        regionCode: 'RU',
        maxResults
    }).execute(response => {
        callback(response.items)
    })
}

const requestMusic = (callback, maxResults = 6) => {
    gapi.client.youtube.videos.list({
        part: 'snippet, statistics',
        chart: 'mostPopular',
        regionCode: 'RU',
        maxResults,
        videoCategoryId: '10'
    }).execute(response => {
        callback(response.items)
    })
}

const requestSearch = (searchText, callback, maxResults = 12) => {
    gapi.client.youtube.search.list({
        part: 'snippet',
        q: searchText,
        maxResults,
        order: 'relevance'
    }).execute(response => {
        callback(response.items)
    })
}

const requestSubscriptions = (callback, maxResults = 6) => {
    gapi.client.youtube.subscriptions.list({
        part: 'snippet',
        mine: true,
        maxResults,
        order: 'unread'
    }).execute(response => {
        callback(response.items)
    })
}

const requestLiked = (callback, maxResults = 6)=>{
    gapi.client.youtube.videos.list({
        part: 'snippet, statistics',
        maxResults,
        myRating: 'like'
    }).execute(response => {
        callback(response.items)
    })
}

const loadScreen = () => {

    requestVideos('UCkEX8Z3U8TQBDwBvUCPQhoQ', data => {
        content.textContent = ''
        createList(data, 'Best Workout Music')

        requestTrending(data => {
            createList(data, 'Trending')

            requestMusic(data => {
                createList(data, 'Music')
            })
        })
    })
}

formSearch.addEventListener('submit', (e) => {
    e.preventDefault()
    requestSearch(formSearch.elements.search.value, data => {
        createList(data, 'Search results ', true)
    })
})

showMore.addEventListener('click', (e) => {
    e.preventDefault()
    navMenuMore.classList.toggle('nav-menu-more-show')
})

subscriptionsList.addEventListener('click', e=>{
    e.preventDefault()
    const channelLink = e.target.closest('.nav-link')
    const channelId = channelLink.dataset.channelId
    const channelTitle = channelLink.dataset.channelTitle
    requestVideos(channelId, data => {
        createList(data, channelTitle, true)
    }, 12)
})

navLinkLiked.forEach(elem=> {
    elem.addEventListener('click', (e) => {
        e.preventDefault()
        requestLiked(data => {
            createList(data, 'Search results ', true)
        }, 12)
    })
})


