jQuery(document).ready( function() {

var map;
var uk;
var regions = {};
var counties = {};
var nations = {};
var groups = {};
var laLookup = {};
var FILL_DEFAULT = 0.5;
var WEIGHT_DEFAULT = 2;
var plain_icon = make_pin('#999');
var feature_icon = make_pin('#999',2);
var zoom_to = {};
var select;


// make the map
map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);

// data needs to be loaded in a specific order so the ajax calls chain rather
// than all fire at the same time.
loadData();
update_from_hash();

$('#miniclosed').click( ()=>{ $('#miniopen').show(); $('#miniclosed').hide(); } );

$('#area-corrections').click( ()=>{ $('#corrections-popup').show(); } );
$('#corrections-popup-inner .button').click( ()=>{ $('#corrections-popup').hide(); } );

function text_to_id(text) {
  if( !text ) { return null; }
  return text.toLowerCase().replace( /[^a-z ]/, ' ' ).replace( / /g, '-' );
}

function make_pin( colour, scale ) {
  var svg = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 365 560" enable-background="new 0 0 365 560" xml:space="preserve">
  <g>
    <path stroke="#000" stroke-width="20px" fill="`+colour+`" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9 C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z " />
  </g>
</svg>`;
  return L.icon({
                  iconUrl:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),
                 iconSize: [scale*10, scale*16],
               iconAnchor: [scale*5,  scale*16],
            tooltipAnchor: [scale*6,  scale*-8],
              popupAnchor: [scale*0,  scale*-20],
  });
}
function make_hourglass( colour ) {
  scale = 3;
  if( colour == '#000000' ) { colour = '#ffffff'; }
  var svg = `
<svg xmlns="http://www.w3.org/2000/svg" id="svg928" version="1.1" viewBox="0 0 264.58333 264.58334" height="1000" width="1000"> 
  <g transform="translate(0,-32.41665)" id="layer1"> 
    <circle cx='132.29135' cy='164.7' fill='#000' r='132.29135' />
    <path id="path381-2-2-4" d="M 132.29135,37.977412 A 126.73073,126.73073 0 0 0 5.5607842,164.7079 126.73073,126.73073 0 0 0 132.29135,291.43918 126.73073,126.73073 0 0 0 259.02266,164.7079 126.73073,126.73073 0 0 0 132.29135,37.977412 Z m 0,18.438882 A 108.29185,108.29185 0 0 1 240.58378,164.7079 108.29185,108.29185 0 0 1 132.29135,273.00037 108.29185,108.29185 0 0 1 23.999744,164.7079 108.29185,108.29185 0 0 1 132.29135,56.416294 Z" style="opacity:1;fill:`+colour+`;fill-opacity:1;stroke:#000;stroke-width:5" /> 
    <path id="path398-7-8-5" d="M 215.08784,83.800123 49.495694,84.088222 120.1276,164.70867 49.495694,245.32838 215.08784,245.61659 144.41828,164.70867 Z M 89.706681,102.22067 h 84.730799 l -42.36542,48.73177 z m 42.585459,76.3717 42.36542,48.73177 H 89.925942 Z" style="opacity:1;fill:`+colour+`;stroke:none;stroke-width:7;stroke-linejoin:miter;stroke-opacity:1" /> 
  </g> 
</svg>`;
  return L.icon({
                  iconUrl:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),
                 iconSize: [scale*10, scale*10],
               iconAnchor: [scale*5,  scale*5],
            tooltipAnchor: [scale*5,  scale*0],
              popupAnchor: [scale*0,  scale*-5],
  });
}


function featureCounty( county ) {
  var c_layers = county.polygons;
  // if LA is not in a county just reveal the current LA
  if( c_layers ) {
    for( var i=0; i<c_layers.length; i++ ) {
      c_layers[i]._path.setAttribute('fill-opacity',FILL_DEFAULT/3);
      c_layers[i]._path.setAttribute('stroke-width',0);
    }
  }
  var c_markers = county.markers;
  if( c_markers ) {
    for( var i=0; i<c_markers.length; i++ ) {
      var icon = c_markers[i].xr_feature_icon;
      c_markers[i].setIcon( icon );
      if( map.getZoom()>=7 ) { 
        c_markers[i].openTooltip();
      }
    }
  }
}

function unfeatureCounty( county ) {
  var c_layers = county.polygons;
  if( c_layers ) {
    for( var i=0; i<c_layers.length; i++ ) {
      c_layers[i]._path.setAttribute('fill-opacity',FILL_DEFAULT);
      c_layers[i]._path.setAttribute('stroke-width',WEIGHT_DEFAULT);
    }
  }
  var c_markers = county.markers;
  if( c_markers ) {
    // if a marker has a muddle between region and county this could mess up the colour
/*
    if( regions[feature.properties.region] ) {
      icon = regions[feature.properties.region].icon;
    } else {
      icon = plain_icon;
    }
*/
    for( var i=0; i<c_markers.length; i++ ) {
      var icon = c_markers[i].xr_usual_icon;
      c_markers[i].setIcon( icon ).closeTooltip();
    }
  }
}


function loadData() {
  // loads regions
  jQuery.ajax({
    url: 'https://cache.xrgroups.org/xrgroups-v2.php',
    jsonp: "callback",
    dataType: "jsonp",
    success: function( response ) {
      for( var i=0; i<response.region.length; ++i ) {
        var region = response.region[i];
        region["usual_icon"] = make_pin( region["colour"], 1 );
        region["feature_icon"] = make_pin( region["colour"], 2 );
        region["region_icon"] = make_hourglass( region["colour"] );
        region.polygons = [];
        region.markers = [];
        region.bounds = null;
        regions[region.id] = region;
      }

      // convert la_map to an index
      for( var i=0; i<response.county.length; ++i ) {
        laLookup[response.county[i]["local authority"]] = response.county[i];
      }
  
      // 
      for( var i=0;i<las.features.length;++i ) {
        var feature = las.features[i];
        var la = laLookup[feature.properties.lad19nm];
        if( !la ) { 
          console.log( "Failed to look up feature", feature );
          continue;
        }
        var nation_id = text_to_id(la["nation"]);
        if( nation_id ) {
          var nation = nations[ nation_id ];
          if( !nation ) {
            nation = {
              label: la["nation"],
              bounds: null,
              markers: [],
              polygons: [] 
            };
            nations[ nation_id ] = nation;
          }
          feature.properties.nation_id = nation_id;
          feature.properties.nation = nation;
          //nation.polygons.push( feature );
        }
        
        var region_id = text_to_id(la["xr region"]);
        if( region_id ) {
          var region = regions[ region_id ];
          if( !region ) {
            region = {
              label: la["xr region"],
              bounds: null,
              markers: [],
              polygons: [] 
            };
            regions[ region_id ] = region;
            console.log( "Unexpected region", la );
          }
          feature.properties.region_id = region_id;
          feature.properties.region = region;
          //region.polygons.push( feature );
        } 

        var county_id = text_to_id(la["county"]);
        if( county_id ) {
          var county = counties[ county_id ];
          if( !county ) {
            county = {
              label: la["county"],
              bounds: null,
              markers: [],
              polygons: []
            };
            counties[ county_id ] = county;
            //console.log( "Unexpected county", la );
          }
          feature.properties.county_id = county_id;
          feature.properties.county = county;
          //county.polygons.push( feature );
        }

        feature.properties.la = la;
      }

      counties[ "channel-islands" ] = {
        label: "Channel Islands",
        bounds: null,
        markers: [],
        polygons: []
      };

      // this data is stored locally so we don't have the same async issue as with the jquery calls
      uk = {"label":"United Kingdom"};
    
      L.geoJSON(las, {
        style: function (feature) {
          if( !feature.properties.region ) {
            console.log( "Missing region info on feature", feature );
            return {};
          }
          return {
            color: feature.properties.region.colour,
            weight: WEIGHT_DEFAULT,
            opacity: 0.3,
            fill: true,
            fillColor: feature.properties.region.colour,
            fillOpacity: FILL_DEFAULT
          };
        },
        onEachFeature: function(feature,layer) { 
    
          if( uk.bounds ) {
            uk.bounds.extend( layer.getBounds() );
          } else {
            uk.bounds = L.latLngBounds( layer.getBounds().getNorthWest(), layer.getBounds().getSouthEast() );
          }
    
          var nation = feature.properties.nation;
          if( nation ) {
            nation.polygons.push( layer );
            if( nation.bounds ) {
              nation.bounds.extend( layer.getBounds() );
            } else {
              nation.bounds = L.latLngBounds( layer.getBounds().getNorthWest(), layer.getBounds().getSouthEast() );
            }
          }
      
          var region = feature.properties.region;
          if( region ) {
            region.polygons.push( layer );
            if( region.bounds ) {
              region.bounds.extend( layer.getBounds() );
            } else {
              region.bounds = L.latLngBounds( layer.getBounds().getNorthWest(), layer.getBounds().getSouthEast() );
            }
          }
    
          var county = feature.properties.county;
          if( county ) {
            county.polygons.push( layer );
            if( county.bounds ) {
              county.bounds.extend( layer.getBounds() );
            } else {
              county.bounds = L.latLngBounds( layer.getBounds().getNorthWest(), layer.getBounds().getSouthEast() );
            }
          }
      
          if( county ) {
            layer.on({
              mouseover: function(e) { featureCounty( this ) }.bind( county ),
               mouseout: function(e) { unfeatureCounty( this ) }.bind( county )
            });
          }
              //jQuery( '.area-info-section' ).hide();
    //          for( var i=0;i<feature.properties.codes.length;++i ) { jQuery( '#'+feature.properties.codes[i] ).show(); } 
    //          jQuery( '#area-debug' ).html( feature.properties.codes.join( ', ') );
    
        }
      }).addTo(map);

      // hack to make channel islands a fake county for jumps
      counties["channel-islands"].bounds = L.latLngBounds( counties["jersey"].bounds.getNorthWest(), counties["jersey"].bounds.getSouthEast() );
      counties["channel-islands"].bounds.extend( counties["guernsey"].bounds );
  
      for( var i=0;i<response.group.length;++i ) {
        var record = response.group[i];
        var nation = null;
        var region = null;
        var county = null;

        if( record["nation"] )    { nation = nations[ text_to_id(record["nation"])]; }
        if( record["xr region"] ) { region = regions[ text_to_id(record["xr region"])]; }
        if( record["county"] )    { county = counties[text_to_id(record["county"])]; }

        var group = {
          label: record["name"],
          bounds: null,
          markers: [],
          polygons: [],
          centre: null,
          zoom: 11 
        };
        var lls=[];
        var llcodes = [ 'latlong', 'latlong2', 'latlong3', 'latlong4', 'latlong5', 'latlong6', 'latlong7', 'latlong8', 'latlong9' ];
   
        for( var j=0;j<llcodes.length;++j ) { 
          if( record[llcodes[j]] ) {
            if( record[llcodes[j]].match( /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/ ) ) {
              lls.push(  record[llcodes[j]].trim().split( /\s*,\s*/ ) );
            } else {
              console.log( "Unexpected "+llcodes[j]+" data", record );
            }
          }
        }

        for( var j=0;j<lls.length;++j ) {
          var ll = lls[j];
          var usual_icon = plain_icon;
          var feature_icon = feature_icon;
          if( region ) {
            usual_icon = region.usual_icon;
            feature_icon = region.feature_icon;
          }
          if( record.category == 'Nation' || record.category == 'Region' ) {
            usual_icon = region.region_icon;
            feature_icon = region.region_icon;
          }
          var marker = L.marker(ll,{ icon: usual_icon } );
          marker.xr_usual_icon = usual_icon;
          marker.xr_feature_icon = feature_icon;
          marker.xr_record = record;
          marker.addTo(map);
          if( nation ) { nation.markers.push( marker ); }
          if( region ) { region.markers.push( marker ); }
          if( county ) { county.markers.push( marker ); }
          if( group ) { 
            group.markers.push( marker ); 
            group.centre = ll;
          }

          var tooltip = L.tooltip({"className":"place-name","direction":"left", "opacity":0.7 });
          if( record["subname"] ) {
            tooltip.setContent(record["name"]+"<br />"+record["subname"]);
          } else {
            tooltip.setContent(record["name"]);
          } 
          marker.bindTooltip(tooltip);
            
          var popup_html = "<div>";
          popup_html += "<h2>"
          popup_html += record["name"];
          popup_html += "</h2>";
          if( record["popup"] ) {
            popup_html += "<p>"+record["popup"]+"</p>";
          }

          var list2 = [];
          if( record["web"] ) {
            list2.push( "<a target='_blank' href='"+record["web"]+"'><img class='sm-icon' title='Website' src='images/web.png' /></a>" );
          }
          if( record["email"] ) {
            list2.push( "<a href='mailto:"+record["email"]+"'><img class='sm-icon' title='Email' src='images/email.png' /></a>" );
          }
          if( record["page"] ) {
            list2.push( "<a target='_blank' href='"+record["page"]+"'><img class='sm-icon' title='Facebook Page' src='images/facebook-page.png' /></a>" );
          }
          if( record["group"] ) {
            list2.push( "<a target='_blank' href='"+record["group"]+"'><img class='sm-icon' title='Facebook Group' src='images/facebook-group.png' /></a>" );
          }
          if( record["twitter"] ) {
            list2.push( "<a target='_blank' href='"+record["twitter"]+"'><img class='sm-icon' title='Twitter' src='images/twitter.png' /></a>" );
          }
          if( record["instagram"] ) {
            list2.push( "<a target='_blank' href='"+record["instagram"]+"'><img class='sm-icon' title='Instagram' src='images/insta.png' /></a>" );
          }
          if( record["youtube"] ) {
            list2.push( "<a target='_blank' href='"+record["youtube"]+"'><img class='sm-icon' title='Youtube' src='images/youtube.png' /></a>" );
          }
          if( list2.length ) {
            popup_html += "<div style='margin-top:1em'>" + list2.join( " " ) + "</div>";;
          }

          popup_html += "<div style='margin-top:1em'>";
          if( record["an code"] ) {
            popup_html += "<a class='mlist-button' target='_blank' href='https://actionnetwork.org/forms/local-group-sign-up-form-referrer-codes?clear_id=true&source=uk_regions_map&referrer=group-"+record["an code"]+"'>Sign up for news</a>";
          } else if( region && region["an code"] ) {
            popup_html += "<a class='mlist-button' target='_blank' href='https://actionnetwork.org/forms/local-group-sign-up-form-referrer-codes?clear_id=true&source=uk_regions_map&referrer=group-"+record["an code"]+"'>Sign up for news</a>";
          }
          if( record["non an mailinglist"] ) {
              popup_html += "<a class='mlist-button' target='_blank' href='"+record["non an mailinglist"]+"'>Sign up for "+record["name"]+" news</a>";
          }
          popup_html += "</div>";

          if( region && region['extra links'] ) {
            popup_html += "<div style='margin-top:1em'>"+region["extra links"]+"</div>";
          }

          /*
          var affiliations = ["UK"]; 
          if( record["xr region"] ) {
            affiliations.push( record["xr region"] );
          }
          if( record["county"] ) {
            affiliations.push( record["county"] );
          }
          popup_html += "<div style='margin-top:1em'>Affiliations: "+affiliations.join( ", ")+".</div>";
          */

          popup_html += "</div>";
          marker.bindPopup(popup_html);

          if( record["county"] ) {
          //  var county = text_to_id(record["county"]);
            marker.on({
              mouseover: function(e) { featureCounty( this ); }.bind(county),
               mouseout: function(e) { unfeatureCounty( this ); }.bind(county)
            });
          }
        }
        if( record["hub id"] ) { 
          groups[ record["hub id"] ] = group;
        }
      }  
      addQuickJumps();
    }
  });
}

function addQuickJumps() {
  var nation_ids = Object.keys(nations).sort(); 
  var region_ids = Object.keys(regions).sort(); 
  var county_ids = Object.keys(counties).sort(); 
  var group_ids = Object.keys(groups).sort(); 
  zoom_to['uk'] = uk;

  var buttons = [];
  buttons.push( 'uk' );

/*
  for( var i=0; i<nation_ids.length; ++i ) {
    var id = nation_ids[i];
    // only add nations that are not also regions (England)
    if( !regions[id] ) {
      zoom_to[id] = nations[id];
      buttons.push( id );
    }
  }
*/

  for( var i=0; i<region_ids.length; ++i ) {
    var id = region_ids[i];
    zoom_to[id] = regions[id];
    buttons.push( id );
  }
  for( var i=0; i<county_ids.length; ++i ) {
    var id = county_ids[i];
    // don't add county info if there's a region of the same name
    if( !zoom_to[id] ) {
      zoom_to[id] = counties[id];
    }
  }
  for( var i=0; i<group_ids.length; ++i ) {
    var id = group_ids[i];
    // don't add group info if there's a region of the same name (there really shouldn't be as this uses ID!)
    if( !zoom_to[id] ) {
      zoom_to[id] = groups[id];
    }
  }

  var bdiv = jQuery( '#jumps' );
  for( var i=0; i<buttons.length; ++i ) {
    var id = buttons[i];
    var button = jQuery( '<a class="jump"></a>' );
    if( zoom_to[id]["colour"] ) { button.css( "backgroundColor",zoom_to[id]["colour"]); }
    if( zoom_to[id]["text"] ) { button.css( "color",zoom_to[id]["text"]); }
    button.text( zoom_to[id].label );
    bdiv.append( button );
    button.click( function(){ window.location.hash = '#'+this.id; }.bind( {id:id} ) );
  }

  select = jQuery( '<select><option>Show county...</option></select>' );
  for( var i=0; i<county_ids.length; ++i ) {
    var id = county_ids[i];
    var option = jQuery('<option></option>');
    option.attr( 'value',  id );
    option.text( zoom_to[id].label );
    select.append( option );
  }
  select.change(function(){
    var id = select.val();
    window.location.hash = '#'+id;
  });
  jQuery( '#county_control' ).text('').append( select );

  $(window).on('hashchange', update_from_hash );

  update_from_hash();
}

function update_from_hash() {
  var hash = window.location.hash.replace( /^#/, '' );
  if( !hash ) { return; }

  var minimal = false;
  var nowheel = false;
  var codes = hash.split( /,/ );
  for( var i=0;i<codes.length;++i ) {
    var code = codes[i];
    if( code == "minimal" ) {
      minimal = true;
      continue;
    }
    if( code == "nowheel" ) {
      nowheel = true;
      continue;
    }
    if( zoom_to[code] && zoom_to[code]['bounds']) {
      map.fitBounds( zoom_to[code].bounds );
      if( counties[code] ) {
        select.val(code); 
      }
    }
    if( zoom_to[code] && zoom_to[code]['centre'] && zoom_to[code]['zoom']) {
      map.setZoom( zoom_to[code].zoom );
      map.setView( zoom_to[code].centre );
    }
  }
  if( nowheel ) {
    map.scrollWheelZoom.disable(); 
  } else {
    map.scrollWheelZoom.enable(); 
  }
  if( minimal ) {
    $('body').addClass( "minimal" );
  } else {
    $('body').removeClass( "minimal" );
  } 
      
}

}); //end of ready
