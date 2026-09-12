/* global Module Log MM KeyHandler */

Module.register("MMM-Carousel", {
  defaults: {
    transitionInterval: 10000,
    slideFadeInSpeed: 1000,
    slideFadeOutSpeed: 1000,
    ignoreModules: [],
    mode: "global", // global || positional || slides
    top_bar: {
      enabled: false,
      ignoreModules: []
    },
    top_left: {
      enabled: false,
      ignoreModules: []
    },
    top_center: {
      enabled: false,
      ignoreModules: []
    },
    top_right: {
      enabled: false,
      ignoreModules: []
    },
    upper_third: {
      enabled: false,
      ignoreModules: []
    },
    middle_center: {
      enabled: false,
      ignoreModules: []
    },
    lower_third: {
      enabled: false,
      ignoreModules: []
    },
    bottom_left: {
      enabled: false,
      ignoreModules: []
    },
    bottom_center: {
      enabled: false,
      ignoreModules: []
    },
    bottom_right: {
      enabled: false,
      ignoreModules: []
    },
    bottom_bar: {
      enabled: false,
      ignoreModules: []
    },
    fullscreen_above: {
      enabled: false,
      ignoreModules: []
    },
    fullscreen_below: {
      enabled: false,
      ignoreModules: []
    },
    slides: [[]],
    showPageIndicators: true,
    showPageControls: true,
    // Individual slide timings configuration
    timings: {},
    enableKeyboardControl: false,
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
    this.isManualMode = false;
    this.positionTimers = {};
  },

  validKeyPress (kp) {
    // KeyBindings navigation only works in global/slides mode
    if (this.config.mode === "positional") {
      Log.warn("[MMM-Carousel] Keyboard navigation via MMM-KeyBindings is not supported in positional mode.");
      return;
    }

    if (!this.manualTransition) {
      Log.warn("[MMM-Carousel] manualTransition not available yet");
      return;
    }

    if (kp.keyName === this.keyHandler.config.map.NextSlide) {
      this.manualTransition(null, 1);
      this.restartTimer();
    } else if (kp.keyName === this.keyHandler.config.map.PrevSlide) {
      this.manualTransition(null, -1);
      this.restartTimer();
    } else if (kp.keyName === this.keyHandler.config.map.Pause) {
      this.toggleTimer();
    } else if (this.keyHandler.reverseMap[kp.keyName].startsWith("Slide")) {
      const slideNumberStr = this.keyHandler.reverseMap[kp.keyName].slice(5);
      const slideNumber = parseInt(slideNumberStr, 10);
      if (Number.isFinite(slideNumber)) {
        this.manualTransition(slideNumber);
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
   * Get the maximum slide/module index for keyboard navigation
   * @returns {number} Maximum valid index
   */
  getMaxSlideIndex () {
    if (!this.modulesContext) {
      return 0;
    }

    if (this.modulesContext.slides) {
      return Object.keys(this.modulesContext.slides).length;
    }

    if (this.modulesContext.modules) {
      return this.modulesContext.modules.length;
    }

    return 0;
  },

  /**
   * Handle keyboard events for carousel navigation
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyboardEvent (event) {
    // Ignore if user is typing in an input field
    const {target} = event;
    if (target && (target.isContentEditable || [
      "INPUT",
      "TEXTAREA",
      "SELECT"
    ].includes(target.tagName))) {
      return;
    }

    let handled = false;

    switch (event.key) {
      case "ArrowRight": // Next slide
        this.manualTransition(null, 1);
        this.restartTimer();
        handled = true;
        break;
      case "ArrowLeft": // Previous slide
        this.manualTransition(null, -1);
        this.restartTimer();
        handled = true;
        break;
      case "ArrowDown": // Pause/play toggle
        this.toggleTimer();
        handled = true;
        break;
      case "Home": // Key "Home" goes to home slide (index 0)
      case "0": // Key "0" also goes to home slide (index 0)
        this.manualTransition(this.config.homeSlide);
        this.restartTimer();
        handled = true;
        break;
      default:
        /*
         * Check for number keys (1-9) to jump to specific slides
         * Key "1" goes to first slide (index 0), "2" to second slide (index 1), etc.
         */
        if (event.key >= "1" && event.key <= "9") {
          const slideNumber = parseInt(event.key, 10) - 1; // Convert to 0-based index
          const maxIndex = this.getMaxSlideIndex();
          // Only navigate if slide exists
          if (slideNumber < maxIndex) {
            this.manualTransition(slideNumber);
            this.restartTimer();
            handled = true;
          }
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  },

  /**
   * Set up native keyboard control (without MMM-KeyBindings)
   */
  setupNativeKeyboardHandler () {
    if (!this.config.enableKeyboardControl) {
      return;
    }

    // Keyboard control only works in global and slides mode
    if (this.config.mode === "positional") {
      Log.warn("[MMM-Carousel] Native keyboard control is not supported in positional mode. Use global or slides mode instead.");
      return;
    }

    // Avoid duplicate registration
    if (this.keyboardHandler) {
      return;
    }

    Log.info("[MMM-Carousel] Setting up native keyboard control");

    this.keyboardHandler = (event) => {
      this.handleKeyboardEvent(event);
    };

    document.addEventListener("keydown", this.keyboardHandler, true);
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

    // Setup native keyboard handler after manualTransition is defined
    this.setupNativeKeyboardHandler();

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
        this.manualTransition(null, 1);
        this.restartTimer();
        break;
      case "CAROUSEL_PREVIOUS":
        this.manualTransition(null, -1);
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
        this.transitionTimer = null;
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
      const index = Number(payload) - 1;
      if (!Number.isInteger(index) || index < 0) {
        Log.error(`Invalid slide index: ${payload}`);
        return;
      }
      this.manualTransition(index);
      this.restartTimer();
    } else if (payload && payload.slide) {
      this.manualTransition(null, 0, payload.slide);
      this.restartTimer();
    }
  },

  /**
   * Set up transition timers for carousel slides
   * Initializes the modules array with configuration and starts automatic transitions
   * @param {string|null} positionIndex - Position name (e.g., 'top_bar') for positional mode, or null for global/slides mode
   */
  /**
   * Get filtered modules for carousel based on position
   * @param {string|null} positionIndex - The position to filter modules for, or null for all positions
   * @returns {Array} Filtered array of MagicMirror modules
   */
  getFilteredModules (positionIndex) {
    return MM.getModules()
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
  },

  /**
   * Determine the transition timer interval
   * @param {string|null} positionIndex - The position index to check for override
   * @returns {number} Timer interval in milliseconds
   */
  getTransitionTimer (positionIndex) {
    let timer = this.config.transitionInterval;

    if (positionIndex !== null) {
      if (
        "overrideTransitionInterval" in this.config[positionIndex] &&
        this.config[positionIndex].overrideTransitionInterval > 0
      ) {
        timer = this.config[positionIndex].overrideTransitionInterval;
      }
    }

    return timer;
  },

  /**
   * Build modules context object with configuration
   * @param {Array} modules - Filtered modules array
   * @returns {object} Context object with modules and carousel configuration
   */
  buildModulesContext (modules) {
    const {mode, slides: configSlides} = this.config;
    let slides = null;
    if (mode === "slides") {
      slides = configSlides;
    }

    return {
      modules,
      slides,
      currentIndex: -1,
      showPageIndicators: this.config.showPageIndicators,
      showPageControls: this.config.showPageControls,
      slideFadeInSpeed: this.config.slideFadeInSpeed,
      slideFadeOutSpeed: this.config.slideFadeOutSpeed,
      timings: this.config.timings
    };
  },

  /**
   * Set up transition timers for carousel slides
   * Initializes the modules context and starts automatic transitions
   * @param {string|null} positionIndex - Position name (e.g., 'top_bar') for positional mode, or null for global/slides mode
   */
  setUpTransitionTimers (positionIndex) {
    this.positionTimers ??= {};

    const modules = this.getFilteredModules(positionIndex);
    const ctx = this.buildModulesContext(modules);
    ctx.positionIndex = positionIndex;
    ctx.transitionInterval = this.getTransitionTimer(positionIndex);

    if (positionIndex === null) {
      // Global/slides mode: single context
      this.modulesContext = ctx;

      // Initial transition
      this.moduleTransition();

      // Create bound function for manual/timed transitions
      this.manualTransition = (goToIndex, goDirection, goToSlide) => {
        this.moduleTransition(goToIndex, goDirection, goToSlide);
      };
    } else {
      /*
       * Positional mode: use closure to capture ctx for this position
       * Each position gets its own timer with its own context
       */
      const transitionFn = async () => {
        const moduleCount = ctx.modules.length;
        ctx.currentIndex = (ctx.currentIndex + 1) % moduleCount;

        Log.debug(`[MMM-Carousel] Position ${positionIndex}: transitioning to index ${ctx.currentIndex}`);

        // Hide all, then show current
        for (const mod of ctx.modules) {
          mod.hide(ctx.slideFadeOutSpeed, false, {lockString: "mmmc"});
        }
        if (ctx.slideFadeOutSpeed > 0) {
          await this.delay(ctx.slideFadeOutSpeed);
        }
        ctx.modules[ctx.currentIndex].show(ctx.slideFadeInSpeed, false, {lockString: "mmmc"});
      };

      // Clear any previously running timer for this position to avoid leaking intervals
      if (this.positionTimers[positionIndex]) {
        clearInterval(this.positionTimers[positionIndex]);
        this.positionTimers[positionIndex] = null;
      }

      // Initial transition
      transitionFn();

      // Start interval timer (captured in closure)
      if (ctx.transitionInterval > 0) {
        this.positionTimers[positionIndex] = setInterval(transitionFn, ctx.transitionInterval);
      }
    }
  },

  /**
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

  /**
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
        typeof module.data?.config?.carouselId === "undefined" ||
        slideConfig.carouselId === module.data?.config?.carouselId) {
        return true;
      }
    }

    return false;
  },

  /**
   * Apply CSS classes and position changes to a module
   * @param {object} module - The MagicMirror module instance to style
   * @param {object} slideConfig - Slide configuration object with optional classes and position properties
   * @param {(position: string) => HTMLElement} selectWrapper - Function to select the target position wrapper DOM element
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

  /**
   * Calculate element IDs for slide indicators and controls
   * @param {number} currentIndex - Current slide index
   * @param {number} maxIndex - Maximum slide index
   * @returns {object} Object with calculated element IDs
   */
  calculateIndicatorIds (currentIndex, maxIndex) {
    const ids = {
      slider: `slider_${currentIndex}`,
      label: `sliderLabel_${currentIndex}`,
      nextButton: null,
      prevButton: null
    };

    // Next button available if not on last slide
    if (currentIndex < maxIndex - 1) {
      ids.nextButton = `sliderNextBtn_${currentIndex + 1}`;
    }

    // Previous button available if not on first slide
    if (currentIndex > 0) {
      ids.prevButton = `sliderPrevBtn_${currentIndex - 1}`;
    }

    return ids;
  },

  /**
   * Update slide indicators and controls in the DOM
   * @param {object} modulesContext - Modules context with current index and configuration
   * @param {number} resetCurrentIndex - Total number of slides
   */
  updateSlideIndicators (modulesContext, resetCurrentIndex) {
    // Early return if slides don't exist
    if (!modulesContext.slides) {
      return;
    }

    // Early return if neither page indicators nor page controls should be shown
    if (!modulesContext.showPageIndicators && !modulesContext.showPageControls) {
      return;
    }

    const ids = this.calculateIndicatorIds(modulesContext.currentIndex, resetCurrentIndex);

    const slider = document.getElementById(ids.slider);
    if (slider) {
      slider.checked = true;
    } else {
      Log.warn(`[MMM-Carousel] Missing slider input for index ${modulesContext.currentIndex}`);
    }

    if (modulesContext.showPageIndicators) {
      const currPages = document.getElementsByClassName("mmm-carousel-current-page");
      while (currPages.length > 0) {
        currPages[0].classList.remove("mmm-carousel-current-page");
      }

      const currentLabel = document.getElementById(ids.label);
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

      if (ids.nextButton) {
        Log.debug(`[MMM-Carousel] Trying to enable button ${ids.nextButton}`);
        const nextButton = document.getElementById(ids.nextButton);
        if (nextButton) {
          nextButton.classList.add("mmm-carousel-available");
        } else {
          Log.warn(`[MMM-Carousel] Missing next button ${ids.nextButton}`);
        }
      }

      if (ids.prevButton) {
        Log.debug(`[MMM-Carousel] Trying to enable button ${ids.prevButton}`);
        const prevButton = document.getElementById(ids.prevButton);
        if (prevButton) {
          prevButton.classList.add("mmm-carousel-available");
        } else {
          Log.warn(`[MMM-Carousel] Missing previous button ${ids.prevButton}`);
        }
      }
    }
  },

  /**
   * Select wrapper DOM element for a given position
   * @param {string} position - Position name (e.g., 'top_bar', 'bottom_left')
   * @returns {HTMLElement|false} The container element or false if not found
   */
  selectWrapper (position) {
    const classes = position.replace("_", " ");
    const parentWrapper = document.getElementsByClassName(classes);
    if (parentWrapper.length > 0) {
      const wrapper = parentWrapper[0].getElementsByClassName("container");
      if (wrapper.length > 0) {
        return wrapper[0];
      }
    }
    return false;
  },

  /**
   * Show/hide modules according to current slide configuration
   * @param {object} ctx - The modules context object
   */
  showModulesForSlide (ctx) {
    for (const module of ctx.modules) {
      Log.debug(`[MMM-Carousel] Processing ${module.name}`);

      // Slides mode: check each module against slide config
      if (ctx.slides) {
        const slideKey = Object.keys(ctx.slides)[ctx.currentIndex];
        const slideModules = ctx.slides[slideKey];
        let show = false;

        for (const slideConfig of slideModules) {
          if (this.shouldShowModuleInSlide(module, slideConfig)) {
            this.applyModuleStyles(module, slideConfig, this.selectWrapper.bind(this));
            module.show(ctx.slideFadeInSpeed, false, {lockString: "mmmc"});
            show = true;
            break;
          }
        }

        if (!show) {
          module.hide(0, false, {lockString: "mmmc"});
        }
      } else {
        // Simple mode: show only current index module
        const moduleIndex = ctx.modules.indexOf(module);
        if (moduleIndex === ctx.currentIndex) {
          module.show(ctx.slideFadeInSpeed, false, {lockString: "mmmc"});
        } else {
          module.hide(0, false, {lockString: "mmmc"});
        }
      }
    }
  },

  /**
   * Transition between carousel slides
   * @param {number} [goToIndex] - Target slide index (defaults to -1 for relative navigation)
   * @param {number} [goDirection] - Direction offset for relative navigation (defaults to 0, e.g., 1 for next, -1 for previous)
   * @param {string} [goToSlide] - Target slide name (for named slide navigation)
   */
  async moduleTransition (goToIndex, goDirection, goToSlide) {
    const ctx = this.modulesContext;

    // Set defaults for optional parameters
    const targetIndex = goToIndex ?? -1;
    const direction = goDirection ?? 0;

    let resetCurrentIndex = ctx.modules.length;
    if (ctx.slides) {
      resetCurrentIndex = Object.keys(ctx.slides).length;
    }

    // Calculate next index
    const result = this.calculateNextIndex(ctx, {
      goToIndex: targetIndex,
      goDirection: direction,
      goToSlide,
      resetCurrentIndex
    });

    if (result.noChange) {
      Log.debug("[MMM-Carousel] No change value: true");
      return;
    }

    ctx.currentIndex = result.nextIndex;

    Log.debug(`[MMM-Carousel] Transitioning to slide ${ctx.currentIndex}`);
    this.sendNotification("CAROUSEL_CHANGED", {slide: ctx.currentIndex});

    // First, hide all modules
    for (const module of ctx.modules) {
      module.hide(ctx.slideFadeOutSpeed, false, {lockString: "mmmc"});
    }

    // Update indicators
    this.updateSlideIndicators(ctx, resetCurrentIndex);

    // Then show appropriate modules after fade out
    if (ctx.slideFadeOutSpeed > 0) {
      await this.delay(ctx.slideFadeOutSpeed);
    }
    this.showModulesForSlide(ctx);

    // Schedule next transition after modules are shown (only in automatic mode)
    if (!this.isManualMode) {
      this.scheduleNextTransition(ctx.currentIndex);
    }
  },

  /**
   * Resolve after the given number of milliseconds
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>} Promise that resolves after the delay
   */
  delay (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },

  updatePause (paused) {
    this.paused = paused;

    const carousel = document.querySelector(".mmm-carousel-container");

    if (carousel) {
      if (this.paused) carousel.classList.add("mmm-carousel-paused");
      else carousel.classList.remove("mmm-carousel-paused");
    }
  },

  restartTimer () {
    // Don't restart timer in manual mode
    if (this.isManualMode) {
      return;
    }

    this.updatePause(false);

    /*
     * Positional mode uses setInterval which auto-restarts
     * Only global/slides mode needs manual restart
     */
    if (this.config.mode === "positional") {
      return;
    }

    // Get current index from context
    const currentIndex = this.modulesContext?.currentIndex || 0;
    this.scheduleNextTransition(currentIndex);
  },

  toggleTimer () {
    // Don't toggle timer while manual mode is active
    if (this.isManualMode) {
      return;
    }

    // Positional mode uses setInterval - pause/play not supported
    if (this.config.mode === "positional") {
      return;
    }

    // Check if a timer exists and toggle it
    if (this.transitionTimer) {
      // Timer is running - pause it
      this.updatePause(true);
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    } else {
      // Timer is paused - restart it
      this.updatePause(false);
      this.restartTimer();
    }
  },

  /**
   * Handle timeout callback to return to home slide
   * This is called when the transitionTimeout expires after manual navigation.
   */
  transitionTimeoutCallback () {
    let goToIndex = -1;
    let goToSlide = null;
    if (typeof this.config.homeSlide === "number") {
      goToIndex = this.config.homeSlide;
    } else if (typeof this.config.homeSlide === "string") {
      goToSlide = this.config.homeSlide;
    } else {
      goToIndex = 0;
    }
    this.manualTransition(goToIndex, null, goToSlide);
    this.restartTimer();
  },

  manualTransitionCallback (slideNum) {
    Log.debug(`manualTransition was called by slider_${slideNum}`);

    // Perform the manual transition
    this.manualTransition(slideNum);
    this.restartTimer();
  },

  /**
   * Schedule the next transition based on configuration
   * @param {number} [currentSlideIndex] - Current slide index (for individual timings)
   */
  scheduleNextTransition (currentSlideIndex) {
    // Clear existing timer
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    // Don't schedule if in manual mode
    if (this.isManualMode) {
      return;
    }

    // Determine the delay for next transition
    let delay = 0;

    if (this.config.mode === "slides" && Object.keys(this.config.timings).length > 0) {
      // Individual slide timings
      delay = this.getSlideTimer(currentSlideIndex);
    } else if (this.config.transitionInterval > 0) {
      // Standard interval mode
      delay = this.config.transitionInterval;
    } else if (this.config.transitionTimeout > 0) {
      // Timeout mode (return to home slide)
      this.transitionTimer = setTimeout(() => {
        this.transitionTimeoutCallback();
      }, this.config.transitionTimeout);
      return;
    }

    // Schedule next transition
    if (delay > 0) {
      this.transitionTimer = setTimeout(() => {
        this.manualTransition();
      }, delay);
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

  /**
   * Creates page control elements (next/previous buttons) for the carousel.
   * @param {number} slideCount - Total number of slides in the carousel.
   * @returns {object} Object with next and previous wrapper elements.
   */
  createPageControls (slideCount) {
    const nextWrapper = document.createElement("div");
    nextWrapper.className = "next control";

    const previousWrapper = document.createElement("div");
    previousWrapper.className = "previous control";

    for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
      const isNotFirstSlide = slideIndex > 0;
      if (isNotFirstSlide) {
        const nCtrlLabelWrapper = document.createElement("label");
        nCtrlLabelWrapper.setAttribute("for", `slider_${slideIndex}`);
        nCtrlLabelWrapper.id = `sliderNextBtn_${slideIndex}`;
        const arrow = document.createElement("span");
        arrow.className = "carousel-arrow carousel-arrow-right";
        nCtrlLabelWrapper.appendChild(arrow);
        nextWrapper.appendChild(nCtrlLabelWrapper);
      }

      const isNotLastSlide = slideIndex < slideCount - 1;
      if (isNotLastSlide) {
        const pCtrlLabelWrapper = document.createElement("label");
        pCtrlLabelWrapper.setAttribute("for", `slider_${slideIndex}`);
        pCtrlLabelWrapper.id = `sliderPrevBtn_${slideIndex}`;
        const arrow = document.createElement("span");
        arrow.className = "carousel-arrow carousel-arrow-left";
        pCtrlLabelWrapper.appendChild(arrow);
        previousWrapper.appendChild(pCtrlLabelWrapper);
      }
    }

    return {
      nextWrapper,
      previousWrapper
    };
  },

  /**
   * Generate the DOM which needs to be displayed.
   * This method is called by the MagicMirror² core and needs to be subclassed
   * if the module wants to display info on the mirror.
   * @returns {HTMLElement} The DOM element to display
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

      const slideCount = Object.keys(this.config.slides).length;

      for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "slider";
        input.id = `slider_${slideIndex}`;
        input.className = "slide-radio";
        input.onchange = this.makeOnChangeHandler(slideIndex);
        paginationWrapper.appendChild(input);
      }

      if (this.config.showPageIndicators) {
        for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
          const label = document.createElement("label");
          label.setAttribute("for", `slider_${slideIndex}`);
          label.id = `sliderLabel_${slideIndex}`;
          paginationWrapper.appendChild(label);
        }
      }

      div.appendChild(paginationWrapper);

      if (this.config.showPageControls) {
        const {
          nextWrapper,
          previousWrapper
        } = this.createPageControls(slideCount);

        div.appendChild(nextWrapper);
        div.appendChild(previousWrapper);
      }
    }
    return div;
  }
});
