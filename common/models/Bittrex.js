var bittrex = require('node-bittrex-api');
var app = require('../../server/server');

var argv = require('minimist')(process.argv.slice(2));

// bittrex secret tokens
bittrex.options({
    'apikey' : argv.k,
    'apisecret' : argv.s,
    'verbose' : true
});

module.exports = function(Bittrex) {
    // listen to Bittrex WebSocket
    bittrex.websockets.listen( function( data, client) {
        if (data.M === 'updateSummaryState') {
            data.A.forEach(function(data_for) {
                app.io.emit('bittrex-event', data_for.Deltas);
            });
        }

        client.serviceHandlers.connectFailed = function(error) {
            console.log("Websocket connectFailed: ", error);
        };

        client.serviceHandlers.onerror = function(error) {
            console.log("Websocket error: ", error);
        };

        client.serviceHandlers.connectionLost = function(error) {
            console.log("Connection Lost: ", error);
        };
    });

    // publish Bittrex API
    /**
     *
     * example:
     *   data: {
  "success": true,
  "message": "",
  "result": [
        {
          "MarketCurrency": "LTC",
          "BaseCurrency": "BTC",
          "MarketCurrencyLong": "Litecoin",
          "BaseCurrencyLong": "Bitcoin",
          "MinTradeSize": 1e-8,
          "MarketName": "BTC-LTC",
          "IsActive": true,
          "Created": "2014-02-13T00:00:00",
          "Notice": null,
          "IsSponsored": null,
          "LogoUrl": "https://i.imgur.com/R29q3dD.png"
        }]
        }
     */
     Bittrex.getMarkets = function(cb) {
        bittrex.getmarkets(function( data, err ) {
            if (err) return cb(err);

            cb(null, data);
        });
     };

    // publish Bittrex API
    /**
     *
     * example:
     *   market: 'BTC-LTC'
     *   data: {
            "success": true,
            "message": "",
            "result": [{
              "Id": 65431497,
              "TimeStamp": "2017-08-25T11:31:25.703",
              "Quantity": 0.48126005,
              "Price": 0.01165085,
              "Total": 0.00560708,
              "FillType": "PARTIAL_FILL",
              "OrderType": "BUY"
            }]
     */
     Bittrex.getMarketHistory = function(market, cb) {
        bittrex.getmarkethistory({market: market}, function(data, err) {
            if (err) return cb(err);

            cb(null, data);
        });
     };

    /**
     *
     * example:
     *   markets: [{
            "MarketName": "BITCNY-BTC",
            "High": 31053.62881383,
            "Low": 27015.85,
            "Volume": 45.07638951,
            "Last": 28182.04,
            "BaseVolume": 1300709.47539646,
            "TimeStamp": "2017-08-25T11:34:07.48",
            "Bid": 28182.06,
            "Ask": 30988.62,
            "OpenBuyOrders": 35,
            "OpenSellOrders": 50,
            "PrevDay": 30888,
            "Created": "2015-12-11T06:31:40.653"
        }]
     */
     Bittrex.getMarketSummaries = function(cb) {
        bittrex.getmarketsummaries( function(data, err) {
            if (err) return cb(err);

            var markets = [];
            for( var i in data.result ) {
                var market = data.result[i];

                markets.push(market);
            }

            cb(null, markets);
        })
     };

    /**
     * example:
     *   market: 'BTC-LTC'
     *   data: {
          "success": true,
          "message": "",
          "result": [
                {
                  "MarketName": "BTC-LTC",
                  "High": 0.01261321,
                  "Low": 0.0113416,
                  "Volume": 260685.8739045,
                  "Last": 0.011595,
                  "BaseVolume": 3104.15736871,
                  "TimeStamp": "2017-08-25T11:50:30.873",
                  "Bid": 0.011595,
                  "Ask": 0.01165,
                  "OpenBuyOrders": 1512,
                  "OpenSellOrders": 8732,
                  "PrevDay": 0.01235989,
                  "Created": "2014-02-13T00:00:00"
                }
             ]
          }
     */
     Bittrex.getMarketSummary = function(market, cb) {
        bittrex.getmarketsummary({market : market}, function( data, err ) {
            if (err) return cb(err);

            cb(null, data);
        });
     };

    /**
     * example:
     *   market: 'BTC-LTC'
     *   ticker: {
           "success": true,
           "message": "",
           "result": {
             "Bid": 0.01165085,
             "Ask": 0.01165992,
             "Last": 0.01165992
          }
     */
     Bittrex.getTicker = function(market, cb) {
        bittrex.getticker( { market : market }, function( ticker ) {

            cb(null, ticker);
        });
     };

    /**
     * example:
     *   market: 'BTC-LTC'
     *   depth: 10
     *   type: 'both'
     *   data: {
              "success": true,
              "message": "",
              "result": {
                    "buy": [
                          {
                            "Quantity": 6.49240589,
                            "Rate": 0.0116
                          }],
                    "sell": [
                          {
                            "Quantity": 6.49240589,
                            "Rate": 0.0116
                          }]
                    }
              }
     */
     Bittrex.getOrderBook = function(market, depth, type, cb) {
        bittrex.getorderbook({ market : market, depth : depth, type : type}, function( data, err ) {
            if (err) return cb(err);

            cb(null, data);
        });
     };

    /**
     * example:
     *   market: 'BTC-LTC'
     *   tickInterval: 'oneMin', 'fiveMin', 'thirtyMin, 'hour', 'day'
     *   startTimestamp: ''
     *   data: {
              "success": true,
              "message": "",
              "result": [
                    {
                      "O": 3170,
                      "H": 3183.099,
                      "L": 3163,
                      "C": 3163.1,
                      "V": 22.79711959,
                      "T": "2017-08-05T13:05:00",
                      "BV": 72382.73592082
                    }]
                }
     */
     Bittrex.getCandles = function(market, tickInterval, startTimestamp, cb) {
        var startTimestamp = startTimestamp.getTime()/1000;

        bittrex.getcandles({ marketName : market, tickInterval: tickInterval, _: startTimestamp}, function( data, err ) {
            if (err) return cb(err);

            cb(null, data);
        });
     };

     Bittrex.remoteMethod (
        'getMarkets',
        {
            description : "Get Markets List",
            returns: {arg: 'markets', type: 'array', root: true},
            http: {verb: 'get', path: '/bittrex/getMarkets'}
        }
     );

     Bittrex.remoteMethod (
        'getMarketHistory',
        {
            description : "Get Market History",
            accepts: {arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
            returns: {arg: 'history', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/getMarketHistory'}
        }
     );

     Bittrex.remoteMethod (
        'getMarketSummaries',
        {
            description : "Get Market Summaries",
            returns: {arg: 'summaries', type: 'array', root: true},
            http: {verb: 'get', path: '/bittrex/getMarketSummaries'}
        }
     );

     Bittrex.remoteMethod (
        'getMarketSummary',
        {
            description : "Get Market Summary",
            accepts: {arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
            returns: {arg: 'summary', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/getMarketSummary'}
        }
     );

     Bittrex.remoteMethod (
        'getTicker',
        {
            description : "Get Ticker",
            accepts: {arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
            returns: {arg: 'ticker', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/getTicker'}
        }
     );

     Bittrex.remoteMethod (
        'getOrderBook',
        {
            description : "Get Order Book",
            accepts: [{arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
                      {arg: 'depth', type: 'number', description: 'Market Depth', required: true, http: {source: 'path'}},
                      {arg: 'type', type: 'string', description: 'Order Type', required: true, http: {source: 'path'}}],
            returns: {arg: 'summary', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/:depth/:type/getOrderBook'}
        }
     );

     Bittrex.remoteMethod (
        'getCandles',
        {
            description : "Get Candles",
            accepts: [{arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
                      {arg: 'tickInterval', type: 'string', description: 'Tick Interval', required: true, http: {source: 'path'}},
                      {arg: 'startTimestamp', type: 'date', description: 'Start timestamp', required: true, http: {source: 'path'}}],
            returns: {arg: 'candles', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/:tickInterval/:startTimestamp/getCandles'}
        }
     );
};
