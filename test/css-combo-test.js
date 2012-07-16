var CssCombo = require('../lib/index'),
    path = require('path');

CssCombo.build({
    target: path.resolve(__dirname, 'css/test.source.css'),
    debug: true,
//    inputEncoding: 'gbk',
//    outputEncoding: 'gbk',
    output:'css/test.combo.css',
    compress: 0
}, function(e){
    if(e){
        console.dir(e);
    }else{
        console.log('success');
    }
});
