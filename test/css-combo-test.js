var CssCombo = require('../lib/index');

CssCombo.build({
    target:'css/test.source.css',
    debug: true,
    inputEncoding: 'gbk',
    outputEncoding: 'gbk',
    output:'css/test.combo.css',
    compress: 0
});
