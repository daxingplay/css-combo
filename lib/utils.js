var fs = require('fs'),
url = require('url'),
path = require('path'),
http = require('http');

var ZNMAP = {

	'\\534E\\6587\\7EC6\\9ED1': ['STHeiti Light [STXihei]', 'STXiheii'],
	'\\534E\\6587\\9ED1\\4F53': 'STHeiti',
	'\\4E3D\\9ED1 Pro': 'LiHei Pro Medium',
	'\\4E3D\\5B8B Pro': 'LiSong Pro Light',
	'\\6807\\6977\\4F53': ["DFKai-SB","BiauKai"],
	'\\82F9\\679C\\4E3D\\4E2D\\9ED1': 'Apple LiGothic Medium',
	'\\82F9\\679C\\4E3D\\7EC6\\5B8B': 'Apple LiSung Light',

	'\\65B0\\7EC6\\660E\4F53': 'PMingLiU',
	'\\7EC6\\660E\\4F53': 'MingLiU',
	'\\9ED1\\4F53': 'SimHei',
	'\\5B8B\\4F53': 'SimSun',
	'\\65B0\\5B8B\\4F53': 'NSimSun',
	'\\4EFF\\5B8B': 'FangSong',
	'\\6977\\4F53': 'KaiTi',
	'\\4EFF\\5B8B_GB2312': 'FangSong_GB2312',
	'\\6977\\4F53_GB2312': 'KaiTi_GB2312',
	'\\5FAE\\x8F6F\\6B63\\9ED1\\4F53': 'Microsoft JhengHei',
	'\\5FAE\\8F6F\\96C5\\9ED1': 'Microsoft YaHei',

	'\\96B6\\4E66': 'LiSu',
	'\\5E7C\\5706': 'YouYuan',
	'\\534E\\6587\\6977\\4F53': 'STKaiti',
	'\\534E\\6587\\5B8B\\4F53': 'STSong',
	'\\534E\\6587\\4E2D\\5B8B': 'STZhongsong',
	'\\534E\\6587\\4EFF\\5B8B': 'STFangsong',
	'\\65B9\\6B63\\8212\\4F53': 'FZShuTi',
	'\\65B9\\6B63\\59DA\\4F53': 'FZYaoti',
	'\\534E\\6587\\5F69\\4E91': 'STCaiyun',
	'\\534E\\6587\\7425\\73C0': 'STHupo',
	'\\534E\\6587\\96B6\\4E66': 'STLiti',
	'\\534E\\6587\\884C\\6977': 'STXingkai',
	'\\534E\\6587\\65B0\\9B4F': 'STXinwei'
};

module.exports = {
	debug: false,
	log: function(msg, type) {
		var self = this;
		type = type ? type: 'info';
		if (msg && (self.debug || (!self.debug && type != 'debug'))) {
			console.log((type ? '[' + type.toUpperCase() + '] ': '') + msg);
		}
	},
	/**
     * analyze @charset first.
     * @example:
     * 1. @charset 'gbk';
     * 2. @charset "gbk";
     * @link: https://developer.mozilla.org/en/CSS/@charset
     */
	detectCharset: function(input) {
		var result = /@charset\s+['|"](\w*)["|'];/.exec(input),
		charset = 'UTF-8';
		if (result && result[1]) {
			charset = result[1];
		}
		//        else{
		//            var detect = jschardet.detect(input);
		//            if(detect && detect.confidence > 0.9){
		//                charset = detect.encoding;
		//            }
		//        }
		return charset;
	},
	mkdirSync: function(dirpath, mode) {
		var self = this;
		if (!fs.existsSync(dirpath)) {
			// try to create parent dir first.
			self.mkdirSync(path.dirname(dirpath), mode);
			fs.mkdirSync(dirpath, mode);
		}
	},
	getRemoteFile: function(filePath, callback) {
		var self = this,
		content = null,
		buffers = [],
		count = 0,
		options = url.parse(filePath);
		// TODO https ?
		if (typeof options != 'undefined') {
			//            debug && console.log('start request');
			var req = http.request(options, function(res) {
				//                debug && console.log('status: ' + res.statusCode);
				var charset = 'utf-8';
				if (typeof res.headers['content-type'] !== 'undefined') {
					var regResult = res.headers['content-type'].match(/;charset=(\S+)/);
					if (regResult !== null && regResult[1]) {
						charset = regResult[1];
						self.log('The charset of url ' + filePath + ' is: ' + charset, 'debug');
					}
				}
				res.on('data', function(chunk) {
					//                    content += chunk;
					buffers.push(chunk);
					count += chunk.length;
				});
				res.on('end', function() {
					switch (buffers.length) {
					case 0:
						content = new Buffer(0);
						break;
					case 1:
						content = buffers[0];
						break;
					default:
						content = new Buffer(count);
						for (var i = 0, pos = 0, l = buffers.length; i < l; i++) {
							var chunk = buffers[i];
							chunk.copy(content, pos);
							pos += chunk.length;
						}
						break;
					}
					callback && callback(content, charset);
				});
			});
			req.on('error', function(e) {
				self.log('request error: ' + e, 'error');
			});
			req.end();
		} else {
			self.log('parse error: ' + filePath, 'error');
			callback && callback(content);
		}
	},
	//中文转unicode
	a2u: function(text) {
		text = escape(text.toString()).replace(/\+/g, "%2B");
		var matches = text.match(/(%([0-9A-F]{2}))/gi);
		if (matches) {
			for (var matchid = 0; matchid < matches.length; matchid++) {
				var code = matches[matchid].substring(1, 3);
				if (parseInt(code, 16) >= 128) {
					text = text.replace(matches[matchid], '%u00' + code);
				}
			}
		}
		text = text.replace('%25', '%u0025');

		return text;
	},
	unicode2En: function(code) {
        if(ZNMAP.hasOwnProperty(code)){
            return ZNMAP[code];
        }
        return code;
	} 
};

