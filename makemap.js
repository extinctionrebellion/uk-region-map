
var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

function onEachFeature(feature, layer, set, idfield) {

/*
  if( ! document.getElementById(id) ) {
    alert( "missing popup info for "+id );
    return;
  }
  var popupContent = document.getElementById(id).innerHTML;
  layer.bindPopup(popupContent);
*/
}

var colours = {
	"scotland":"red",
	"northern-ireland":"orange",
	"wales":"yellow",
	"london":"white",
	"north-west":"blue",
	"north-east":"cyan",
	"west-midlands":"deeppink",
	"east-midlands":"green",
	"south-west":"navy",
	"south-east":"coral",
	"east-of-england":"magenta",
	"yorkshire-and-the-humber":"brown"
};
function text_to_id(text) {
  return text.toLowerCase().replace( /[^a-z ]/, '' ).replace( / /g, '-' );
}
for( var i=0;i<las.features.length;++i ) {
    var feature = las.features[i];
    feature.properties.country = text_to_id(country[feature.properties.lad19cd][2]);
    if( feature.properties.country == "england" ) {
      feature.properties.region = text_to_id(region[feature.properties.lad19cd][2]);
    } else {
      feature.properties.region = feature.properties.country;
    }
    if( county[feature.properties.lad19cd] ) { 
      feature.properties.county = text_to_id(county[feature.properties.lad19cd][2]);
    }
    feature.properties.las = text_to_id(country[feature.properties.lad19cd][0]);
}
L.geoJSON(las, {
  style: function (feature) {
    return {
      color: "#999999",
      weight: 1,
      opacity: 0.3,
      fill: true,
      fillColor: colours[feature.properties.region],
      fillOpacity: 0.3,
    };
  },
  onEachFeature: function(feature,layer) { 
    layer.on({
      mouseover: function(e) {
        jQuery( '.area-info-section' ).hide();
        var toshow = [ feature.properties.region , feature.properties.las ];
        if( feature.properties['county'] ) {
          toshow.push( feature.properties.county );
        }
        for( var i=0;i<toshow.length;++i ) { jQuery( '#'+toshow[i] ).show(); } 
        jQuery( '#area-debug' ).html( 'SHOWING: '+toshow.join( ', ') );
      },
      mouseout: function(e) {
      }
    });
  }
}).addTo(map);
