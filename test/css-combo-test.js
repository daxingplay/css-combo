var CssCombo = require('../lib/index');

CssCombo.build({
    target:'css/test.source.css',
    debug: false,
    inputEncoding: 'gbk',
    outputEncoding: 'gbk',
    output:'css/',
    compress: 0
});
