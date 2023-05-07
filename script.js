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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const database = firebase.database();

document.addEventListener('DOMContentLoaded', function () {
  var map = L.map('map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  setMapViewToFaithlegg(map);

  // Attempt to set the map view to the user's location and add a pin at their location
  setMapViewToUserLocationAndAddPin(map);

  loadPinsFromDatabase(map);
});

function setMapViewToFaithlegg(map) {
  const faithleggCoords = [52.260465, -7.010256]; // Updated Latitude and longitude of Faithlegg, Co. Waterford, Ireland
  map.setView(faithleggCoords, 14); // 14 is the updated initial zoom level
}

function setMapViewToUserLocationAndAddPin(map) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        map.setView(userLocation, 14); // 14 is the updated initial zoom level
        enableManualPinDrop(map);
      },
      (error) => {
        console.log('Error getting user location:', error);
        enableManualPinDrop(map);
      }
    );
  } else {
    console.log('Geolocation is not supported by this browser.');
    enableManualPinDrop(map);
  }
}

function addPin(map, location) {
  const marker = L.marker(location).addTo(map);
  marker.on('click', function () {
    if (confirm('Do you want to delete this pin?')) {
      map.removeLayer(marker);
      removePinFromDatabase(marker._leaflet_id);
    }
  });

  const comment = prompt('Please enter a comment for this pin:');
  if (comment) {
    marker.bindPopup(comment);
    savePinToDatabase(marker._leaflet_id, location, comment);
  }
}

function enableManualPinDrop(map) {
  map.on('click', function (e) {
    addPin(map, e.latlng);
  });
}

function savePinToDatabase(id, location, comment) {
  database.ref('pins/' + id).set({
    lat: location.lat,
    lng: location.lng,
    comment: comment
  });
}

function loadPinsFromDatabase(map) {
  const pinsRef = database.ref('pins');
  pinsRef.once('value', (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const pinData = childSnapshot.val();
      const location = [pinData.lat, pinData.lng];
      const marker = L.marker(location).addTo(map);
      marker._leaflet_id = childSnapshot.key;
      marker.bindPopup(pinData.comment);

      marker.on('click', function () {
        if (confirm('Do you want to delete this pin?')) {
          map.removeLayer(marker);
          removePinFromDatabase(marker._leaflet_id);
        }
      });
    });
  });
}

function removePinFromDatabase(id) {
  database.ref('pins/' + id).remove();
}
