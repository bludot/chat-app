// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ChatApp', ['ionic'])
    .factory('_socketplug', ['$window', '$q', '$http', function($window, $q, $http) {
        return {
            // Initialize the socketplug API with callback to do another function
            // when done
            init: function(scope, callback) {
                // we need scope to do our functions inside of the
                // ChatController scope
                var scope = scope;

                // Standard url. Will change later when adding security as to
                // who has access to use the chat like this (this requires
                // socketplug backend programming)
                var asyncUrl = "http://socketplug.floretos.com/js/client/web/init.js";

                // Function to load the script
                var asyncLoad = function(asyncUrl) {
                    var script = document.createElement('script');
                    script.src = asyncUrl;
                    document.body.appendChild(script);
                };

                // Lets load it!
                asyncLoad(asyncUrl);

                // Set _socketplug to what is returned so that we can add our functions to it
                var _socketplug = this;
                // Don't think this is needed anymore
                _socketplug.not_loaded = true;
                // Is it loaded? What about now? Now?
                var interval = setInterval(function() {
                    // Its loaded!
                    if ($window.socketplug) {
                        (function(io, socketplug) {

                            console.log("its going");

                            var socket_events = {
                                "chat": {
                                    events: {
                                        'join': function(data) {
                                            console.log("joined");
                                            scope.loginModal.hide();
                                            console.log(data);
                                            scope.data = data;
                                            scope.users = data.users.map(function(user) {
                                                return {username: user, room: data.room};
                                            });
                                        },
                                        'user_join': function(data) {
                                            scope.newUser(data);
                                        },
                                        'msg': function(data) {
                                            scope.newMsg(data);
                                        },
                                        'user_leave': function(data) {
                                            console.log(data);
                                            scope.removeUser(data);
                                        }
                                    }
                                }
                            }

                            _socketplug.socket = socketplug({
                                apikey: "username",
                                apisecret: "password",
                                socket_events: socket_events,
                                getOAuth: true,
                                services: ["chat"]
                            });
                            _socketplug.login = function(username) {
                                _socketplug.socket.services.chat.socket.emit('login', {
                                    username: username
                                })
                            }
                            _socketplug.sendMsg = function(msg) {
                                _socketplug.socket.services.chat.socket.emit('msg', {
                                    msg: msg
                                });
                                this.value = "";
                            }

                        })(io, socketplug);
                        callback();
                        clearInterval(interval);
                    }
                }, 1000);
            }
        };
    }])
    .run(['$ionicPlatform', '$timeout', '_socketplug', function($ionicPlatform, $timeout, _socketplug, $ionicPopup) {
        $ionicPlatform.ready(function() {

            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            if(window.Connection) {
              if(navigator.connection.type == Connection.NONE) {
                $ionicPopup.confirm({
                  title: 'Network Problem',
                  content: 'Sorry, Please Check Your Network Connection.'
                })
                .then(function(result) {
                  if(!result) {
                    navigator.app.exitApp();
                  }
                });
              }
            }
        });
    }]).controller('ChatController', ['$scope', '_socketplug', '$window', '$ionicModal', '$ionicLoading', '$ionicScrollDelegate', function($scope, _socketplug, $window, $ionicModal, $ionicLoading, $ionicScrollDelegate) {
        var self = this;
        $scope.messages = [];
        $scope.users = [];
        // Loading functions
        $scope.showLoading = function() {
            $ionicLoading.show({
                template: 'Loading...'
            });
        };
        $scope.hideLoading = function() {
            $ionicLoading.hide();
        };

        // We gotta show loading while we load socketplug
        $scope.showLoading();

        // Setup the modal for initial login
        $ionicModal.fromTemplateUrl('login.html', function(modal) {
            $scope.loginModal = modal;
        }, {
            scope: $scope,
            animation: 'slide-in-up'
        });

        // The login function to show the login modal
        // happens when socketplug is loaded
        $scope.login = function() {
            $scope.hideLoading();
            $scope.loginModal.show();
        }

        $scope.newUser = function(data) {
            if(data.username != self.username) {
                $scope.users.push(data);
                console.log($scope.users);
                $scope.$apply();
            }
        }

        $scope.removeUser = function(data) {
            $scope.users.splice($scope.users.indexOf(data.username), 1);
            console.log($scope.users);
            $scope.$apply();
        }

        // We have to process the login when user gives username
        $scope.processLogin = function() {
            console.log("got the tap");
            _socketplug.login(self.username);
        }

        // We are finally ready to start the app. Fetch socketplug and move on
        // from there
        _socketplug.init($scope, $scope.login);

        // function to join the chat. Not sure if this is used
        $scope.join = function() {
            _socketplug.login();
        };

        // When we send a message we call on socketplug
        self.sendMsg = function() {
            console.log(self.msg);
            _socketplug.sendMsg(self.msg);
            self.msg = "";
            $ionicScrollDelegate.scrollBottom();
        };

        // Theres a new message. lets add it to the messages array and to the
        // view. Might make this different as it will become a huge array soon.
        // SQLite?
        $scope.newMsg = function(data) {
            console.log(data);
            if(data.username == self.username) {
                data.user = "user";
            } else {
                data.user = "other";
            }
            $scope.messages.push(data);
            $scope.$apply();
            console.log(self.messages);
            $ionicScrollDelegate.scrollBottom();
        };


        // Directive. Handles the ng-enter of buttons. This lets use hit enter
        // on the keyboard
    }]).directive('ngEnter', function() {
        return function(scope, element, attrs) {
            return element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    })

                    event.preventDefault();
                }
            });
        };
    });
    angular.module('msgr').directive('isFocused', function($timeout) {
          return {
            scope: { trigger: '@isFocused' },
            link: function(scope, element) {
              scope.$watch('trigger', function(value) {
                if(value === "true") {
                  $timeout(function() {
                    element[0].focus();

                    element.on('blur', function() {
                      element[0].focus();
                    });
                  });
                }

              });
            }
          };
        });
