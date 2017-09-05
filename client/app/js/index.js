angular.module('coinmachine', ['ui.router', 'kendo.directives', 'lbServices', 'ngMaterial'])
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
                        //$log.info('event from bittrex-event topic is: ' + event);

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
    .directive('expandKGrid', ['$window', function ($window) {
        // Define the directive, but restrict its usage to
        var directive = {
            link: link,           // The function attaching the behavior
            restrict: 'A',        // Restrict directive to be used only as attribute
            require: 'kendoGrid'  // Ensure the directive is set on a <kendo-grid> element
        };
        return directive;

        function link(scope, element, attrs) {
            var gridElement = $(element);

            // Attach an eventHandler to the resize event of the
            // window to resize the data area of the grid accordingly
            $($window).resize(function () {
                // Get the element wrapping the data
                var dataElement = gridElement.find('.k-grid-content');

                // Get all other elements (headers, footers, etc...)
                var nonDataElements = gridElement.children().not('.k-grid-content');

                // Get the height of the whole grid without any borders or margins
                var currentGridHeight = gridElement.innerHeight();

                // Get viewport height
                var viewportHeight = $(window).height();

                var containerHeight = $('#market-container').height();

                // Calculate and set the height for the data area, which is the height of the whole grid less the height taken by all non-data content.
                var nonDataElementsHeight = 0;
                nonDataElements.each(function () {
                    nonDataElementsHeight += $(this).outerHeight();
                });

                //dataElement.height(currentGridHeight - nonDataElementsHeight);
                //dataElement.height(viewportHeight - nonDataElementsHeight);
                dataElement.height(100);
            });
        }
    }])
    .controller('mainController', ['$scope', '$log', 'Bittrex', 'Socket', 'Context', function ($scope, $log, Bittrex, Socket, Context) {
        'use strict';

        $scope.markets = [];

        /*function resizeGrid() {
            var gridElement = $('#market-grid');

            // Get the element wrapping the data
            var dataElement = gridElement.find('.k-grid-content');
            // Get all other elements (headers, footers, etc...)
            var nonDataElements = gridElement.children().not('.k-grid-content');
            // Get the height of the whole grid without any borders or margins
            var currentGridHeight = gridElement.innerHeight();
            // Calculate and set the height for the data area, which
            // is the height of the whole grid less the height taken
            // by all non-data content.
            var nonDataElementsHeight = 0;
            nonDataElements.each(function () {
                nonDataElementsHeight += $(this).outerHeight();
            });
            dataElement.height(currentGridHeight - nonDataElementsHeight);
        }*/

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
            scrollable: true,
            sortable: true,
            filterable: true,
            resizable: true,
            selectable: true,
            columnMenu: true,
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
                { field: "TimeStamp", title: "TimeStamp", template: '#= kendo.toString(kendo.parseDate(TimeStamp), "dd/MM/yyyy HH:mm:ss")#'},
                { field: "Bid", title: "Bid"},
                { field: "Ask", title: "Ask"},
                { field: "OpenBuyOrders", title: "Open Buy Orders"},
                { field: "OpenSellOrders", title: "Open Sell Orders"},
                { field: "PrevDay", title: "Previous Day"},
                { field: "Created", title: "Created", template: '#= kendo.toString(kendo.parseDate(Created), "dd/MM/yyyy HH:mm:ss")#'}
            ]
        };

        $scope.toolTipOptions = {
            filter: ".k-header",
            position: "top",
            content: function(e) {
                if ($scope.gridProducts.columns[e.target.context.cellIndex] !== undefined)
                    var content = $scope.gridProducts.columns[e.target.context.cellIndex].title;

                return content;
            }
        };

        // configure kendo widgets before rendered
        $scope.$on("kendoRendered", function(e) {
            // set list time intervals to readonly
            //$scope.comboboxMarketInterval.readonly(true);
        });

        // load graph summary
        $scope.onGraphClick = function (event) {
            // create data table on loaded data
            var dataTable = anychart.data.table();

            // get candles from startTimestamp
            Bittrex.getCandles({market: 'BTC-LTC', tickInterval: 'fiveMin', startTimestamp: $scope.startTimestamp})
                .$promise
                .then(function(candles, responseHeaders) {
                        if (candles.result.length > 0)
                            $scope.candles = JSON.parse(angular.toJson(candles.result));
                        else
                            $scope.candles = [];

                        $log.info($scope.candles.length + ' candles recovered');
                    },
                    function(httpResponse) {
                        var error = httpResponse.data.error;
                        $log.error('Error querying markets - ' + error.status + ": " + error.message);
                    });
        };

        // load market summary
        $scope.onMarketClick = function (event) {
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
        var cleanUpFuncBittrexEventConfirm = Context.subscribe('bittrex-event', function(event, markets) {
            // refresh grid datasource markets
            $scope.gridProducts.dataSource.data(markets);
        });

        // unsubscribe socket.io client to bittrex-event topic
        $scope.$on('$destroy', function() {
            cleanUpFuncBittrexEventConfirm();
        });
    }]);
