(function () {
  'use strict';

  System.register("project:///assets/newScript.ts", ["cc"], function (_export, _context) {

    var _decorator, Component, _dec, _class, ccclass, property, newScript;

    _export({
      _dec: void 0,
      _class: void 0
    });

    return {
      setters: [function (_cc) {
        _decorator = _cc._decorator;
        Component = _cc.Component;
      }],
      execute: function () {
        cc._RF.push(window.module || {}, "9654fvYEDxNRbUGNofS3GWH", "newScript"); // begin newScript


        ccclass = _decorator.ccclass;
        property = _decorator.property;

        _export("newScript", newScript = (_dec = ccclass("newScript"), _dec(_class =
        /*#__PURE__*/
        function (_Component) {
          babelHelpers.inherits(newScript, _Component);

          function newScript() {
            babelHelpers.classCallCheck(this, newScript);
            return babelHelpers.possibleConstructorReturn(this, babelHelpers.getPrototypeOf(newScript).apply(this, arguments));
          }

          babelHelpers.createClass(newScript, [{
            key: "start",

            /* class member could be defined like this */
            // dummy = '';

            /* use `property` decorator if your want the member to be serializable */
            // @property
            // serializableDummy = 0;
            value: function start() {} // Your initialization goes here.
            // update (deltaTime: number) {
            //     // Your update function goes here.
            // }

          }]);
          return newScript;
        }(Component)) || _class));

        cc._RF.pop(); // end newScript

      }
    };
  });


}());
