controllers.controller('editPinController', ['$scope', 'demandFormFactory', 'mapFactory' ,'$location', function($scope, demandFormFactory, mapFactory, $location){

  $scope.userMarker, $scope.routingControl, $scope.initialMarker;
  $scope.map      = mapFactory.buildMap('user-map');
  $scope.demand   = demandFormFactory;
  $scope.markers  = null;
  $scope.demand.pins = [];



  $scope.initialize = function() {
    if (!$scope.demand.user) {
      $location.path('/demands/new');
    }
    $scope.setupAutoComplete();
  }

 

  $scope.setupAutoComplete = function() {
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-23.0763561, -43.7959671),
      new google.maps.LatLng(-22.7259989, -43.0799675)
    );

    var options = { bounds: defaultBounds, componentRestrictions: { country: 'BR' } };
    var input = document.getElementById('searchTextField');

    var autocomplete = new google.maps.places.Autocomplete(input, options);
    

    google.maps.event.addListener(autocomplete, 'place_changed', function(){

      var place = autocomplete.getPlace();
      var lat = place.geometry.location.k;
      var lng = place.geometry.location.D;
     
      // Text field update
      $scope.demand.pin_fullname = place.formatted_address;


      // Setting the initial marker for routing
      $scope.initialMarker = L.latLng(lat, lng);

      // latitude, longitude
      $scope.showMarkerOnAutocomplete(lat, lng);



      $scope.updateDemandPins(lat, lng);

      $scope.$apply();

    });

  }


  $scope.updateDemandPins = function(lat, lng) {
      $scope.demand.pins[0]['latitude'] = lat;
      $scope.demand.pins[0]['longitude'] = lng;
      $scope.$apply();
  }




  $scope.showMarkerOnAutocomplete = function(lat, lng){

    if ( $scope.markers != null ) {
        $scope.markers.clearLayers();
    }

    var icon = L.icon({ iconUrl: 'http://i.imgur.com/S7CbL0Q.png', iconSize: [60, 106], iconAnchor: [60, 100] });
    var marker = L.marker([lat, lng], { icon: icon, draggable: true });

    $scope.markers = L.layerGroup([marker])

    $scope.markers.addTo( $scope.map );

    $scope.map.setView(new L.LatLng(lat, lng), 17)


    // Checking if creating routes is allowed ( based on category/param )

      $scope.onMapClick(); 
      $scope.watchMarkerDragEnd(marker); 



  }

  // If route creation is enabled, allow map click event
  $scope.onMapClick = function() {
    $scope.map.on('click', function(event, layerPoint){
      $scope.map.removeLayer($scope.markers);


      if ( !$scope.routingControl ) {
        $scope.routingControl = L.Routing.control({ 
          waypoints: [
            $scope.initialMarker, 
            event.latlng
          ], 
          routeWhileDragging: true 
        }).addTo($scope.map); 
      }
    });

  }

  // If route creation is not enabled, just trigger a normal drag/drop event on the map
  $scope.watchMarkerDragEnd = function(marker) { 

    marker.on('dragend', function(event){
      var target = event.target
      $scope.userMarker = target.getLatLng();
      $scope.updateSearchOnDrag($scope.userMarker.lat, $scope.userMarker.lng);
      $scope.updateDemandPins($scope.userMarker.lat, $scope.userMarker.lng);      
      $scope.$apply();
    });

  }

  // We get the full street/address name using the Google Apps Geocoder
  $scope.updateSearchOnDrag = function(lat, lng) {

    var geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ 'latLng': latlng  }, function(results, status){
      if ( status == google.maps.GeocoderStatus.OK ) {
        
        if (results[1]) {
          console.log(results[1]);
          $scope.demand.pins[0]['fullname'] = results[1].formatted_address;
          $scope.$apply();

        }
      }
    
    });


    
  }

  $scope.reset = function() {
    $scope.demand = null;
  }


  $scope.nextStep = function() {

    if ($scope.routingControl) {
      $scope.demand.pins = [];
      var waypoints = $scope.routingControl.getWaypoints();
      
      waypoints.forEach(function(item){
        $scope.demand.pins.push({ lat: item.latLng.lat, long: item.latLng.lng, fullname: item.name })
      });
      
    }


    $location.path('/demands/create'); 
  }


  $scope.$on('$locationChangeStart', function(event){
    $scope.map.remove();
  });
 


  $scope.initialize();


}]);
