
var map = L.map('map').setView([54.5, -2], 6);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 21
}).addTo(map);


function onEachFeature(feature, layer, set) {

	var id = set+"-"+feature.properties.objectid;
	if( ! document.getElementById(id) ) {
		alert( "missing popup info for "+id );
		return;
	}
	var popupContent = document.getElementById(id).innerHTML;
//"<p>I started out as a GeoJSON " +
//JSON.stringify( feature.properties )+"("+set+")"+
			//feature.geometry.type + ", but now I'm a Leaflet vector!</p>";

	if (feature.properties && feature.properties.popupContent) {
		popupContent += feature.properties.popupContent;
	}

	layer.bindPopup(popupContent);
}

L.geoJSON(regions_england, {
	onEachFeature: function(feature,layer) { onEachFeature(feature,layer,"region-england"); }
}).addTo(map);
