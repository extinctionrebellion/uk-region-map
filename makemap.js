jQuery(document).ready( function() {

var regions = {};
var laLookup = {};
var feature_by_region = {};
var feature_by_county = {};
var marker_by_region = {};
var marker_by_county = {};
var bounds_by_region = {};
var bounds_by_county = {};
var FILL_DEFAULT = 0.5;
var WEIGHT_DEFAULT = 2;
var white_icon = make_icon('#fff');
var plain_icon = make_icon('#999');

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

function googleSheetToData( sheet, heading_row ) {
  var grid = googleSheetToGrid( sheet ); 
  var headings = [];
  for(var i=1;i<grid[heading_row].length;i++ ) {
    if( grid[heading_row][i] ) {
      headings[i] = grid[heading_row][i].inputValue;
    } else {
      headings[i] = 'col_'+i;
    }
  }
  var records = [];
  for( var i=heading_row+1;i<grid.length;++i ) {
    var record = {};
    for( var j=1;j<headings.length;++j ) {
      if( grid[i][j] ) {
        record[headings[j]] = grid[i][j].inputValue;
      } 
    }
    records.push( record );
  }
  return records;
}


function text_to_id(text) {
  if( !text ) { return null; }
  return text.toLowerCase().replace( /[^a-z ]/, ' ' ).replace( / /g, '-' );
}

function make_icon( colour ) {
  return L.icon({
            iconUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg version%3D"1.1" id%3D"Layer_1" xmlns%3D"http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" xmlns%3Axlink%3D"http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink" x%3D"0px" y%3D"0px" viewBox%3D"0 0 365 560" enable-background%3D"new 0 0 365 560" xml%3Aspace%3D"preserve"%3E%3Cg%3E%3Cpath stroke%3D"%23000" stroke-width%3D"20px" fill%3D"'+encodeURIComponent(colour)+'" d%3D"M182.9%2C551.7c0%2C0.1%2C0.2%2C0.3%2C0.2%2C0.3S358.3%2C283%2C358.3%2C194.6c0-130.1-88.8-186.7-175.4-186.9 C96.3%2C7.9%2C7.5%2C64.5%2C7.5%2C194.6c0%2C88.4%2C175.3%2C357.4%2C175.3%2C357.4S182.9%2C551.7%2C182.9%2C551.7z " %2F%3E%3C%2Fg%3E%3C%2Fsvg%3E',
//M122.2%2C187.2c0-33.6%2C27.2-60.8%2C60.8-60.8 c33.6%2C0%2C60.8%2C27.2%2C60.8%2C60.8S216.5%2C248%2C182.9%2C248C149.4%2C248%2C122.2%2C220.8%2C122.2%2C187.2z
            iconSize: [10, 16],
            iconAnchor: [5,16],
            popupAnchor: [0, -20],
/*
    shadowUrl: 'my-icon-shadow.png',
    shadowSize: [68, 95],
    shadowAnchor: [22, 94]
*/
  });
}

// make the map
var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

loadData();

function loadData() {
  // loads regions
  jQuery.ajax({
    url: 'https://spreadsheets.google.com/feeds/cells/1KxpfpHzCstsg_hvG8v6ksgjt3ghAHb1URwW41mW7Vgs/2/public/full?alt=json-in-script',
    jsonp: "callback",
    dataType: "jsonp",
    success: function( response ) {
      var records = googleSheetToData( response, 1 );
      for( var i=0; i<records.length; ++i ) {
        var record = records[i];
        record["icon"] = make_icon( record["Colour"] );
        regions[record.ID] = record;
      }
      loadData2();     
    }
  });
}

function loadData2() {
  // loads local authority to county & region data
  jQuery.ajax({
    url: 'https://spreadsheets.google.com/feeds/cells/1KxpfpHzCstsg_hvG8v6ksgjt3ghAHb1URwW41mW7Vgs/1/public/full?alt=json-in-script',
    jsonp: "callback",
    dataType: "jsonp",
    success: function( response ) {
      var records = googleSheetToData( response, 1 );

      // convert la_map to an index
      for( var i=0; i<records.length; ++i ) {
        laLookup[records[i]["Local Authority"]] = records[i];
      }
      
      for( var i=0;i<las.features.length;++i ) {
          var feature = las.features[i];
          var la = laLookup[feature.properties.lad19nm];
          feature.properties.country = text_to_id(la["Nation"]);
          feature.properties.region = text_to_id(la["XR Region"]);
          feature.properties.county = text_to_id(la["County"]);
          feature.properties.las = text_to_id(la["Local Authority"]);
          
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
      loadData3();     
    }
  });
}


function loadData3() {
  // this data is stored locally so we don't have the same async issue as with the jquery calls
  
  L.geoJSON(las, {
    style: function (feature) {
      var colour = "#888888";
      if( regions[feature.properties.region] )  { 
        colour = regions[feature.properties.region].Colour;
      }
      return {
        color: colour,
        weight: WEIGHT_DEFAULT,
        opacity: 0.3,
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
              c_markers[i].setIcon( white_icon );
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
            // if a marker has a muddle between region and county this could mess up the colour
            if( regions[feature.properties.region] ) {
              icon = regions[feature.properties.region].icon;
            } else {
              icon = plain_icon;
            }
            for( var i=0; i<c_markers.length; i++ ) {
              c_markers[i].setIcon( icon );
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
  
  loadData4();
}

function loadData4() {
  jQuery.ajax({
    url: 'https://spreadsheets.google.com/feeds/cells/1xE9AXVX7vXRnrvhVkA_9DubgxCFywN9bMhSIGws6GHc/1/public/full?alt=json-in-script',
    jsonp: "callback",
    dataType: "jsonp",
    success: function( response ) {
      var records = googleSheetToData( response, 3 );
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
/*
          var colour = "#888888";
          if( regions[region] )  { 
            colour = regions[region].Colour;
          }
/*
          var marker = L.circle(ll,{
            color: '#000',
            weight: 1,
            fillColor: colour,
            fillOpacity: 0.9,
            radius: 1000
          }).addTo(map);  
*/
          var ll = record["LatLong"].split( /\s*,\s*/ );
          var icon;
          if( regions[region] ) {
            icon = regions[region].icon;
          } else {
            icon = plain_icon;
console.log(region,regions);
          }
          var marker = L.marker(ll,{ icon: icon } );
          marker.addTo(map);
            

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
}

}); //end of ready
