const firebaseConfig = {
  apiKey: "AIzaSyCOEpz-LCmMsvoDOkH6CdqUsAfh42DTmug",
  authDomain: "tidy-towns-litter-tracker.firebaseapp.com",
  databaseURL: "https://tidy-towns-litter-tracker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "tidy-towns-litter-tracker",
  storageBucket: "tidy-towns-litter-tracker.appspot.com",
  messagingSenderId: "532639980959",
  appId: "1:532639980959:web:a62234e579947ce5a831aa",
  measurementId: "G-SZZW59VS4Q"
};

firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();

const database = firebase.database();

var markers = {};

document.addEventListener('DOMContentLoaded', function () {
  var map = L.map('map');
  
  database.ref('pins/').on('value', (snapshot) => {
  const pinData = snapshot.val();
  for (const pinId in pinData) {
    if (!markers[pinId]) {
      const pin = pinData[pinId];
      const marker = addPin(map, [pin.latitude, pin.longitude], pin.comment, pin.id);
      markers[pinId] = marker;
    }
  }
});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  setMapViewToFaithlegg(map);
  setMapViewToUserLocationAndAddPin(map);
  enableManualPinDrop(map);

  database.ref('pins/').on('child_added', (snapshot) => {
    const pinData = snapshot.val();
    console.log('Pins snapshot:', pinData);
    const marker = addPin(map, [pinData.latitude, pinData.longitude], pinData.comment, pinData.id);
    markers[pinData.id] = marker;
  });

  database.ref('pins/').on('child_removed', (snapshot) => {
    const pinId = snapshot.key;
    const marker = markers[pinId];
    if (marker) {
      map.removeLayer(marker);
      delete markers[pinId];
    }
  });
});

function setMapViewToFaithlegg(map) {
  const faithleggCoords = [52.260465, -7.010256];
  map.setView(faithleggCoords, 14);
}

function setMapViewToUserLocationAndAddPin(map) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        map.setView(userLocation, 14);
      },
      (error) => {
        console.log('Error getting user location:', error);
      }
    );
  } else {
    console.log('Geolocation is not supported by this browser.');
  }
}

function addPin(map, location, comment, pinId) {
  const marker = L.marker(location, { pinId: pinId }).addTo(map);

  if (pinId) {
    marker.options.firebaseKey = pinId;
  }

  const deleteButton = L.DomUtil.create('button', 'delete-pin-btn');
  deleteButton.setAttribute('data-firebase-key', pinId);
  deleteButton.innerHTML = 'Delete Pin';

  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    if (confirm('Do you want to delete this pin?')) {
      const firebaseKey = deleteButton.getAttribute('data-firebase-key');
      map.removeLayer(marker);
      if (firebaseKey) {
        database.ref('pins/' + firebaseKey).remove();
      }
    }
  });

  const popupContent = L.DomUtil.create('div');
  if (comment) {
    const commentText = L.DomUtil.create('p');
    commentText.innerHTML = comment;
    popupContent.appendChild(commentText);
  }
  popupContent.appendChild(deleteButton);

  const popup = L.popup().setContent(popupContent);
  marker.bindPopup(popup);
}


function enableManualPinDrop(map) {
  let debounce = false;
  map.on('click', function (e) {
    if (!debounce) {
      debounce = true;
      const location = e.latlng;
      const comment = prompt('Please enter a comment for this pin:');
      if (comment) {
        const pinData = {
          latitude: location.lat,
          longitude: location.lng,
          comment: comment
        };
        const newPinRef = database.ref('pins/').push();
        pinData.id = newPinRef.key;
        newPinRef.set(pinData);
        console.log('Pin data saved:', pinData);
      }
      setTimeout(() => {
        debounce = false;
      }, 300);
    }
  });
}
