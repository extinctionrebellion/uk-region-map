jQuery(document).ready( function() {

var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

function text_to_id(text) {
  return text.toLowerCase().replace( /[^a-z ]/, ' ' ).replace( / /g, '-' );
}

// convert la_map to an index
var laLookup = {};
for( var i=0; i<la_map.length; ++i ) {
        laLookup[la_map[i][3]] = la_map[i];
}

var feature_by_region = {};
var feature_by_county = {};
var marker_by_region = {};
var marker_by_county = {};
var bounds_by_region = {};
var bounds_by_county = {};
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
    feature_by_region[feature.properties.region] = [];
    if( feature.properties.county ) {
      feature_by_county[feature.properties.county] = [];
    }
}

var FILL_DEFAULT = 0.75;
var WEIGHT_DEFAULT = 2;
L.geoJSON(las, {
  style: function (feature) {
    var colour = "#888888";
    if( regions[feature.properties.region] )  { 
      colour = regions[feature.properties.region].colour;
    }
    return {
      color: colour,
      weight: WEIGHT_DEFAULT,
      //opacity: 0.3,
      fill: true,
      fillColor: colour,
      fillOpacity: FILL_DEFAULT
    };
  },
  onEachFeature: function(feature,layer) { 
    feature_by_region[feature.properties.region].push( layer );
    if( bounds_by_region[feature.properties.region] ) {
      bounds_by_region[feature.properties.region].extend( layer.getBounds() );
    } else {
      bounds_by_region[feature.properties.region] = layer.getBounds();
    }
    if( feature.properties.county ) {
      feature_by_county[feature.properties.county].push( layer );
      if( bounds_by_county[feature.properties.county] ) {
        bounds_by_county[feature.properties.county].extend( layer.getBounds() );
      } else {
        bounds_by_county[feature.properties.county] = layer.getBounds();
      }
    }

    layer.on({
      mouseover: function(e) {
        var c_layers = feature_by_county[feature.properties.county];
        // if LA is not in a county just reveal the current LA
        if( !c_layers ) { c_layers = [ layer ]; }
        for( var i=0; i<c_layers.length; i++ ) {
          c_layers[i]._path.setAttribute('fill-opacity',FILL_DEFAULT/3);
          c_layers[i]._path.setAttribute('stroke-width',0);
        }
        var c_markers = marker_by_county[feature.properties.county];
        if( c_markers ) {
          for( var i=0; i<c_markers.length; i++ ) {
            c_markers[i]._path.setAttribute('fill','white');
          }
        }
        jQuery( '.area-info-section' ).hide();
        for( var i=0;i<feature.properties.codes.length;++i ) { jQuery( '#'+feature.properties.codes[i] ).show(); } 
        jQuery( '#area-debug' ).html( feature.properties.codes.join( ', ') );
      },
      mouseout: function(e) {
        var c_layers = feature_by_county[feature.properties.county];
        if( !c_layers ) { c_layers = [ layer ]; }
        for( var i=0; i<c_layers.length; i++ ) {
          c_layers[i]._path.setAttribute('fill-opacity',FILL_DEFAULT);
          c_layers[i]._path.setAttribute('stroke-width',WEIGHT_DEFAULT);
        }
        var c_markers = marker_by_county[feature.properties.county];
        if( c_markers ) {
          var colour = "#888888";
          // if a marker has a muddle between region and county this could mess up the colour
          if( regions[feature.properties.region] )  { 
            colour = regions[feature.properties.region].colour;
          }
          for( var i=0; i<c_markers.length; i++ ) {
            c_markers[i]._path.setAttribute('fill',colour);
          }
        }
        jQuery( '#area-debug' ).html( '' );
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


function googleSheetToGrid( sheet ) {
    //var rows = response.feed["gs$rowCount"];
    //var cols = response.feed["gs$colCount"];
    var grid = [];
    for( var i=0; i<sheet.feed.entry.length; i++ ) {
      var cell = sheet.feed.entry[i]["gs$cell"];
      if( !grid[cell.row] ) { grid[cell.row] = []; }
      grid[cell.row][cell.col] = cell;
    }
    return grid;
}

var local
jQuery.ajax({
  url: 'https://spreadsheets.google.com/feeds/cells/1xE9AXVX7vXRnrvhVkA_9DubgxCFywN9bMhSIGws6GHc/1/public/full?alt=json-in-script',
  jsonp: "callback",
  dataType: "jsonp",
  success: function( response ) {
    var grid = googleSheetToGrid( response );
    var headings = [];
    for(var i=1;i<grid[3].length;i++ ) {
      if( grid[3][i] ) {
        headings[i] = grid[3][i].inputValue;
      } else {
        headings[i] = 'col_'+i;
      }
    }
    var records = [];
    for( var i=4;i<grid.length;++i ) {
      var record = {};
      for( var j=1;j<headings.length;++j ) {
        if( grid[i][j] ) {
          record[headings[j]] = grid[i][j].inputValue;
        } 
      }
      records.push( record );
    }

    for( var i=0;i<records.length;++i ) {
      var record = records[i];
      var country;
      var region;
      var county;
      if( record["Country"] ) {
        country = text_to_id(record["Country"]);
      }
      if( record["XR Region"] ) {
        region = text_to_id(record["XR Region"]);
      }
      if( record["County"] ) {
        county = text_to_id(record["County"]);
      }
      if( record["LatLong"] ) {
        var colour = "#888888";
        if( regions[region] )  { 
          colour = regions[region].colour;
        }
        var ll = record["LatLong"].split( /\s*,\s*/ );
        var marker = L.circle(ll,{
          color: '#000',
          weight: 1,
          fillColor: colour,
          fillOpacity: 0.9,
          radius: 1000
        }).addTo(map);  
        var popup_html = "<div>";
        popup_html += "<h2>"+record["Name"]+"</h2>";
        if( record["Country"] ) {
          popup_html += "<div>Country: "+record["Country"]+"</div>";
        }
        if( record["XR Region"] ) {
          popup_html += "<div>Region affiliation: "+record["XR Region"]+"</div>";
        }
        if( record["County"] ) {
          popup_html += "<div>County affiliation: "+record["County"]+"</div>";
        }
        if( record["Page"] ) {
          popup_html += "<div><a href='"+record["Page"]+"'>Facebook Page</a></div>";
        }
        if( record["Group"] ) {
          popup_html += "<div><a href='"+record["Group"]+"'>Facebook Group</a></div>";
        }
        if( record["Twitter"] ) {
          popup_html += "<div><a href='"+record["Twitter"]+"'>Twitter</a></div>";
        }
        if( record["Instagram"] ) {
          popup_html += "<div><a href='"+record["Instagram"]+"'>Instagram</a></div>";
        }
        if( record["Website"] ) {
          popup_html += "<div><a href='"+record["Website"]+"'>Website</a></div>";
        }
        if( record["Youtube"] ) {
          popup_html += "<div><a href='"+record["Youtube"]+"'>Youtube</a></div>";
        }
        if( record["Action Network"] ) {
          popup_html += "<div><a href='"+record["Action Network"]+"'>Action Network</a></div>";
        }
        if( record["Email"] ) {
          popup_html += "<div><a href='mailto:"+record["Email"]+"'>"+record["Email"]+"</a></div>";
        }
        popup_html += "</div>";
        marker.bindPopup(popup_html);

        if( record["Country"] ) {
          country = text_to_id(record["Country"]);
          if( !marker_by_country[ country ] ) { marker_by_country[ country ]=[]; }
          marker_by_country[ country ].push( marker );
        }
        if( record["XR Region"] ) {
          region = text_to_id(record["XR Region"]);
          if( !marker_by_region[ region ] ) { marker_by_region[ region ]=[]; }
          marker_by_region[ region ].push( marker );
        }
        if( record["County"] ) {
          county = text_to_id(record["County"]);
          if( !marker_by_county[ county ] ) { marker_by_county[ county ]=[]; }
          marker_by_county[ county ].push( marker );
        }

      }
    }  
  }
});

}); //end of ready
