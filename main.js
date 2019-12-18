

function setupModuleSystem(settings) {
//    var importMap = { imports: { }, };
//    importMap.imports['cc'] = settings.debug ? 'cocos3d-js.js' : 'cocos3d-js.min.js';
//    const importMapElement = document.createElement('script');
//    importMapElement.type = ccEnv.importMapType;
//    importMapElement.text = JSON.stringify(importMap, undefined, 2);
//    console.log('importmap ' + importMapElement.src);
//    document.body.appendChild(importMapElement);
    require('cocos3d-js.js');
    var cc = ccm;
    System.register('cc', [], function (_export, _context) {
      return {
        setters: [],
        execute: function () {
          _export(cc);
        }
      };
    });
}

function loadPrerequisiteModules(settings) {
    const promises = [];
    settings.scripts.forEach(function(script) {
        if (!script.defer) {
            promises.push(ccEnv.imp(script.moduleId));
        }
    });
    return Promise.all(promises);
}

function loadScriptPackages(settings) {
    if (settings.scriptPackages) {
        settings.scriptPackages.forEach((sp) => {
            require(sp);
        });
    }
    return Promise.resolve(0);
    
}

window.importEngine = function() {
    setupModuleSystem(window._CCSettings);
    let promise = loadScriptPackages(window._CCSettings);
    return promise.then(function() {
        let result = ccEnv.imp("cc");
        return result;
    });
};

window.boot = function () {
    var settings = window._CCSettings;

    var onStart = function () {
        window._CCSettings = undefined;
        cc.loader.downloader._subpackages = settings.subpackages;

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

		if (cc.sys.isMobile) {
			if (settings.orientation === 'landscape') {
				cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
			} else if (settings.orientation === 'portrait') {
				cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
			}
			cc.view.enableAutoFullScreen(false);
		}
        
        
        // init assets
        cc.AssetLibrary.init({
            libraryPath: 'res/import',
            rawAssetsBase: 'res/raw-',
            rawAssets: settings.rawAssets,
            packedAssets: settings.packedAssets,
            md5AssetsMap: settings.md5AssetsMap,
            subpackages: settings.subpackages
        });

        var launchScene = settings.launchScene;
        loadPrerequisiteModules(settings).then(function() {
            // load scene
            cc.director.loadScene(launchScene, null,
                function () {
                    cc.view.setDesignResolutionSize(720, 1559, 4);
        
                    cc.loader.onProgress = null;
                    console.log('Success to load scene: ' + launchScene);
                }
            );
        });
    };

    // jsList
    var jsList = settings.jsList;
	/* <!--  --> */
	
		var bundledScript = 'src/project.dev.js';
        if (jsList) {
            jsList = jsList.map(function (x) {
                return 'src/' + x;
            });
        } else {
			jsList = [];
        }
	
    var option = {
        id: 'GameCanvas',
        scenes: settings.scenes,
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: !false && settings.debug,
        frameRate: 60,
        jsList: jsList,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
        renderpipeline: settings.renderpipeline,
    }

    cc.game.run(option, onStart);
};


if (window.jsb) {
    require('src/babelHelpers.js');
    require('src/settings.js');
    require('src/cc-env.js');
    try {
        window.importEngine().then(function() {
            require('jsb-adapter/jsb-engine.js');
            window.boot();
        });
    }
    catch (e) {
        console.log('IMPORT ENGINE FAILED !!!');
        console.log(e.message);
    }
}
