/* global Module Log MM KeyHandler */

let globalThis;

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
    globalThis = this;
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

  notificationReceived (notification, payload, sender) {
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
    if (notification === "MODULE_DOM_CREATED") {
      // Register Key Handler
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
            this.validKeyPress(kp); // Your Key Press Function
          }
        });
        this.keyHandler = KeyHandler.create(this.name, this.keyBindings);
      }

      /*
       * Initially, all modules are hidden except the first and any ignored modules
       * We start by getting a list of all of the modules in the transition cycle
       */
      if (this.config.mode === "global" || this.config.mode === "slides") {
        this.setUpTransitionTimers(null);
      } else {
        for (const position of positions) {
          if (this.config[position].enabled) {
            this.setUpTransitionTimers(position);
          }
        }
      }

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
          }
        }
      };
      if (this.config.mode === "slides") {
        Object.keys(this.config.slides).forEach((s) => {
          api.actions[s.replace(/\s/gu, "").toLowerCase()] = {
            notification: "CAROUSEL_GOTO",
            payload: {slide: s},
            prettyName: `Go To Slide ${s}`
          };
        });
      }
      this.sendNotification("REGISTER_API", api);
    }

    if (this.keyHandler && this.keyHandler.validate(notification, payload)) {
      return;
    }

    if (notification === "KEYPRESS") Log.debug(`[MMM-Carousel] notification ${notification} from ${sender.name}`);

    if (notification === "CAROUSEL_NEXT") {
      this.manualTransition(undefined, 1);
      this.restartTimer();
    } else if (notification === "CAROUSEL_PREVIOUS") {
      this.manualTransition(undefined, -1);
    } else if (notification === "CAROUSEL_PLAYPAUSE") {
      this.toggleTimer();
      this.restartTimer();
    } else if (notification === "CAROUSEL_GOTO") {
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
    }
  },

  setUpTransitionTimers (positionIndex) {
    let timer = this.config.transitionInterval;
    const modules = MM.getModules()
      .exceptModule(this)
      .filter((module) => {
        if (positionIndex === null) {
          return this.config.ignoreModules.indexOf(module.name) === -1;
        }
        return (
          this.config[positionIndex].ignoreModules.indexOf(module.name) ===
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

  moduleTransition (goToIndex = -1, goDirection = 0, goToSlide = undefined) {
    let noChange = false;
    let resetCurrentIndex = this.length;
    if (this.slides !== undefined) {
      resetCurrentIndex = Object.keys(this.slides).length;
    }

    // Update the current index
    if (goToSlide) {
      Log.log(`[MMM-Carousel] In goToSlide, current slide index${this.currentIndex}`);
      Object.keys(this.slides).find((s, j) => {
        if (goToSlide === s) {
          if (j === this.currentIndex) {
            Log.log("[MMM-Carousel] No change, requested slide is the same.");
            noChange = true;
          } else {
            this.currentIndex = j;
          }
          return true;
        }
        return false;
      });
    } else if (goToIndex === -1) {
      // Go to a specific slide?
      if (goDirection === 0) {
        this.currentIndex += 1; // Normal Transition, Increment by 1
      } else {
        Log.debug(`[MMM-Carousel] Currently on slide ${this.currentIndex} and going to slide ${this.currentIndex + goDirection}`);
        this.currentIndex += goDirection; // Told to go a specific direction
      }
      if (this.currentIndex >= resetCurrentIndex) {
        // Wrap-around back to beginning
        this.currentIndex = 0;
      } else if (this.currentIndex < 0) {
        this.currentIndex = resetCurrentIndex - 1; // Went too far backwards, wrap-around to end
      }
    } else if (goToIndex >= 0 && goToIndex < resetCurrentIndex) {
      if (goToIndex === this.currentIndex) {
        Log.debug("[MMM-Carousel] No change, requested slide is the same.");
        noChange = true;
      } else {
        this.currentIndex = goToIndex; // Go to a specific slide if in range
      }
    }

    // Some modules like MMM-RTSPStream get into an odd state if you enable them when already enabled
    Log.debug(`[MMM-Carousel] No change value: ${noChange}`);
    if (noChange === true) {
      return;
    }

    Log.debug(`[MMM-Carousel] Transitioning to slide ${this.currentIndex}`);
    globalThis.sendNotification("CAROUSEL_CHANGED", {slide: this.currentIndex});

    // Schedule next slide transition with individual timing
    if (this.slides !== undefined && Object.keys(this.timings).length > 0) {
      globalThis.scheduleNextTransition(this.currentIndex);
    }

    /*
     * selectWrapper(position)
     * Select the wrapper dom object for a specific position.
     *
     * argument position string - The name of the position.
     */
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

    // First, hide all modules before showing the new ones
    for (let i = 0; i < this.length; i += 1) {
      this[i].hide(this.slideFadeOutSpeed, false, {lockString: "mmmc"}); // Hide all modules
    }

    setTimeout(() => {
      for (let i = 0; i < this.length; i += 1) {
        /*
         * There is currently no easy way to discover whether a module is ALREADY shown/hidden
         * In testing, calling show/hide twice seems to cause no issues
         */
        Log.debug(`[MMM-Carousel] Processing ${this[i].name}`);
        if (this.slides === undefined && i === this.currentIndex) {
          this[i].show(this.slideFadeInSpeed, false, {lockString: "mmmc"});
        } else if (this.slides === undefined) {
          // We aren't using slides and this module shouldn't be shown.
          this[i].hide(0, false, {lockString: "mmmc"});
        } else {
          // Handle slides
          const mods = this.slides[Object.keys(this.slides)[this.currentIndex]];
          let show = false;
          // Loop through all of the modules that are supposed to be in this slide
          for (let s = 0; s < mods.length; s += 1) {
            if (typeof mods[s] === "string" && mods[s] === this[i].name) {
            // If only the module name is given as a string, and it matches, show the module
              this[i].show(this.slideFadeInSpeed, false, {
                lockString: "mmmc"
              });
              show = true;
            } else if (
              typeof mods[s] === "object" &&
              "name" in mods[s] &&
              mods[s].name === this[i].name
            ) {
            /*
             * If the slide definition has an object, and it's name matches the module continue
             * check if carouselId is set (multiple module instances) and this is not the one we should show
             */
              if (
                typeof mods[s].carouselId === "undefined" ||
                typeof this[i].data.config.carouselId === "undefined" ||
                mods[s].carouselId === this[i].data.config.carouselId
              ) {
                // This module instance should be shown
                if (typeof mods[s].classes === "string") {
                // Check if we have any classes we're supposed to add
                  const dom = document.getElementById(this[i].identifier);
                  // Remove any classes added by this module (other slides)
                  [dom.className] = dom.className.split("mmmc");
                  if (mods[s].classes) {
                  /*
                   * Check for an empty classes tag (required to remove classes added from other slides)
                   * If we have a valid class list, add the classes
                   */
                    dom.classList.add("mmmc");
                    dom.classList.add(mods[s].classes);
                  }
                }

                if (typeof mods[s].position === "string") {
                // Check if we were given a position to change, if so, move the module to the new position
                  selectWrapper(mods[s].position).appendChild(document.getElementById(this[i].identifier));
                }
                // Finally show the module
                this[i].show(this.slideFadeInSpeed, false, {
                  lockString: "mmmc"
                });
                show = true;
              }
            }
          }
          // The module is not in this slide.
          if (!show) {
            this[i].hide(0, false, {lockString: "mmmc"});
          }
        }
      }
    }, this.slideFadeOutSpeed);

    // Update the DOM if we're using it.
    if (
      this.slides !== undefined &&
      (this.showPageIndicators || this.showPageControls)
    ) {
      const slider = document.getElementById(`slider_${this.currentIndex}`);
      slider.checked = true;

      if (this.showPageIndicators) {
        const currPages = document.getElementsByClassName("mmm-carousel-current-page");
        if (currPages && currPages.length > 0) {
          for (let i = 0; i < currPages.length; i += 1) {
            currPages[i].classList.remove("mmm-carousel-current-page");
          }
        }
        document
          .getElementById(`sliderLabel_${this.currentIndex}`)
          .classList.add("mmm-carousel-current-page");
      }

      if (this.showPageControls) {
        const currBtns = document.getElementsByClassName("mmm-carousel-available");
        if (currBtns && currBtns.length > 0) {
          while (currBtns.length > 0) {
            currBtns[0].classList.remove("mmm-carousel-available");
          }
        }
        if (this.currentIndex !== resetCurrentIndex - 1) {
          Log.debug(`[MMM-Carousel] Trying to enable button sliderNextBtn_${this.currentIndex + 1}`);
          document
            .getElementById(`sliderNextBtn_${this.currentIndex + 1}`)
            .classList.add("mmm-carousel-available");
        }
        if (this.currentIndex !== 0) {
          Log.debug(`[MMM-Carousel] Trying to enable button sliderPrevBtn_${this.currentIndex - 1}`);
          document
            .getElementById(`sliderPrevBtn_${this.currentIndex - 1}`)
            .classList.add("mmm-carousel-available");
        }
      }
    }
  },

  updatePause (paused) {
    this.paused = paused;

    const carousel = document.querySelector(".mmm-carousel-container");

    if (this.paused) carousel.classList.add("mmm-carousel-paused");
    else carousel.classList.remove("mmm-carousel-paused");
  },

  restartTimer () {
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
    if (this.config.transitionInterval > 0) {
      if (this.transitionTimer) {
        this.updatePause(true);
        clearInterval(this.transitionTimer);
        this.transitionTimer = undefined;
      } else {
        this.updatePause(false);
        this.transitionTimer = setInterval(
          this.manualTransition,
          this.config.transitionInterval
        );
      }
    } else if (this.config.transitionTimeout > 0) {
      if (this.transitionTimer) {
        this.updatePause(true);
        clearTimeout(this.transitionTimer);
        this.transitionTimer = undefined;
      } else {
        this.updatePause(false);
        this.transitionTimer = setTimeout(() => {
          this.transitionTimeoutCallback();
        }, this.config.transitionTimeout);
      }
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

      for (let i = 0; i < Object.keys(this.config.slides).length; i += 1) {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "slider";
        input.id = `slider_${i}`;
        input.className = "slide-radio";
        input.onchange = this.makeOnChangeHandler(i);
        paginationWrapper.appendChild(input);
      }

      if (this.config.showPageIndicators) {
        for (let i = 0; i < Object.keys(this.config.slides).length; i += 1) {
          const label = document.createElement("label");
          label.setAttribute("for", `slider_${i}`);
          label.id = `sliderLabel_${i}`;
          paginationWrapper.appendChild(label);
        }
      }

      div.appendChild(paginationWrapper);

      if (this.config.showPageControls) {
        const nextWrapper = document.createElement("div");
        nextWrapper.className = "next control";

        const previousWrapper = document.createElement("div");
        previousWrapper.className = "previous control";

        for (let j = 0; j < Object.keys(this.config.slides).length; j += 1) {
          if (j !== 0) {
            const nCtrlLabelWrapper = document.createElement("label");
            nCtrlLabelWrapper.setAttribute("for", `slider_${j}`);
            nCtrlLabelWrapper.id = `sliderNextBtn_${j}`;
            nCtrlLabelWrapper.innerHTML =
                "<i class='fa fa-arrow-circle-right'></i>";
            nextWrapper.appendChild(nCtrlLabelWrapper);
          }

          if (j !== Object.keys(this.config.slides).length - 1) {
            const pCtrlLabelWrapper = document.createElement("label");
            pCtrlLabelWrapper.setAttribute("for", `slider_${j}`);
            pCtrlLabelWrapper.id = `sliderPrevBtn_${j}`;
            pCtrlLabelWrapper.innerHTML =
                "<i class='fa fa-arrow-circle-left'></i>";
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
