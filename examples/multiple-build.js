/**
 *
 * @author: daxingplay<daxingplay@gmail.com>
 * @time: 13-4-17 15:26
 * @description:
 */

var path = require('path'),
    combo = require('../lib/index');

combo.build(
    [
        path.resolve(__dirname, '../test/css/test.source.css'),
        path.resolve(__dirname, '../test/css/test2.source.css')
    ],
    path.resolve(__dirname, '../test/css/'),
    {
        debug: true
    },
    function(err, result){
        console.log(result);
    }
);