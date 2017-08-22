angular.module('coinmachine', ['ui.router', 'kendo.directives', 'lbServices'])
    .config(['$stateProvider', 'SocketProvider', function ($stateProvider) {
        'use strict';
    }])
    .factory('Context', ['$rootScope', function($rootScope) {
        return {
            emit: function(eventName, value) {
                $rootScope.$emit(eventName, value);
            },
            subscribe: function(eventName, callback) {
                return $rootScope.$on(eventName, callback);
            },
            unsubscribe: function(currentScope) {
                currentScope.currentScope.vm.cleanUpFuncsId.forEach(function(id) {
                    $rootScope.$$listeners[id] = [];
                });
            }
        };
    }])
    .factory('Socket', ['$log', 'Context', function($log, Context) {
        var socket = undefined;

        return {
            connect: function() {
                socket = io.connect('http://localhost:3000');

                socket.on('error', function(err){
                    $log.error(err)
                });

                socket.on('connect', function() {
                    $log.info('User connected to socket.io server');

                    // define soket.io channels beetween utrack and utrack-gateway
                    $log.info('Subscribed to bittrex-event');
                    socket.on('bittrex-event', function(event) {
                        $log.info('event from bittrex-event topic is: ' + event);

                        // propagate the message throw event bus
                        Context.emit('bittrex-event', event);
                    });

                    socket.on("disconnect",function(event) {
                        $log.info('User disconnected to socket.io server with event: ' + event);
                    });
                });

                return socket;
            },
            disconnect: function(event) {
                $log.info('User disconnected to socket.io with event: ' + event);
            }
        };
    }])
    .controller('mainController', ['$scope', '$log', 'Bittrex', 'Socket', 'Context', function ($scope, $log, Bittrex, Socket, Context) {
        'use strict';

        $scope.markets = [];

        // configure kendo ui table
        $scope.mainGridOptions = {
            toolbar: ["excel", "pdf"],
            excel: {
                fileName: "Markets Export.xlsx",
                allPages: true
            },
            pdf: {
                fileName: "Markets Export.pdf",
                allPages: true
            },
            dataSource: {
                data: $scope.markets,
                schema: {
                    model: {
                        fields: {
                            MarketName: { type: "string" },
                            High: { type: "number" },
                            Low: { type: "number" },
                            Volume: { type: "number" },
                            Last: { type: "number" },
                            BaseVolume: { type: "number" },
                            TimeStamp: { type: "date" },
                            Bid: { type: "number" },
                            Ask: { type: "number" },
                            OpenBuyOrders: { type: "number" },
                            OpenSellOrders: { type: "number" },
                            PrevDay: { type: "number" },
                            Created: { type: "date" }
                        }
                    }
                },
                pageSize: 50
            },
            height: 550,
            scrollable: true,
            sortable: true,
            filterable: true,
            pageable: {
                input: true,
                numeric: false
            },
            columns: [
                { field: "MarketName", title: "Market Name"},
                { field: "High", title: "High"},
                { field: "Low", title: "Low"},
                { field: "Volume", title: "Volume"},
                { field: "Last", title: "Last"},
                { field: "BaseVolume", title: "Base Volume"},
                { field: "TimeStamp", title: "TimeStamp"},
                { field: "Bid", title: "Bid"},
                { field: "Ask", title: "Ask"},
                { field: "OpenBuyOrders", title: "Open Buy Orders"},
                { field: "OpenSellOrders", title: "Open Sell Orders"},
                { field: "PrevDay", title: "Previous Day"},
                { field: "Created", title: "Created"}
            ]
        };

        // load market summary
        $scope.onClick = function (event) {
            // get Bittrex markets summary
            Bittrex.getMarketSummaries()
                .$promise
                .then(function(markets, responseHeaders) {
                    if (markets.length > 0)
                        $scope.markets = JSON.parse(angular.toJson(markets));
                    else
                        $scope.markets = [];

                    // refresh grid datasource
                    $scope.gridProducts.dataSource.data($scope.markets);

                    $log.info($scope.markets.length + ' markets recovered');
                },
                function(httpResponse) {
                    var error = httpResponse.data.error;
                    $log.error('Error querying markets - ' + error.status + ": " + error.message);
                });
        };

        // connect socket.io client to socket server
        Socket.connect();

        // subscribe socket.io client to bittrex-event topic
        var cleanUpFuncBittrexEventConfirm = Context.subscribe('bittrex-event', function(event, data) {
            $log.info(data);

        });

        // unsubscribe socket.io client to bittrex-event topic
        $scope.$on('$destroy', function() {
            cleanUpFuncBittrexEventConfirm();
        });
    }]);
