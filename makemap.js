
var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

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
    feature.properties.codes = [ feature.properties.region , feature.properties.las ];
    if( feature.properties['county'] ) {
      feature.properties.codes.push( feature.properties.county );
    }
    if( feature.properties.country != feature.properties.region ) {
      feature.properties.codes.push( feature.properties.country );
    }
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
        for( var i=0;i<feature.properties.codes.length;++i ) { jQuery( '#'+feature.properties.codes[i] ).show(); } 
        jQuery( '#area-debug' ).html( 'SHOWING: '+feature.properties.codes.join( ', ') );
      },
      mouseout: function(e) {
      }
    });
    var popup_html = "<div>";
    for( var i=0;i<feature.properties.codes.length;++i ) { 
      var id = feature.properties.codes[i];
      if( document.getElementById(id) ) {
        popup_html += jQuery( '#'+id).html();
      }
    }
    popup_html += "</div>";
    layer.bindPopup(popup_html);
    
/*
  if( ! document.getElementById(id) ) {
    alert( "missing popup info for "+id );
    return;
  }
*/

  }
}).addTo(map);
