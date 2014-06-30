/**
 * a css module combo tool
 * author: daxingplay(daxingplay@gmail.com)
 */
var fs = require('fs'),
    path = require('path'),
    iconv = require('iconv-lite'),
    compressor = require('./cssmin').compressor,
    _ = require('lodash'),
    async = require('async'),
    utils = require('./utils'),
    os = require('os');

function CssCombo(cfg, callback){
    var self = this;

    self.imports = [];
    /**
     * 额外进行查找的路径，如：paths: 'path/to/app/utils', path/to/app/public/a.js文件内容：@import "mod.css"
     *  1、现在当前路径下寻找: path/to/app/public/mod.css
     *  2、若找不到，则再查找: path/to/app/utils/mod.css
     */
    self.paths = cfg.paths || [];
    utils.debug = cfg.debug;
    cfg.target = cfg.src || cfg.target;
    cfg.native2ascii = cfg.native2ascii !== false;
    cfg.replaceFont = cfg.replaceFont !== false;
    if(!cfg.target) {
        throw new Error('Please enter css path');
    }else{
        cfg.target = cfg.src = path.resolve(cfg.target);

        if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
            cfg.outputEncoding = '';
        }

        cfg.linefeed = cfg.linefeed || os.EOL;

        cfg.compress = !!cfg.compress;

        cfg.silent = !!cfg.silent;

        cfg.dest = cfg.output = path.resolve(path.normalize(cfg.dest));

        cfg.suffix = cfg.suffix || '.combo';

        cfg.sourceDir = path.dirname(cfg.target);

        self.config = cfg;
        self.build(callback);
    }
}

CssCombo.prototype = {
    error: function(e){
        var self = this;
        return {
            type: e.type || 'Syntax',
            message: e.message,
            filename: path.basename(self.config.target),
            filepath: self.config.target
        };
    },
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
        return (/http(s?):\/\//).test(filepath);
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
                    // 若在当前文件夹找不到，就去paths中寻找，直到找到为止
                    self.paths.forEach(function( pathBase ){
                        if( !content ){
                            var outFilePath = path.resolve( pathBase, file);
                            if( fs.existsSync(outFilePath) ){
                                var buf = fs.readFileSync( outFilePath );
                                content = iconv.decode(buf, config.inputEncoding ? config.inputEncoding : utils.detectCharset(buf));
                            }
                        }
                    });

                    if(!content){
                        utils.log('cannot find file ' + filePath, 'warning');
                    }
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
                '/*' + config.linefeed,
                'combined files : ' + config.linefeed,
                config.linefeed
            ];

        for (var i in self.imports) {
            commentTpl.push(self.imports[i] + config.linefeed);
        }

        commentTpl.push('*/' + config.linefeed);

        // join combo comment to file content.
        fileContent = commentTpl.join('') + config.linefeed + fileContent;
        var cssFileExt = config.suffix + '.css';
        if(config.compress){
            utils.log('start compress file.', 'debug');
            fileContent = compressor.cssmin(fileContent);
            cssFileExt = '.css';
        }
        fileContent = iconv.encode(fileContent, config.outputEncoding || 'gbk');
        var comboFile = config.output;
        // if output is not a file name, then generate a file name with .combo.css or .css.
        if(path.extname(config.output) !== '.css'){
            comboFile = path.resolve(config.output, path.basename(config.target).replace(/(\.source)?\.css/, cssFileExt));
            utils.log('dest is dir, I guess the output file is: ' + comboFile, 'debug');
        }

        utils.log('start generate combo file: ' + comboFile, 'debug');

        utils.mkdirSync(path.dirname(comboFile));

//        fs.writeFileSync(comboFile, fileContent, '');
        // if exists, unlink first, otherwise, there may be some problems with the file encoding.
        if(fs.existsSync(comboFile)){
            fs.unlinkSync(comboFile);
        }

        // write file
        var fd = fs.openSync(comboFile, 'w');
        fs.writeSync(fd, fileContent, 0, fileContent.length);
        fs.closeSync(fd);

        utils.log('Successfully generated combo file: ' + comboFile, 'debug');
    },
    analyzeImports: function(content, callback){
        var self = this;
//        utils.log('Analyzing ' + self.config.target, 'debug');
        if(content){
            var reg = /@import\s*(url)?\(?['"]([^'"]+)\.css['"]\)?[^;]*;/ig,
                result;
            result = reg.exec(content);
            if(typeof result != 'undefined' && result && result[2]){
                var filePath = result[2] + '.css';
                self.imports.push(filePath);
                self.getFileContent(filePath, function(data){
                    data = self.modifySubImportsPath(data,filePath);
                    data = data.replace(/(['"]|\():/g,'$1');
                    data = data.replace(/(['"])%/g,'$1');
                    content = content.replace(result[0], '\n' + data + '\n');
                    content = self.analyzeImports(content, callback);
                });
            }else{
                callback && callback(content);
            }
        }else{
            utils.log('content empty.', 'debug');
            callback && callback(content);
        }
    },
    // 修改子文件import的相对路径
    // 子文件夹中所有的相对路径都要进行转换
    // 先看一下什么形式的地址需要转换
    // @import "./mods/import.css"
    // background: url("./mods/import.png");
    // list-style: url("./mods/import.jpg");
    // @font-face {
    //      src:url("./mods/import.ttf");
    // } 
    modifySubImportsPath: function(content,filePath) {
        'use strict';

        var self = this;

        var regImport = /@import\s*(url)?\(?['"]([^'"%]+)\.css['"]\)?[^;]*;/ig,
            regImageOrFont = /(url)?\(['"]?([^:\)]+\.(png|jpg|gif|jpeg|ttf|eot|woff|svg))([^\)]*)['"]?\)/ig,
            importResult,
            picAndFontResult;

        var importFilePath = path.dirname(path.resolve(self.config.sourceDir,filePath));

        // 替换import
        importResult = regImport.exec(content);
        if (typeof importResult !== 'undefined' && importResult && importResult[2]) {
            var importAbsoluteUrl = path.resolve(importFilePath,importResult[2]);
            // 用%号表示已经替换好的import路径，后续会再去掉百分号,这里替换的时
            // 候要注意全局的替换
            var regimportReplace = RegExp(importResult[2],'g');
            content = content.replace(regimportReplace, "%" + path.relative(self.config.sourceDir,importAbsoluteUrl));
            return self.modifySubImportsPath(content, filePath);
        }
        // 替换图片和font的路径
        picAndFontResult = regImageOrFont.exec(content);
        if (typeof picAndFontResult !== 'undefined' && picAndFontResult && picAndFontResult[2]) {
            var regpicReplace = RegExp(picAndFontResult[2],'g');
            var picAbsolutePath = path.resolve(importFilePath,picAndFontResult[2]);
            //解决win平台下路径的斜杠问题
            var isWin = (process.platform === 'win32');
            var _path = path.relative(self.config.sourceDir,picAbsolutePath);
            if(isWin){
               _path = path.relative(self.config.sourceDir,picAbsolutePath).split(path.sep).join("\/");
            }
            // 用：号表示已经替换好的import路径，后续会再去掉冒号
            content = content.replace(regpicReplace, ":" + _path);
            return self.modifySubImportsPath(content, filePath);
        }
        return content;
    },
    build: function(callback){
        var self = this,
            config = self.config,
            file = config.target,
            report = {};

        utils.log('start analyze file : ' + file, 'debug');

        config.base = path.dirname(file);

        var data = fs.readFileSync(file);
        utils.log('Cur file is ' + self.config.target, 'debug');
        utils.log('file read: ' + file, 'debug');

        config.inputEncoding = config.inputEncoding ? config.inputEncoding : utils.detectCharset(data);
        var fileContent = iconv.decode(data, config.inputEncoding);
        utils.log('file charset is: ' + config.inputEncoding, 'debug');

        // preserve data url and comment.
        var preservedTokens = [];
//        fileContent = compressor._extractDataUrls(fileContent, preservedTokens);
        fileContent = compressor._extractComments(fileContent, preservedTokens);

        // start analyze file content
        self.analyzeImports(fileContent, function(data){
            utils.log('analyze done.', 'debug');
            // after combo, @charset position may be changed. since the output file encoding is specified, we should remove @charset.
            data = data.replace(/@charset\s+['|"](\S*)["|'];/g, '');
            // restore all comments back.
            data = compressor._restoreComments(data, preservedTokens);
            //convert ZH to unicode
            if(config.native2ascii === true){
                data = data.replace(/[\u4E00-\u9FA5\uF900-\uFA2D]/g,function($1){
                    return '\\'+utils.a2u($1).replace('%u','');
                });
            }
            //convert unicode font-family to EN
            if(config.replaceFont === true){
                data = data.replace(/[\'|\"](\\\w{4}.*)[\'|\"]/g,function($1,$2){
                    $2 = $2.trim();
                    var en = utils.unicode2En($2),
                        temp = '';
                    if(_.isArray(en)){
                        for(var i = 0;i<en.length;i++) {
                            temp += '"' + en[i] + '",';
                        }
                        en = temp.slice(0,-1);
                    }else{
                        en = '"' + en + '"';
                    }
                    return $2 ? en : $1;
                });
            }
            self.generateOutput(data);

            report.imports = self.imports;
            report.target = self.config.target;
            report.output = self.config.output;
            report.content = data;
            callback && callback(null, report);
        });

//        fs.readFile(file, '', function(err, data){
//            if(err){
//                utils.log(err, 'error');
//                throw self.error(err);
//            }
//            utils.log('Cur file is ' + self.config.target, 'debug');
//            utils.log('file read: ' + file, 'debug');
//
//            config.inputEncoding = config.inputEncoding ? config.inputEncoding : utils.detectCharset(data);
//            var fileContent = iconv.decode(data, config.inputEncoding);
//            utils.log('file charset is: ' + config.inputEncoding, 'debug');
//
//            // preserve data url and comment.
//            var preservedTokens = [];
//            fileContent = compressor._extractDataUrls(fileContent, preservedTokens);
//            fileContent = compressor._extractComments(fileContent, preservedTokens);
//
//            // start analyze file content
//            self.analyzeImports(fileContent, function(data){
//                utils.log('analyze done.', 'debug');
//                // after combo, @charset position may be changed. since the output file encoding is specified, we should remove @charset.
//                data = data.replace(/@charset\s+['|"](\S*)["|'];/g, '');
//                // restore all comments back.
//                data = compressor._restoreComments(data, preservedTokens);
//                self.generateOutput(data);
//
//                report.imports = self.imports;
//                report.target = self.config.target;
//                report.output = self.config.output;
//                report.content = data;
//                callback && callback(null, report);
//            });
////            self.analyzeImports();
//        });
    }
};

module.exports = {
    build: function(src, dest, options, callback){
        var files = [],
            dests = [];
        options = _.isPlainObject(options) ? options : {};
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
