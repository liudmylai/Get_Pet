// local storage to keep data
const storage = [];


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
    <div class="card">
        <div class="card-media">
            <img src="${(animal.primary_photo_cropped !== null && 'small' in animal.primary_photo_cropped) ? animal.primary_photo_cropped.small : 'images/card-placeholder.png'}"
            class="card-img" alt="${animal.name}-image">
        </div>
        <div class="card-body">
            <h5 class="card-title">${animal.name}</h5>
            <p class="card-text">${animal.age} - ${(animal.breeds.mixed) ? 'Mixed Breed' : animal.breeds.primary}</p>
            <p class="card-text"><small class="text-muted">${(animal.distance === null) ? '' : animal.distance + ' mile away'}</small></p>
        </div>
    </div>
</div>`
// function to store data
const storeData = data => storage = data.animals.slice();

// function to display results
const displayResults = data => {
    document.getElementById('pf-result-heading').innerHTML = `We found ${data.pagination.total_count} pets`;
    document.getElementById('pf-animal-cards').innerHTML = data.animals.map(animal => animalCard(animal)).join('');
    return data;
}

// function to perform search request on PetFinder.com
const pfSearch = token => {
    const url = 'https://api.petfinder.com/v2/animals';

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
const petFinder = () => {
    // use Promise to ENSURE we get the access token before using it in other fetch-request
    new Promise((resolve) => resolve(
        // get an access token asynchronously
        getAccessToken()
    ))
        .then(token => pfSearch(token))
}
// function to show detailed information about pet in the modal window
const showAnimalInfo = id => {
    
}

// document.getElementById('pf-search-btn').addEventListener('click', petFinder);
document.getElementById('pf-search-btn').addEventListener('click', showAnimalInfo);
