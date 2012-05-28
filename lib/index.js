var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    url = require('url'),
    compressor = require('./cssmin').compressor,
    async = require('async');

//var CssComboTest = function(){
//
//    var config = {},
//        imports = [];
//
//    function parseConfig(cfg){
//        config = cfg;
//        if(!config.target) {
//            console.log('please enter an complier path\r\n');
//            return false;
//        }
//
//        if(!config.inputEncoding || config.inputEncoding == 'gbk' || config.inputEncoding == 'GBK' || config.inputEncoding == 'gb2312') {
//            config.inputEncoding = '';
//        }
//
//        if(!config.outputEncoding || config.outputEncoding == 'gbk' || config.outputEncoding == 'GBK' || config.outputEncoding == 'gb2312') {
//            config.outputEncoding = '';
//        }
//
//        if(!config.exclude){
//            config.exclude = [/.combo.css/, /-min.css/, /.combine.css/];
//        }
//
//        config.compress = config.compress == 0 ? 0 : 1;
//
//        config.output = path.resolve(path.normalize(config.output));
//
//        console.log('parse config done.');
//
//        return true;
//    }
//
//    /**
//     * combo one css file.
//     * @param file
//     */
//    function comboCss(file){
//        fs.readFile(file, config.inputEncoding, function(err, data){
//            if(err){
//                console.log(err);
//            }
//            console.log('read file data done.');
//
//            var fileContent = data.toString();
//
//            // preserve data url and comment.
//            var preservedTokens = [];
//            fileContent = compressor._extractDataUrls(fileContent, preservedTokens);
//            fileContent = compressor._extractComments(fileContent, preservedTokens);
//
//            fileContent = analyzeModules(fileContent);
//            fileContent = compressor._restoreComments(fileContent, preservedTokens);
//
//            generateOutput(fileContent);
//        });
//    }
//
//    function analyzeModules(fileContent){
//        if(fileContent){
//            var reg = /@import\s*(url)?\(?['|"]([^'"]+)\.css['|"]\)?[^;]*;/ig,
//                result;
//            while((result = reg.exec(fileContent)) != null){
//                var modulePath = result[2] + '.css',
//                    moduleContent = getModuleContent(modulePath);
//                imports.push(modulePath);
//                fileContent = fileContent.replace(result[0], '\n' + moduleContent + '\n');
//            }
//        }else{
//            console.log('content empty.');
//        }
//        return fileContent;
//    }
//
//    function getModuleContent(modulePath){
//        var content = '';
//        if(/http(s?):\/\//.test(modulePath)){
//            console.log('start get remote file content.');
//            var options = url.parse(modulePath);
//            if(typeof options != 'undefined'){
//                console.log('start request');
//                content = httpRequestSync(options);
//            }else{
//                console.log('parse error: ' + modulePath);
//            }
//        }else{
//            if(!isExcluded(modulePath)){
//                var filePath = path.resolve(config.base, modulePath);
//                console.log('*** start import file: ' + filePath);
//                if(path.existsSync(filePath)){
//                    content = fs.readFileSync(filePath, config.inputEncoding).toString();
//                }else{
//                    console.log('WARNING: ' + filePath + ' does not exists.');
//                }
//            }else{
//                console.log('file excluded: ' + modulePath);
//            }
//        }
//        return content;
//    }
//
//    function generateOutput(fileContent){
//        var commentTpl = [
//            '/*\r\n',
//            'combined files : \r\n',
//            '\r\n'
//        ];
//
//        for (var i in imports) {
//            commentTpl.push(imports[i] + '\r\n');
//        }
//
//        commentTpl.push('*/\r\n');
//
//        // join combo comment to file content.
//        fileContent = commentTpl.join('') + '\r\n' + fileContent;
//        var cssFileExt = '.combo.css';
//        if(config.compress){
//            console.log('start compress file.');
//            fileContent = compressor.cssmin(fileContent);
//            cssFileExt = '.css';
//        }
//
//        var comboFile = path.join(config.output, path.basename(config.target).replace(/(.source)?.css/, cssFileExt));
//        console.log('start generate combo file: ' + comboFile);
//
//        mkdirSync(path.dirname(comboFile));
//
//        var fd = fs.openSync(comboFile, 'w');
//
//        //write file
//        fs.writeSync(fd, fileContent, 0, config.outputEncoding);
//        fs.closeSync(fd);
//    }
//
//    function isExcluded(filename){
//        for(var i in config.exclude){
//            if(config.exclude[i].test(filename)){
//                return true;
//            }
//        }
//        return false;
//    }
//
//    function httpRequestSync(options){
//        var done = false,
//            data = '',
//            timer,
//            request = function(doNotRequset){
//                if(!doNotRequset){
//                    var req = http.request(options, function(res){
//                        var reqData = '';
//                        res.on('data', function(chunk){
//                            reqData += chunk;
//                        });
//                        res.on('error', function(){
//                            done = true;
//                        });
//                        res.on('end', function(){
//                            done = true;
//                            data = reqData;
//                        });
//                    });
//                    req.on('error', function(e){
//                        console.log('request error: ' + e);
//                        done = true;
//                    });
//                    req.end();
//                    request(true);
//                }else{
//                    timer && clearTimeout(timer);
//                    if(!done){
//                        timer = setTimeout(function(){
//                            request(true);
//                        }, 100);
////                        request(true);
//                    }else{
//                        return data;
//                    }
//                }
//            };
//        return request();
//    }
//
//    function mkdirSync(dirpath, mode) {
//        if(!path.existsSync(dirpath)) {
//            // try to create parent dir first.
//            mkdirSync(path.dirname(dirpath), mode);
//            fs.mkdirSync(dirpath, mode);
//        }
//    }
//
//    return {
//        build: function(cfg){
//            parseConfig(cfg);
//            comboCss(config.target);
//        }
//    }
//
//}();

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

    function mkdirSync(dirpath, mode) {
        if(!path.existsSync(dirpath)) {
            // try to create parent dir first.
            mkdirSync(path.dirname(dirpath), mode);
            fs.mkdirSync(dirpath, mode);
        }
    }

    function isRemoteFile(filepath){
        return /http(s?):\/\//.test(filepath);
    }

    function getRemoteFile(filePath, callback){
        var content = '',
            options = url.parse(filePath);
        if(typeof options != 'undefined'){
            debug && console.log('start request');
            var req = http.request(options, function(res){
                debug && console.log('status: ' + res.statusCode);
                res.on('data', function(chunk){
                    content += chunk;
                });
                res.on('end', function(){
                    callback && callback(content);
                });
            });
            req.on('error', function(e){
                debug && console.log('request error: ' + e);
            });
            req.end();
        }else{
            debug && console.log('parse error: ' + filePath);
            callback && callback(content);
        }
    }

    function getFileContent(file, callback){
        // TODO https ?
        var content = '';
        if(!isRemoteFile(file)){
            if(!isExcluded(file)){
                var filePath = path.resolve(config.base, file);
                if(path.existsSync(filePath)){
                    content = fs.readFileSync(filePath, config.inputEncoding).toString();
                }else{
                    console.log('WARNING: cannot find file ' + filePath);
                }
            }else{
                debug && console.log('file excluded: ' + file);
            }
            callback && callback(content);
        }else{
            // TODO get remote file content.
            debug && console.log('Try to get remote file: ' + file);
            getRemoteFile(file, function(data){
                content = data;
                callback && callback(data);
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
        mkdirSync(path.dirname(comboFile));

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
        debug && console.log('start analyze file : ' + file);

        config.base = path.dirname(file);
        fs.readFile(file, config.inputEncoding, function(err, data){
            if(err){
                debug && console.log(err);
            }

            var fileContent = data.toString();

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
            debug = cfg.debug;
            if(!cfg.target) {
                debug && console.log('please enter an complier path\r\n');
                return false;
            }

            if(!cfg.inputEncoding || cfg.inputEncoding == 'gbk' || cfg.inputEncoding == 'GBK' || cfg.inputEncoding == 'gb2312') {
                cfg.inputEncoding = '';
            }

            if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
                cfg.outputEncoding = '';
            }

            if(typeof cfg.exclude == 'undefined'){
                cfg.exclude = [/.combo.css/, /-min.css/, /.combine.css/];
            }

            cfg.compress = cfg.compress ==0 ? 0 : 1;

            cfg.output = path.resolve(path.normalize(cfg.output));

            config = cfg;
            buildFile();
            return true;
        }
    }
}();

module.exports = CssCombo;