var CssCombo = require('../lib/index'),
    ComboCore = require('../lib/combo'),
    path = require('path'),
    fs = require('fs'),
    should = require('should');

describe('When extract imports ', function(){

    var extract = function(content){
        var result = ComboCore.prototype.extractImports(content);
        return result ? result.filePath : null;
    };

    it('should support tengine combo url format.', function(){
        extract('@import url(http://g.tbcdn.cn/??mui/global/1.2.42/global.css);').should.equal('http://g.tbcdn.cn/??mui/global/1.2.42/global.css');
        extract('@import url("http://g.tbcdn.cn/??mui/global/1.2.42/global.css");').should.equal('http://g.tbcdn.cn/??mui/global/1.2.42/global.css');
    });

    it('should support remote url.', function(){
        extract('@import url(http://g.tbcdn.cn/mui/global/1.2.42/global.css);').should.equal('http://g.tbcdn.cn/mui/global/1.2.42/global.css');
    });

    it('should support remote url with params.', function(){
        extract('@import url(http://g.tbcdn.cn/mui/global/1.2.42/global.css?test=123);').should.equal('http://g.tbcdn.cn/mui/global/1.2.42/global.css');
    });

    it('should support local path.', function(){
        extract('@import url(test/123.css);').should.equal('test/123.css');
    });

    it('should support path with "".', function(){
        extract('@import url("test/123.css");').should.equal('test/123.css');
        extract('@import url("http://test.com/123.css");').should.equal('http://test.com/123.css');
    });

    it('should support path without url function.', function(){
        extract('@import "test/123.css";').should.equal('test/123.css');
        extract('@import "http://test.com/123.css";').should.equal('http://test.com/123.css');
    });

    it('should support simple http url.', function(){
        extract('@import "//test.com/123.css";').should.equal('//test.com/123.css');
    });

    it('should support custom protocols.', function(){
        extract('@import url("chrome://communicator/skin.css");').should.equal('chrome://communicator/skin.css');
    });

    it('should support https url.', function(){
        extract('@import "https://test.com/123.css";').should.equal('https://test.com/123.css');
    });

    it('should support list-of-media-queries.', function(){
        extract('@import url("fineprint.css") print;').should.equal('fineprint.css');
        extract('@import url("bluish.css") projection, tv;').should.equal('bluish.css');
        extract('@import url("landscape.css") screen and (orientation:landscape);').should.equal('landscape.css');
    });

});

describe('When analyze', function(){

    it('should get results', function(done){
        CssCombo.analyze({
            target: path.resolve(__dirname, 'css/test.source.css'),
            debug: false,
            paths: [ path.resolve(__dirname, 'css/external' ) ],
            inputEncoding: 'gbk',
            outputEncoding: 'gbk',
            compress: 0
        }, function(e, report){
            report[0].imports.length.should.equal(8);
            done();
        });
    });

});

describe('When remove charset', function() {
    it('should get proper result', function() {
        var removeCharset = ComboCore.prototype.removeCharset;

        removeCharset('@charset "utf-8";samp{font-family:"monospace";font-size:.1rem}').should.equal('samp{font-family:"monospace";font-size:.1rem}');
        removeCharset("@charset 'utf-8'; div { width: 0; }").should.equal(' div { width: 0; }');
        removeCharset("@charset  'gbk'; div { width: 0; }").should.equal(' div { width: 0; }');
        removeCharset("@charset 'gb2312' ; div { width: 0; }").should.equal(' div { width: 0; }');
        removeCharset("@charset 'utf-8';").should.equal('');
    });
});

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