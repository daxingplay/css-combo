var fs = require('fs'),
    path = require('path'),
    iconv = require('iconv-lite'),
    compressor = require('./cssmin').compressor,
//    native2ascii = require('native2ascii').native2ascii,
    utils = require('./utils');

function CssCombo(cfg, success){
    var self = this;

    self.imports = [];

    utils.debug = cfg.debug;
    if(!cfg.target) {
        utils.log('please enter css path\r\n', 'error');
        return false;
    }

    if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
        cfg.outputEncoding = '';
    }

//    if(typeof cfg.exclude == 'undefined'){
//        cfg.exclude = [/.combo.css/, /-min.css/, /.combine.css/];
//    }

    cfg.compress = !!cfg.compress;

    cfg.output = path.resolve(path.normalize(cfg.output));

    self.config = cfg;
    self.build(success);
    return true;
}

CssCombo.prototype = {
    isExcluded: function(filename){
        var config = this.config;
        for(var i in config.exclude){
            if(config.exclude[i].test(filename)){
                return true;
            }
        }
        return false;
    },
    isRemoteFile: function(filepath){
        return /http(s?):\/\//.test(filepath);
    },
    getFileContent: function(file, callback){
        var self = this,
            config = self.config,
            content = '';
        if(!self.isRemoteFile(file)){
            if(!self.isExcluded(file)){
                var filePath = path.resolve(config.base, file);
                if(fs.existsSync(filePath)){
                    var buf = fs.readFileSync(filePath);
                    content = iconv.decode(buf, config.inputEncoding ? config.inputEncoding : utils.detectCharset(buf));
                }else{
                    utils.log('cannot find file ' + filePath, 'warning');
                }
            }else{
                utils.log('file excluded: ' + file, 'debug');
            }
            callback && callback(content);
        }else{
            utils.log('Try to get remote file: ' + file, 'debug');
            utils.getRemoteFile(file, function(data, charset){
                content = iconv.decode(data, charset);
                callback && callback(content);
            });
        }
    },
    generateOutput: function(fileContent){
        var self = this,
            config = self.config,
            commentTpl = [
                '/*\r\n',
                'combined files : \r\n',
                '\r\n'
            ];

        for (var i in self.imports) {
            commentTpl.push(self.imports[i] + '\r\n');
        }

        commentTpl.push('*/\r\n');

        // join combo comment to file content.
        fileContent = commentTpl.join('') + '\r\n' + fileContent;
        var cssFileExt = '.combo.css';
        if(config.compress){
            utils.log('start compress file.', 'debug');
            fileContent = compressor.cssmin(fileContent);
            // native2ascii
//            fileContent = native2ascii(fileContent);
//            config.outputEncoding = 'ascii';
            cssFileExt = '.css';
        }

        var comboFile = config.output;
        // if output is not a file name, then generate a file name with .combo.css or .css.
        if(path.extname(config.output) !== '.css'){
            comboFile = path.join(config.output, path.basename(config.target).replace(/(.source)?.css/, cssFileExt));
        }

        utils.log('start generate combo file: ' + comboFile, 'debug');

        utils.mkdirSync(path.dirname(comboFile));

        var fd = fs.openSync(comboFile, 'w');

        // write file
        fs.writeSync(fd, fileContent, 0, config.outputEncoding);
        fs.closeSync(fd);

        utils.log('Successfully generated combo file: ' + comboFile, 'info');
    },
    analyzeImports: function(content, callback){
        var self = this;
        if(content){
            var reg = /@import\s*(url)?\(?['|"]([^'"]+)\.css['|"]\)?[^;]*;/ig,
                result;
            result = reg.exec(content);
            if(typeof result != 'undefined' && result && result[2]){
                var filePath = result[2] + '.css';
                self.imports.push(filePath);
                self.getFileContent(filePath, function(data){
                    if(content){
                        content = content.replace(result[0], '\n' + data + '\n');
                        content = self.analyzeImports(content, callback);
                    }else{
                        utils.log('no content', 'debug');
                    }
                });
            }else{
                callback && callback(content);
            }
        }else{
            utils.log('content empty.', 'debug');
            callback && callback(content);
        }
    },
    build: function(callback){
        var self = this,
            config = self.config,
            file = config.target;

        utils.log('start analyze file : ' + file, 'debug');

        config.base = path.dirname(file);
        fs.readFile(file, '', function(err, data){
            if(err){
                utils.log(err, 'error');
            }

            config.inputEncoding = config.inputEncoding ? config.inputEncoding : utils.detectCharset(data);
            var fileContent = iconv.decode(data, config.inputEncoding);
            utils.log('file charset is: ' + config.inputEncoding, 'debug');

            // preserve data url and comment.
            var preservedTokens = [];
            fileContent = compressor._extractDataUrls(fileContent, preservedTokens);
            fileContent = compressor._extractComments(fileContent, preservedTokens);

            // start analyze file content
            self.analyzeImports(fileContent, function(data){
                utils.log('analyze done.', 'debug');
                // after combo, @charset position may be changed. since the output file encoding is specified, we should remove @charset.
                data = data.replace(/@charset\s+['|"](\w*)["|'];/g, '');
                // restore all comments back.
                data = compressor._restoreComments(data, preservedTokens);
                self.generateOutput(data);
                callback && callback();
            });
        });
    }
};

module.exports = {
    build: function(cfg, success){
        new CssCombo(cfg, success);
    }
};