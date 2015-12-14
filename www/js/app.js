/*
 * angular-elastic v2.4.2
 * (c) 2014 Monospaced http://monospaced.com
 * License: MIT
 */

angular.module('monospaced.elastic', [])

  .constant('msdElasticConfig', {
    append: ''
  })

  .directive('msdElastic', [
    '$timeout', '$window', 'msdElasticConfig',
    function($timeout, $window, config) {
      'use strict';

      return {
        require: 'ngModel',
        restrict: 'A, C',
        link: function(scope, element, attrs, ngModel) {

          // cache a reference to the DOM element
          var ta = element[0],
              $ta = element;

          // ensure the element is a textarea, and browser is capable
          if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
            return;
          }

          // set these properties before measuring dimensions
          $ta.css({
            'overflow': 'hidden',
            'overflow-y': 'hidden',
            'word-wrap': 'break-word'
          });

          // force text reflow
          var text = ta.value;
          ta.value = '';
          ta.value = text;

          var append = attrs.msdElastic ? attrs.msdElastic.replace(/\\n/g, '\n') : config.append,
              $win = angular.element($window),
              mirrorInitStyle = 'position: absolute; top: -999px; right: auto; bottom: auto;' +
                                'left: 0; overflow: hidden; -webkit-box-sizing: content-box;' +
                                '-moz-box-sizing: content-box; box-sizing: content-box;' +
                                'min-height: 0 !important; height: 0 !important; padding: 0;' +
                                'word-wrap: break-word; border: 0;',
              $mirror = angular.element('<textarea tabindex="-1" ' +
                                        'style="' + mirrorInitStyle + '"/>').data('elastic', true),
              mirror = $mirror[0],
              taStyle = getComputedStyle(ta),
              resize = taStyle.getPropertyValue('resize'),
              borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                          taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
              boxOuter = !borderBox ? {width: 0, height: 0} : {
                            width:  parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                            height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                                    parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                                    parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                          },
              minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
              heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
              minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
              maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
              mirrored,
              active,
              copyStyle = ['font-family',
                           'font-size',
                           'font-weight',
                           'font-style',
                           'letter-spacing',
                           'line-height',
                           'text-transform',
                           'word-spacing',
                           'text-indent'];

          // exit if elastic already applied (or is the mirror element)
          if ($ta.data('elastic')) {
            return;
          }

          // Opera returns max-height of -1 if not set
          maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

          // append mirror to the DOM
          if (mirror.parentNode !== document.body) {
            angular.element(document.body).append(mirror);
          }

          // set resize and apply elastic
          $ta.css({
            'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
          }).data('elastic', true);

          /*
           * methods
           */

          function initMirror() {
            var mirrorStyle = mirrorInitStyle;

            mirrored = ta;
            // copy the essential styles from the textarea to the mirror
            taStyle = getComputedStyle(ta);
            angular.forEach(copyStyle, function(val) {
              mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
            });
            mirror.setAttribute('style', mirrorStyle);
          }

          function adjust() {
            var taHeight,
                taComputedStyleWidth,
                mirrorHeight,
                width,
                overflow;

            if (mirrored !== ta) {
              initMirror();
            }

            // active flag prevents actions in function from calling adjust again
            if (!active) {
              active = true;

              mirror.value = ta.value + append; // optional whitespace to improve animation
              mirror.style.overflowY = ta.style.overflowY;

              taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

              taComputedStyleWidth = getComputedStyle(ta).getPropertyValue('width');

              // ensure getComputedStyle has returned a readable 'used value' pixel width
              if (taComputedStyleWidth.substr(taComputedStyleWidth.length - 2, 2) === 'px') {
                // update mirror width in case the textarea width has changed
                width = parseInt(taComputedStyleWidth, 10) - boxOuter.width;
                mirror.style.width = width + 'px';
              }

              mirrorHeight = mirror.scrollHeight;

              if (mirrorHeight > maxHeight) {
                mirrorHeight = maxHeight;
                overflow = 'scroll';
              } else if (mirrorHeight < minHeight) {
                mirrorHeight = minHeight;
              }
              mirrorHeight += boxOuter.height;
              ta.style.overflowY = overflow || 'hidden';

              if (taHeight !== mirrorHeight) {
                ta.style.height = mirrorHeight + 'px';
                scope.$emit('elastic:resize', $ta);
              }

              scope.$emit('taResize', $ta); // listen to this in the UserMessagesCtrl

              // small delay to prevent an infinite loop
              $timeout(function() {
                active = false;
              }, 1);

            }
          }

          function forceAdjust() {
            active = false;
            adjust();
          }

          /*
           * initialise
           */

          // listen
          if ('onpropertychange' in ta && 'oninput' in ta) {
            // IE9
            ta['oninput'] = ta.onkeyup = adjust;
          } else {
            ta['oninput'] = adjust;
          }

          $win.bind('resize', forceAdjust);

          scope.$watch(function() {
            return ngModel.$modelValue;
          }, function(newValue) {
            forceAdjust();
          });

          scope.$on('elastic:adjust', function() {
            initMirror();
            forceAdjust();
          });

          $timeout(adjust);

          /*
           * destroy
           */

          scope.$on('$destroy', function() {
            $mirror.remove();
            $win.unbind('resize', forceAdjust);
          });
        }
      };
    }
  ]);
// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('ChatApp', ['ionic', 'monospaced.elastic', 'angularMoment'])
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
    }]).controller('ChatController', ['$scope', '_socketplug', '$window', '$ionicModal', '$ionicLoading', '$ionicScrollDelegate', '$timeout', function($scope, _socketplug, $window, $ionicModal, $ionicLoading, $ionicScrollDelegate, $timeout) {
        var self = this;
        $scope.messages = [];
        $scope.users = [];
        function keepKeyboardOpen() {
          console.log('keepKeyboardOpen');
          txtInput.one('blur', function() {
            console.log('textarea blur, focus back on it');
            txtInput[0].focus();
          });
        }
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
            keepKeyboardOpen();
            console.log(self.msg);
            _socketplug.sendMsg(self.msg);
            self.msg = "";
            $timeout(function() {
        keepKeyboardOpen();
        $ionicScrollDelegate.scrollBottom();
      }, 0);

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
        var messageCheckTimer;
        var viewScroll = $ionicScrollDelegate.$getByHandle('userMessageScroll');
    var footerBar; // gets set in $ionicView.enter
    var scroller;
    var txtInput; // ^^^

        console.log("ITS READY!");
    $timeout(function() {
            footerBar = document.body.querySelector('.bar-footer');
            scroller = document.body.querySelector('.scroll-content');
            txtInput = angular.element(footerBar.querySelector('textarea'));
          }, 0);

        $scope.$on('taResize', function(e, ta) {
      //console.log('taResize');
      if (!ta) return;

      var taHeight = ta[0].offsetHeight;
      //console.log('taHeight: ' + taHeight);

      if (!footerBar) return;

      var newFooterHeight = taHeight + 10;
      newFooterHeight = (newFooterHeight > 44) ? newFooterHeight : 44;

      footerBar.style.height = newFooterHeight + 'px';
      scroller.style.bottom = newFooterHeight + 'px';
    });

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
    /*angular.module('msgr').directive('isFocused', function($timeout) {
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
      });*/
