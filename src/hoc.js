var React = require('react')
var mixin = require('./mixin.js')

function extractDeps(deps, allDeps) {
  return Object.keys(deps).reduce(function (depsMap, key) {
    if (deps[key].getDepsMap) {
      return extractDeps(deps[key].getDepsMap(), allDeps);
    } else {
      var depsKey = Array.isArray(deps[key]) ? deps[key].join('.') : deps[key];
      depsMap[depsKey] = true;
    }
    return depsMap;
  }, allDeps);
}

module.exports = function (Component, paths) {
  return React.createClass({
    displayName: 'CerebralWrapping_' + Component.name,
    mixins: [mixin],
    componentWillReceiveProps: function (nextProps) {
      var hasChange = false;
      var oldPropKeys = Object.keys(this.props);
      var newPropKeys = Object.keys(nextProps);
      if (oldPropKeys.length !== newPropKeys.length) {
        hasChange = true;
      } else {
        for (var i = 0; i < newPropKeys.length; i++) {
          if (this.props[newPropKeys[i]] !== nextProps[newPropKeys[i]]) {
            hasChange = true
            break
          }
        }
      }
      // If dynamic paths, we need to update them
      if (typeof paths === 'function') {
        this.context.cerebral.updateComponent(this, this.getDepsMap(nextProps))
      } else {
        hasChange && this._update();
      }
    },
    getPropsWithModules: function (props) {
      return Object.keys(props).reduce(function (propsWithModules, key) {
        propsWithModules[key] = props[key]
        return propsWithModules
      }, {modules: this.modules});
    },
    getDepsMap(props) {
      if (!paths) {
        return {}
      }
      var propsWithModules = this.getPropsWithModules(props);
      var deps = typeof paths === 'function' ? paths(propsWithModules) : paths;

      return extractDeps(deps, {});
    },
    getStatePaths: function (props) {
      if (!paths) {
        return {}
      }
      var propsWithModules = Object.keys(props).reduce(function (propsWithModules, key) {
        propsWithModules[key] = props[key]
        return propsWithModules
      }, {modules: this.modules})
      return typeof paths === 'function' ? paths(propsWithModules) : paths
    },
    render: function () {
      return React.createElement(Component, this.getProps())
    }
  })
}
