var loaderContext = null;

function CompilerContext() {


}

CompilerContext.prototype.getOptions = function () {
  return loaderContext._compiler.options;
}

CompilerContext.prototype.setContext = function (e) {
  loaderContext = e;
}

CompilerContext.prototype.setVueOptions = function (vue) {
  this.vue = vue;
}

CompilerContext.prototype.getVueOptions = function(){
  return this.vue;
}


module.exports = new CompilerContext();