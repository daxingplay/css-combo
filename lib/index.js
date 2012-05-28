var fs = require('fs'),
    path = require('path'),
    iconv = require('iconv-lite'),
    compressor = require('./cssmin').compressor,
    utils = require('./utils');

var CssCombo = function(){

    var debug = false,
        config = {},
        imports = [];

    function isExcluded(filename){
        for(var i in config.exclude){
            if(config.exclude[i].test(filename)){
                return true;
            }
        }
        return false;
    }

    function isRemoteFile(filepath){
        return /http(s?):\/\//.test(filepath);
    }

    function getFileContent(file, callback){
        var content = '';
        if(!isRemoteFile(file)){
            if(!isExcluded(file)){
                var filePath = path.resolve(config.base, file);
                if(path.existsSync(filePath)){
                    var buf = fs.readFileSync(filePath);
//                    utils.log('charset: ' + utils.detectCharset(buf), 'info');
                    content = iconv.decode(buf, config.inputEncoding ? config.inputEncoding : utils.detectCharset(buf));
//                    content = fs.readFileSync(filePath, config.inputEncoding).toString();
                }else{
                    console.log('WARNING: cannot find file ' + filePath);
                }
            }else{
                debug && console.log('file excluded: ' + file);
            }
            callback && callback(content);
        }else{
            debug && console.log('Try to get remote file: ' + file);
            utils.getRemoteFile(file, function(data){
                content = iconv.decode(data, utils.detectCharset(data));
//                console.log(content);
                callback && callback(content);
            });
        }
    }

    // TODO deal with charset
    function generateOutput(fileContent){
        var commentTpl = [
                '/*\r\n',
                'combined files : \r\n',
                '\r\n'
            ];

        for (var i in imports) {
            commentTpl.push(imports[i] + '\r\n');
        }

        commentTpl.push('*/\r\n');

        // join combo comment to file content.
        fileContent = commentTpl.join('') + '\r\n' + fileContent;
        var cssFileExt = '.combo.css';
        if(config.compress){
            debug && console.log('start compress file.');
            fileContent = compressor.cssmin(fileContent);
            cssFileExt = '.css';
        }

        var comboFile = path.join(config.output, path.basename(config.target).replace(/(.source)?.css/, cssFileExt));
        debug && console.log('start generate combo file: ' + comboFile);

//        fs.mkdirSync(path.dirname(comboFile));
        utils.mkdirSync(path.dirname(comboFile));

        var fd = fs.openSync(comboFile, 'w');

        //write file
        fs.writeSync(fd, fileContent, 0, config.outputEncoding);
        fs.closeSync(fd);
    }

    function analyzeImports(content, callback){
        if(content){
            var reg = /@import\s*(url)?\(?['|"]([^'"]+)\.css['|"]\)?[^;]*;/ig,
//            allReg = /@import\s*(url)?\(?['|"]([^'"]+)\.(c|le)ss['|"]\)?[^;]*;/ig,
                result;
            result = reg.exec(content);
            if(typeof result != 'undefined' && result && result[2]){
                var filePath = result[2] + '.css';
                imports.push(filePath);
                getFileContent(filePath, function(data){
                    if(content){
                        content = content.replace(result[0], '\n' + data + '\n');
                        content = analyzeImports(content, callback);
                    }else{
                        debug && console.log('no content');
                    }
                });
            }else{
                callback && callback(content);
            }
        }else{
            debug && console.log('content empty.');
        }
    }

    function buildFile(){
        var file = config.target;
        utils.log('start analyze file : ' + file, 'info');

        config.base = path.dirname(file);
        fs.readFile(file, '', function(err, data){
            if(err){
                debug && console.log(err);
            }

//            var fileContent = data.toString();
            config.inputEncoding = config.inputEncoding ? config.inputEncoding : utils.detectCharset(data);
            var fileContent = iconv.decode(data, config.inputEncoding);
            utils.log('file charset is: ' + config.inputEncoding, 'info');
            utils.log(fileContent);

            // preserve data url and comment.
            var preservedTokens = [];
            fileContent = compressor._extractDataUrls(fileContent, preservedTokens);
            fileContent = compressor._extractComments(fileContent, preservedTokens);
//            console.log(fileContent);
            debug && console.log(preservedTokens);

            // start analyze file content
            analyzeImports(fileContent, function(data){
                debug && console.log('analyze done.');
                data = compressor._restoreComments(data, preservedTokens);
                generateOutput(data);
            });

//            var fileContent = data.toString(),
//                imports = [],
////                lessImports = [],
//                result;
//            while((result = /@import\s*(url)?\(?['|"]([^'"]+)\.(c|le)ss['|"]\)?[^;]*;/ig.exec(fileContent)) != null){
//                console.log(result);
//                if(result[3] == 'c'){
//                    // TODO resolve path.
//                    var filePath = result[2] + '.css',
//                        importContent = getFileContent(filePath, cfg);
//                    imports.push(filePath);
//                    fileContent = fileContent.replace(result[0], '\n' + importContent + '\n');
//                }else if(result[3] == 'le'){
////                    lessImports.push(result[2] + '.less');
//                    // leave less files behind. I will deal with it later.
//                }else{
//                    debug && console.log('import file syntax error.');
//                }
//            }
////            console.log(fileContent);
//            generateFile(fileContent, cfg);
        });

    }

    return {
        build: function(cfg){
            utils.debug = debug = cfg.debug;
            if(!cfg.target) {
                debug && console.log('please enter an complier path\r\n');
                return false;
            }

//            if(!cfg.inputEncoding || cfg.inputEncoding == 'gbk' || cfg.inputEncoding == 'GBK' || cfg.inputEncoding == 'gb2312') {
//                cfg.inputEncoding = '';
//            }
//
            if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
                cfg.outputEncoding = '';
            }

            if(typeof cfg.exclude == 'undefined'){
                cfg.exclude = [/.combo.css/, /-min.css/, /.combine.css/];
            }

            cfg.compress = cfg.compress == 0 ? 0 : 1;

            cfg.output = path.resolve(path.normalize(cfg.output));

            config = cfg;
            buildFile();
            return true;
        }
    }
}();

module.exports = CssCombo;