// babel-plugin-parse-mp-info.js

const generate = require('babel-generator').default
const babelon = require('babelon')
const compilerContext = require('../context');

function getImportsMap(metadata) {
  let { importsMap } = metadata
  const { imports } = metadata.modules

  if (!importsMap) {
    importsMap = {}
    imports.forEach(m => {
      m.specifiers.forEach(v => {
        importsMap[v.local] = m.source
      })
    })
    metadata.importsMap = importsMap
  }

  return metadata
}

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
  NewExpression: function (path) {
    const { metadata } = path.hub.file
    const { importsMap } = getImportsMap(metadata)

    const calleeName = path.node.callee.name
    const isVue = /vue$/.test(importsMap[calleeName])

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
    const { importsMap } = getImportsMap(metadata)

    // 找到所有的 imports
    const { properties } = path.node.value
    const components = {}
    properties.forEach(p => {
      const k = p.key.name || p.key.value
      const v = p.value.name || p.value.value
      components[k] = getComponents(importsMap[v], k);
    })

    metadata.components = components
  }
}

// components 的遍历器
const componentsVisitor = {
  ExportDefaultDeclaration: function (path) {
    path.traverse(traverseComponentsVisitor)
  },
  CallExpression:function(path){
    if(path.node.callee && path.node.callee.name==='Component'){
      path.traverse(traverseComponentsVisitor)
    }
  }
}

function parseComponentsDeps(babel) {
  return { visitor: componentsVisitor }
}

function getComponents(libraryName, methodName) {
  const dynamic = compilerContext.getQueryOptions().dynamic || [];
  for (var i = 0, k = dynamic.length; i < k; i++) {
    var info = dynamic[i];
    if (info.libraryName === libraryName) {
      var transformedMethodName = info.camel2UnderlineComponentName // eslint-disable-line
        ? camel2Underline(methodName) : info.camel2DashComponentName ? camel2Dash(methodName) : methodName;
      return info.libraryName + '/' + (info.libraryDirectory || 'lib') + '/' + transformedMethodName;
    }
  }
  return methodName;
}

function camel2Dash(_str) {
  var str = _str[0].toLowerCase() + _str.substr(1);

  return str.replace(/([A-Z])/g, function ($1) {
    return "-".concat($1.toLowerCase());
  });
}

function camel2Underline(_str) {
  var str = _str[0].toLowerCase() + _str.substr(1);

  return str.replace(/([A-Z])/g, function ($1) {
    return "_".concat($1.toLowerCase());
  });
}

module.exports = { parseConfig, parseComponentsDeps }
