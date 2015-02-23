/**
 * a css module combo tool
 * author: daxingplay(daxingplay@gmail.com)
 */
var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    async = require('async'),
    utils = require('./utils');

var CssCombo = require('./combo');

function _iterator(src, dest, options){
    var files = [],
        dests = [];
    options = _.isPlainObject(options) ? _.clone(options) : {};
    if(src && _.isPlainObject(src)){
        options = src;
        files.push(options.src || options.target);
        dests.push(options.dest || options.output);
    }else if(_.isString(src)){
        files.push(src);
        dests.push(dest);
    }else{
        files = src;
        dests = dest;
    }
    //return [files, dests, options];
    return function(iterator, callback){
        var funcs = [];

        _.forEach(files, function(file, index){
            funcs.push(function(cb){
                iterator({
                    src: file,
                    dest: _.isArray(dests) ? (dests[index] || '') : dests,
                    options: options
                }, cb);
            });
        });
        async.parallel(funcs, function(err, results){
            callback && callback(err, results);
        });
    };
}

module.exports = {
    build: function(src, dest, options, callback){
        for(var i = 1; i < arguments.length; i++){
            if(_.isFunction(arguments[i])){
                callback = arguments[i];
                break;
            }
        }
        var walker = _iterator(src, dest, options);
        walker(function(item, cb){
            var c = _.merge(item.options, {
                src: item.src,
                dest: item.dest
            });
            new CssCombo(c).build(cb);
        }, callback);
    },
    analyze: function(src, options, callback){
        for(var i = 1; i < arguments.length; i++){
            if(_.isFunction(arguments[i])){
                callback = arguments[i];
                break;
            }
        }
        var walker = _iterator(src, '', options);
        walker(function(item, cb){
            var c = _.merge(item.options, {
                src: item.src,
                dest: item.dest
            });
            new CssCombo(c).analyze(cb);
        }, callback);
    },
    version: require('../package.json').version
};
