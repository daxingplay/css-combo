# css-combo

## Introduction
combo css which import other css
对于js，目前已经有比较成熟的模块化方案，比如seajs、kissy，但是css方面呢，一般是通过less进行编译打包的。less官方对于less文件中的@import "xxx.css"是不会打包进来的，这也是考虑到本身就是有需求要这样引用css，而如果你@import "xxx.less"，less打包工具就会分析这些引入的模块，进行打包。
css-combo就是借鉴了这种思想，实现了css模块化。即在入口文件中@import其他模块，然后对入口文件进行打包的时候，该工具会分析import的文件，把这些文件打包进来。

## Usage

*API:*

    CssCombo.build(cfg);

* cfg:{Object} 参数

    * target：{String} 入口文件
    * inputEncoding：{String} 输入文件编码，可选，默认GBK
    * outputEncoding：{String} 输出文件编码，可选，默认GBK
    * output：{String} 输出目录，可以使用相对路径
    * exclude：{Array} 黑名单正则数组，可选，默认不处理[/.combine.css/, /-min.css/, /.combo.css/]
    * compress: {Boolean} 是否压缩，默认为true
    * debug: {Boolean} 是否打印日志

## TODO

    * 增加目录打包形式
    * <del>先去掉注释再打包</del>
    * 增加对模块@charset的检测
    * 编码转换，最后压缩成ascii

## License
css-combo 遵守 "MIT"：https://github.com/daxingplay/css-combo/blob/master/LICENSE.md 协议

