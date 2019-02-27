const relative = require('relative')
const upath = require('upath')

// 获取文件路径，去掉 src 和 node_modules 目录
module.exports = function (...arv) {
  let file =  upath.normalize(relative(...arv)).replace(/^src\//, '').replace(/node_modules\//g, 'modules/');
  return file.replace(/(\.\.\/)+modules/,'modules')
}
