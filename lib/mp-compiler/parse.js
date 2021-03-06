// babel-plugin-parse-mp-info.js

const generate = require('babel-generator').default
const babelon = require('babelon7')
const compilerContext = require('../context')
const path = require('path')

// 解析 config
const traverseConfigVisitor = {
  Property: function (path) {
    const k = path.node.key.name || path.node.key.value
    if (k !== 'config') {
      return
    }
    path.stop()

    const { metadata } = path.hub.file
    const { code } = generate(path.node.value, {}, '')
    metadata.config = { code, node: path.node.value, value: babelon.eval(code) }

    // path.remove()
  }
}

// config 的遍历器
const configVisitor = {
  ExportDefaultDeclaration: function (path) {
    path.traverse(traverseConfigVisitor)
    path.remove()
  },
  ImportDeclaration: parseImports,
  NewExpression: function (path) {
    const { metadata } = path.hub.file
    const { importsMap = {} } = metadata

    const calleeName = path.node.callee.name
    const isVue = /(vue$)|vue-property-decorator/.test(importsMap[calleeName])

    if (!isVue) {
      return
    }

    const arg = path.node.arguments[0]
    const v = arg.type === 'Identifier' ? importsMap[arg.name] : importsMap['App']
    metadata.rootComponent = v || importsMap['index'] || importsMap['main']
  }
}
function parseConfig(babel) {
  return { visitor: configVisitor }
}

// 解析 components
const traverseComponentsVisitor = {
  Property: function (path) {
    if (path.node.key.name !== 'components') {
      return
    }
    path.stop()

    const { metadata } = path.hub.file
    const { importsMap = {} } = metadata;

    // 找到所有的 imports
    const { properties } = path.node.value
    const components = {}
    properties.forEach(p => {
      const k = p.key.name || p.key.value
      const v = p.value.name || p.value.value
      components[k] = getComponents(importsMap[v], k)
    })

    metadata.components = components
  }
}

// components 的遍历器
const componentsVisitor = {
  ExportDefaultDeclaration: function (path) {
    path.traverse(traverseComponentsVisitor)
  },
  ImportDeclaration: function(path){
    return parseImports(path);
  },
  CallExpression: function (path) {
    if (path.node.callee && path.node.callee.name === 'Component') {
      path.traverse(traverseComponentsVisitor)
    }
  }
}

function parseImports(path){
  const node = path.node;
  const { metadata } = path.hub.file;
  const moduleName = node.source.value;
  const specifiers = node.specifiers || [];
  if (!metadata.importsMap) {
    metadata.importsMap = {};
  }
  const importMaps = metadata.importsMap || {};
  specifiers.forEach((element) => {
    importMaps[element.local.name] = moduleName;
  });
}

function parseComponentsDeps(babel) {
  return { visitor: componentsVisitor }
}

function getComponents(libraryName, methodName) {
  const dynamic = compilerContext.getQueryOptions().dynamic || []
  for (var i = 0, k = dynamic.length; i < k; i++) {
    var info = dynamic[i]
    if (info.libraryName === libraryName) {
      var camel2DashComponentName = typeof info.camel2DashComponentName === 'undefined' ? true : info.camel2DashComponentName
      var transformedMethodName = info.camel2UnderlineComponentName // eslint-disable-line
        ? camel2Underline(methodName) : camel2DashComponentName ? camel2Dash(methodName) : methodName
      var using = winPath(
        info.customName
          ? info.customName(transformedMethodName)
          : path.join(info.libraryName, info.libraryDirectory || 'lib', transformedMethodName, info.fileName || '')
      ) // eslint-disable-line
      return using
    }
  }
  return libraryName
}

function camel2Dash(_str) {
  var str = _str[0].toLowerCase() + _str.substr(1)

  return str.replace(/([A-Z])/g, function ($1) {
    return '-'.concat($1.toLowerCase())
  })
}

function winPath(path) {
  return path.replace(/\\/g, '/')
}

function camel2Underline(_str) {
  var str = _str[0].toLowerCase() + _str.substr(1)

  return str.replace(/([A-Z])/g, function ($1) {
    return '_'.concat($1.toLowerCase())
  })
}

module.exports = { parseConfig, parseComponentsDeps }
