const path = require('path')
const upath = require('upath')
const relative = require('relative')

const getRelativePath = (filePath) => {
  if (!/^\.(\.)?\//.test(filePath)) {
    filePath = `./${filePath}`
  }
  return filePath
}

const emitHandle = (compilation, callback) => {
  compilation.entrypoints.forEach(entry => {
    const { chunks } = entry;
    const entryChunk = chunks.pop()

    entryChunk.files.forEach(filePath => {
      const assetFile = compilation.assets[filePath]
      const extname = path.extname(filePath)
      let content = assetFile.source()

      const newChunks = [...chunks].reverse();
      newChunks.forEach(chunk => {
        chunk.files.forEach(subFile => {
          if (path.extname(subFile) === extname && assetFile) {
            let relativePath = upath.normalize(relative(filePath, subFile))

            // 百度小程序 js 引用不支持绝对路径，改为相对路径
            if (extname === '.js') {
              relativePath = getRelativePath(relativePath)
            }

            if (/^(\.wxss)|(\.ttss)|(\.acss)|(\.css)$/.test(extname)) {
              relativePath = getRelativePath(relativePath)
              content = `@import "${relativePath}";\n${content}`
            } else if (!(/^\.map$/.test(extname))) {
              content = `require("${relativePath}");\n${content}`
            }
          }
        })
        assetFile.source = () => content
      })
    })
  })
  callback()
}

module.exports = {
   emitHandle:emitHandle
}