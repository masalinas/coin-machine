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

                    // define socket.io channels beetween utrack and utrack-gateway
                    $log.info('Subscribed to bittrex-event');
                    socket.on('bittrex-event', function(event) {
                        // propagate the message throw event bus
                        Context.emit('bittrex-event', event);

                        //$log.info('event from bittrex-event topic is: ' + event);
                    });
                });

                socket.on("disconnect",function(event) {
                    $log.info('User disconnected to socket.io server with event: ' + event);
                });

                return socket;
            },
            disconnect: function(event) {
                $log.info('User disconnected to socket.io with event: ' + event);
            }
        };
    }])
    .directive('kendoExpandGrid', ['$window', function ($window) {
        // Define the directive, but restrict its usage to
        var directive = {
            link: link,           // The function attaching the behavior
            restrict: 'A',        // Restrict directive to be used only as attribute
            scope: {
                name: '=name',
                options: '=options'
            },
            template: '<div kendo-grid="{{name}}" options="{{options}}"></div>'
        };

        function link(scope, element, attrs) {
            var gridElement = $(element);

            // Attach an eventHandler to the resize event of the
            // window to resize the data area of the grid accordingly
            $($window).resize(function () {
                var newHeight = gridElement.innerHeight(),
                    otherElements = gridElement.children().not(".k-grid-content"),
                    otherElementsHeight = 0;

                // calculate columns and pagination toobar market grid height
                otherElements.each(function(){
                    otherElementsHeight += $(this).outerHeight();
                });

                var height = $(window).height() - $('#filter').height() - $('#footer').height() - otherElementsHeight - 56;

                // market grid container height calculation:
                //  -- market filter height
                //  -- footer height
                //  -- market grid header and footer
                //  -- window margin and padding height
                gridElement.children(".k-grid-content").height(height);
            });
        }

        return directive;
    }])
    .directive('expandKGrid', ['$window', '$timeout', function ($window, $timeout) {
        // Define the directive, but restrict its usage to
        var directive = {
            link: link,           // The function attaching the behavior
            restrict: 'A',        // Restrict directive to be used only as attribute
            require: 'kendoGrid'  // Ensure the directive is set on a <kendo-grid> element
        };

        function link(scope, element, attrs) {
            var gridElement = $(element);

            function resize() {
                var newHeight = gridElement.innerHeight(),
                    otherElements = gridElement.children().not(".k-grid-content"),
                    otherElementsHeight = 0;

                // calculate columns and pagination toobar market grid height
                otherElements.each(function(){
                    otherElementsHeight += $(this).outerHeight();
                });

                var height = $(window).height() - $('#filter').height() - $('#footer').height() - otherElementsHeight - 56;

                // market grid container height calculation:
                //  -- market filter height
                //  -- footer height
                //  -- market grid header and footer
                //  -- window margin and padding height
                gridElement.children(".k-grid-content").height(height);
            }

            // Attach an eventHandler to the resize event of the
            // window to resize the data area of the grid accordingly
            $($window).resize(function () {
                resize();
            });

            $timeout(function() {
                resize();
            }, 1000);
        }

        return directive;
    }])
    .controller('mainController', ['$scope', '$log', 'Bittrex', 'Socket', 'Context', function ($scope, $log, Bittrex, Socket, Context) {
        'use strict';

        // configure any kendo widgets before rendered
        $scope.$on("kendoRendered", function(e) {
            // set list time intervals to readonly
            //$scope.comboboxMarketInterval.readonly(true);
        });

        $scope.markets = [];

        // configure kendo-ui table
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

        // configure kendo-ui header table tooltips
        $scope.toolTipOptions = {
            filter: ".k-header",
            position: "top",
            content: function(e) {
                if ($scope.gridMarkets.columns[e.target.context.cellIndex] !== undefined)
                    var content = $scope.gridMarkets.columns[e.target.context.cellIndex].title;

                return content;
            }
        };

        // load market candles
        $scope.onGraphClick = function (event) {
            Bittrex.getCandles({market: 'BTC-LTC', tickInterval: 'fiveMin', startTimestamp: $scope.startTimestamp})
                .$promise
                .then(function(candles, responseHeaders) {
                        if (candles.result.length > 0)
                            $scope.candles = JSON.parse(angular.toJson(candles.result));
                        else
                            $scope.candles = [];

                        // create data table on loaded data
                        var dataTable = anychart.data.table();

                        // refresh anyChart datasource
                        $log.info($scope.candles.length + ' candles recovered');
                    },
                    function(httpResponse) {
                        var error = httpResponse.data.error;
                        $log.error('Error querying candles - ' + error.status + ": " + error.message);
                    });
        };

        // load market summary
        $scope.onMarketClick = function (event) {
            Bittrex.getMarketSummaries()
                .$promise
                .then(function(markets, responseHeaders) {
                    if (markets.length > 0)
                        $scope.markets = JSON.parse(angular.toJson(markets));
                    else
                        $scope.markets = [];

                    // refresh grid datasource
                    $scope.gridMarkets.dataSource.data($scope.markets);

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
            $scope.gridMarkets.dataSource.data(markets);
        });

        // unsubscribe socket.io client to bittrex-event topic
        $scope.$on('$destroy', function() {
            cleanUpFuncBittrexEventConfirm();
        });
    }]);
