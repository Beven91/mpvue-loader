// vue compiler module for transforming `<tag>:<attribute>` to `require`

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var resolveSrc = require('../../utils/resolve-src')

var defaultOptions = {
  img: 'src',
  image: 'xlink:href'
}

module.exports = userOptions => {
  var options = userOptions
    ? Object.assign({}, defaultOptions, userOptions)
    : defaultOptions

  return {
    postTransformNode: node => {
      transform(node, options)
    }
  }
}

function transform (node, options) {
  for (var tag in options) {
    if (node.tag === tag && node.attrs) {
      var attributes = options[tag]
      if (typeof attributes === 'string') {
        node.attrs.some(attr => rewrite(attr, attributes))
      } else if (Array.isArray(attributes)) {
        attributes.forEach(item => node.attrs.some(attr => rewrite(attr, item)))
      }
    }
  }
}

function rewrite (attrsMap, name, fileOptions) {
  var value = attrsMap[name]
  if (value) {
    var firstChar = value.charAt(0)
    if (firstChar === '.') {
      var { resourcePath, outputPath, context } = fileOptions
      var assetPath = path.resolve(resourcePath, '..', value)
      var toPath = resolveSrc(context, assetPath)
      attrsMap[name] = `/${toPath}`
      copyAsset(assetPath, path.join(outputPath, toPath))
    }
    return true
  }
}
