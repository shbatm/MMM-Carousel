/* eslint-disable max-lines-per-function, no-underscore-dangle, init-declarations, no-undef, sort-imports */

import {after, afterEach, beforeEach, describe, it, mock} from "node:test";
import assert from "node:assert/strict";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mock MagicMirror globals
let moduleDefinition = null;

global.Module = {
  register (name, definition) {
    moduleDefinition = definition;
    return definition;
  }
};

global.Log = {
  info: mock.fn(),
  log: mock.fn(),
  debug: mock.fn(),
  warn: mock.fn(),
  error: mock.fn()
};

global.MM = {
  getModules () {
    return {
      exceptModule () {
        return {
          filter () {
            return [];
          }
        };
      }
    };
  }
};

global.KeyHandler = {};

// Load the module by executing it in the global context
const modulePath = join(__dirname, "../../MMM-Carousel.js");
const moduleCode = readFileSync(modulePath, "utf8");
const script = new vm.Script(moduleCode, {filename: "MMM-Carousel.js"});
const windowMock = {};
const context = vm.createContext({
  Module: global.Module,
  Log: global.Log,
  MM: global.MM,
  KeyHandler: global.KeyHandler,
  document: {},
  window: windowMock,
  console: global.console,
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
  URLSearchParams: global.URLSearchParams
});
script.runInContext(context);

describe("MMM-Carousel Core Functions", () => {
  let instance;

  beforeEach(() => {
    // Create a fresh instance for each test
    instance = Object.create(moduleDefinition);
    instance.config = {
      mode: "slides",
      timings: {},
      transitionInterval: 10000,
      homeSlide: 0
    };
    Log.warn.mock.resetCalls();
  });

  describe("getMaxSlideIndex", () => {
    it("should return 0 when modulesContext is not set", () => {
      instance.modulesContext = null;
      assert.equal(instance.getMaxSlideIndex(), 0);
    });

    it("should return slide count when slides exist", () => {
      instance.modulesContext = {
        slides: {slide1: [],
          slide2: [],
          slide3: []}
      };
      assert.equal(instance.getMaxSlideIndex(), 3);
    });

    it("should return module count when no slides", () => {
      instance.modulesContext = {
        modules: [
          {},
          {},
          {},
          {}
        ]
      };
      assert.equal(instance.getMaxSlideIndex(), 4);
    });

    it("should return 0 when modulesContext is empty object", () => {
      instance.modulesContext = {};
      assert.equal(instance.getMaxSlideIndex(), 0);
    });
  });

  describe("calculateNextIndex", () => {
    it("should increment index by 1 with goDirection", () => {
      const ctx = {currentIndex: 2,
        slides: null};
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: -1,
        goDirection: 1,
        resetCurrentIndex: 5
      });
      assert.equal(result.nextIndex, 3);
      assert.equal(result.noChange, false);
    });

    it("should wrap around to 0 when exceeding max", () => {
      const ctx = {currentIndex: 4,
        slides: null};
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: -1,
        goDirection: 1,
        resetCurrentIndex: 5
      });
      assert.equal(result.nextIndex, 0);
    });

    it("should wrap around to last when going negative", () => {
      const ctx = {currentIndex: 0,
        slides: null};
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: -1,
        goDirection: -1,
        resetCurrentIndex: 5
      });
      assert.equal(result.nextIndex, 4);
    });

    it("should jump to specific index", () => {
      const ctx = {currentIndex: 2,
        slides: null};
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: 4,
        goDirection: 0,
        resetCurrentIndex: 5
      });
      assert.equal(result.nextIndex, 4);
    });

    it("should set noChange when jumping to current index", () => {
      const ctx = {currentIndex: 2,
        slides: null};
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: 2,
        goDirection: 0,
        resetCurrentIndex: 5
      });
      assert.equal(result.noChange, true);
    });

    it("should find slide by name", () => {
      const ctx = {
        currentIndex: 0,
        slides: {main: [],
          page2: [],
          page3: []}
      };
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: -1,
        goDirection: 0,
        goToSlide: "page2",
        resetCurrentIndex: 3
      });
      assert.equal(result.nextIndex, 1);
    });

    it("should set noChange when slide name not found", () => {
      const ctx = {
        currentIndex: 1,
        slides: {main: [],
          page2: [],
          page3: []}
      };
      const result = instance.calculateNextIndex(ctx, {
        goToIndex: -1,
        goDirection: 0,
        goToSlide: "nonexistent",
        resetCurrentIndex: 3
      });
      // When slide not found, nextIndex stays at currentIndex but noChange is false
      assert.equal(result.nextIndex, 1);
      assert.equal(result.noChange, false);
    });
  });

  describe("getSlideTimer", () => {
    it("should return individual slide timing when defined", () => {
      instance.config.timings = {0: 5000,
        2: 15000};
      instance.config.transitionInterval = 10000;
      assert.equal(instance.getSlideTimer(0), 5000);
      assert.equal(instance.getSlideTimer(2), 15000);
    });

    it("should return default transitionInterval when slide timing not defined", () => {
      instance.config.timings = {0: 5000};
      instance.config.transitionInterval = 10000;
      assert.equal(instance.getSlideTimer(1), 10000);
    });

    it("should handle empty timings object", () => {
      instance.config.timings = {};
      instance.config.transitionInterval = 8000;
      assert.equal(instance.getSlideTimer(5), 8000);
    });
  });

  describe("shouldShowModuleInSlide", () => {
    it("should match module by name string", () => {
      const module = {name: "calendar"};
      assert.equal(instance.shouldShowModuleInSlide(module, "calendar"), true);
      assert.equal(instance.shouldShowModuleInSlide(module, "weather"), false);
    });

    it("should match module by config object with name", () => {
      const module = {name: "calendar",
        data: {config: {}}};
      const slideConfig = {name: "calendar"};
      assert.equal(instance.shouldShowModuleInSlide(module, slideConfig), true);
    });

    it("should match module by carouselId when specified", () => {
      const module = {
        name: "calendar",
        data: {config: {carouselId: "cal1"}}
      };
      const slideConfig = {name: "calendar",
        carouselId: "cal1"};
      assert.equal(instance.shouldShowModuleInSlide(module, slideConfig), true);
    });

    it("should not match when carouselId differs", () => {
      const module = {
        name: "calendar",
        data: {config: {carouselId: "cal1"}}
      };
      const slideConfig = {name: "calendar",
        carouselId: "cal2"};
      assert.equal(instance.shouldShowModuleInSlide(module, slideConfig), false);
    });

    it("should handle module without data property", () => {
      const module = {name: "weather"};
      const slideConfig = {name: "weather",
        carouselId: "w1"};
      // When module.data is undefined, carouselId is treated as undefined -> matches
      assert.equal(instance.shouldShowModuleInSlide(module, slideConfig), true);
    });

    it("should match when slideConfig has no carouselId", () => {
      const module = {
        name: "calendar",
        data: {config: {carouselId: "cal1"}}
      };
      const slideConfig = {name: "calendar"};
      assert.equal(instance.shouldShowModuleInSlide(module, slideConfig), true);
    });
  });

  describe("getTransitionTimer", () => {
    it("should return default transitionInterval for null position", () => {
      instance.config.transitionInterval = 12000;
      assert.equal(instance.getTransitionTimer(null), 12000);
    });

    it("should return override for specific position", () => {
      instance.config.transitionInterval = 10000;
      instance.config.top_left = {
        enabled: true,
        overrideTransitionInterval: 8000
      };
      assert.equal(instance.getTransitionTimer("top_left"), 8000);
    });

    it("should return default when no override exists", () => {
      instance.config.transitionInterval = 10000;
      instance.config.top_left = {enabled: true};
      assert.equal(instance.getTransitionTimer("top_left"), 10000);
    });
  });

  describe("handleKeyboardEvent", () => {
    beforeEach(() => {
      instance.manualTransition = mock.fn();
      instance.restartTimer = mock.fn();
      instance.toggleTimer = mock.fn();
      instance.getMaxSlideIndex = () => 5;
    });

    it("should ignore events from input fields", () => {
      const event = {
        target: {tagName: "INPUT"},
        key: "ArrowRight",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });

    it("should ignore events from contentEditable", () => {
      const event = {
        target: {isContentEditable: true},
        key: "ArrowRight",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });

    it("should ignore events from textarea fields", () => {
      const event = {
        target: {tagName: "TEXTAREA"},
        key: "ArrowRight",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });

    it("should ignore events from select elements", () => {
      const event = {
        target: {tagName: "SELECT"},
        key: "ArrowLeft",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });

    it("should navigate to next slide on ArrowRight", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "ArrowRight",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], null);
      assert.equal(args[1], 1);
      assert.equal(event.preventDefault.mock.calls.length, 1);
    });

    it("should navigate to previous slide on ArrowLeft", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "ArrowLeft",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], null);
      assert.equal(args[1], -1);
    });

    it("should toggle timer on ArrowDown", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "ArrowDown",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.toggleTimer.mock.calls.length, 1);
    });

    it("should jump to home on Home key", () => {
      instance.config.homeSlide = 2;
      const event = {
        target: {tagName: "DIV"},
        key: "Home",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 2);
    });

    it("should jump to home on 0 key", () => {
      instance.config.homeSlide = 1;
      const event = {
        target: {tagName: "DIV"},
        key: "0",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 1);
    });

    it("should jump to slide 1 on key \"1\"", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "1",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 0); // "1" → index 0
    });

    it("should jump to slide 5 on key \"5\"", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "5",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 4); // "5" → index 4
    });

    it("should not navigate when slide number exceeds max", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "9",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      // GetMaxSlideIndex returns 5, so key "9" (index 8) should be ignored
      assert.equal(instance.manualTransition.mock.calls.length, 0);
      assert.equal(event.preventDefault.mock.calls.length, 0);
    });

    it("should not call preventDefault for unhandled keys", () => {
      const event = {
        target: {tagName: "DIV"},
        key: "x",
        preventDefault: mock.fn()
      };
      instance.handleKeyboardEvent(event);
      assert.equal(event.preventDefault.mock.calls.length, 0);
    });
  });

  describe("setupNativeKeyboardHandler", () => {
    it("should not setup handler when enableKeyboardControl is false", () => {
      instance.config.enableKeyboardControl = false;
      instance.keyboardHandler = null;
      instance.setupNativeKeyboardHandler();
      // Handler remains null when disabled
      assert.equal(instance.keyboardHandler, null);
    });

    it("should warn and skip setup in positional mode", () => {
      instance.config.mode = "positional";
      instance.config.enableKeyboardControl = true;
      instance.keyboardHandler = null;
      instance.setupNativeKeyboardHandler();
      assert.equal(Log.warn.mock.calls.length, 1);
      assert.match(Log.warn.mock.calls[0].arguments[0], /positional mode/u);
    });

    it("should not register duplicate handlers", () => {
      instance.config.enableKeyboardControl = true;
      instance.keyboardHandler = {existing: true}; // Already registered
      const initialHandler = instance.keyboardHandler;
      instance.setupNativeKeyboardHandler();
      assert.equal(instance.keyboardHandler, initialHandler);
    });
  });

  describe("handleCarouselGoto", () => {
    beforeEach(() => {
      instance.manualTransition = mock.fn();
      instance.restartTimer = mock.fn();
    });

    it("should handle numeric payload (1-indexed)", () => {
      instance.handleCarouselGoto(3);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 2); // 3 - 1 = index 2
    });

    it("should handle string number payload", () => {
      instance.handleCarouselGoto("5");
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], 4);
    });

    it("should handle object with slide property", () => {
      instance.handleCarouselGoto({slide: "home"});
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], null);
      assert.equal(args[1], 0);
      assert.equal(args[2], "home");
    });

    it("should reject negative indices", () => {
      instance.handleCarouselGoto(0);
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });

    it("should reject non-integer indices", () => {
      instance.handleCarouselGoto("abc");
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });
  });

  describe("parseUrlParam", () => {
    beforeEach(() => {
      instance.modulesContext = {slides: {Home: [],
        "News Feed": []}};
    });

    it("should return null for an empty value", () => {
      assert.equal(instance.parseUrlParam(""), null);
      assert.equal(instance.parseUrlParam(null), null);
    });

    it("should return the slide number for a numeric value", () => {
      assert.equal(instance.parseUrlParam("3"), 3);
    });

    it("should return a slide object for a known slide name", () => {
      assert.deepEqual({...instance.parseUrlParam("Home")}, {slide: "Home"});
    });

    it("should handle slide names with spaces (already decoded by URLSearchParams)", () => {
      assert.deepEqual({...instance.parseUrlParam("News Feed")}, {slide: "News Feed"});
    });

    it("should return null for unknown slide names", () => {
      assert.equal(instance.parseUrlParam("nope"), null);
      assert.ok(Log.warn.mock.calls.length > 0);
    });
  });

  describe("setupUrlParam", () => {
    beforeEach(() => {
      windowMock.location = {search: "?carousel=2"};
      instance.handleCarouselGoto = mock.fn();
      instance.urlParamActive = false;
    });

    afterEach(() => {
      delete windowMock.location;
      instance.urlParamActive = false;
    });

    it("should do nothing when urlParam is disabled", () => {
      instance.setupUrlParam();
      assert.equal(instance.handleCarouselGoto.mock.calls.length, 0);
    });

    it("should not work in positional mode", () => {
      instance.config.urlParam = true;
      instance.config.mode = "positional";
      instance.setupUrlParam();
      assert.equal(instance.handleCarouselGoto.mock.calls.length, 0);
      assert.ok(Log.warn.mock.calls.length > 0);
    });

    it("should jump to the slide in the start parameter", () => {
      instance.config.urlParam = true;
      instance.setupUrlParam();
      assert.equal(instance.handleCarouselGoto.mock.calls[0].arguments[0], 2);
    });

    it("should initialize only once", () => {
      instance.config.urlParam = true;
      instance.setupUrlParam();
      instance.setupUrlParam();
      assert.equal(instance.handleCarouselGoto.mock.calls.length, 1);
    });
  });

  describe("updateUrlParam", () => {
    beforeEach(() => {
      windowMock.location = {search: "?carousel=1"};
      windowMock.history = {replaceState: mock.fn()};
      instance.urlParamActive = false;
    });

    afterEach(() => {
      delete windowMock.location;
      delete windowMock.history;
      instance.urlParamActive = false;
    });

    it("should not touch the URL before setupUrlParam ran", () => {
      instance.updateUrlParam(2);
      assert.equal(windowMock.history.replaceState.mock.calls.length, 0);
    });

    it("should write the 1-indexed slide number", () => {
      instance.urlParamActive = true;
      instance.updateUrlParam(2);
      assert.equal(windowMock.history.replaceState.mock.calls[0].arguments[2], "?carousel=3");
    });

    it("should skip writing when the param is already current", () => {
      instance.urlParamActive = true;
      instance.updateUrlParam(0);
      assert.equal(windowMock.history.replaceState.mock.calls.length, 0);
    });
  });

  describe("handleToggleAutoMode", () => {
    beforeEach(() => {
      instance.updatePause = mock.fn();
      instance.restartTimer = mock.fn();
      instance.transitionTimer = {id: 123};
      instance.isManualMode = false;
    });

    it("should switch to manual mode and pause", () => {
      instance.handleToggleAutoMode();
      assert.equal(instance.isManualMode, true);
      assert.equal(instance.updatePause.mock.calls[0].arguments[0], true);
      assert.equal(instance.transitionTimer, null);
    });

    it("should switch back to auto mode and restart", () => {
      instance.isManualMode = true;
      instance.handleToggleAutoMode();
      assert.equal(instance.isManualMode, false);
      assert.equal(instance.updatePause.mock.calls[0].arguments[0], false);
      assert.equal(instance.restartTimer.mock.calls.length, 1);
    });
  });

  describe("toggleTimer", () => {
    beforeEach(() => {
      instance.config.mode = "slides";
      instance.updatePause = mock.fn();
      instance.restartTimer = mock.fn();
      instance.isManualMode = false;
    });

    it("should pause when timer is running", () => {
      instance.transitionTimer = {id: 456};
      instance.toggleTimer();
      assert.equal(instance.transitionTimer, null);
      assert.equal(instance.updatePause.mock.calls[0].arguments[0], true);
    });

    it("should restart when timer is paused", () => {
      instance.transitionTimer = null;
      instance.toggleTimer();
      assert.equal(instance.updatePause.mock.calls[0].arguments[0], false);
      assert.equal(instance.restartTimer.mock.calls.length, 1);
    });

    it("should not toggle in manual mode", () => {
      instance.isManualMode = true;
      instance.transitionTimer = {id: 789};
      instance.toggleTimer();
      assert.equal(instance.updatePause.mock.calls.length, 0);
    });

    it("should not toggle in positional mode", () => {
      instance.config.mode = "positional";
      instance.toggleTimer();
      assert.equal(instance.updatePause.mock.calls.length, 0);
    });
  });

  describe("restartTimer", () => {
    beforeEach(() => {
      instance.config.mode = "slides";
      instance.updatePause = mock.fn();
      instance.scheduleNextTransition = mock.fn();
      instance.modulesContext = {currentIndex: 2};
      instance.isManualMode = false;
    });

    it("should not restart in manual mode", () => {
      instance.isManualMode = true;
      instance.restartTimer();
      assert.equal(instance.scheduleNextTransition.mock.calls.length, 0);
    });

    it("should not restart in positional mode", () => {
      instance.config.mode = "positional";
      instance.restartTimer();
      assert.equal(instance.scheduleNextTransition.mock.calls.length, 0);
    });

    it("should unpause and schedule next transition", () => {
      instance.restartTimer();
      assert.equal(instance.updatePause.mock.calls[0].arguments[0], false);
      assert.equal(instance.scheduleNextTransition.mock.calls.length, 1);
      assert.equal(instance.scheduleNextTransition.mock.calls[0].arguments[0], 2);
    });
  });

  describe("buildModulesContext", () => {
    it("should build context for slides mode", () => {
      instance.config.mode = "slides";
      instance.config.slides = {page1: [],
        page2: []};
      instance.config.showPageIndicators = true;
      instance.config.showPageControls = false;
      instance.config.slideFadeInSpeed = 500;
      instance.config.slideFadeOutSpeed = 300;
      instance.config.timings = {0: 8000};

      const modules = [
        {name: "clock"},
        {name: "weather"}
      ];
      const ctx = instance.buildModulesContext(modules);

      assert.equal(ctx.modules, modules);
      assert.deepEqual(ctx.slides, {page1: [],
        page2: []});
      assert.equal(ctx.currentIndex, -1);
      assert.equal(ctx.showPageIndicators, true);
      assert.equal(ctx.showPageControls, false);
      assert.equal(ctx.slideFadeInSpeed, 500);
      assert.equal(ctx.slideFadeOutSpeed, 300);
      assert.deepEqual(ctx.timings, {0: 8000});
    });

    it("should build context for global mode without slides", () => {
      instance.config.mode = "global";
      const modules = [{name: "calendar"}];
      const ctx = instance.buildModulesContext(modules);

      assert.equal(ctx.modules, modules);
      assert.equal(ctx.slides, null);
    });
  });

  describe("scheduleNextTransition", () => {
    beforeEach(() => {
      instance.isManualMode = false;
      instance.config.mode = "slides";
      instance.config.transitionInterval = 10000;
      instance.config.timings = {};
      instance.manualTransition = mock.fn();
    });

    it("should not schedule in manual mode", () => {
      instance.isManualMode = true;
      instance.transitionTimer = null;
      instance.scheduleNextTransition(0);
      assert.equal(instance.transitionTimer, null);
    });

    it("should clear existing timer before scheduling", () => {
      instance.transitionTimer = {id: 999};
      instance.scheduleNextTransition(0);
      // Timer should be cleared and rescheduled
      assert.notEqual(instance.transitionTimer, null);
      assert.notEqual(instance.transitionTimer.id, 999);
    });

    it("should use individual slide timing when available", () => {
      instance.config.timings = {2: 5000};
      instance.getSlideTimer = mock.fn(() => 5000);
      instance.scheduleNextTransition(2);
      assert.equal(instance.getSlideTimer.mock.calls[0].arguments[0], 2);
    });

    it("should use transitionInterval when no individual timing", () => {
      instance.config.timings = {}; // Empty timings object
      instance.config.transitionInterval = 12000;
      instance.getSlideTimer = mock.fn(() => 12000);
      instance.scheduleNextTransition(0);
      // When timings is empty, getSlideTimer is NOT called - uses transitionInterval directly
      assert.equal(instance.getSlideTimer.mock.calls.length, 0);
      assert.notEqual(instance.transitionTimer, null);
    });
  });

  describe("notificationReceived", () => {
    beforeEach(() => {
      instance.manualTransition = mock.fn();
      instance.restartTimer = mock.fn();
      instance.toggleTimer = mock.fn();
      instance.handleToggleAutoMode = mock.fn();
      instance.handleCarouselGoto = mock.fn();
      instance.initializeModule = mock.fn();
      instance.keyHandler = null;
    });

    it("should initialize module on MODULE_DOM_CREATED", () => {
      instance.notificationReceived("MODULE_DOM_CREATED", {}, {});
      assert.equal(instance.initializeModule.mock.calls.length, 1);
    });

    it("should handle CAROUSEL_NEXT notification", () => {
      instance.notificationReceived("CAROUSEL_NEXT", {}, {});
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], null);
      assert.equal(args[1], 1);
      assert.equal(instance.restartTimer.mock.calls.length, 1);
    });

    it("should handle CAROUSEL_PREVIOUS notification", () => {
      instance.notificationReceived("CAROUSEL_PREVIOUS", {}, {});
      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const args = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(args[0], null);
      assert.equal(args[1], -1);
    });

    it("should handle CAROUSEL_PLAYPAUSE notification", () => {
      instance.notificationReceived("CAROUSEL_PLAYPAUSE", {}, {});
      assert.equal(instance.toggleTimer.mock.calls.length, 1);
    });

    it("should handle CAROUSEL_TOGGLE_AUTO notification", () => {
      instance.notificationReceived("CAROUSEL_TOGGLE_AUTO", {}, {});
      assert.equal(instance.handleToggleAutoMode.mock.calls.length, 1);
    });

    it("should handle CAROUSEL_GOTO notification", () => {
      const payload = {slide: "home"};
      instance.notificationReceived("CAROUSEL_GOTO", payload, {});
      assert.equal(instance.handleCarouselGoto.mock.calls.length, 1);
      assert.equal(instance.handleCarouselGoto.mock.calls[0].arguments[0], payload);
    });

    it("should ignore unknown notifications", () => {
      instance.notificationReceived("UNKNOWN_NOTIFICATION", {}, {});
      assert.equal(instance.manualTransition.mock.calls.length, 0);
    });
  });

  describe("calculateIndicatorIds", () => {
    it("should calculate all IDs for middle slide", () => {
      const ids = instance.calculateIndicatorIds(2, 5);

      assert.equal(ids.slider, "slider_2");
      assert.equal(ids.label, "sliderLabel_2");
      assert.equal(ids.nextButton, "sliderNextBtn_3");
      assert.equal(ids.prevButton, "sliderPrevBtn_1");
    });

    it("should have no prevButton for first slide", () => {
      const ids = instance.calculateIndicatorIds(0, 5);

      assert.equal(ids.slider, "slider_0");
      assert.equal(ids.label, "sliderLabel_0");
      assert.equal(ids.nextButton, "sliderNextBtn_1");
      assert.equal(ids.prevButton, null);
    });

    it("should have no nextButton for last slide", () => {
      const ids = instance.calculateIndicatorIds(4, 5);

      assert.equal(ids.slider, "slider_4");
      assert.equal(ids.label, "sliderLabel_4");
      assert.equal(ids.nextButton, null);
      assert.equal(ids.prevButton, "sliderPrevBtn_3");
    });

    it("should handle single slide (both buttons null)", () => {
      const ids = instance.calculateIndicatorIds(0, 1);

      assert.equal(ids.slider, "slider_0");
      assert.equal(ids.label, "sliderLabel_0");
      assert.equal(ids.nextButton, null);
      assert.equal(ids.prevButton, null);
    });
  });

  describe("getFilteredModules", () => {
    beforeEach(() => {
      instance.config.ignoreModules = ["weather"];
      instance.config.top_left = {ignoreModules: [
        "clock",
        "weather"
      ]};
    });

    it("should filter by ignoreModules in global mode", () => {
      const allModules = [
        {name: "calendar",
          data: {position: "top_left"}},
        {name: "weather",
          data: {position: "top_left"}},
        {name: "clock",
          data: {position: "bottom_bar"}}
      ];

      global.MM.getModules = () => ({
        exceptModule () {
          return {
            filter (fn) {
              return allModules.filter(fn);
            }
          };
        }
      });

      const filtered = instance.getFilteredModules(null);

      assert.equal(filtered.length, 2);
      assert.equal(filtered[0].name, "calendar");
      assert.equal(filtered[1].name, "clock");
    });

    it("should filter by position and ignoreModules in positional mode", () => {
      const allModules = [
        {name: "calendar",
          data: {position: "top_left"}},
        {name: "weather",
          data: {position: "top_left"}},
        {name: "clock",
          data: {position: "top_left"}},
        {name: "newsfeed",
          data: {position: "bottom_bar"}}
      ];

      global.MM.getModules = () => ({
        exceptModule () {
          return {
            filter (fn) {
              return allModules.filter(fn);
            }
          };
        }
      });

      const filtered = instance.getFilteredModules("top_left");

      // Should exclude: weather (in ignoreModules), clock (in position ignoreModules), newsfeed (wrong position)
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].name, "calendar");
    });

    it("should use carouselId when available instead of module name", () => {
      const allModules = [
        {
          name: "calendar",
          data: {
            position: "top_left",
            config: {carouselId: "cal-main"}
          }
        },
        {
          name: "calendar",
          data: {
            position: "top_left",
            config: {carouselId: "cal-alt"}
          }
        }
      ];

      instance.config.ignoreModules = ["cal-alt"];

      global.MM.getModules = () => ({
        exceptModule () {
          return {
            filter (fn) {
              return allModules.filter(fn);
            }
          };
        }
      });

      const filtered = instance.getFilteredModules(null);

      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].data.config.carouselId, "cal-main");
    });

    it("should handle modules without data property", () => {
      const allModules = [
        {name: "calendar",
          data: {position: "top_left"}},
        {name: "simple-module"} // No data property
      ];

      instance.config.ignoreModules = [];

      global.MM.getModules = () => ({
        exceptModule () {
          return {
            filter (fn) {
              return allModules.filter(fn);
            }
          };
        }
      });

      const filtered = instance.getFilteredModules(null);

      assert.equal(filtered.length, 2);
    });
  });

  describe("transitionTimeoutCallback", () => {
    beforeEach(() => {
      instance.manualTransition = mock.fn();
      instance.restartTimer = mock.fn();
    });

    it("should navigate to numeric homeSlide", () => {
      instance.config.homeSlide = 3;
      instance.transitionTimeoutCallback();

      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const [
        goToIndex,
        goDirection,
        goToSlide
      ] = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(goToIndex, 3);
      assert.equal(goDirection, null);
      assert.equal(goToSlide, null);
    });

    it("should navigate to string homeSlide", () => {
      instance.config.homeSlide = "homepage";
      instance.transitionTimeoutCallback();

      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const [
        goToIndex,
        goDirection,
        goToSlide
      ] = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(goToIndex, -1);
      assert.equal(goDirection, null);
      assert.equal(goToSlide, "homepage");
    });

    it("should default to slide 0 when homeSlide is not configured", () => {
      delete instance.config.homeSlide;
      instance.transitionTimeoutCallback();

      assert.equal(instance.manualTransition.mock.calls.length, 1);
      const [goToIndex] = instance.manualTransition.mock.calls[0].arguments;
      assert.equal(goToIndex, 0);
    });

    it("should restart timer after transition", () => {
      instance.config.homeSlide = 1;
      instance.transitionTimeoutCallback();

      assert.equal(instance.restartTimer.mock.calls.length, 1);
    });
  });

  describe("scheduleNextTransition with timeout mode", () => {
    beforeEach(() => {
      instance.isManualMode = false;
      instance.config.mode = "slides";
      instance.manualTransition = mock.fn();
      instance.transitionTimeoutCallback = mock.fn();
    });

    it("should use transitionTimeout when configured and no interval", () => {
      instance.config.transitionInterval = 0;
      instance.config.transitionTimeout = 5000;
      instance.config.timings = {};

      instance.scheduleNextTransition(0);

      assert.notEqual(instance.transitionTimer, null);
      // Timer should be set for timeout mode
    });

    it("should prefer individual timings over timeout", () => {
      instance.config.transitionInterval = 0;
      instance.config.transitionTimeout = 5000;
      instance.config.timings = {0: 3000};
      instance.getSlideTimer = mock.fn(() => 3000);

      instance.scheduleNextTransition(0);

      // Should use individual timing, not timeout
      assert.equal(instance.getSlideTimer.mock.calls.length, 1);
    });

    it("should prefer transitionInterval over timeout", () => {
      instance.config.transitionInterval = 8000;
      instance.config.transitionTimeout = 5000;
      instance.config.timings = {};

      instance.scheduleNextTransition(0);

      // Should use interval, not timeout
      assert.notEqual(instance.transitionTimer, null);
    });
  });

  describe("setUpTransitionTimers", () => {
    let mockModules;
    const activeTimers = [];
    let originalSetTimeout;
    let originalSetInterval;

    beforeEach(() => {
      // Track all timers
      originalSetTimeout = global.setTimeout;
      originalSetInterval = global.setInterval;

      global.setTimeout = (...args) => {
        const id = originalSetTimeout.apply(global, args);
        activeTimers.push({id,
          type: "timeout"});
        return id;
      };

      global.setInterval = (...args) => {
        const id = originalSetInterval.apply(global, args);
        activeTimers.push({id,
          type: "interval"});
        return id;
      };

      mockModules = [
        {
          name: "mod1",
          hide: mock.fn(),
          show: mock.fn()
        },
        {
          name: "mod2",
          hide: mock.fn(),
          show: mock.fn()
        }
      ];
      instance.getFilteredModules = mock.fn(() => mockModules);
      instance.buildModulesContext = mock.fn((modules) => ({
        modules,
        slides: null,
        currentIndex: -1,
        slideFadeInSpeed: 500,
        slideFadeOutSpeed: 300
      }));
      instance.getTransitionTimer = mock.fn(() => 10000);
      instance.moduleTransition = mock.fn();
    });

    afterEach(() => {
      // Clear all timers
      for (const timer of activeTimers) {
        if (timer.type === "timeout") {
          clearTimeout(timer.id);
        } else {
          clearInterval(timer.id);
        }
      }
      activeTimers.length = 0;

      // Restore original functions
      global.setTimeout = originalSetTimeout;
      global.setInterval = originalSetInterval;
    });

    it("should set up global mode with modulesContext", () => {
      instance.setUpTransitionTimers(null);

      assert.ok(instance.modulesContext);
      assert.equal(instance.modulesContext.positionIndex, null);
      assert.equal(instance.modulesContext.transitionInterval, 10000);
    });

    it("should call initial transition in global mode", () => {
      instance.setUpTransitionTimers(null);

      assert.equal(instance.moduleTransition.mock.calls.length, 1);
    });

    it("should create manualTransition function in global mode", () => {
      instance.setUpTransitionTimers(null);

      assert.equal(typeof instance.manualTransition, "function");

      // Test that manualTransition delegates to moduleTransition
      instance.manualTransition(1, 0, "test");
      assert.equal(instance.moduleTransition.mock.calls.length, 2); // Initial + manual
      const [
        goToIndex,
        goDirection,
        goToSlide
      ] = instance.moduleTransition.mock.calls[1].arguments;
      assert.equal(goToIndex, 1);
      assert.equal(goDirection, 0);
      assert.equal(goToSlide, "test");
    });

    it("should hide all modules initially in positional mode", () => {
      instance.setUpTransitionTimers("top_left");

      assert.equal(mockModules[0].hide.mock.calls.length, 1);
      assert.equal(mockModules[1].hide.mock.calls.length, 1);
    });

    it("should show first module after fadeout in positional mode", (_testContext, done) => {
      instance.setUpTransitionTimers("top_left");

      // Initially no show calls
      assert.equal(mockModules[0].show.mock.calls.length, 0);

      setTimeout(() => {
        // After fadeout, first module should be shown
        assert.equal(mockModules[0].show.mock.calls.length, 1);
        done();
      }, 350); // Wait for fadeout (300ms) + buffer
    });

    it("should call getFilteredModules with correct position", () => {
      instance.setUpTransitionTimers("bottom_bar");

      assert.equal(instance.getFilteredModules.mock.calls.length, 1);
      assert.equal(instance.getFilteredModules.mock.calls[0].arguments[0], "bottom_bar");
    });

    it("should call getTransitionTimer with correct position", () => {
      instance.setUpTransitionTimers("top_right");

      assert.equal(instance.getTransitionTimer.mock.calls.length, 1);
      assert.equal(instance.getTransitionTimer.mock.calls[0].arguments[0], "top_right");
    });
  });
});

describe("MMM-Carousel Transition Logic", () => {
  let instance;

  beforeEach(() => {
    instance = Object.create(moduleDefinition);
    instance.config = {
      mode: "slides",
      timings: {},
      transitionInterval: 10000,
      homeSlide: 0
    };
    Log.warn.mock.resetCalls();
  });

  describe("showModulesForSlide", () => {
    it("should show only matching modules in slides mode", () => {
      const mod1 = {
        name: "calendar",
        show: mock.fn(),
        hide: mock.fn()
      };
      const mod2 = {
        name: "weather",
        show: mock.fn(),
        hide: mock.fn()
      };
      const mod3 = {
        name: "clock",
        show: mock.fn(),
        hide: mock.fn()
      };

      const ctx = {
        modules: [
          mod1,
          mod2,
          mod3
        ],
        slides: {
          page1: [
            "calendar",
            "clock"
          ],
          page2: ["weather"]
        },
        currentIndex: 0,
        slideFadeInSpeed: 500
      };

      instance.applyModuleStyles = mock.fn();
      instance.selectWrapper = mock.fn();
      instance.showModulesForSlide(ctx);

      // Page1: calendar and clock should show, weather should hide
      assert.equal(mod1.show.mock.calls.length, 1);
      assert.equal(mod1.show.mock.calls[0].arguments[0], 500);
      assert.equal(mod2.hide.mock.calls.length, 1);
      assert.equal(mod3.show.mock.calls.length, 1);
    });

    it("should show only current index module in global mode", () => {
      const mod1 = {
        name: "calendar",
        show: mock.fn(),
        hide: mock.fn()
      };
      const mod2 = {
        name: "weather",
        show: mock.fn(),
        hide: mock.fn()
      };

      const ctx = {
        modules: [
          mod1,
          mod2
        ],
        slides: null,
        currentIndex: 1,
        slideFadeInSpeed: 300
      };

      instance.showModulesForSlide(ctx);

      // Only mod2 (index 1) should show
      assert.equal(mod1.hide.mock.calls.length, 1);
      assert.equal(mod2.show.mock.calls.length, 1);
      assert.equal(mod2.show.mock.calls[0].arguments[0], 300);
    });

    it("should apply module styles when showing in slides mode", () => {
      const mod1 = {
        name: "calendar",
        show: mock.fn(),
        hide: mock.fn()
      };

      const ctx = {
        modules: [mod1],
        slides: {
          page1: [
            {name: "calendar",
              classes: "custom-class"}
          ]
        },
        currentIndex: 0,
        slideFadeInSpeed: 500
      };

      instance.applyModuleStyles = mock.fn();
      instance.selectWrapper = mock.fn();
      instance.showModulesForSlide(ctx);

      assert.equal(instance.applyModuleStyles.mock.calls.length, 1);
      const args = instance.applyModuleStyles.mock.calls[0].arguments;
      assert.equal(args[0], mod1);
      assert.deepEqual(args[1], {name: "calendar",
        classes: "custom-class"});
    });
  });

  describe("moduleTransition", () => {
    const activeTimers = [];
    let originalSetTimeout;
    let originalSetInterval;

    beforeEach(() => {
      // Track all timers
      originalSetTimeout = global.setTimeout;
      originalSetInterval = global.setInterval;

      global.setTimeout = (...args) => {
        const id = originalSetTimeout.apply(global, args);
        activeTimers.push({id,
          type: "timeout"});
        return id;
      };

      global.setInterval = (...args) => {
        const id = originalSetInterval.apply(global, args);
        activeTimers.push({id,
          type: "interval"});
        return id;
      };

      instance.modulesContext = {
        modules: [
          {
            name: "mod1",
            hide: mock.fn()
          },
          {
            name: "mod2",
            hide: mock.fn()
          }
        ],
        slides: null,
        currentIndex: 0,
        slideFadeOutSpeed: 200,
        slideFadeInSpeed: 300
      };
      instance.sendNotification = mock.fn();
      instance.showModulesForSlide = mock.fn();
      instance.scheduleNextTransition = mock.fn();
      instance.updateSlideIndicators = mock.fn();
      instance.isManualMode = false;
    });

    afterEach(() => {
      // Clear all timers
      for (const timer of activeTimers) {
        if (timer.type === "timeout") {
          clearTimeout(timer.id);
        } else {
          clearInterval(timer.id);
        }
      }
      activeTimers.length = 0;

      // Restore original functions
      global.setTimeout = originalSetTimeout;
      global.setInterval = originalSetInterval;
    });

    it("should calculate next index and update context", () => {
      instance.moduleTransition(null, 1);

      assert.equal(instance.modulesContext.currentIndex, 1);
    });

    it("should send CAROUSEL_CHANGED notification", () => {
      instance.moduleTransition(null, 1);

      assert.equal(instance.sendNotification.mock.calls.length, 1);
      const [
        notificationType,
        payload
      ] = instance.sendNotification.mock.calls[0].arguments;
      assert.equal(notificationType, "CAROUSEL_CHANGED");
      assert.equal(payload.slide, 1);
    });

    it("should hide all modules immediately", () => {
      instance.moduleTransition(null, 1);

      assert.equal(instance.modulesContext.modules[0].hide.mock.calls.length, 1);
      assert.equal(instance.modulesContext.modules[1].hide.mock.calls.length, 1);
      assert.equal(instance.modulesContext.modules[0].hide.mock.calls[0].arguments[0], 200);
    });

    it("should call showModulesForSlide after fadeout delay", (_testContext, done) => {
      instance.moduleTransition(null, 1);

      // ShowModulesForSlide should not be called immediately
      assert.equal(instance.showModulesForSlide.mock.calls.length, 0);

      // But should be called after fadeout
      setTimeout(() => {
        assert.equal(instance.showModulesForSlide.mock.calls.length, 1);
        assert.equal(instance.showModulesForSlide.mock.calls[0].arguments[0], instance.modulesContext);
        done();
      }, 250);
    });

    it("should schedule next transition in automatic mode", (_testContext, done) => {
      instance.isManualMode = false;
      instance.moduleTransition(null, 1);

      setTimeout(() => {
        assert.equal(instance.scheduleNextTransition.mock.calls.length, 1);
        assert.equal(instance.scheduleNextTransition.mock.calls[0].arguments[0], 1);
        done();
      }, 250);
    });

    it("should not schedule next transition in manual mode", (_testContext, done) => {
      instance.isManualMode = true;
      instance.moduleTransition(null, 1);

      setTimeout(() => {
        assert.equal(instance.scheduleNextTransition.mock.calls.length, 0);
        done();
      }, 250);
    });

    it("should update slide indicators", () => {
      instance.modulesContext.slides = {page1: [],
        page2: []};
      instance.moduleTransition(null, 1);

      assert.equal(instance.updateSlideIndicators.mock.calls.length, 1);
      assert.equal(instance.updateSlideIndicators.mock.calls[0].arguments[0], instance.modulesContext);
      assert.equal(instance.updateSlideIndicators.mock.calls[0].arguments[1], 2);
    });

    it("should not transition when noChange is true", () => {
      instance.modulesContext.currentIndex = 1;
      instance.moduleTransition(1, 0); // Try to go to same index

      // CurrentIndex should not change
      assert.equal(instance.modulesContext.currentIndex, 1);
      // No notification should be sent
      assert.equal(instance.sendNotification.mock.calls.length, 0);
    });
  });

  // Force exit after this describe block to prevent hanging
  after(() => {
    setImmediate(() => {
      process.exit(0);
    });
  });
});
