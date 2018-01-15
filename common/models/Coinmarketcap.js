const request = require('request');

module.exports = function(Coinmarketcap) {
    Coinmarketcap.getTicker = function(id, limit, start, convert, cb) {
        const URL_API = 'https://api.coinmarketcap.com/v1/ticker/';

        var propertiesObject = {};

        if (id !== undefined)
            propertiesObject.id = id;

        if (limit !== undefined)
            propertiesObject.limit = limit;

        if (start !== undefined)
            propertiesObject.start = start;

        if (convert !== undefined)
            propertiesObject.convert = convert;

        request({url: URL_API, qs: propertiesObject}, function(err, response, body) {
            if (err) return cb(err);

            var tickers = JSON.parse(response.body);

            // order tickers by name
            tickers.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }

                if (a.name < b.name) {
                    return -1;
                }

                // a must be equal to b
                return 0;
            });

            cb(null, tickers);
        });
    };

    Coinmarketcap.getGlobalData = function(convert, cb) {
        const URL_API = 'https://api.coinmarketcap.com/v1/global/';

        var propertiesObject = {};

        if (convert !== undefined)
            propertiesObject.convert = convert;

        request({url: URL_API, qs: propertiesObject}, function(err, response, body) {
            if (err) return cb(err);

            cb(null, JSON.parse(response.body));
        });
    };

    Coinmarketcap.remoteMethod (
        'getTicker',
        {
            description : "Get Ticker",
            accepts: [{arg: 'id', type: 'number', description: 'Market id', http: {source: 'query'}},
                      {arg: 'limit', type: 'number', description: 'Market limit', http: {source: 'query'}},
                      {arg: 'start', type: 'number', description: 'Market start', http: {source: 'query'}},
                      {arg: 'convert', type: 'string', description: 'Market convert', http: {source: 'query'}}],
            returns: {arg: 'tickers', type: 'array', root: true},
            http: {verb: 'get', path: '/getTicker'}
        }
    );

    Coinmarketcap.remoteMethod (
        'getGlobalData',
        {
            description : "Get Global data",
            accepts: [{arg: 'convert', type: 'string', description: 'Market convert', http: {source: 'query'}}],
            returns: {arg: 'tickers', type: 'object', root: true},
            http: {verb: 'get', path: '/getGlobalData'}
        }
    );
};
