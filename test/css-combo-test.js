var CssCombo = require('../lib/index'),
    path = require('path'),
    fs = require('fs'),
    should = require('should');

describe('When build ', function(){

    it('should have no errors.', function(done){
        CssCombo.build({
            target: path.resolve(__dirname, 'css/test.source.css'),
            debug: false,
            paths: [ path.resolve(__dirname, 'css/external' ) ],
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
                if (report.imports.length !== 8) {
                    throw new Error('report.imports Error');
                }
            }
            done();
        });
    });

    it('should not replace data uris', function(done){
        CssCombo.build({
            target: path.resolve(__dirname, 'css/test3.source.css'),
            debug: false,
            inputEncoding: 'utf-8',
            outputEncoding: 'utf-8',
            output:path.resolve(__dirname, 'css/test3.combo.css'),
            compress: 0
        }, function(e, report){
            if(e){
                throw new Error(e);
            }else{
                report = report[0];
                if (report.target !== path.resolve(__dirname, 'css/test3.source.css')) {
                    throw new Error('report.target Error');
                }
                if (report.output !== path.resolve(__dirname, 'css/test3.combo.css')) {
                    throw new Error('report.output Error');
                }
                if (report.imports.length !== 1) {
                    throw new Error('report.imports Error');
                }
            }
            done();
        });
    });

    //a2u ZH test
    it('should replace ZH text to css unicode',function(done){
        CssCombo.build({
            target: path.resolve(__dirname, 'css/a2u.source.css'),
            debug: false,
            inputEncoding: 'utf-8',
            outputEncoding: 'utf-8',
            output:path.resolve(__dirname, 'css/a2u.combo.css'),
            compress: 0
        },function(e,report){
            if(e){
                throw new Error(e); 
            }else{
                report = report[0]; 
                if(report.content.match(/[\u4E00-\u9FA5\uF900-\uFA2D]/)){
                    throw new Error('report.content Error'); 
                }
            } 
            done();
        }); 
    });
});

describe('When compress,', function(){
    var compressor = require('../lib/cssmin').compressor;
    it('should preserve pseudo-class colons', function(){
        var text = 'a :nth-child(2), a :nth-child(5), a :nth-child(9) {display: none;}';
        compressor.cssmin(text).should.equal('a :nth-child(2),a :nth-child(5),a :nth-child(9){display:none}');
    });
});