// local storage to keep data
let storage = [];

// user location
let userLocation = {};

// next page URL for lazy pagination
let nextPageUrl = '';

// flag to check if a lazy pagination request is already running
let isLazyPaginationStarted = false;

// function to get longtitude and latitude from geolocation.onetrust.com
// @return location object
// { "country":"US"
//  , "state":"OH"
//  , "stateName":"Ohio"
//  , "zipcode":"45236"
//  , "timezone":"America/New_York"
//  , "latitude":"39.20410"
//  , "longitude":"-84.39680"
//  , "city":"Cincinnati"
//  , "continent":"NA"
//  })
const getUserLocation = (location) => userLocation = location;

// function to get an access token
const getAccessToken = () => {
    const url = 'https://api.petfinder.com/v2/oauth2/token';

    const options = {
        method: 'POST',
        headers: new Headers({ 'content-type': 'application/x-www-form-urlencoded' }),
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: 'C7dIlLjDpzyBin3bfbhyCZ70g4NOrJyrSQ1Jk3DhdypHpgLsxC',
            client_secret: 'KUeWq5mspfVrt6dXS1g4xafb1z373SCJiDETZfEr'
        })
    }
    // fetch response from server
    return fetch(url, options)
        // transform response to object
        .then(response => response.json())
}

// function to convert animal object to HTML-fragment
const animalCard = animal =>
    `<div class="pf-search-column col-lg-3 col-md-4">
    <div class="card animal-card" onclick="showAnimalInfo(${animal.id})" data-bs-toggle="modal" data-bs-target="#pf-animal-modal">
        <div class="card-media">
            <img src="${(animal.primary_photo_cropped !== null && 'small' in animal.primary_photo_cropped) ? animal.primary_photo_cropped.small : 'images/card-placeholder.png'}"
            class="card-img" alt="${animal.name}-image">
        </div>
        <div class="card-body">
            <h5 class="card-title">${animal.name}</h5>
            <p class="card-text">${animal.age} - ${(animal.breeds.mixed) ? 'Mixed Breed' : animal.breeds.primary}</p>
            <p class="card-text"><small class="text-muted">${(animal.distance === null) ? '' : Math.ceil(animal.distance) + ' mile away'}</small></p>
        </div>
    </div>
</div>`
// function to store data
const storeData = data => {
    if (storage.length > 0) {
        storage = storage.concat(data.animals.slice());
    } else {
        storage = data.animals.slice();
    }
    return storage;
}

// function to display results
const displayResults = data => {
    let location = document.getElementById('pf-search-location').value;
    if (location === '') {
        location = userLocation.city + ', ' + userLocation.state;
    }
    // check if server response has a link to the next page
    nextPageUrl = ('next' in data.pagination._links && 'href' in data.pagination._links.next) ? `https://api.petfinder.com${data.pagination._links.next.href}` : '';

    // put search results into DOM
    document.getElementById('pf-result-heading').innerHTML = `We found ${data.pagination.total_count} pets near ${location}`;
    document.getElementById('pf-animal-cards').innerHTML += data.animals.map(animal => animalCard(animal)).join('');

    // hide loading overlay at the end
    bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingOverlay')).hide();

    return data;
}

// function to perform search request on PetFinder.com
const pfSearch = (token, url) => {

    const options = {
        method: 'GET',
        headers: new Headers({ 'Authorization': `Bearer ${token.access_token}` })
    }

    fetch(url, options)
        // transform response to data-object
        .then(response => response.json())
        // transform data-object to animal cards
        .then(data => displayResults(data))
        // store data
        .then(data => storeData(data))
}

// main function to search and display result
const myFetch = (url) => {
    // use Promise to ENSURE we get the access token before using it in other fetch-request
    new Promise((resolve) => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('loadingOverlay')).show();
        resolve('Ok');
    })
        // get an access token asynchronously
        .then(() => getAccessToken())
        .then(token => pfSearch(token, url))
        .finally(() => isLazyPaginationStarted = false);

}

// function to perform initial search by criteria
const petFinder = () => {
    // clear animal results
    document.getElementById('pf-animal-cards').innerHTML = '';
    document.getElementById('pf-result-heading').innerHTML = '';
    // form search parameters
    const parameters = [];
    const type = document.getElementById('pf-search-category').value;
    if (type !== "") {
        parameters.push('type=' + type);
    }
    const distance = document.getElementById('pf-search-distance').value;
    if (distance !== "") {
        parameters.push('distance=' + distance);
    }
    const location = document.getElementById('pf-search-location').value;
    if (location !== "") {
        parameters.push('location=' + location);
    } else {
        parameters.push('location=' + userLocation.city + ', ' + userLocation.state);
    }
    // use encodeURI to encode space characters in location (city, state)
    const url = encodeURI(`https://api.petfinder.com/v2/animals?${parameters.join('&')}`);
    // 
    myFetch(url);
}

// function to convert animal photo to HTML-fragment
const animalPhoto = (src, alt, isActive) =>
    `<div class="carousel-item ${isActive ? 'active' : ''} photo-item">
    <div class="card-media">
        <img src="${src}"
            class="card-img d-block w-100" alt="${alt}">
    </div>
</div>`;

// function to show detailed information about pet in the modal window
const showAnimalInfo = id => {
    const animal = storage.find(element => element.id === id);
    if (Object.keys(animal).length === 0) {
        return;
    }

    const photos = animal.photos.map((photo, index) => animalPhoto(photo.large, animal.name + '-photo-' + index, index === 0)).join('');

    document.getElementById('pf-animal-details').innerHTML =
        `<div class="modal-header">
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body p-0">
            <!-- Carousel -->
            <div id="pf-animal-photos" class="carousel carousel-dark slide" data-bs-ride="carousel">
                <div class="carousel-inner">${photos}</div>
                <button class="carousel-control-prev" type="button" data-bs-target="#pf-animal-photos"
                    data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#pf-animal-photos"
                    data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                </button>
            </div>
            <!-- About Info -->
            <div class="animal-details">
                <h2>Meet ${animal.name}</h2>
                <p>${(animal.breeds.mixed) ? 'Mixed Breed' : animal.breeds.primary} &#65121; ${animal.contact.address.city}, ${animal.contact.address.state}</p>
                <p>${animal.age} &#65121; ${animal.gender} &#65121; ${animal.size} &#65121; ${Object.values(animal.colors).filter(color => color !== null).join(', ')}</p>
                <h4>About</h4>
                <p>${animal.description}</p>
                <h4>Characteristics</h4>
                <p>${animal.tags.join(', ')}</p>
                <h4>Good in a home with</h4>
                <p>${Object.entries(animal.environment).filter((env) => env[1] === true).map((env) => env[0]).join(', ')}</p>
                <h4>Prefers a home without</h4>
                <p>${Object.entries(animal.environment).filter((env) => env[1] === false).map((env) => env[0]).join(', ')}</p>
            </div>
        </div>
        <div class="modal-footer">
            <a href="${animal.url}" target="_blank" class="btn btn-primary" role="button">More About ${animal.name} on Petfinder</a>
        </div>`
}

// function to get the list of location suggestions for user input
const setLocation = (event) => {
    const input = event.target;
    // get suggestions when input more than 2 characters
    if (input.value.length > 2) {
        const url = `https://www.petfinder.com/v2/geography/search/?q=${input.value}&lat=${userLocation.latitude}&lng=${userLocation.longitude}`;
        // fetch request to get allowed locations from PetFinder.com
        fetch(url)
            // transform response to data-object
            .then((res) => res.json())
            // transform data to HTML-fragments of Datalist options
            .then((data) => data.locations.map((loc) => `<option value="${loc.display_name}">`).join(''))
            // put options to Datalist
            .then((options) => document.getElementById('locationOptions').innerHTML = options)
            // Problem: browser attempts to show the datalist before the options are put into Datalist.
            // This results in the list not being shown or sometimes a partial list being shown
            // Workaround: trigger a refresh of the rendered datalist using focus()
            // Source: https://stackoverflow.com/questions/26610752/how-do-you-refresh-an-html5-datalist-using-javascript
            .finally(() => setTimeout(() => input.focus(), 100))
    }
}

const startSearch = (event) => {
    switch (event.currentTarget.id) {
        case 'search-button':
            // save selected location to sessionStorage
            window.sessionStorage.setItem('location', document.getElementById('search-location').value);
            break;
        case 'dog-feature':
        case 'cat-feature':
        case 'rabbit-feature':
        case 'small-furry-feature':
        case 'horse-feature':
        case 'bird-feature':
        case 'scales-fins-other':
        case 'barnyard-feature':
            // save selected animal type to sessionStorage
            window.sessionStorage.setItem('type', event.currentTarget.dataset.pfType);
            break;
    }
    window.location.href = './petfinder.html';
}
// scroll event that calls a 'myFetch(nextPageUrl)' function if the scrolled height is bigger than the whole scroll height of the body minus 5 pixels.
// source: https://javascript.plainenglish.io/building-an-infinite-scroll-with-vanilla-javascript-32810bae9a8c
const lazyPagination = () => {
    const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight > scrollHeight - 5 && nextPageUrl !== '' && !isLazyPaginationStarted) {
        isLazyPaginationStarted = true;
        myFetch(nextPageUrl);
    }
}

// function to identify name of the loaded page and perform particular actions
window.addEventListener('load', (event) => {
    let pathArray = window.location.pathname.split('/');
    switch (pathArray[pathArray.length - 1]) {
        case 'petfinder.html':
            // start search function by clicking on the 'Search' button
            document.getElementById('pf-search-btn').addEventListener('click', petFinder);
            // trigger location suggestions for user input
            document.getElementById('pf-search-location').addEventListener('input', setLocation);

            // the scroll event
            window.addEventListener('scroll', lazyPagination);

            // get saved data from sessionStorage
            document.getElementById('pf-search-location').value = window.sessionStorage.getItem('location');
            document.getElementById('pf-search-category').value = window.sessionStorage.getItem('type');
            petFinder();
            break;
        case 'contact.html':
            break;
        default:
            // remove all saved data from sessionStorage
            sessionStorage.clear();
            // trigger location suggestions for user input
            document.getElementById('search-location').addEventListener('input', setLocation);
            // collect all search items and trigger 'startSearch' function for each of them on click
            document.querySelectorAll('.search-item')
                .forEach(element => element.addEventListener('click', startSearch));
            // toggle 'other pets' dropdown list by clicking
            document.querySelectorAll('.other-pets')
                .forEach(element => element.addEventListener('click', () =>
                    bootstrap.Dropdown.getOrCreateInstance(document.getElementById('other-pets-dropdown')).toggle()
                ));
            break;
    }
})

