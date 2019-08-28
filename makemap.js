
var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

var colours = {
	"south-west":"#cc3333",
	"london":"#000000",
        "the-south":"#ffff33",
	"the-east-coast":"#238b45",
	"the-north":"#0570b0",
	"wales":"#00c957",
	"oxford-cambridgeshire":"#ff7f00",
	"yorkshire":"#810f7c",
	"north-west":"#d6604d",
	"west-midlands":"#74add1",
	"east-midlands":"#fb9a99",
	"scotland":"#9e0142",
	"northern-ireland":"#737373"
};

function text_to_id(text) {
  return text.toLowerCase().replace( /[^a-z ]/, ' ' ).replace( / /g, '-' );
}

// convert regions to an index
var laLookup = {};
for( var i=0; i<regions.length; ++i ) {
	laLookup[regions[i][3]] = regions[i];
}


for( var i=0;i<las.features.length;++i ) {
    var feature = las.features[i];
    var la = laLookup[feature.properties.lad19nm];
    feature.properties.country = text_to_id(la[0]);
    feature.properties.region = text_to_id(la[1]);
    feature.properties.county = text_to_id(la[2]);
    feature.properties.las = text_to_id(la[3]);
    
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
      color: "#000000",
      weight: 2,
      opacity: 0.1,
      fill: true,
      fillColor: colours[feature.properties.region],
      fillOpacity: 0.75,
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
