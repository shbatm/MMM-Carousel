# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.1](https://github.com/shbatm/MMM-Carousel/compare/v0.6.0...v0.6.1) ― 2025-07-15

- chore: add `husky` as a devDependency
  This is required for the `lint-staged` configuration to work properly.
- chore: update devDependencies
- docs: clarify position setting requirement in README.md
  Reported here [shbatm/MMM-Carousel#37](https://github.com/shbatm/MMM-Carousel/issues/37).
- docs: describe CAROUSEL_PLAYPAUSE notification
  Reported here [shbatm/MMM-Carousel#27](https://github.com/shbatm/MMM-Carousel/issues/27).
- fix: allow multiple instances of the same module on one slide
  This fixes [#34](https://github.com/shbatm/MMM-Carousel/issues/34) and [#36](https://github.com/shbatm/MMM-Carousel/issues/36).

## [0.6.0](https://github.com/shbatm/MMM-Carousel/compare/v0.5.7...v0.6.0) ― 2025-07-01 ― Feature Release

- feat: add individual slide timings configuration
  Checkout the new `timings` option in the [README](README.md).
- chore: add missing `type` field in to `package.json`
- chore: update devDependencies

## [0.5.7](https://github.com/shbatm/MMM-Carousel/compare/v0.5.6...v0.5.7) ― 2025-06-01 ― Maintenance Release

- chore: add `lint-staged` and `husky` to lint staged files
- chore: lint `css` and `markdown` with ESLint instead of `stylelint` and `markdownlint-cli2`
- chore: update devDependencies

## [0.5.6](https://github.com/shbatm/MMM-Carousel/compare/v0.5.5...v0.5.6) ― 2025-05-18 ― Maintenance Release

- chore: replaced `markdownlint-cli` with `markdownlint-cli2`
- chore: review ESLint config
- chore: update devDependencies
- chore: use `node --run` instead of `npm run` to run scripts

## [0.5.5](https://github.com/shbatm/MMM-Carousel/compare/v0.5.4...v0.5.5) ― 2025-05-01 ― Maintenance Release

- chore: optimize ESLint config for consistency
- chore: update devDependencies
- chore: update ESLint configuration to use new import plugin structure
- refactor: remove negated condition in method `setTimeout`
- refactor: simplify position handling in method `notificationReceived`
- refactor: update background color syntax in `MMM-Carousel.css`

## [0.5.4](https://github.com/shbatm/MMM-Carousel/compare/v0.5.3...v0.5.4) ― 2025-03-28 ― Maintenance Release

- docs: Fix MMM-Remote-Control URLs in README
- docs: Remove recipes for MMM-AssistantMk2 from README. MMM-AssistantMk2 doesn't work anymore.
- chore: Simplify stylelint config
- chore: Update devDependencies

## [0.5.3](https://github.com/shbatm/MMM-Carousel/compare/v0.5.2...v0.5.3) ― 2025-02-02 ― Maintenance Release

- Update devDependencies
- Add dates and links to CHANGELOG entries
- Order package.json in the npm standard way
- Replace eslint-plugin-import with eslint-plugin-import-x
- Simplify ESLint calls and stylistic ESLint config
- Remove unused release script
- Add link to Code of Conduct into README
- Switch node-version to lts in GitHub workflow

## [0.5.2] ― 2025-02-02 ― Maintenance Release

- Update devDependencies
- Add GitHub workflow
- Check spelling also in .github directory
- Fix typo

## [0.5.1] ― 2024-12-10 ― Maintenance Release

- chore: Add release script
- chore: Add changelog and license section to README
- chore: Add introduction notes to CHANGELOG
- chore: Update devDependencies

## [0.5.0] ― 2024-11-21

- feature: Add "CAROUSEL_CHANGED" notification
- docs: Optimize configuration examples
- chore: Optimize logging
- chore: Update devDependencies

## [0.4.1] ― 2024-04-11 ― Maintenance Release

- chore: Add spell check
- docs: Add Contributing section to README
- docs: Fix typos
- chore: Switch to stylelint flat config
- chore: Update devDependencies
- docs: Update LICENSE file

## [0.4.0] ― 2024-10-23

- Add fade-out effect (by new option `slideFadeOutSpeed`) to slides #96. Thanks to @dennisklad!
  - With this the option `slideTransitionSpeed` gets replaced by `slideFadeInSpeed`.
- Upgrade ESLint
- Update devDependencies

## [0.3.2] ― 2023-09-11

- Added Play/Pause Control (#70)

## [0.3.1] ― 2023-06-19

- Fix transitionTimeoutCallback by @btastic (#66)
- Use screenshots instead of photos (#54)
- Update devDependencies

## [0.3.0] ― 2022-02-01 ― Add option to default to home slide on timeout

- Add `homeSlide` and `transitionTimeout` to timeout and return to a home page, similar to MMM-Pages (#30)
- Merge downstream changes from @KristjanESPERANTO and others (Thanks!)

## [0.2.8] ― 2021-12-25

- Cleanup

## [0.2.7] ― 2021-05-05 ― Add fullscreen positions

- Added support for fullscreen positions.

## [0.2.6] ― 2019-01-03 ― Named Slide Support & Update for new MMM-KeyBindings

- Added support for named slides.
- Updated Key Handling for new MMM-KeyBindings methods.
- Broadcast API request to new MMM-Remote-Control API.

## [0.2.5] ― 2018-12-19 ― Added direct controls via Notification

- Added control from Module Notification (See [README](README.md#Navigation-from-other-modules)).
- Removed unnecessary and unused tests and Grunt file.

## [0.2.5-dev] ― 2018-05-09 ― Module Fix for bug in MichMich/MagicMirror#1140

- Uses 'MODULE_DOM_CREATED' notification instead of 'DOM_OBJECTS_CREATED'

## [0.2.4] ― 2017-11-29 ― Added slideTransitionSpeed Parameter per #4

- Added a parameter for slide transition speed. Default is 1500ms.

## [0.2.3] ― 2017-11-01 ― Fix for #1 ― Fix timed transition for slides

- Bug fix for Issue #1 -- Correct issue where setting transitionInterval for a "slides" configuration doesn't actually cause the slides to transition automatically.

## [0.2.2] ― 2017-06-03 ― Added support for MMM-KeyBindings Instances

- Added support for using MMM-KeyBindings control with multiple instances of the MagicMirror² open. For example, you can use a remote on the screen attached to the Raspberry Pi (SERVER) and use a keyboard on another computer with the mirror running in a browser (LOCAL) to independently change slides on the respective screens.

## [0.2.1] ― 2017-05-29 ― Multiple instances of a module

Changes:

- Added the ability to handle multiple instances of a module. To use, add a `carouselId: "uniqueString"` to each modules' `config` section:

```javascript
        {
            module: "clock",
            position: "top_left",
            config: {
                carouselId: "1",
                displayType: "both"
            }
        },
        {
            module: "clock",
            position: "top_left",
            config: {
                carouselId: 2,
            }
        },
        {
            module: 'MMM-Carousel',
            position: "bottom_bar",
            config: {
                mode: 'slides',
                slides: [
                    [   {name:'clock', classes:'zoom200', position:"top_left", carouselId: "1"} ],
                    [   {name:'clock', classes:'', position:"top_left", carouselId: 2},  ]]
            }
        },
```

## [0.2.0] ― 2027-05-22 ― Added manual-only slides and per-slide positions & classes

Changes:

- Added the ability to pass an object with detail for a module on a per slide basis. Passing a config similar to the following shows a large clock on the first slide and then a small clock and additional modules on the second.

```javascript
    mode: 'slides',
    slides: [
        [   {name:'clock', classes:'zoom200', position:"middle_center"} ],
        [   {name:'clock', classes:'', position:"top_left"},
            {name:'calendar', position:'top_left'},
            'MMM-WunderGround',
            'newsfeed'
        ]
    ]
```

- Made use of `zoom` classes introduced in [0.1.1]: using the method above, supported zooms are 070%, 080%, 090%, 125%, 150%, 175%, and 200%. Pass `classes:''` for 100%.
- Added support for indefinite slides -- set `transitionInterval: 0` for manual-transition only slides
- Added KeyPress events to go to specific slide index. (e.g. `Slide0: "Home"` in the KeyBindings would jump to the first slide when the home key is pushed). Works with any number of slides in the format `Slide#: "KeyName"` where # is the 0-based index of the slide.

## [0.1.1] ― 2017-05-20 ― Added manual transitions

Changes:

- Added manual transitions between slides
- Added optional Pagination indicators at the bottom of the screen to show what slide is currently showing.
- Added hidden next/previous page controls that show on hover in each lower corner

## [0.1.0] ― 2016-08-17 ― First public release

First public release

[0.5.2]: https://github.com/shbatm/MMM-Carousel/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/shbatm/MMM-Carousel/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/shbatm/MMM-Carousel/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/shbatm/MMM-Carousel/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/shbatm/MMM-Carousel/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/shbatm/MMM-Carousel/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/shbatm/MMM-Carousel/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.8...v0.3.0
[0.2.8]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.5-dev...v0.2.5
[0.2.5-dev]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.4...v0.2.5-dev
[0.2.4]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/shbatm/MMM-Carousel/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/shbatm/MMM-Carousel/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/shbatm/MMM-Carousel/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/shbatm/MMM-Carousel/releases/tag/v0.1.0
