var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
  }
  return;
};

function showAlert(msg, type){
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    const alert = (message, type) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
      ].join('');

      alertPlaceholder.append(wrapper);
    }

    alert(msg, type);

    // $("#liveAlertPlaceholder").fadeTo(2000, 500).slideUp(500, function(){
    //     $("#liveAlertPlaceholder").slideUp(500);
    // });
  }

//Global variables
var lotsMarkers = [];
// Setting up bounds that will be used to calucalte the center of the area
// In our case it should be San Francisco

// Init Leaflet Maps with the location (hardcoded below to San Francisco) and appropriate zoom level
var map;


function createIcon(name){
  return new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-" + name + ".png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

var icons = {
  green: createIcon("green"),
  orange: createIcon("orange"),
  blue: createIcon("blue")
};

function createMarker(loca, color, size){
  return L.marker(loca, {
    icon: icons[color],
  })
  // return L.circle(loca, {color: "white", fillColor: color, fillOpacity: 1.0, radius: size || 100});
}


var marker;

// Add moving maker to map

// map.on("click", function (e) {
//   this.removeLayer(marker);
//   marker = L.marker(e.latlng, {
//     icon: greenIcon,
//   });
//   map.addLayer(marker);
// });

function doAjax(url, data, onSuccess){
  $("#ajaxLoading").removeClass('d-none');
  $.ajax({
    url: url,
    data: JSON.stringify(data),
    headers: {Authorization: "prj_live_pk_025bfe39a181442148fb92c4b3f8b441ec74fee6"},
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    type: "POST",
    async: true,
    crossDomain: true
  }).done(function (res) {
    $("#ajaxLoading").addClass('d-none');
    onSuccess(res);
  }).fail(function (error) {
    $("#ajaxLoading").addClass('d-none');
    showAlert("request error: " + error, "danger");
    console.error(error);
  });
}

function showPoints(data, isFrom){
  coords = parseLoc(data);
  // console.log(coords);
  var amarker = createMarker([coords[0], coords[1]], isFrom? "orange": "blue", parseInt(coords[2]) * 25)
    .bindTooltip(coords[2].toString(), //specific number, 
    {
      permanent: true,
      direction: 'center',
      className: "my-labels",
      offset: [0, 25]
    })
    .bindPopup(
      `Name: ${data.address} <br>`
      // Address: ${element.navigationAddress.street} <br>
      // Phone: ${element.phone} <br>
      // Payment Types: ${element.pmtTypes} <br>
      // Hours: ${element.hrs} <br>
      // Rate Card: ${element.rateCard} <br>
    )
    .addTo(map)
    .on("click", function (e) {
      this.openPopup();
    });
  lotsMarkers.push(amarker);
  let group1Offsetx = 0.4, group1Offsety = 0.55;
  let points = [
    [
     // marker.getLatLng().lat - 0.05 + group1Offsetx,
     // marker.getLatLng().lng - group1Offsety - 0.25
     marker.getLatLng().lat, 
     marker.getLatLng().lng
   ],
   [
     amarker.getLatLng().lat,
     amarker.getLatLng().lng
   ]
  ];

  if(isFrom){
    let temp = points[0];
    points[0] = points[1];
    points[1] = temp;
  }

  
  lotsMarkers.push(L.polyline(points, {color: isFrom? "orange": "blue" })
  .arrowheads({
    size: "10px",
  })
  .bindPopup(`<pre><code>L.polyline(coords).arrowheads()</code></pre>`, {
   maxWidth: 2000,
   minWidth: 400
  }).addTo(map));
}

function parseLoc(data){
    if(config.isJava){
      return [data.latitude, data.longitude, data.count];       
    }
    return data.split("|");
  }

// Visualizing parking lots markers using the information from INRIX Parking Lots API and adding it to the map.
function drawLots() {
  if(!map){
    map = new L.Map("map", {
      zoom: 13,
      center: [parseFloat(getUrlParameter("lat")), parseFloat(getUrlParameter("lon"))],
    });

    // Create OSM Tile Layer and providing some max and min zoom level
    const osm = new L.TileLayer(config.openStreetMapAPI, {
      minZoom: 5,
      maxZoom: 18,
    });

    // Adding the Open Street Map layer
    map.addLayer(osm);
  }

  marker = createMarker([map.getCenter().lat, map.getCenter().lng], "green").addTo(map);

  //Making sure we delete old patking lots markers
  for (let p = 0; p < lotsMarkers.length; p++) {
    map.removeLayer(lotsMarkers[p]);
  }
  
  // console.log("drawLots");

  doAjax(config.visitCountAPI, {address: getUrlParameter("address"), latitude: map.getCenter().lat, longitude: map.getCenter().lng}, function(res){
    var count = 0;
    res = res.data || res;
    res.to = res.to || [];
    res.from = res.from || [];

    var first = res.from.shift();
    if(first){
      count = parseInt(parseLoc(first).pop()) || 0
    } 

    var first = res.to.shift();
    if(first){
      count = parseInt(parseLoc(first).pop()) || 0
    } 

    res.from.forEach(function(element){
      showPoints(element, true);
    });

    res.to.forEach(function(element){
      showPoints(element, false);
    });
  });
}