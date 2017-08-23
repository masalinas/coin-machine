var bittrex = require('node.bittrex.api');
var app = require('../../server/server');

// bittrex secret tokens
bittrex.options({
    'apikey' : '',
    'apisecret' : ''
});

module.exports = function(Bittrex) {
    // listen to Bittrex WebSocket
    var websocketsclient = bittrex.websockets.listen( function( data ) {
        if (data.M === 'updateSummaryState') {
            data.A.forEach(function(data_for) {
                app.io.emit('bittrex-event', data_for.Deltas);
            });
        }
    });

    // publish Bittrex API
    Bittrex.getMarketSummaries = function(cb) {
        bittrex.getmarketsummaries( function( data, err ) {
            if (err) return cb(err);

            var markets = [];
            for( var i in data.result ) {
                var market = data.result[i];

                markets.push(market);
            }

            cb(null, markets);
        })
    };

    Bittrex.getTicker = function(market, cb) {
        bittrex.getticker( { market : data.result[i].MarketName }, function( ticker ) {

            cb(null, ticker);
        });
    };

    Bittrex.remoteMethod (
        'getMarketSummaries',
        {
            description : "Get Market summaries",
            returns: {arg: 'markets', type: 'array', root: true},
            http: {verb: 'get'}
        }
    );

    Bittrex.remoteMethod (
        'getTicker',
        {
            description : "Get Market tiker",
            accepts: {arg: 'market', type: 'string', description: 'Market name', required: true, http: {source: 'path'}},
            returns: {arg: 'ticker', type: 'object', root: true},
            http: {verb: 'get', path: '/bittrex/:market/getTicker'}
        }
    );
};
