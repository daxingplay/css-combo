var CssCombo = require('../lib/index'),
    path = require('path'),
    fs = require('fs'),
    should = require('should');

describe('When build ', function(){

    it('should have no errors.', function(done){
        CssCombo.build({
            target: path.resolve(__dirname, 'css/test.source.css'),
            debug: false,
            inputEncoding: 'gbk',
            outputEncoding: 'gbk',
            output:path.resolve(__dirname, 'css/test.combo.css'),
            compress: 0
        }, function(e, report){
            if(e){
                throw new Error(e);
            }else{
                report = report[0];
                if (report.target !== path.resolve(__dirname, 'css/test.source.css')) {
                    throw new Error('report.target Error');
                }
                if (report.output !== path.resolve(__dirname, 'css/test.combo.css')) {
                    throw new Error('report.output Error');
                }
                if (report.imports.length !== 7) {
                    throw new Error('report.imports Error');
                }
            }
            done();
        });
    });

});