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
                    socket.on('bittrex-event', function(event) {
                        $log.info('Subscribed to bittrex-event');

                        // propagate the message throw event bus
                        Context.emit('bittrex-event', event);
                    });

                    socket.on('ccxt-ohlcv', function(event) {
                        $log.info('Subscribed to ccxt-ohlcv');

                        // propagate the message throw event bus
                        Context.emit('ccxt-ohlcv', event);
                    });

                    socket.on('ccxt-tickers', function(event) {
                        $log.info('Subscribed to ccxt-tickers');

                        // propagate the message throw event bus
                        Context.emit('ccxt-tickers', event);
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
    .controller('mainController', ['$scope', '$log', 'Coinmarketcap', 'Socket', 'Context', 'AnychartService', function ($scope, $log, Coinmarketcap, Socket, Context, AnychartService) {
        'use strict';

        // configure any kendo widgets before rendered
        $scope.$on("kendoRendered", function(e) {
            // set list time intervals to readonly
            //$scope.comboboxMarketInterval.readonly(true);
        });

        // initialize filter values
        $scope.startTimestamp = new Date();
        $scope.quantity = 1;

        // initialize collections
        $scope.marketCaps =[];
        $scope.tickers = [];

        var initializeTable = function initializeTable() {
            // configure market tickers table
            $scope.optionsCcxtGrid = {
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
                    data: $scope.tickers,
                    schema: {
                        model: {
                            fields: {
                                symbol: { type: "string" },
                                low: { type: "number" },
                                high: { type: "number" },
                                bid: { type: "number" },
                                ask: { type: "number" },
                                last: { type: "number" },
                                quoteVolume: { type: "number" },
                                baseVolume: { type: "number" },
                                datetime: { type: "date" }
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
                    { field: "symbol", title: "Symbol", template: function(dataRow) {
                            var symbol = dataRow.symbol.split("/")[0];

                            return '<div class="s-s-' + symbol + '" style= "float: left; margin-top: 3px; margin-right: 5px;"></div>' + ' <span>' + dataRow.symbol + '</span>';
                        }
                    },
                    { field: "low", title: "Low"},
                    { field: "high", title: "High"},
                    { field: "bid", title: "Bid"},
                    { field: "ask", title: "Ask"},
                    { field: "last", title: "Last"},
                    { field: "quoteVolume", title: "Volume"},
                    { field: "baseVolume", title: "Base Volume"},
                    { field: "datetime", title: "Date", template: '#= kendo.toString(kendo.parseDate(datetime), "dd/MM/yyyy HH:mm:ss")#'}
                ]
            };

            $scope.toolTipOptions = {
                filter: ".k-header",
                position: "top",
                content: function(e) {
                    if ($scope.marketGrid.columns[e.target.context.cellIndex] !== undefined)
                        var content = $scope.marketGrid.columns[e.target.context.cellIndex].title;

                    return content;
                }
            };
        };

        var initializeGraph = function initializeGraph() {
            // configure anystock ohlcv graph
            var table = anychart.data.table();

            // initialize ohlcv graph collection
            table.addData([]);

            // price mapping the data
            var priceMapping = table.mapAs();

            priceMapping.addField('open', 1, 'first');
            priceMapping.addField('high', 2, 'max');
            priceMapping.addField('low', 3, 'min');
            priceMapping.addField('close', 4, 'last');

            // volume mapping the data
            var volumeMapping = table.mapAs();
            volumeMapping.addField('value', 5, 'sum');

            $scope.chartInstance = anychart.stock();

            // configure the price series
            //$scope.chartInstance.plot(0).ohlc(priceMapping).name('ACME Corp.'); // OHLC Graph
            $scope.chartInstance.plot(0).candlestick(priceMapping).name('ACME Corp.'); // Candlestick Graph

            // configure the volume series
            $scope.chartInstance.plot(1).column(volumeMapping).name('Volume');

            $scope.chartInstance.padding(10, 10, 10, 50);
            $scope.chartInstance.plot(1).height('30%');

            $scope.chartInstance.plot(1).yAxis().labels().format(function () {
                var val = this['tickValue'];
                var neg = val < 0;
                val = Math.abs(val);
                if (val / 1e15 >= 1) {
                    return (val / 1e9).toFixed(0) + 'Q';
                } else if (val / 1e12 >= 1) {
                    return (val / 1e9).toFixed(0) + 'T';
                } else if (val / 1e9 >= 1) {
                    return (val / 1e9).toFixed(0) + 'B';
                } else if (val / 1e6 >= 1) {
                    return (val / 1e6).toFixed(0) + 'M';
                } else if (val / 1e3 >= 1) {
                    return (val / 1e3).toFixed(0) + 'K';
                }
                return neg ? '-' + val : val;
            });

            $scope.stock =  $scope.chartInstance;
        };

        // get all market caps
        var getMarketCaps = function getMarketCaps(maxMarkets) {
            Coinmarketcap.getTicker({limit: MAX_MARKETS})
                .$promise
                .then(function(marketCaps, responseHeaders) {
                        if (marketCaps.length > 0)
                            $scope.marketCaps = marketCaps;
                        else
                            $scope.marketCaps = [];

                        $scope.marketOptions = {
                            dataSource: $scope.marketCaps,
                            dataTextField: "name",
                            dataValueField: "symbol",
                            headerTemplate: '<div class="dropdown-header k-widget k-header">' +
                            '<span>Logo</span>' +
                            '<span>Market (Symbol)</span>' +
                            '</div>',
                            valueTemplate: "<div ng-class=\"'s-s-{{dataItem.symbol}}'\" style= \"float: left; margin-top: 3px; margin-right: 5px;\"></div>{{dataItem.name}} ({{dataItem.symbol}})</span>",
                            template: "<div ng-class=\"'s-s-{{dataItem.symbol}}'\" style= \"float: left; margin-top: 3px; margin-right: 5px;\"></div>{{dataItem.name}} ({{dataItem.symbol}})</span>",
                            footerTemplate: 'Total #: instance.dataSource.total() # coins found',
                        };

                        // refresh anyChart datasource
                        $log.info($scope.marketCaps.length + ' Market Caps recovered');
                    },
                    function(httpResponse) {
                        var error = httpResponse.data.error;
                        $log.error('Error querying tickers - ' + error.status + ": " + error.message);
                    });
        };

        const MAX_MARKETS = 3000;
        getMarketCaps(MAX_MARKETS);

        // intialize Market tickers table
        initializeTable();

        // intialize Market ohlcv stock grah
        initializeGraph();

        // load market tickers
        $scope.onTickerClick = function (event) {

        };

        // load market candles
        $scope.onGraphClick = function (event) {

        };

        // connect socket.io client to socket server
        Socket.connect();

        // subscribe socket.io client to bittrex event topics
        var cleanUpFuncBittrexEventConfirm = Context.subscribe('bittrex-event', function(event, data) {
            var tickers = data;

            // refresh grid datasource markets
            //$scope.marketGrid.dataSource.data(tickers);
        });

        // subscribe socket.io client to ccxt event topics
        var cleanUpFuncCcxtEventConfirm = Context.subscribe('ccxt-tickers', function(event, data) {
            var tickers = [];

            Object.keys(data).forEach(function(key, index) {
                // key: the name of the object key
                // index: the ordinal position of the key within the object
                tickers.push(data[key]);
            });

            // refresh grid datasource markets
            $scope.marketGrid.dataSource.data(tickers);
        });

        var cleanUpFuncCcxtOHLCVConfirm = Context.subscribe('ccxt-ohlcv', function(event, data) {
            // refresh candelstick graph datasource
            if (AnychartService.chart) {
                // refresh the data in the stock series already created
                AnychartService.chart.plot(0).getSeries(0).data(data);
                AnychartService.chart.plot(1).getSeries(0).data(data);

                /*var table = anychart.data.table();

                table.addData(data);

                // mapping the data
                var mapping = table.mapAs();

                mapping.addField('open', 1, 'first');
                mapping.addField('high', 2, 'max');
                mapping.addField('low', 3, 'min');
                mapping.addField('close', 4, 'last');
                mapping.addField('value', 4, 'last');*/

                // remove all series
                /*AnychartService.chart.plot(0).removeAllSeries();

                // add the new series with the new data
                AnychartService.chart.plot(0).candlestick(mapping).name('ACME Corp.');*/
            }
        });

        // unsubscribe socket.io client to bittrex-event and bittrex-ohlcv topic on destroy
        $scope.$on('$destroy', function() {
            cleanUpFuncBittrexEventConfirm();
            cleanUpFuncCcxtEventConfirm();
            cleanUpFuncCcxtOHLCVConfirm();
        });
    }]);
