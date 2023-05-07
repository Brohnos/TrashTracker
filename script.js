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

const db = firebase.database();

document.addEventListener('DOMContentLoaded', function () {
  var map = L.map('map');

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  setMapViewToFaithlegg(map);

  // Attempt to set the map view to the user's location and add a pin at their location
  setMapViewToUserLocationAndAddPin(map);

  // Load pins from the database
  loadPinsFromDatabase(map);
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

function addPin(map, location, comment = '') {
  const marker = L.marker(location).addTo(map);
  marker.on('click', function () {
    if (confirm('Do you want to delete this pin?')) {
      map.removeLayer(marker);
      deletePinFromDatabase(marker);
    }
  });

  if (comment) {
    marker.bindPopup(comment);
  }

  return marker;
}

function enableManualPinDrop(map) {
  map.on('click', function (e) {
    const comment = prompt('Please enter a comment for this pin:');
    if (comment) {
      const marker = addPin(map, e.latlng, comment);
      savePinToDatabase(marker, comment);
    }
  });
}

function savePinToDatabase(marker, comment) {
  const { lat, lng } = marker.getLatLng();
  const newPinRef = db.ref('pins').push();
  newPinRef.set({ lat, lng, comment });
  marker.pinKey = newPinRef.key; // Store the key on the marker for future reference
}

function deletePinFromDatabase(marker) {
  if (marker.pinKey) {
    db.ref('pins/' + marker.pinKey).remove();
  }
}

function loadPinsFromDatabase(map) {
  db.ref('pins').on('value', function (snapshot) {
    const data = snapshot.val();
    if (data) {
      for (const pinKey in data) {
        const pinData = data[pinKey];
        const latLng = L.latLng(pinData.lat, pinData.lng);
        const marker = addPin(map, latLng, pinData.comment);
        marker.pinKey = pinKey; // Store the key on the marker for future reference
      }
    }
  });
}
