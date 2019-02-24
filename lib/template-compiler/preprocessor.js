// loader for pre-processing templates with e.g. pug

var cons = require('consolidate')
var loaderUtils = require('loader-utils')
var compilerContext = require('../context')

module.exports = function (content) {
  this.cacheable && this.cacheable()
  var callback = this.async()
  var opt = loaderUtils.getOptions(this)
  var vueOptions = compilerContext.getVueOptions() || {}

  if (!cons[opt.engine]) {
    return callback(new Error(
      'Template engine \'' + opt.engine + '\' ' +
      'isn\'t available in Consolidate.js'
    ))
  }

  // allow passing options to the template preprocessor via `template` option
  if (vueOptions) {
    Object.assign(opt, vueOptions.template)
  }

  // for relative includes
  opt.filename = this.resourcePath

  cons[opt.engine].render(content, opt, function (err, html) {
    if (err) {
      return callback(err)
    }
    callback(null, html)
  })
}
