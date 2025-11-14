/* global Module Log MM KeyHandler */

let carouselInstance;

Module.register("MMM-Carousel", {
  defaults: {
    transitionInterval: 10000,
    slideFadeInSpeed: 1000,
    slideFadeOutSpeed: 1000,
    ignoreModules: [],
    mode: "global", // global || positional || slides
    top_bar: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    top_left: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    top_center: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    top_right: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    upper_third: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    middle_center: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    lower_third: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    bottom_left: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    bottom_center: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    bottom_right: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    bottom_bar: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    fullscreen_above: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    fullscreen_below: {
      enabled: false,
      ignoreModules: [],
      overrideTransitionInterval: undefined
    },
    slides: [[]],
    showPageIndicators: true,
    showPageControls: true,
    // Individual slide timings configuration
    timings: {},
    // MMM-KeyBindings mapping.
    keyBindings: {
      enabled: true
    },
    transitionTimeout: 0,
    homeSlide: 0
  },

  keyBindings: {
    mode: "DEFAULT",
    map: {
      NextSlide: "ArrowRight",
      PrevSlide: "ArrowLeft",
      Pause: "ArrowDown",
      Slide0: "Home"
    }
  },

  start () {
    Log.info(`Starting module: ${this.name} with identifier: ${this.identifier}`);
    carouselInstance = this;
    this.isManualMode = false;
  },

  validKeyPress (kp) {
    if (kp.keyName === this.keyHandler.config.map.NextSlide) {
      this.manualTransition(undefined, 1);
      this.restartTimer();
    } else if (kp.keyName === this.keyHandler.config.map.PrevSlide) {
      this.manualTransition(undefined, -1);
      this.restartTimer();
    } else if (kp.keyName === this.keyHandler.config.map.Pause) {
      this.toggleTimer();
    } else if (this.keyHandler.reverseMap[kp.keyName].startsWith("Slide")) {
      const goToSlide = this.keyHandler.reverseMap[kp.keyName].match(/Slide([0-9]+)/iu);
      Log.debug(`[MMM-Carousel] ${typeof goToSlide[1]} ${goToSlide[1]}`);
      if (typeof parseInt(goToSlide[1], 10) === "number") {
        this.manualTransition(parseInt(goToSlide[1], 10));
        this.restartTimer();
      }
    }
  },

  /**
   * Set up MMM-KeyBindings integration if available
   */
  setupKeyHandler () {
    if (
      this.config.keyBindings.enabled &&
      MM.getModules().filter((kb) => kb.name === "MMM-KeyBindings").length > 0
    ) {
      this.keyBindings = {
        ...this.keyBindings,
        ...this.config.keyBindings
      };
      KeyHandler.register(this.name, {
        validKeyPress: (kp) => {
          this.validKeyPress(kp);
        }
      });
      this.keyHandler = KeyHandler.create(this.name, this.keyBindings);
    }
  },

  /**
   * Register carousel API actions for external control
   */
  registerApiActions () {
    const api = {
      module: "MMM-Carousel",
      path: "carousel",
      actions: {
        next: {
          notification: "CAROUSEL_NEXT",
          prettyName: "Next Slide"
        },
        previous: {
          notification: "CAROUSEL_PREVIOUS",
          prettyName: "Previous Slide"
        },
        playpause: {
          notification: "CAROUSEL_PLAYPAUSE",
          prettyName: "Play/Pause"
        },
        toggleauto: {
          notification: "CAROUSEL_TOGGLE_AUTO",
          prettyName: "Toggle Auto-Rotation"
        }
      }
    };

    if (this.config.mode === "slides") {
      Object.keys(this.config.slides).forEach((slideName) => {
        api.actions[slideName.replace(/\s/gu, "").toLowerCase()] = {
          notification: "CAROUSEL_GOTO",
          payload: {slide: slideName},
          prettyName: `Go To Slide ${slideName}`
        };
      });
    }

    this.sendNotification("REGISTER_API", api);
  },

  /**
   * Initialize the module after DOM creation
   * Sets up key bindings, transition timers, and registers API actions
   */
  initializeModule () {
    const positions = [
      "top_bar",
      "bottom_bar",
      "top_left",
      "bottom_left",
      "top_center",
      "bottom_center",
      "top_right",
      "bottom_right",
      "upper_third",
      "middle_center",
      "lower_third",
      "fullscreen_above",
      "fullscreen_below"
    ];

    this.setupKeyHandler();

    // Set up transition timers for all modules
    if (this.config.mode === "global" || this.config.mode === "slides") {
      this.setUpTransitionTimers(null);
    } else {
      for (const position of positions) {
        if (this.config[position].enabled) {
          this.setUpTransitionTimers(position);
        }
      }
    }

    this.registerApiActions();
  },

  notificationReceived (notification, payload, sender) {
    if (notification === "MODULE_DOM_CREATED") {
      this.initializeModule();
      return;
    }

    if (this.keyHandler && this.keyHandler.validate(notification, payload)) {
      return;
    }

    // Handle navigation notifications
    switch (notification) {
      case "KEYPRESS":
        Log.debug(`[MMM-Carousel] notification ${notification} from ${sender.name}`);
        break;
      case "CAROUSEL_NEXT":
        this.manualTransition(undefined, 1);
        this.restartTimer();
        break;
      case "CAROUSEL_PREVIOUS":
        this.manualTransition(undefined, -1);
        this.restartTimer();
        break;
      case "CAROUSEL_PLAYPAUSE":
        this.toggleTimer();
        break;
      case "CAROUSEL_TOGGLE_AUTO":
        this.handleToggleAutoMode();
        break;
      case "CAROUSEL_GOTO":
        this.handleCarouselGoto(payload);
        break;
      default:
        // Unknown notification, do nothing
        break;
    }
  },

  /**
   * Toggle between manual and automatic rotation modes
   */
  handleToggleAutoMode () {
    this.isManualMode = !this.isManualMode;
    if (this.isManualMode) {
      Log.info("[MMM-Carousel] Switched to manual mode - stopping automatic rotation");
      this.updatePause(true);
      if (this.transitionTimer) {
        clearInterval(this.transitionTimer);
        clearTimeout(this.transitionTimer);
        this.transitionTimer = undefined;
      }
    } else {
      Log.info("[MMM-Carousel] Switched to automatic mode - starting automatic rotation");
      this.updatePause(false);
      this.restartTimer();
    }
  },

  /**
   * Navigate to a specific slide by index or name
   * @param {number|string|object} payload - Slide identifier (1-indexed number, string name, or object with slide property)
   */
  handleCarouselGoto (payload) {
    if (typeof payload === "number" || typeof payload === "string") {
      try {
        this.manualTransition(parseInt(payload, 10) - 1);
        this.restartTimer();
      } catch {
        Log.error(`Could not navigate to slide ${payload}`);
      }
    } else if (typeof payload === "object") {
      try {
        this.manualTransition(undefined, 0, payload.slide);
        this.restartTimer();
      } catch {
        Log.error(`Could not navigate to slide ${payload.slide}`);
      }
    }
  },

  /**
   * Set up transition timers for carousel slides
   * Initializes the modules array with configuration and starts automatic transitions
   * @param {string|null} positionIndex - Position name (e.g., 'top_bar') for positional mode, or null for global/slides mode
   */
  setUpTransitionTimers (positionIndex) {
    let timer = this.config.transitionInterval;
    const modules = MM.getModules()
      .exceptModule(this)
      .filter((module) => {
        // Use carouselId if available, otherwise fall back to module name
        const searchName = module.data?.config?.carouselId || module.name;
        if (positionIndex === null) {
          return this.config.ignoreModules.indexOf(searchName) === -1;
        }
        return (
          this.config[positionIndex].ignoreModules.indexOf(searchName) ===
          -1 && module.data.position === positionIndex
        );
      }, this);

    if (this.config.mode === "slides") {
      modules.slides = this.config.slides;
    }

    if (positionIndex !== null) {
      if (
        this.config[positionIndex].overrideTransitionInterval !== undefined &&
        this.config[positionIndex].overrideTransitionInterval > 0
      ) {
        timer = this.config[positionIndex].overrideTransitionInterval;
      }
    }

    modules.currentIndex = -1;
    modules.showPageIndicators = this.config.showPageIndicators;
    modules.showPageControls = this.config.showPageControls;
    modules.slideFadeInSpeed = this.config.slideFadeInSpeed;
    modules.slideFadeOutSpeed = this.config.slideFadeOutSpeed;
    // Add timings configuration to modules object
    modules.timings = this.config.timings;
    modules.defaultTimer = timer;

    this.moduleTransition.call(modules);

    // Reference to function for manual transitions
    this.manualTransition = this.moduleTransition.bind(modules);

    // Check if individual timings should be used
    if (this.config.mode === "slides" && Object.keys(this.config.timings).length > 0) {
      // Use individual timings - don't set standard timer
      this.useIndividualTimings = true;
    } else if (
      this.config.mode !== "slides" ||
      this.config.mode === "slides" && timer > 0
    ) {
      /*
       * We set a timer to cause the page transitions
       * If we're in slides mode and the timer is set to 0, we only use manual transitions
       */
      this.transitionTimer = setInterval(this.manualTransition, timer);
    } else if (
      this.config.mode === "slides" &&
      timer === 0 &&
      this.config.transitionTimeout > 0
    ) {
      this.transitionTimer = setTimeout(() => {
        this.transitionTimeoutCallback();
      }, this.config.transitionTimeout);
    }
  },

  /*
   * Calculate the next slide index based on navigation parameters
   * @param {object} modulesContext - The modules array context with currentIndex and slides properties
   * @param {object} params - Navigation parameters
   * @param {number} params.goToIndex - Target slide index (-1 for relative navigation)
   * @param {number} params.goDirection - Direction offset for relative navigation (e.g., 1 for next, -1 for previous)
   * @param {string} params.goToSlide - Target slide name (for named slide navigation)
   * @param {number} params.resetCurrentIndex - Total number of slides (for wrapping)
   * @returns {object} Result object with nextIndex (number) and noChange (boolean) properties
   */
  calculateNextIndex (modulesContext, params) {
    const {
      goToIndex,
      goDirection,
      goToSlide,
      resetCurrentIndex
    } = params;
    let noChange = false;
    let nextIndex = modulesContext.currentIndex;

    if (goToSlide) {
      Log.log(`[MMM-Carousel] In goToSlide, current slide index${modulesContext.currentIndex}`);
      Object.keys(modulesContext.slides).find((slideName, slideIndex) => {
        if (goToSlide === slideName) {
          if (slideIndex === modulesContext.currentIndex) {
            Log.log("[MMM-Carousel] No change, requested slide is the same.");
            noChange = true;
          } else {
            nextIndex = slideIndex;
          }
          return true;
        }
        return false;
      });
    } else if (goToIndex === -1) {
      if (goDirection === 0) {
        nextIndex = modulesContext.currentIndex + 1;
      } else {
        Log.debug(`[MMM-Carousel] Currently on slide ${modulesContext.currentIndex} and going to slide ${modulesContext.currentIndex + goDirection}`);
        nextIndex = modulesContext.currentIndex + goDirection;
      }
      if (nextIndex >= resetCurrentIndex) {
        nextIndex = 0;
      } else if (nextIndex < 0) {
        nextIndex = resetCurrentIndex - 1;
      }
    } else if (goToIndex >= 0 && goToIndex < resetCurrentIndex) {
      if (goToIndex === modulesContext.currentIndex) {
        Log.debug("[MMM-Carousel] No change, requested slide is the same.");
        noChange = true;
      } else {
        nextIndex = goToIndex;
      }
    }

    return {
      nextIndex,
      noChange
    };
  },

  /*
   * Check if a module should be shown in the current slide
   * @param {object} module - The MagicMirror module instance to check
   * @param {string|object} slideConfig - Slide configuration (module name string or config object with name and optional carouselId)
   * @returns {boolean} True if the module should be displayed in this slide
   */
  shouldShowModuleInSlide (module, slideConfig) {
    // Simple name match
    if (typeof slideConfig === "string") {
      return slideConfig === module.name;
    }

    // Object config match
    if (typeof slideConfig === "object" && "name" in slideConfig && slideConfig.name === module.name) {
      // Check carouselId for multiple instances
      if (typeof slideConfig.carouselId === "undefined" ||
        typeof module.data.config.carouselId === "undefined" ||
        slideConfig.carouselId === module.data.config.carouselId) {
        return true;
      }
    }

    return false;
  },

  /*
   * Apply CSS classes and position changes to a module
   * @param {object} module - The MagicMirror module instance to style
   * @param {object} slideConfig - Slide configuration object with optional classes and position properties
   * @param {Function} selectWrapper - Function to select the target position wrapper DOM element
   */
  applyModuleStyles (module, slideConfig, selectWrapper) {
    if (typeof slideConfig === "object") {
      // Apply CSS classes
      if (typeof slideConfig.classes === "string") {
        const dom = document.getElementById(module.identifier);
        // Remove any classes added by this module (other slides)
        [dom.className] = dom.className.split("mmmc");
        if (slideConfig.classes) {
          dom.classList.add("mmmc");
          dom.classList.add(slideConfig.classes);
        }
      }

      // Change position if specified
      if (typeof slideConfig.position === "string") {
        const targetWrapper = selectWrapper(slideConfig.position);
        const moduleDom = document.getElementById(module.identifier);
        if (targetWrapper && moduleDom) {
          targetWrapper.appendChild(moduleDom);
        } else {
          Log.warn(`[MMM-Carousel] Unable to move module ${module.identifier} to position ${slideConfig.position}`);
        }
      }
    }
  },

  /*
   * Update slide indicators (pagination dots and navigation buttons)
   * @param {object} modulesContext - The modules array context with currentIndex, slides, showPageIndicators, and showPageControls properties
   * @param {number} resetCurrentIndex - Total number of slides (for boundary checks)
   */
  updateSlideIndicators (modulesContext, resetCurrentIndex) {
    if (modulesContext.slides === undefined || !modulesContext.showPageIndicators && !modulesContext.showPageControls) {
      return;
    }

    const slider = document.getElementById(`slider_${modulesContext.currentIndex}`);
    if (slider) {
      slider.checked = true;
    } else {
      Log.warn(`[MMM-Carousel] Missing slider input for index ${modulesContext.currentIndex}`);
    }

    if (modulesContext.showPageIndicators) {
      const currPages = document.getElementsByClassName("mmm-carousel-current-page");
      if (currPages && currPages.length > 0) {
        for (let pageIndex = 0; pageIndex < currPages.length; pageIndex += 1) {
          currPages[pageIndex].classList.remove("mmm-carousel-current-page");
        }
      }
      const currentLabel = document.getElementById(`sliderLabel_${modulesContext.currentIndex}`);
      if (currentLabel) {
        currentLabel.classList.add("mmm-carousel-current-page");
      } else {
        Log.warn(`[MMM-Carousel] Missing slider label for index ${modulesContext.currentIndex}`);
      }
    }

    if (modulesContext.showPageControls) {
      const currBtns = document.getElementsByClassName("mmm-carousel-available");
      if (currBtns && currBtns.length > 0) {
        while (currBtns.length > 0) {
          currBtns[0].classList.remove("mmm-carousel-available");
        }
      }
      if (modulesContext.currentIndex !== resetCurrentIndex - 1) {
        Log.debug(`[MMM-Carousel] Trying to enable button sliderNextBtn_${modulesContext.currentIndex + 1}`);
        const nextButton = document.getElementById(`sliderNextBtn_${modulesContext.currentIndex + 1}`);
        if (nextButton) {
          nextButton.classList.add("mmm-carousel-available");
        } else {
          Log.warn(`[MMM-Carousel] Missing next button for index ${modulesContext.currentIndex + 1}`);
        }
      }
      if (modulesContext.currentIndex !== 0) {
        Log.debug(`[MMM-Carousel] Trying to enable button sliderPrevBtn_${modulesContext.currentIndex - 1}`);
        const prevButton = document.getElementById(`sliderPrevBtn_${modulesContext.currentIndex - 1}`);
        if (prevButton) {
          prevButton.classList.add("mmm-carousel-available");
        } else {
          Log.warn(`[MMM-Carousel] Missing previous button for index ${modulesContext.currentIndex - 1}`);
        }
      }
    }
  },

  /**
   * Show/hide modules according to current slide configuration
   * @param {object} modulesContext - The modules array context
   * @param {Function} selectWrapper - Function to select position wrapper DOM element
   */
  showModulesForSlide (modulesContext, selectWrapper) {
    for (let moduleIndex = 0; moduleIndex < modulesContext.length; moduleIndex += 1) {
      Log.debug(`[MMM-Carousel] Processing ${modulesContext[moduleIndex].name}`);

      // Simple mode: show only current index
      if (modulesContext.slides === undefined) {
        if (moduleIndex === modulesContext.currentIndex) {
          modulesContext[moduleIndex].show(modulesContext.slideFadeInSpeed, false, {lockString: "mmmc"});
        } else {
          modulesContext[moduleIndex].hide(0, false, {lockString: "mmmc"});
        }
      } else {
        // Slides mode: check each module against slide config
        const mods = modulesContext.slides[Object.keys(modulesContext.slides)[modulesContext.currentIndex]];
        let show = false;

        for (let slideConfigIndex = 0; slideConfigIndex < mods.length; slideConfigIndex += 1) {
          if (carouselInstance.shouldShowModuleInSlide(modulesContext[moduleIndex], mods[slideConfigIndex])) {
            carouselInstance.applyModuleStyles(modulesContext[moduleIndex], mods[slideConfigIndex], selectWrapper);
            modulesContext[moduleIndex].show(modulesContext.slideFadeInSpeed, false, {lockString: "mmmc"});
            show = true;
            break;
          }
        }

        if (!show) {
          modulesContext[moduleIndex].hide(0, false, {lockString: "mmmc"});
        }
      }
    }
  },

  /**
   * Transition between carousel slides
   * This method is called with the modules array as context (via bind/call)
   * @param {number} [goToIndex=-1] - Target slide index (-1 for relative navigation)
   * @param {number} [goDirection=0] - Direction offset for relative navigation (e.g., 1 for next, -1 for previous)
   * @param {string} [goToSlide] - Target slide name (for named slide navigation)
   */
  moduleTransition (goToIndex = -1, goDirection = 0, goToSlide = undefined) {
    let resetCurrentIndex = this.length;
    if (this.slides !== undefined) {
      resetCurrentIndex = Object.keys(this.slides).length;
    }

    // Calculate next index
    const result = carouselInstance.calculateNextIndex(this, {
      goToIndex,
      goDirection,
      goToSlide,
      resetCurrentIndex
    });

    if (result.noChange) {
      Log.debug("[MMM-Carousel] No change value: true");
      return;
    }

    this.currentIndex = result.nextIndex;

    Log.debug(`[MMM-Carousel] Transitioning to slide ${this.currentIndex}`);
    carouselInstance.sendNotification("CAROUSEL_CHANGED", {slide: this.currentIndex});

    // Schedule next slide transition with individual timing (only in automatic mode)
    if (this.slides !== undefined && Object.keys(this.timings).length > 0 && !carouselInstance.isManualMode) {
      carouselInstance.scheduleNextTransition(this.currentIndex);
    }

    // Helper to select wrapper DOM element
    const selectWrapper = (position) => {
      const classes = position.replace("_", " ");
      const parentWrapper = document.getElementsByClassName(classes);
      if (parentWrapper.length > 0) {
        const wrapper = parentWrapper[0].getElementsByClassName("container");
        if (wrapper.length > 0) {
          return wrapper[0];
        }
      }
      return false;
    };

    // First, hide all modules
    for (let moduleIndex = 0; moduleIndex < this.length; moduleIndex += 1) {
      this[moduleIndex].hide(this.slideFadeOutSpeed, false, {lockString: "mmmc"});
    }

    // Then show appropriate modules after fade out
    setTimeout(() => {
      carouselInstance.showModulesForSlide(this, selectWrapper);
    }, this.slideFadeOutSpeed);

    // Update indicators
    carouselInstance.updateSlideIndicators(this, resetCurrentIndex);
  },

  updatePause (paused) {
    this.paused = paused;

    const carousel = document.querySelector(".mmm-carousel-container");

    if (this.paused) carousel.classList.add("mmm-carousel-paused");
    else carousel.classList.remove("mmm-carousel-paused");
  },

  restartTimer () {
    // Don't restart timer in manual mode
    if (this.isManualMode) {
      return;
    }

    if (this.config.mode === "slides" && Object.keys(this.config.timings).length > 0) {
      // Use individual slide timings
      this.updatePause(false);
      this.scheduleNextTransition(this.currentIndex || 0);
    } else if (this.config.transitionInterval > 0) {
      this.updatePause(false);
      // Restart the timer
      clearInterval(this.transitionTimer);
      this.transitionTimer = setInterval(
        this.manualTransition,
        this.config.transitionInterval
      );
    } else if (this.config.transitionTimeout > 0) {
      this.updatePause(false);
      // Restart the timeout
      clearTimeout(this.transitionTimer);
      this.transitionTimer = setTimeout(() => {
        this.transitionTimeoutCallback();
      }, this.config.transitionTimeout);
    }
  },

  toggleTimer () {
    // Don't toggle timer while manual mode is active
    if (this.isManualMode) {
      return;
    }

    // Check if a timer exists and toggle it
    if (this.transitionTimer) {
      // Timer is running - pause it
      this.updatePause(true);
      clearInterval(this.transitionTimer);
      clearTimeout(this.transitionTimer);
      this.transitionTimer = undefined;
    } else {
      // Timer is paused - restart it
      this.updatePause(false);
      this.restartTimer();
    }
  },

  /*
   * This is called when the module is loaded and the DOM is ready.
   * This is the first method called after the module has been registered.
   */
  transitionTimeoutCallback () {
    let goToIndex = -1;
    let goToSlide;
    if (typeof this.config.homeSlide === "number") {
      goToIndex = this.config.homeSlide;
    } else if (typeof this.config.homeSlide === "string") {
      goToSlide = this.config.homeSlide;
    } else {
      goToIndex = 0;
    }
    this.manualTransition(goToIndex, undefined, goToSlide);
    this.restartTimer();
  },

  manualTransitionCallback (slideNum) {
    Log.debug(`manualTransition was called by slider_${slideNum}`);

    // Perform the manual transition
    this.manualTransition(slideNum);
    this.restartTimer();
  },

  scheduleNextTransition (currentSlideIndex) {
    // Clear existing timer
    if (this.transitionTimer) {
      clearInterval(this.transitionTimer);
      clearTimeout(this.transitionTimer);
    }

    // Get the timer for the current slide
    const slideTimer = this.getSlideTimer(currentSlideIndex);

    if (slideTimer > 0) {
      this.transitionTimer = setTimeout(() => {
        this.manualTransition();
      }, slideTimer);
    }
  },

  getSlideTimer (slideIndex) {
    // Check if we have individual timing for this slide
    if (this.config.timings && typeof this.config.timings[slideIndex] === "number") {
      return this.config.timings[slideIndex];
    }

    // Fall back to transitionInterval
    return this.config.transitionInterval;
  },

  getStyles () {
    return ["MMM-Carousel.css"];
  },

  makeOnChangeHandler (id) {
    return () => {
      this.manualTransitionCallback(id);
    };
  },

  /*
   * getDom()
   * This method generates the DOM which needs to be displayed. This method is called by the MagicMirror² core.
   * This method needs to be subclassed if the module wants to display info on the mirror.
   *
   * return DOM object - The DOM to display.
   */
  getDom () {
    const div = document.createElement("div");

    if (
      this.config.mode === "slides" &&
      (this.config.showPageIndicators || this.config.showPageControls)
    ) {
      div.className = "mmm-carousel-container";

      const paginationWrapper = document.createElement("div");
      paginationWrapper.className = "slider-pagination";

      for (let slideIndex = 0; slideIndex < Object.keys(this.config.slides).length; slideIndex += 1) {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "slider";
        input.id = `slider_${slideIndex}`;
        input.className = "slide-radio";
        input.onchange = this.makeOnChangeHandler(slideIndex);
        paginationWrapper.appendChild(input);
      }

      if (this.config.showPageIndicators) {
        for (let slideIndex = 0; slideIndex < Object.keys(this.config.slides).length; slideIndex += 1) {
          const label = document.createElement("label");
          label.setAttribute("for", `slider_${slideIndex}`);
          label.id = `sliderLabel_${slideIndex}`;
          paginationWrapper.appendChild(label);
        }
      }

      div.appendChild(paginationWrapper);

      if (this.config.showPageControls) {
        const nextWrapper = document.createElement("div");
        nextWrapper.className = "next control";

        const previousWrapper = document.createElement("div");
        previousWrapper.className = "previous control";

        for (let slideIndex = 0; slideIndex < Object.keys(this.config.slides).length; slideIndex += 1) {
          if (slideIndex !== 0) {
            const nCtrlLabelWrapper = document.createElement("label");
            nCtrlLabelWrapper.setAttribute("for", `slider_${slideIndex}`);
            nCtrlLabelWrapper.id = `sliderNextBtn_${slideIndex}`;
            const arrow = document.createElement("span");
            arrow.className = "carousel-arrow carousel-arrow-right";
            nCtrlLabelWrapper.appendChild(arrow);
            nextWrapper.appendChild(nCtrlLabelWrapper);
          }

          if (slideIndex !== Object.keys(this.config.slides).length - 1) {
            const pCtrlLabelWrapper = document.createElement("label");
            pCtrlLabelWrapper.setAttribute("for", `slider_${slideIndex}`);
            pCtrlLabelWrapper.id = `sliderPrevBtn_${slideIndex}`;
            const arrow = document.createElement("span");
            arrow.className = "carousel-arrow carousel-arrow-left";
            pCtrlLabelWrapper.appendChild(arrow);
            previousWrapper.appendChild(pCtrlLabelWrapper);
          }
        }

        div.appendChild(nextWrapper);
        div.appendChild(previousWrapper);
      }
    }
    return div;
  }
});
