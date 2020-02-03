
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

function XRList( id, area ) {
  jQuery(document).ready( function(){
    XRListWhenReady( id, area );
  });
}

var XRDATA = null;
var XRLOADING = false;
async function XRListWhenReady( id, area ) {
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

  var table = jQuery( '<table>' );
  var headings = [ 'name', 'category', 'county', 'xr region', 'nation', 'email', 'page', 'group', 'twitter', 'instagram', 'youtube', 'web' ];
  var records = googleSheetToData( XRDATA, 3 );
  var trh = jQuery( '<tr>' );
  for( var h=0;h<headings.length;++h ) {
    trh.append( jQuery( '<th></th>' ).text( headings[h] ));
  }
  table.append( trh );
  for( var i=0;i<records.length;++i ) {
    var record = records[i];
    if( area 
     && ( !record['county'] || area.toLowerCase() != record['county'].toLowerCase() )
     && ( !record['xr region'] || area.toLowerCase() != record['xr region'].toLowerCase() )
     && ( !record['nation'] || area.toLowerCase() != record['nation'].toLowerCase() ) ) {
      continue;
    }
    var tr = jQuery( '<tr>' );
    for( var h=0;h<headings.length;++h ) {
      tr.append( jQuery( '<td></td>' ).text( record[headings[h]] ));
    }
    table.append( tr );
  }  
  jQuery( '#'+id ).append( table );    
}

