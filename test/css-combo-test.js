var CssCombo = require('../lib/index'),
    path = require('path'),
    fs = require('fs'),
    iconv = require('iconv-lite');

CssCombo.build({
    target: path.resolve(__dirname, 'css/test.source.css'),
    debug: true,
    inputEncoding: 'gbk',
    outputEncoding: 'gbk',
    output:path.resolve(__dirname, 'css/test.combo.css'),
    compress: 0
}, function(e){
    if(e){
        console.dir(e);
    }else{
        console.log('success');
    }
});