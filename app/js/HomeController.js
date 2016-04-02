app.controller('HomeController', function($scope, $http) {
    $scope.room = [];
    
    function update() {
        $http.get('https://robin-tracker.herokuapp.com/rooms').then(function(res) {
            $scope.rooms = res.data;
        });        
    }
    
    setTimeout(update, 3 * 60 * 1000);
    update();
       
});