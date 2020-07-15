
var update_email = "christophergutteridge@gmail.com";

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
      headings[i] = grid[heading_row][i].inputValue.toLowerCase();
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

function XRList( id, area, layout ) {
  jQuery(document).ready( function(){
    XRListWhenReady( id, area, layout  );
  });
}

var XRDATA = null;
var XRLOADING = false;
async function XRListWhenReady( id, area, layout  ) {
  if( !XRDATA ) {
    if( !XRLOADING ) { 
      XRLOADING = true;
        jQuery.ajax({
              url: 'https://spreadsheets.google.com/feeds/cells/1xE9AXVX7vXRnrvhVkA_9DubgxCFywN9bMhSIGws6GHc/1/public/full?alt=json-in-script',
              jsonp: "callback",
              dataType: "jsonp",
              success: function( response ) {
            XRDATA = response;
            XRLOADING = false;
          }
      });
    }
    while( XRLOADING ) { 
      await new Promise(r => setTimeout(r, 200));
    }
  }  

  var records = googleSheetToData( XRDATA, 3 );
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

  var rendered;
  if( layout == "review" ) {
    rendered = XRRenderReview( filteredRecords );
  } 
  if( layout == "table" ) {
    rendered = XRRenderTable( filteredRecords );
    jQuery( '#'+id ).text('').append( rendered ).append( '<p>This information is curated by the National and Regional Development circle. Please contact <a href="mailto:'+update_email+'">'+update_email+'</a> with any corrections or additions.</p>' );    
  } 
  if( layout == "list" ) {
    rendered = XRRenderList( filteredRecords );
    jQuery( '#'+id ).text('').append( rendered ).append( '<p>This information is curated by the National and Regional Development circle. Please contact <a href="mailto:'+update_email+'">'+update_email+'</a> with any corrections or additions.</p>' );    
  } 
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
  return ul;
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
  return table;
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
      if( record[headings[h]].match( '/^http' ) ) {
        li2.append( jQuery( '<a>' ).attr( "href", record[headings[h]] ).text( record[headings[h]] ));
      } else {
        li2.append( jQuery( '<span>' ).text( record[headings[h]] ));
      }
    }
  }  
  return ul1;
}

