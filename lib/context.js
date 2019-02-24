var loaderContext = null;
var loaderOptions = {};

function CompilerContext() {


}

CompilerContext.prototype.getOptions = function () {
  return loaderContext._compiler.options;
}

CompilerContext.prototype.getQueryOptions = function () {
  return loaderOptions;
}

CompilerContext.prototype.setContext = function (e, querys) {
  loaderContext = e;
  loaderOptions = querys;
}

CompilerContext.prototype.setVueOptions = function (vue) {
  this.vue = vue;
}

CompilerContext.prototype.getVueOptions = function () {
  return this.vue;
}


module.exports = new CompilerContext();