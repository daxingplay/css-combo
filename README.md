# css-combo

[![Build Status](https://secure.travis-ci.org/daxingplay/css-combo.png)](http://travis-ci.org/daxingplay/css-combo)

[![NPM version](https://badge.fury.io/js/css-combo.png)](http://badge.fury.io/js/css-combo)

## Introduction
combo css which import other css
对于js，目前已经有比较成熟的模块化方案，比如seajs、kissy，但是css方面呢，一般是通过less进行编译打包的。less官方对于less文件中的@import "xxx.css"是不会打包进来的，这也是考虑到本身就是有需求要这样引用css，而如果你@import "xxx.less"，less打包工具就会分析这些引入的模块，进行打包。
css-combo就是借鉴了这种思想，实现了css模块化。即在入口文件中@import其他模块，然后对入口文件进行打包的时候，该工具会分析import的文件，把这些文件打包进来。

对于CSS模块化，欢迎大家看我这篇博文：(http://www.techcheng.com/study/css/introduce-css-combo.html)

## Usage

首先需要npm安装一下：

    npm install -g css-combo

###命令行使用###

命令行下，可以先进入需要打包的文件所在目录，然后

    csscombo xxx.source.css xxx.combo.css

第一个参数是源文件名，第二个参数是打包之后的文件名

其他选项有：

* -s: silent, 静默模式，表示不输出任何信息
* -ic: inputCharset, 可以指定输入文件的编码
* -oc： outputCharset, 可以指定输出文件的编码

### 在NodeJS里面使用 ###

你也可以在自己的打包工具中调用css combo，和其他npm包一样：

    var CSSCombo = require('css-combo');
    CSSCombo.build(cfg, function(err){ callback(); });

* cfg 参数可以配置以下选项：

    * target：{String} 入口文件
    * inputEncoding：{String} 输入文件编码，可选，默认检测入口文件中的@charset设置。如果入口文件没有设置@charset，那么最好设置本选项
    * outputEncoding：{String} 输出文件编码，可选，默认UTF-8
    * output：{String} 输出目录或者输出的完整路径（含文件名，推荐），可以使用相对路径
    * exclude：{Array} 黑名单正则数组，可选，默认空
    * compress: {Boolean} 是否压缩，默认为true，处理规则同YUICompressor
    * debug: {Boolean} 是否打印日志
    * paths: {Array} `@import`额外查找的路径。

### 在grunt中使用 ###

CSS Combo配套的grunt插件：https://github.com/daxingplay/grunt-css-combo

## TODO

* 增加目录打包形式

## ChangeList

* 0.2.2：修正打包之后输出文件编码问题
* 0.2.7：build参数更改，提供更多形式的输入，去掉部分log信息

## License
css-combo 遵守 "MIT"：https://github.com/daxingplay/css-combo/blob/master/LICENSE.md 协议

