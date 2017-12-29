angular.module('coinmachine', ['ui.router', 'kendo.directives', 'lbServices', 'ngMaterial', 'anychart-angularjs'])
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
    .directive('expandKGrid', ['$window', '$timeout', function ($window, $timeout) {
        // Define the directive, but restrict its usage to
        var directive = {
            link: link,           // The function attaching the behavior
            restrict: 'A',        // Restrict directive to be used only as attribute
            require: 'kendoGrid'  // Ensure the directive is set on a <kendo-grid> element
        };

        function link(scope, element, attrs) {
            function resize() {
                var newHeight = element.innerHeight(),
                    otherElements = element.children().not(".k-grid-content"),
                    otherElementsHeight = 0;

                // calculate columns and pagination toobar market grid height
                otherElements.each(function(){
                    otherElementsHeight += $(this).outerHeight();
                });

                var height = $(window).height() - $('#market-filter').height() - $('#market-footer').height() - otherElementsHeight - 136;

                // market grid container height calculation:
                //  -- market filter height
                //  -- footer height
                //  -- market grid header and footer
                //  -- window margin and padding height
                element.children(".k-grid-content").height(height);
            }

            // Attach an eventHandler to the resize event of the window to resize the data area of the grid accordingly
            $($window).resize(function () {
                resize();
            });

            $timeout(function() {
                resize();
            }, 500);
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

        // initialize markers collection
        $scope.markets = [];

        // initialize filter values
        $scope.startTimestamp = new Date();
        $scope.quantity = 1;

        // configure kendo-ui table
        $scope.optionsGrid = {
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

        // configure kendo-ui header table tooltips
        $scope.toolTipOptions = {
            filter: ".k-header",
            position: "top",
            content: function(e) {
                if ($scope.marketGrid.columns[e.target.context.cellIndex] !== undefined)
                    var content = $scope.marketGrid.columns[e.target.context.cellIndex].title;

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
                    $scope.marketGrid.dataSource.data($scope.markets);

                    $log.info($scope.markets.length + ' markets recovered');
                },
                function(httpResponse) {
                    var error = httpResponse.data.error;
                    $log.error('Error querying markets - ' + error.status + ": " + error.message);
                });
        };

        // paint anystock graph
        var table = anychart.data.table();

        table.addData([
            ['2015-12-24', 511.53, 514.98, 505.79, 506.40],
            ['2015-12-25', 512.53, 514.88, 505.69, 507.34],
            ['2015-12-26', 511.83, 514.98, 505.59, 506.23],
            ['2015-12-27', 511.22, 515.30, 505.49, 506.47],
            ['2015-12-28', 510.35, 515.72, 505.23, 505.80],
            ['2015-12-29', 510.53, 515.86, 505.38, 508.25],
            ['2015-12-30', 511.43, 515.98, 505.66, 507.45],
            ['2015-12-31', 511.50, 515.33, 505.99, 507.98],
            ['2016-01-01', 511.32, 514.29, 505.99, 506.37],
            ['2016-01-02', 511.70, 514.87, 506.18, 506.75],
            ['2016-01-03', 512.30, 514.78, 505.87, 508.67],
            ['2016-01-04', 512.50, 514.77, 505.83, 508.35],
            ['2016-01-05', 511.53, 516.18, 505.91, 509.42],
            ['2016-01-06', 511.13, 516.01, 506.00, 509.26],
            ['2016-01-07', 510.93, 516.07, 506.00, 510.99],
            ['2016-01-08', 510.88, 515.93, 505.22, 509.95],
            ['2016-01-09', 509.12, 515.97, 505.15, 510.12],
            ['2016-01-10', 508.53, 516.13, 505.66, 510.42],
            ['2016-01-11', 508.90, 516.24, 505.73, 510.40]
        ]);

        // mapping the data
        var mapping = table.mapAs();

        mapping.addField('open', 1, 'first');
        mapping.addField('high', 2, 'max');
        mapping.addField('low', 3, 'min');
        mapping.addField('close', 4, 'last');
        mapping.addField('value', 4, 'last');

        var chart = anychart.stock();

        // set the series type
        //chart.plot(0).ohlc(mapping).name('ACME Corp.');
        chart.plot(0).candlestick(mapping).name('ACME Corp.');

        $scope.stock = chart;

        // connect socket.io client to socket server
        Socket.connect();

        // subscribe socket.io client to bittrex-event topic
        var cleanUpFuncBittrexEventConfirm = Context.subscribe('bittrex-event', function(event, data) {
            // refresh grid datasource markets
            $scope.marketGrid.dataSource.data(data);
        });

        // unsubscribe socket.io client to bittrex-event topic on destroy
        $scope.$on('$destroy', function() {
            cleanUpFuncBittrexEventConfirm();
        });
    }]);
