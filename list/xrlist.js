
var update_email = "christophergutteridge@gmail.com";

function XRList( id, area, layout ) {
  jQuery(document).ready( function(){
    XRListWhenReady( id, area, layout  );
  });
}
function XRListTag( id, tag, layout ) {
  jQuery(document).ready( function(){
    XRListTagWhenReady( id, tag, layout  );
  });
}
function XRGroups( id, names, layout ) {
  jQuery(document).ready( function(){
    XRGroupsWhenReady( id, names, layout  );
  });
}

var XRDATA = null;
var XRLOADING = false;
function XRLoadData() {
  if( !XRDATA ) {
    if( !XRLOADING ) { 
      XRLOADING = true;
      jQuery.ajax({
        url: 'https://cache.xrgroups.org/xrgroups-v2.php',
        jsonp: "callback",
        dataType: "jsonp",
        success: function( response ) {
          XRDATA = response;
          XRLOADING = false;
        }
      });
    }
  }  
}
async function XRListTagWhenReady( id, tag, layout  ) {
  XRLoadData();
  while( XRLOADING ) { 
    await new Promise(r => setTimeout(r, 200));
  }
  var records = XRDATA.group;

  var filteredRecords = [];
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    if( record["tags"] ) {
      var tags = record.tags.split( /\s*;\s*/ );
      for( j=0;j<tags.length;++j ) {
        if( tags[j]==tag ) { 
          filteredRecords.push( record );
        }
      }
    }
  }

  var rendered = XRRender( filteredRecords, layout );
  jQuery( '#'+id ).text('').append( rendered );
}

async function XRGroupsWhenReady( id, names, layout  ) {
  XRLoadData();
  while( XRLOADING ) { 
    await new Promise(r => setTimeout(r, 200));
  }
  var records = XRDATA.group;

  var filteredRecords = [];
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    for( var j=0;j<names.length;++j ) {
      if( typeof names[j]=="string" && names[j].trim().toLowerCase()==record.name.trim().toLowerCase() 
       || typeof names[j]=="number" && names[j]==record["hub id"] ){
        filteredRecords.push( record );
      }
    }
  }

  var rendered = XRRender( filteredRecords, layout );
  jQuery( '#'+id ).text('').append( rendered );
}

async function XRListWhenReady( id, area, layout  ) {
  XRLoadData();
  while( XRLOADING ) { 
    await new Promise(r => setTimeout(r, 200));
  }
  var records = XRDATA.group;

  var filteredRecords = [];
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    if( area 
     && ( !record['county'] || area.toLowerCase() != record['county'].toLowerCase() )
     && ( !record['xr region'] || area.toLowerCase() != record['xr region'].toLowerCase() )
     && ( !record['nation'] || area.toLowerCase() != record['nation'].toLowerCase() ) ) {
      continue;
    }
    filteredRecords.push( record );
  }

  var rendered = XRRender( filteredRecords, layout );
  jQuery( '#'+id ).text('').append( rendered );
}

function XRRender( records, layout ) {
  var rendered;
  if( layout == "review" ) {
    rendered = XRRenderReview( records );
  } 
  else if( layout == "table" ) {
    rendered = XRRenderTable( records );
    rendered.append( '<p>This information is curated by UK Rebel Hive. Please contact <a href="mailto:'+update_email+'">'+update_email+'</a> with any corrections or additions.</p>' );    
  } 
  else if( layout == "list" ) {
    rendered = XRRenderList( records );
    rendered.append( '<p>This information is curated by the UK Rebel Hive. National and Regional Development circle. Please contact <a href="mailto:'+update_email+'">'+update_email+'</a> with any corrections or additions.</p>' );    
  } 
  else 
  {
    rendered.append( '<p>Unkown layout '+layout+'</p>' );
  }
  return rendered;
}

function XRRenderList( records ) {
  var ul = jQuery( '<ul>' );
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    var li = jQuery( '<li>' );
    li.append( jQuery( '<b></b>' ).text( record.name ) );
    if( record.email ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href','mailto:'+record.email).text('Email') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.page ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.page).text('FB Page') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.group ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.group).text('FB Group') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.twitter ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.twitter).text('Twitter') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.instagram ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.instagram).text('Instagram') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.youtube ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.youtube).text('YouTube') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    if( record.web ) {
      li.append( jQuery( '<span> [</span>' ) );
      li.append( jQuery( '<a></a>' ).attr( 'href',record.web).text('Website') );
      li.append( jQuery( '<span>]</span>' ) );
    }
    ul.append( li );
  }
  var div = jQuery( '<div class="xr-groups-list"></div>' ).append(ul);
  return div;
}

function XRRenderTable( records ) {
  var table = jQuery( '<table>' );
  var headings = [ 'name', 'category', 'county', 'xr region', 'nation', 'email', 'page', 'group', 'twitter', 'instagram', 'youtube', 'web' ];
  var trh = jQuery( '<tr>' );
  for( var h=0;h<headings.length;++h ) {
    trh.append( jQuery( '<th></th>' ).text( headings[h] ));
  }
  table.append( trh );
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    var tr = jQuery( '<tr>' );
    for( var h=0;h<headings.length;++h ) {
      tr.append( jQuery( '<td></td>' ).css( 'background-color','#ccc' ).text( record[headings[h]]));
    }
    table.append( tr );
  }  
  var div = jQuery( '<div class="xr-groups-list"></div>' ).append(table);
  return div;
}

function XRRenderReview( records ) {
  var ul1 = jQuery( '<ul>' );
  var headings = [ 'name', 'category', 'county', 'xr region', 'nation', 'email', 'page', 'group', 'twitter', 'instagram', 'youtube', 'web' ];
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    var li1 = jQuery( '<li>' ).text( record['name'] );
    var ul2 = jQuery( '<ul>' );
    ul1.append( li1 );
    li1.append( ul2 );
    for( var h=0;h<headings.length;++h ) {
      var li2 = jQuery( '<li>' );
      ul2.append( li2 );
      li2.append( jQuery( '<strong>' ).text( headings[h]+": " ) );
      if( ! record[headings[h]] ) {
        li2.append( jQuery( '<span style="color: #ccc">no data</span>' ));
      } else if (record[headings[h]].match( /^http/ ) ) {
        li2.append( jQuery( '<a>' ).attr( "href", record[headings[h]] ).text( record[headings[h]] ));
      } else {
        li2.append( jQuery( '<span>' ).text( record[headings[h]] ));
      }
    }
  }  
  return ul1;
}

