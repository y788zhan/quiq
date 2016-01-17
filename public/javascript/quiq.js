
var app = angular.module('quiq', ["firebase", 'ngRoute', 'ngResource']).run(function($rootScope) {
	var ref = new Firebase("https://quiq.firebaseio.com/")
	$rootScope.authenticated = false;
	$rootScope.current_user = '';
	$rootScope.current_lecture = '';
	$rootScope.current_lecture_section = '';

	$rootScope.signout = function() {
		ref.unauth();
		$rootScope.authenticated = false;
		$rootScope.current_user = '';
	}
})

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
	console.log('ran');
	$routeProvider
      //the timeline display
		.when('/', {
			templateUrl: 'main.html',
			controller: 'mainController'
		})
		//the login display
		.when('/login', {
			templateUrl: 'login.html',
			controller: 'authController'
		})
		//the signup display
		.when('/signup', {
			templateUrl: 'signup.html',
			controller: 'authController'
		})

		.when('/dashboard', {
			templateUrl: 'dashboard.html',
			controller: 'dashController'
		})

		.when('/current-course', {
			templateUrl: 'current-course.html',
			controller: 'courseController'
		});
}]);

app.factory("Auth", ["$firebaseAuth",
	function($firebaseAuth) {
		var ref = new Firebase("https://quiq.firebaseio.com/");
		return $firebaseAuth(ref);
	}
]);

app.controller('mainController', function($scope, $firebaseObject, $location) {
	var ref = new Firebase("https://quiq.firebaseio.com/");
});


app.controller('authController', ["$scope", "Auth", "$rootScope", "$location", 
	function($scope, Auth, $rootScope, $location) {
		$scope.createUser = function() {
			$scope.message = null;
			$scope.error = null;

			Auth.$createUser({
				email: $scope.user.email,
				password: $scope.user.password
			}).then(function(userData) {
				$scope.message = "User created with uid: " + userData.uid;
				console.log($scope.message);

				var ref = new Firebase("https://quiq.firebaseio.com/instructors/" + $scope.user.name);
				ref.update({
					name: $scope.user.name
				})

				Auth.$authWithPassword({
					email: $scope.user.email,
					password: $scope.user.password
				}).then(function(authData) {
					$location.path('/dashboard');
				});

				$rootScope.authenticated = true;
				$rootScope.current_user = $scope.user.name;
			}).catch(function(error) {
				$scope.error = error;
				console.log(error);
			});
		};

		$scope.login = function() {
			$scope.authData = null;
			$scope.error = null;

			Auth.$authWithPassword({
  				email: $scope.user.email,
  				password: $scope.user.password
			}).then(function(authData) {
  				console.log("Logged in as:", authData.uid);
  				$location.path('/dashboard');
  				$rootScope.authenticated = true;
  				$rootScope.current_user = $scope.user.name;
			}).catch(function(error) {
  				console.error("Authentication failed:", error);
			});

		};
	}
]);


function prepopulate() {
	var ref = new Firebase("https://quiq.firebaseio.com/instructors/Do%20Not%20Touch/1234/lectures/17-01-2016");
	var questionRef = [];
	for (var i = 0; i < 10; i++) {
		var votes = [];
		for (var j = 0; j < i; j++) {
			votes[j] = 1;
		}
		questionRef[i] = {
			index: i,
			text: "sample text" + i,
			votes: votes,
			answered: false,
			answer: "empty"
		};
	}
	ref.child('questions').set(questionRef);
}

app.controller('dashController', ["$scope", "$rootScope", "$location",
	function($scope, $rootScope, $location) {
		console.log($rootScope.current_user);
		var courses = new Firebase("https://quiq.firebaseio.com/instructors/" + $rootScope.current_user);
		$scope.courses = {
			availableOptions: []
		};
		courses.once("value", function(snapshot) {
			snapshot.forEach(function(childSnapShot) {
				var courseID = childSnapShot.key();
				if (courseID != "name") {
					var toPush = {id: courseID};
					$scope.courses.availableOptions.push(toPush);
					$scope.$apply();
				}
			});
		});

		$scope.addClass = function() {
			var newCourse = new Firebase("https://quiq.firebaseio.com/instructors/" + $rootScope.current_user + "/" + $scope.className.id);
			newCourse.update({
				lectures: "emptyData"
			});
			console.log('added');
		};

		$scope.beginLecture = function() {
			console.log('begin');
			$rootScope.current_lecture = $scope.courses.selectedOption;
			var timeStamp = new Date();
			var dd = timeStamp.getDate();
			var mm = timeStamp.getMonth() + 1;
			var yyyy = timeStamp.getFullYear();
			if (dd < 10) dd = '0' + dd;
			if (mm < 10) mm = '0' + mm;
			timeStamp = dd + '-' + mm + '-' + yyyy;
			$rootScope.current_lecture_section = timeStamp;
			var newLecture = new Firebase("https://quiq.firebaseio.com/instructors/" + $rootScope.current_user + "/" + $rootScope.current_lecture.id + "/lectures/" + timeStamp);
			newLecture.update({
				title: "circuits"
			});
			console.log(timeStamp);
			prepopulate();
			$location.path('/current-course');
		};
	}
]);


app.controller('courseController', ['$scope', '$rootScope', '$location', 
	function($scope, $rootScope, $location) {
		$scope.currentCourseID = $rootScope.current_lecture.id;
		$scope.questions = [];
		var ref = new Firebase("https://quiq.firebaseio.com/instructors/" + $rootScope.current_user + "/" + $scope.currentCourseID + "/lectures/" + $rootScope.current_lecture_section);
		//console.log("https://quiq.firebaseio.com/instructors/" + $rootScope.current_user + "/" + $scope.currentCourseID + "/lectures/" + $rootScope.current_lecture_section);
		ref.on("value", function(snapshot) {
			var toPush = {};
			$scope.questions = snapshot.val().questions;
			console.log($scope.questions);
			var answered;
			var votes = 0;
			var questionBody;
			if(!$scope.$$phase) {
				$scope.$apply();
			}
			/***
			for (var i = 0; i < questionsSource.length; i++) {
				answered = questionsSource[i].answered;
				if (questionsSource[i].votes) {
					for (var j = 0; j < questionsSource[i].votes.length; j++) {
						votes += questionsSource[i].votes[j];
					}
				}
				questionBody = questionsSource[i].text;

				if (votes >= 5 && !answered) {
					toPush = {
						text: questionBody,
						votes: votes,
						index: i
					};
					console.log(toPush);
					$scope.questions.push(toPush);
				}
				votes = 0;
			}
			***/
		});

		$scope.answer = function(index) {
			console.log(index);
			ref.child('questions').child(index).update({answered:true});
			console.log('done');
			ref.child('questions').child(index).update({answer: "some answer"});
		};

		$scope.dismiss = function(index) {
			ref.child('questions').child(index).remove();
		};
	}
]);



