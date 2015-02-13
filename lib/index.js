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

module.exports = {
    build: function(src, dest, options, callback){
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
        for(var i = 1; i < arguments.length; i++){
            if(_.isFunction(arguments[i])){
                callback = arguments[i];
                break;
            }
        }
        var funcs = [];

        _.forEach(files, function(file, index){
            funcs.push(function(cb){
                try{
                    var c = _.merge(options, {
                        src: file,
                        dest: _.isArray(dests) && dests[index] ? dests[index] : dests
                    });
                    new CssCombo(c, cb);
                }catch (e){
                    utils.log(e, 'debug');
                    cb(e);
                }
            });
        });
        async.parallel(funcs, function(err, results){
            callback && callback(err, results);
        });
    },
    version: JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'))).version
};
