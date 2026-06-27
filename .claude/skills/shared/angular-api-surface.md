# Kigumi Angular API Surface

> Auto-generated from registry + custom-elements.json + Angular templates.
> Angular events use (outputName) syntax. Collision suffixes: blur->blurEvent, focus->focusEvent, show->showEvent, input->inputEvent.

## Transformation Rules

| HTML                | Angular                                      |
| ------------------- | -------------------------------------------- |
| `<wa-button>`       | `<k-button>`                                 |
| `class="..."`       | `class="..."` (no change)                    |
| `variant="primary"` | `[variant]="'brand'"`                        |
| `disabled`          | `[disabled]="true"`                          |
| `style="--wa-x: y"` | `style="--wa-x: y"` (no change)              |
| `slot="header"`     | `slot="header"` (preserved)                  |
| Event: `wa-hide`    | `(hide)="handler()"`                         |
| Event: `blur`       | `(blurEvent)="handler()"` (collision suffix) |
| Form value          | `[(ngModel)]="value"` (requires FormsModule) |

---

## Button

Actions | free | Buttons represent actions that are available to the user
wa-button -> <Button> (selector: k-button)

**Props:** variant(neutral|brand|success|warning|danger=neutral), appearance(accent|filled-outlined|filled|outlined|plain=filled), size(small|medium|large|xs|s|m|l|xl=medium), pill(boolean=false), disabled(boolean=false), loading(boolean=false), with-caret(boolean=false), href(string), target(\_blank|\_self|\_parent|\_top), download(string), rel(string), type(button|submit|reset=button), name(string), value(string), formaction(string), formenctype(string), formmethod(string), formnovalidate(boolean=false), formtarget(string)
**Outputs:** (focusEvent), (invalid), (blurEvent)
**Slots:** default, start, end
**Methods:** click(), focus(), blur()
**Parts:** base, start, label, end, caret, spinner

## ButtonGroup

Actions | free | Groups related buttons into organized sections, supporting both horizontal and vertical layouts
wa-button-group -> <ButtonGroup> (selector: k-button-group)

**Props:** label(string=''), orientation(horizontal|vertical=horizontal)
**Slots:** default
**Parts:** base
**Requires:** Button

## Input

Form Controls | free | Inputs collect data from the user
wa-input -> <Input> (selector: k-input)

**Props:** type(text|email|password|number|date|tel|url|search=text), label(string), hint(string), placeholder(string), value(string), appearance(filled|filled-outlined|outlined=outlined), size(small|medium|large|xs|s|m|l|xl=medium), pill(boolean=false), disabled(boolean=false), with-clear(boolean=false), password-toggle(boolean=false), password-visible(boolean=false), readonly(boolean=false), required(boolean=false), name(string), pattern(string), minlength(number), maxlength(number), min(string), max(string), step(string), without-spin-buttons(boolean=false), autocomplete(string), autocapitalize(off|none|on|sentences|words|characters), autocorrect(boolean=false), autofocus(boolean=false), inputmode(none|text|decimal|numeric|tel|search|email|url), enterkeyhint(enter|done|go|next|previous|search|send)
**Outputs:** (change), (blurEvent), (focusEvent), (clear), (invalid), (inputEvent)
**Slots:** label, start, end, clear-icon, show-password-icon, hide-password-icon, hint
**Methods:** focus(), blur(), select(), setSelectionRange(), setRangeText(), showPicker(), stepUp(), stepDown()
**Parts:** label, hint, base, input, start, clear-button, password-toggle-button, end
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## Card

Organization | free | Cards can be used to group related subjects in a container
wa-card -> <Card> (selector: k-card)

**Props:** appearance(outlined|filled-outlined|plain|filled|accent=outlined), orientation(vertical|horizontal=vertical), with-header(boolean=false), with-footer(boolean=false), with-media(boolean=false)
**Slots:** default, header, footer, media, actions, header-actions, footer-actions
**Parts:** media, header, body, footer
**CSS:** --spacing(var(--wa-space-l))

## Dialog

Overlays | free | Dialogs display important prompts and information
wa-dialog -> <Dialog> (selector: k-dialog)

**Props:** open(boolean=false), label(string='', required), without-header(boolean=false), light-dismiss(boolean=false)
**Outputs:** (afterShow), (hide), (afterHide), (show)
**Slots:** default, label, header-actions, footer
**Methods:** show(), requestClose()
**Parts:** dialog, header, header-actions, title, close-button, close-button\_\_base, body, footer
**CSS:** --spacing, --width, --backdrop-filter(none), --show-duration(200ms), --hide-duration(200ms)

## AnimatedImage

Display | free | A component for displaying animated GIFs and WEBPs that play and pause on interaction
wa-animated-image -> <AnimatedImage> (selector: k-animated-image)

**Props:** src(string, required), alt(string, required), play(boolean=false)
**Outputs:** (error), (load)
**Slots:** play-icon, pause-icon
**Parts:** control-box
**CSS:** --control-box-size, --icon-size
**Requires:** Icon

## Animation

Display | free | Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
wa-animation -> <Animation> (selector: k-animation)

**Props:** name(string=none), play(boolean=false), delay(number=0), direction(normal|reverse|alternate|alternate-reverse=normal), duration(number=1000), easing(string=linear), end-delay(number=0), fill(auto|backwards|both|forwards|none=auto), iterations(number=Infinity), iteration-start(number=0), playback-rate(number=1)
**Outputs:** (finishEvent), (start), (cancelEvent)
**Slots:** default
**Methods:** cancel(), finish()

## Avatar

Display | free | Avatars are used to represent a person or object
wa-avatar -> <Avatar> (selector: k-avatar)

**Props:** image(string=''), label(string='', required), initials(string=''), loading(eager|lazy=eager), shape(circle|square|rounded=circle)
**Outputs:** (error)
**Slots:** icon
**Parts:** icon, initials, image
**CSS:** --size
**Requires:** Icon

## Badge

Display | free | Badges are used to draw attention and display statuses or counts
wa-badge -> <Badge> (selector: k-badge)

**Props:** variant(brand|neutral|success|warning|danger=brand), appearance(accent|filled|outlined|filled-outlined=accent), pill(boolean=false), attention(none|pulse|bounce=none)
**Slots:** default, start, end
**Parts:** base, start, end
**CSS:** --pulse-color

## Breadcrumb

Navigation | free | Breadcrumbs provide a group of links so users can easily navigate a website hierarchy
wa-breadcrumb -> <Breadcrumb> (selector: k-breadcrumb)

**Props:** label(string='')
**Slots:** default, separator
**Parts:** base
**Requires:** Icon

## BreadcrumbItem

Navigation | free | Breadcrumb Items are used inside breadcrumbs to represent different links
wa-breadcrumb-item -> <BreadcrumbItem> (selector: k-breadcrumb-item)

**Props:** href(string), target(\_blank|\_parent|\_self|\_top), rel(string=noreferrer noopener)
**Slots:** default, start, end, separator
**Parts:** label, start, end, separator

## Icon

Display | free | Icons are symbols that can be used to represent various options within an application
wa-icon -> <Icon> (selector: k-icon)

**Props:** name(string), library(string=default), src(string), label(string=''), family(string), variant(string), auto-width(boolean=false), swap-opacity(boolean=false), rotate(number), flip(horizontal|vertical|both), animation(string)
**Outputs:** (error), (load)
**Parts:** svg, use
**CSS:** --animation-delay(0), --animation-direction(normal), --animation-duration(1s), --animation-iteration-count(infinite), --animation-timing, --beat-fade-opacity, --beat-fade-scale, --beat-scale, --bounce-height, --bounce-jump-scale-x, --bounce-jump-scale-y, --bounce-land-scale-x, --bounce-land-scale-y, --bounce-rebound, --bounce-start-scale-x, --bounce-start-scale-y, --fade-opacity, --flip-angle, --flip-x, --flip-y, --flip-z, --primary-color(currentColor), --primary-opacity(1), --secondary-color(currentColor), --secondary-opacity(0.4)

## Carousel

Display | free | Displays an arbitrary number of content slides along a horizontal or vertical axis
wa-carousel -> <Carousel> (selector: k-carousel)

**Props:** autoplay(boolean=false), autoplay-interval(number=3000), loop(boolean=false), mouse-dragging(boolean=false), navigation(boolean=false), orientation(horizontal|vertical=horizontal), pagination(boolean=false), slides-per-move(number=1), slides-per-page(number=1)
**Outputs:** (slideChange)
**Slots:** default, next-icon, previous-icon
**Methods:** previous(), next(), goToSlide()
**Parts:** base, scroll-container, pagination, pagination-item, pagination-item-active, navigation, navigation-button, navigation-button-previous, navigation-button-next
**CSS:** --aspect-ratio(16/9), --scroll-hint, --slide-gap(var(--wa-space-m))
**Requires:** CarouselItem

## CarouselItem

Display | free | Represents an individual slide within a carousel component
wa-carousel-item -> <CarouselItem> (selector: k-carousel-item)

**Props:** none
**Slots:** default
**CSS:** --aspect-ratio

## Checkbox

Form Controls | free | Checkboxes allow the user to toggle an option on or off
wa-checkbox -> <Checkbox> (selector: k-checkbox)

**Props:** checked(boolean=false), disabled(boolean=false), hint(string=''), indeterminate(boolean=false), name(string=''), required(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium), value(string)
**Outputs:** (blurEvent), (focusEvent), (inputEvent), (invalid), (change)
**Slots:** default, hint
**Methods:** click(), focus(), blur()
**Parts:** base, control, checked-icon, indeterminate-icon, label, hint
**CSS:** --checked-icon-color, --checked-icon-scale
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** Icon

## ColorPicker

Form Controls | free | Color pickers allow the user to select a color
wa-color-picker -> <ColorPicker> (selector: k-color-picker)

**Props:** value(string), format(hex|rgb|hsl|hsv=hex), opacity(boolean=false), disabled(boolean=false), required(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium), label(string=''), hint(string=''), name(string), open(boolean=false), placement(top|top-start|top-end|bottom|bottom-start|bottom-end|right|right-start|right-end|left|left-start|left-end=bottom-start), swatches(string=''), uppercase(boolean=false), without-format-toggle(boolean=false), inline(boolean=false)
**Outputs:** (inputEvent), (showEvent), (afterShow), (hideEvent), (afterHide), (blurEvent), (focusEvent), (invalid), (change)
**Slots:** label, hint
**Methods:** getHexString(), focus(), blur(), getFormattedValue(), show(), hide()
**Parts:** base, trigger, swatches, swatch, grid, grid-handle, slider, slider-handle, hue-slider, hue-slider-handle, opacity-slider, opacity-slider-handle, preview, input, eyedropper-button, eyedropper-button**base, eyedropper-button**start, eyedropper-button**label, eyedropper-button**end, eyedropper-button**caret, format-button, format-button**base, format-button**start, format-button**label, format-button**end, format-button**caret
**CSS:** --grid-width, --grid-height, --grid-handle-size, --slider-height, --slider-handle-size
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** Button, Icon, Input, Popup

## Combobox

Form Controls | pro | Combines a text input with a listbox for filtering and selecting options
wa-combobox -> <Combobox> (selector: k-combobox)

**Props:** allow-custom-value(boolean=false), appearance(filled|outlined|filled-outlined=outlined), allow-create(boolean=false), autocapitalize(off|none|on|sentences|words|characters), autocorrect(boolean), disabled(boolean=false), enterkeyhint(enter|done|go|next|previous|search|send), hint(string=''), inputmode(none|text|decimal|numeric|tel|search|email|url), label(string=''), max-options-visible(number=3), multiple(boolean=false), name(string=''), open(boolean=false), pill(boolean=false), placeholder(string=''), placement(top|bottom=bottom), required(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium), spellcheck(boolean), with-clear(boolean=false), value(string='')
**Outputs:** (change), (focusEvent), (blurEvent), (clear), (showEvent), (afterShow), (hideEvent), (afterHide), (create), (invalid), (inputEvent)
**Slots:** default, label, start, end, clear-icon, expand-icon, hint
**Methods:** show(), hide(), focus(), blur()
**Parts:** form-control, form-control-label, form-control-input, hint, combobox, start, end, combobox-input, listbox, tags, tag, tag**content, tag**remove-button, tag**remove-button**base, clear-button, expand-icon
**CSS:** --show-duration(100ms), --hide-duration(100ms), --tag-max-size(10ch)
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** Button, Icon, Option, Popup, Tag

## Comparison

Display | free | Compare visual differences between similar content with a sliding panel
wa-comparison -> <Comparison> (selector: k-comparison)

**Props:** position(number=50)
**Outputs:** (change)
**Slots:** before, after, handle
**Parts:** base, before, after, divider, handle
**CSS:** --divider-width, --handle-size
**Requires:** Icon

## Page

Layout | free | Pages offer an easy way to scaffold entire page layouts using minimal markup
wa-page -> <Page> (selector: k-page)

**Props:** disable-navigation-toggle(boolean=false), mobile-breakpoint(string=768px), navigation-placement(start|end=start), nav-open(boolean=false), view(mobile|desktop=desktop)
**Slots:** default, banner, header, subheader, menu, navigation-header, navigation, navigation-footer, navigation-toggle, navigation-toggle-icon, main-header, main-footer, aside, skip-to-content, footer
**Methods:** visiblePixelsInViewport(), showNavigation(), hideNavigation(), toggleNavigation()
**Parts:** base, banner, header, subheader, body, menu, navigation, navigation-header, navigation-footer, navigation-toggle, navigation-toggle-icon, main-header, main-content, main-footer, aside, skip-links, skip-link, footer, dialog-wrapper
**CSS:** --menu-width(auto), --main-width(1fr), --aside-width(auto), --banner-height(0px), --header-height(0px), --subheader-height(0px)

## CopyButton

Actions | free | Copies text data to the clipboard when clicked
wa-copy-button -> <CopyButton> (selector: k-copy-button)

**Props:** value(string=''), from(string=''), disabled(boolean=false), copy-label(string=''), success-label(string=''), error-label(string=''), feedback-duration(number=1000), tooltip-placement(top|right|bottom|left=top)
**Outputs:** (error), (copy)
**Slots:** default, copy-icon, success-icon, error-icon
**Parts:** button, copy-icon, success-icon, error-icon, feedback
**Requires:** Icon, Tooltip

## Details

Organization | free | Shows a brief summary and expands to show additional content
wa-details -> <Details> (selector: k-details)

**Props:** open(boolean=false), summary(string), disabled(boolean=false), appearance(filled|outlined|filled-outlined|plain=outlined), icon-placement(start|end=end), name(string)
**Outputs:** (afterShow), (hideEvent), (afterHide), (showEvent)
**Slots:** default, summary, expand-icon, collapse-icon
**Methods:** show(), hide()
**Parts:** base, header, summary, icon, content
**CSS:** --spacing, --show-duration(200ms), --hide-duration(200ms)
**Requires:** Icon

## Divider

Layout | free | Dividers are used to visually separate content
wa-divider -> <Divider> (selector: k-divider)

**Props:** orientation(horizontal|vertical=horizontal)
**CSS:** --color, --width, --spacing

## Drawer

Overlays | free | Drawers slide in from a container edge to expose additional options
wa-drawer -> <Drawer> (selector: k-drawer)

**Props:** open(boolean=false), label(string=''), placement(top|end|bottom|start=end), light-dismiss(boolean=false), without-header(boolean=false)
**Outputs:** (afterShow), (hide), (afterHide), (show)
**Slots:** default, label, header-actions, footer
**Methods:** show(), requestClose()
**Parts:** dialog, header, header-actions, title, close-button, close-button\_\_base, body, footer
**CSS:** --spacing, --size, --backdrop-filter(none), --show-duration(200ms), --hide-duration(200ms)
**Requires:** Icon

## Dropdown

Overlays | free | Dropdowns expose additional content that pops up when the user interacts with a trigger
wa-dropdown -> <Dropdown> (selector: k-dropdown)

**Props:** open(boolean=false), placement(top|top-start|top-end|bottom|bottom-start|bottom-end|right|right-start|right-end|left|left-start|left-end=bottom-start), disabled(boolean=false), stay-open-on-select(boolean=false), distance(number=0), skidding(number=0), hoist(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium)
**Outputs:** (afterShow), (hide), (afterHide), (select), (show)
**Slots:** default, trigger
**Parts:** base, menu
**CSS:** --show-duration, --hide-duration
**Requires:** Popup

## DropdownItem

Overlays | free | Dropdown items are used inside dropdowns to represent individual menu items
wa-dropdown-item -> <DropdownItem> (selector: k-dropdown-item)

**Props:** type(normal|checkbox=normal), checked(boolean=false), value(string=''), disabled(boolean=false), loading(boolean=false), variant(default|danger=default)
**Outputs:** (focus), (blur)
**Slots:** default, icon, details, submenu
**Methods:** openSubmenu(), closeSubmenu()
**Parts:** checkmark, icon, label, details, submenu-icon, submenu
**Requires:** Icon

## FormatBytes

Formatting | free | Formats a number as a human-readable byte value
wa-format-bytes -> <FormatBytes> (selector: k-format-bytes)

**Props:** value(number=0), unit(byte|bit=byte), display(long|short|narrow=short), lang(string)

## FormatDate

Formatting | free | Formats a date/time using the Intl.DateTimeFormat API
wa-format-date -> <FormatDate> (selector: k-format-date)

**Props:** date(string), weekday(narrow|short|long), era(narrow|short|long), year(numeric|2-digit), month(numeric|2-digit|narrow|short|long), day(numeric|2-digit), hour(numeric|2-digit), minute(numeric|2-digit), second(numeric|2-digit), hour-format(auto|12|24=auto), time-zone-name(short|long), time-zone(string), lang(string)

## FormatNumber

Formatting | free | Formats a number using the Intl.NumberFormat API
wa-format-number -> <FormatNumber> (selector: k-format-number)

**Props:** value(number=0), type(currency|decimal|percent=decimal), currency(string=USD), currency-display(symbol|narrowSymbol|code|name=symbol), minimum-integer-digits(number), minimum-fraction-digits(number), maximum-fraction-digits(number), minimum-significant-digits(number), maximum-significant-digits(number), without-grouping(boolean=false), lang(string)

## Include

Utilities | free | Includes give you the power to embed external HTML files into the page
wa-include -> <Include> (selector: k-include)

**Props:** src(string), mode(cors|no-cors|same-origin=cors), allow-scripts(boolean=false)
**Outputs:** (includeError), (load)

## IntersectionObserver

Utilities | free | Observes changes in the intersection of a target element with an ancestor
wa-intersection-observer -> <IntersectionObserver> (selector: k-intersection-observer)

**Props:** disabled(boolean=false), once(boolean=false), threshold(string=0), root-margin(string=0px), intersect-class(string)
**Outputs:** (intersect)
**Slots:** default

## Markdown

Display | free | Renders markdown content in plain HTML
wa-markdown -> <Markdown> (selector: k-markdown)

**Props:** tab-size(number=4)
**Methods:** getMarked(), updateAll(), renderMarkdown()

## MutationObserver

Utilities | free | Observes changes to a target element and emits events when they occur
wa-mutation-observer -> <MutationObserver> (selector: k-mutation-observer)

**Props:** attr(string), attr-old-value(boolean=false), char-data(boolean=false), char-data-old-value(boolean=false), child-list(boolean=false), disabled(boolean=false), subtree(boolean=false)
**Outputs:** (mutation)
**Slots:** default

## ResizeObserver

Utilities | free | Reports changes to the dimensions of an element
wa-resize-observer -> <ResizeObserver> (selector: k-resize-observer)

**Props:** disabled(boolean=false)
**Outputs:** (resize)
**Slots:** default

## Popover

Overlays | free | Popovers display additional content when users interact with a trigger element
wa-popover -> <Popover> (selector: k-popover)

**Props:** open(boolean=false), disabled(boolean=false), placement(top|top-start|top-end|bottom|bottom-start|bottom-end|right|right-start|right-end|left|left-start|left-end=top), trigger(string=click), distance(number=8), skidding(number=0), with-arrow(boolean=false), without-arrow(boolean=false), for(string)
**Outputs:** (afterShow), (hideEvent), (afterHide), (showEvent)
**Slots:** default
**Methods:** show(), hide()
**Parts:** dialog, body, popup, popup**popup, popup**arrow
**CSS:** --arrow-size(0.375rem), --max-width(25rem), --show-duration(100ms), --hide-duration(100ms)
**Requires:** Popup

## Popup

Overlays | free | Popup is a utility component for positioning elements relative to an anchor
wa-popup -> <Popup> (selector: k-popup)

**Props:** active(boolean=false), anchor(string), placement(top|top-start|top-end|bottom|bottom-start|bottom-end|right|right-start|right-end|left|left-start|left-end=top), strategy(absolute|fixed=absolute), distance(number=0), skidding(number=0), arrow(boolean=false), arrow-placement(start|end|center|anchor=anchor), arrow-padding(number=10), flip(boolean=false), flip-fallback-placements(string), flip-fallback-strategy(best-fit|initial=best-fit), flip-padding(number=0), shift(boolean=false), shift-padding(number=0), auto-size(horizontal|vertical|both), sync(width|height|both), auto-size-padding(number=0)
**Outputs:** (repositionEvent)
**Slots:** default, anchor
**Methods:** reposition()
**Parts:** arrow, popup, hover-bridge
**CSS:** --arrow-size(6px), --popup-border-width, --arrow-color(black), --auto-size-available-width, --auto-size-available-height, --show-duration(100ms), --hide-duration(100ms)

## ProgressBar

Progress | free | Progress bars are used to show the completion of a task or operation
wa-progress-bar -> <ProgressBar> (selector: k-progress-bar)

**Props:** value(number=0), indeterminate(boolean=false), label(string='')
**Slots:** default
**Parts:** base, indicator, label
**CSS:** --track-height(1rem), --track-color(var(--wa-color-neutral-fill-normal)), --indicator-color(var(--wa-color-brand-fill-loud))

## ProgressRing

Progress | free | Progress rings are used to show the completion of a task in a circular format
wa-progress-ring -> <ProgressRing> (selector: k-progress-ring)

**Props:** value(number=0), label(string='')
**Slots:** default
**Parts:** base, label, track, indicator
**CSS:** --size, --track-width, --track-color, --indicator-width, --indicator-color, --indicator-transition-duration

## QrCode

Display | free | Generates QR codes for encoding text, URLs, or data
wa-qr-code -> <QrCode> (selector: k-qr-code)

**Props:** value(string=''), label(string=''), size(number=128), fill(string=black), background(string=white), radius(number=0), error-correction(L|M|Q|H=H)
**Parts:** base

## RadioGroup

Form Controls | free | Radio groups are used to group multiple radios so only one can be selected
wa-radio-group -> <RadioGroup> (selector: k-radio-group)

**Props:** label(string=''), hint(string=''), name(string=option), value(string=''), size(small|medium|large|xs|s|m|l|xl=medium), required(boolean=false), orientation(horizontal|vertical=vertical), disabled(boolean=false), invalid(boolean=false), help-text(string='')
**Outputs:** (change), (invalidEvent), (inputEvent)
**Slots:** default, label, hint
**Methods:** focus()
**Parts:** form-control, form-control-label, form-control-input, radios, hint
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** ButtonGroup

## Radio

Form Controls | free | Radios allow the user to select a single option from a group
wa-radio -> <Radio> (selector: k-radio)

**Props:** value(string), disabled(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium), appearance(default|button=default)
**Outputs:** (focus), (blur)
**Slots:** default
**Parts:** control, checked-icon, label
**CSS:** --checked-icon-color, --checked-icon-scale
**Requires:** Icon

## Rating

Form Controls | free | Ratings give users a way to quickly view and provide feedback
wa-rating -> <Rating> (selector: k-rating)

**Props:** label(string=''), value(number=0), max(number=5), precision(number=1), readonly(boolean=false), disabled(boolean=false), name(string=''), required(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium)
**Outputs:** (hover), (invalid), (change)
**Parts:** base
**CSS:** --symbol-color, --symbol-color-active, --symbol-spacing
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** Icon

## RelativeTime

Formatting | free | Outputs a localized time phrase relative to the current date and time
wa-relative-time -> <RelativeTime> (selector: k-relative-time)

**Props:** date(string), format(long|short|narrow=long), numeric(always|auto=auto), sync(boolean=false), lang(string)

## Scroller

Layout | free | Adds a scrollable container with optional shadow indicators
wa-scroller -> <Scroller> (selector: k-scroller)

**Props:** orientation(horizontal|vertical=horizontal), with-scroll-indicator(boolean=false), without-scrollbar(boolean=false), without-shadow(boolean=false)
**Slots:** default
**Parts:** content
**CSS:** --shadow-color(var(--wa-color-surface-default)), --shadow-size(2rem)

## Select

Form Controls | free | Selects allow you to choose items from a menu of predefined options
wa-select -> <Select> (selector: k-select)

**Props:** name(string=''), value(string), appearance(filled|outlined|filled-outlined=outlined), size(small|medium|large|xs|s|m|l|xl=medium), placeholder(string=''), multiple(boolean=false), max-options-visible(number=3), disabled(boolean=false), with-clear(boolean=false), open(boolean=false), hoist(boolean=false), placement(top|bottom=bottom), pill(boolean=false), label(string=''), hint(string=''), required(boolean=false), invalid(boolean=false), help-text(string='')
**Outputs:** (change), (focusEvent), (blurEvent), (clear), (showEvent), (afterShow), (hideEvent), (afterHide), (invalidEvent), (inputEvent)
**Slots:** default, label, start, end, clear-icon, expand-icon, hint
**Methods:** show(), hide(), focus(), blur()
**Parts:** form-control, form-control-label, form-control-input, hint, combobox, start, end, display-input, listbox, tags, tag, tag**content, tag**remove-button, tag**remove-button**base, clear-button, expand-icon
**CSS:** --show-duration(100ms), --hide-duration(100ms), --tag-max-size(10ch)
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)
**Requires:** Icon, Option, Popup, Tag

## Option

Form Controls | free | Options define the selectable items within various form controls
wa-option -> <Option> (selector: k-option)

**Props:** value(string=''), disabled(boolean=false), selected(boolean=false), label(string)
**Slots:** default, start, end
**Parts:** checked-icon, label, start, end
**Requires:** Icon

## Skeleton

Display | free | Skeletons are used to provide a visual representation of where content will eventually load
wa-skeleton -> <Skeleton> (selector: k-skeleton)

**Props:** effect(pulse|sheen|none=none)
**Parts:** indicator
**CSS:** --color, --sheen-color

## Slider

Form Controls | free | Sliders allow the user to select a value within a range
wa-slider -> <Slider> (selector: k-slider)

**Props:** name(string=''), value(number=0), label(string=''), hint(string=''), min(number=0), max(number=100), step(number=1), orientation(horizontal|vertical=horizontal), disabled(boolean=false), readonly(boolean=false), range(boolean=false), with-markers(boolean=false), with-tooltip(boolean=true), size(small|medium|large|xs|s|m|l|xl=medium), autofocus(boolean=false)
**Outputs:** (blurEvent), (focusEvent), (inputEvent), (invalid), (change)
**Slots:** label, hint, reference
**Methods:** focus(), blur(), stepDown(), stepUp()
**Parts:** label, hint, slider, track, indicator, markers, marker, references, thumb, thumb-min, thumb-max, tooltip, tooltip**tooltip, tooltip**content, tooltip\_\_arrow
**CSS:** --track-size(0.75em), --marker-width(0.1875em), --marker-height(0.1875em), --thumb-width(1.25em), --thumb-height(1.25em)
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## Spinner

Progress | free | Spinners are used to show the progress of an indeterminate operation
wa-spinner -> <Spinner> (selector: k-spinner)

**Props:** none
**Parts:** base
**CSS:** --track-width, --track-color, --indicator-color, --speed

## SplitPanel

Layout | free | Split panels display two adjacent panels with a divider for resizing
wa-split-panel -> <SplitPanel> (selector: k-split-panel)

**Props:** position(number=50), position-in-pixels(number), orientation(horizontal|vertical=horizontal), primary(start|end=start), disabled(boolean=false), snap(string), snap-threshold(number=12)
**Outputs:** (reposition)
**Slots:** start, end, divider
**Parts:** start, end, panel, divider
**CSS:** --divider-width(4px), --divider-hit-area(12px), --min(0), --max(100%)
**Requires:** Icon

## Switch

Form Controls | free | Switches allow the user to toggle an option on or off
wa-switch -> <Switch> (selector: k-switch)

**Props:** name(string), value(string), size(small|medium|large|xs|s|m|l|xl=medium), disabled(boolean=false), checked(boolean=false), required(boolean=false), hint(string='')
**Outputs:** (inputEvent), (blurEvent), (focusEvent), (invalid), (change)
**Slots:** default, hint
**Methods:** click(), focus(), blur()
**Parts:** base, control, thumb, label, hint
**CSS:** --width, --height, --thumb-size
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## TabGroup

Navigation | free | Tab groups organize content into a container that shows one section at a time
wa-tab-group -> <TabGroup> (selector: k-tab-group)

**Props:** placement(top|bottom|start|end=top), activation(auto|manual=auto), without-scroll-controls(boolean=false), active(string)
**Outputs:** (tabHide), (tabShow)
**Slots:** default, nav
**Parts:** base, nav, tabs, body, scroll-button, scroll-button-start, scroll-button-end, scroll-button\_\_base
**CSS:** --indicator-color, --track-color, --track-width
**Requires:** Icon

## Tab

Navigation | free | Tabs are used inside tab groups to represent selectable tabs
wa-tab -> <Tab> (selector: k-tab)

**Props:** panel(string), disabled(boolean=false)
**Slots:** default
**Parts:** base
**Requires:** Icon

## TabPanel

Navigation | free | Tab panels are used inside tab groups to display content for each tab
wa-tab-panel -> <TabPanel> (selector: k-tab-panel)

**Props:** name(string=''), active(boolean=false)
**Slots:** default
**Parts:** base
**CSS:** --padding

## Tag

Display | free | Tags are used as labels to organize things or indicate selections
wa-tag -> <Tag> (selector: k-tag)

**Props:** appearance(accent|filled|outlined|filled-outlined=filled-outlined), pill(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium), variant(brand|neutral|success|warning|danger=neutral), with-remove(boolean=false)
**Outputs:** (remove)
**Slots:** default
**Parts:** base, content, remove-button, remove-button\_\_base
**Requires:** Icon

## Textarea

Form Controls | free | Textareas collect multi-line text data from the user
wa-textarea -> <Textarea> (selector: k-textarea)

**Props:** name(string), value(string=''), appearance(filled|outlined|filled-outlined=outlined), size(small|medium|large|xs|s|m|l|xl=medium), label(string=''), hint(string=''), placeholder(string=''), rows(number=4), resize(none|vertical|horizontal|both|auto=vertical), disabled(boolean=false), readonly(boolean=false), required(boolean=false), minlength(number), maxlength(number), spellcheck(boolean=true), with-count(boolean=false)
**Outputs:** (change), (focusEvent), (inputEvent), (invalid), (blurEvent)
**Slots:** label, hint
**Methods:** focus(), blur(), select(), scrollPosition(), setSelectionRange(), setRangeText()
**Parts:** label, form-control-input, hint, textarea, base, count
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## Tooltip

Overlays | free | Tooltips display additional information based on a specific action
wa-tooltip -> <Tooltip> (selector: k-tooltip)

**Props:** placement(top|top-start|top-end|bottom|bottom-start|bottom-end|right|right-start|right-end|left|left-start|left-end=top), disabled(boolean=false), distance(number=8), open(boolean=false), skidding(number=0), trigger(string=hover focus), without-arrow(boolean=false), show-delay(number=150), hide-delay(number=0), for(string)
**Outputs:** (afterShow), (hideEvent), (afterHide), (showEvent)
**Slots:** default
**Methods:** show(), hide()
**Parts:** base, base**popup, base**arrow, body
**CSS:** --max-width
**Requires:** Popup

## Tree

Navigation | free | Trees allow you to display a hierarchical list of selectable tree items
wa-tree -> <Tree> (selector: k-tree)

**Props:** selection(single|multiple|leaf=single)
**Outputs:** (selectionChange)
**Slots:** default, expand-icon, collapse-icon
**Parts:** base
**CSS:** --indent-size(var(--wa-space-m)), --indent-guide-color(var(--wa-color-surface-border)), --indent-guide-offset(0), --indent-guide-style(solid), --indent-guide-width(0)

## TreeItem

Navigation | free | Tree items are used inside trees to represent hierarchical items
wa-tree-item -> <TreeItem> (selector: k-tree-item)

**Props:** expanded(boolean=false), selected(boolean=false), disabled(boolean=false), lazy(boolean=false)
**Outputs:** (afterExpand), (collapse), (afterCollapse), (lazyChange), (lazyLoad), (expand)
**Slots:** default, expand-icon, collapse-icon
**Methods:** getChildrenItems()
**Parts:** base, item, indentation, expand-button, spinner, spinner**base, label, children, checkbox, checkbox**base, checkbox**control, checkbox**checked-icon, checkbox**indeterminate-icon, checkbox**label
**CSS:** --show-duration(200ms), --hide-duration(200ms)
**Requires:** Icon, Checkbox, Spinner

## ZoomableFrame

Display | free | Zoomable frames display iframe content with zoom controls
wa-zoomable-frame -> <ZoomableFrame> (selector: k-zoomable-frame)

**Props:** src(string), srcdoc(string), zoom(number=1), zoom-levels(string=25% 50% 75% 100% 125% 150% 175% 200%), allowfullscreen(boolean=false), loading(eager|lazy=eager), without-controls(boolean=false), without-interaction(boolean=false), sandbox(string), referrerpolicy(string)
**Outputs:** (error), (load)
**Slots:** zoom-in-icon, zoom-out-icon
**Methods:** zoomIn(), zoomOut()
**Parts:** iframe, controls, zoom-in-button, zoom-out-button
**Requires:** ButtonGroup, Icon

## Callout

Display | free | Callouts are used to display important messages inline
wa-callout -> <Callout> (selector: k-callout)

**Props:** appearance(accent|filled|outlined|plain|filled-outlined=filled-outlined), size(small|medium|large|xs|s|m|l|xl=medium), variant(brand|neutral|success|warning|danger=brand)
**Slots:** default, icon
**Parts:** icon, message

## FileInput

Form Controls | pro | File inputs allow users to select and upload files from their device
wa-file-input -> <FileInput> (selector: k-file-input)

**Props:** label(string), hint(string), accept(string), multiple(boolean=false), disabled(boolean=false), required(boolean=false), size(small|medium|large|xs|s|m|l|xl=medium)
**Outputs:** (change), (focusEvent), (blurEvent), (invalid), (inputEvent)
**Slots:** label, hint, dropzone
**Methods:** focus(), blur()
**Parts:** label, hint, base, dropzone, dropzone-icon, dropzone-text, file-list, file, file-thumbnail, file-image, file-icon, file-details, file-name, file-size, remove-button
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## NumberInput

Form Controls | pro | Number inputs allow users to enter numeric values with optional step controls
wa-number-input -> <NumberInput> (selector: k-number-input)

**Props:** label(string), hint(string), value(number), min(number), max(number), step(number=1), disabled(boolean=false), required(boolean=false), placeholder(string), size(small|medium|large|xs|s|m|l|xl=medium), appearance(filled|outlined|filled-outlined=outlined), without-steppers(boolean=false)
**Outputs:** (change), (blurEvent), (focusEvent), (beforeinput), (invalid), (inputEvent)
**Slots:** label, start, end, increment-icon, decrement-icon, hint
**Methods:** focus(), blur(), select(), stepUp(), stepDown()
**Parts:** label, form-control-label, hint, base, input, start, end, stepper, stepper-increment, stepper-decrement
**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)

## Sparkline

Display | pro | Sparklines are small inline data visualizations for showing trends
wa-sparkline -> <Sparkline> (selector: k-sparkline)

**Props:** data(string), label(string), appearance(gradient|line|solid=line), trend(positive|negative|neutral), curve(linear|natural|step=natural)
**Parts:** base, line, fill
**CSS:** --fill-color, --line-color, --line-width

## Chart

Data Display | pro | Renders interactive data visualisations including bars, lines, pies, and more via Chart.js
wa-chart -> <Chart> (selector: k-chart)

**Props:** label(string), description(string), type(bar|line|pie|doughnut|polarArea|radar|scatter|bubble=bar), x-label(string), y-label(string), legend-position(top|right|bottom|left|start|end=top), stacked(boolean=false), index-axis(x|y=x), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## BarChart

Data Display | pro | Displays categorical data as horizontal or vertical rectangular bars scaled to their values
wa-bar-chart -> <BarChart> (selector: k-bar-chart)

**Props:** label(string), description(string), orientation(vertical|horizontal=vertical), x-label(string), y-label(string), legend-position(top|right|bottom|left|start|end=top), stacked(boolean=false), index-axis(x|y=x), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## LineChart

Data Display | pro | Connects sequential data points to reveal trends and patterns over a continuous axis
wa-line-chart -> <LineChart> (selector: k-line-chart)

**Props:** label(string), description(string), x-label(string), y-label(string), legend-position(top|right|bottom|left|start|end=top), stacked(boolean=false), index-axis(x|y=x), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## BubbleChart

Data Display | pro | Plots three-dimensional data using position and circle size to encode a third variable
wa-bubble-chart -> <BubbleChart> (selector: k-bubble-chart)

**Props:** label(string), description(string), x-label(string), y-label(string), legend-position(top|right|bottom|left|start|end=top), stacked(boolean=false), index-axis(x|y=x), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## DoughnutChart

Data Display | pro | Shows proportional segments in a ring shape with an open center for summary content
wa-doughnut-chart -> <DoughnutChart> (selector: k-doughnut-chart)

**Props:** label(string), description(string), legend-position(top|right|bottom|left|start|end=top), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## PieChart

Data Display | pro | Divides a circle into wedges that represent each category's share of the whole
wa-pie-chart -> <PieChart> (selector: k-pie-chart)

**Props:** label(string), description(string), legend-position(top|right|bottom|left|start|end=top), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## PolarAreaChart

Data Display | pro | Arranges segments of equal angle but varying radius around a central point
wa-polar-area-chart -> <PolarAreaChart> (selector: k-polar-area-chart)

**Props:** label(string), description(string), legend-position(top|right|bottom|left|start|end=top), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## RadarChart

Data Display | pro | Maps multiple variables onto radial axes to compare profiles at a glance
wa-radar-chart -> <RadarChart> (selector: k-radar-chart)

**Props:** label(string), description(string), legend-position(top|right|bottom|left|start|end=top), stacked(boolean=false), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## ScatterChart

Data Display | pro | Positions individual data points by two numeric axes to expose correlations
wa-scatter-chart -> <ScatterChart> (selector: k-scatter-chart)

**Props:** label(string), description(string), x-label(string), y-label(string), legend-position(top|right|bottom|left|start|end=top), grid(x|y|both|none=both), min(number), max(number), without-animation(boolean=false), without-legend(boolean=false), without-tooltip(boolean=false)
**Slots:** default
**CSS:** --fill-color-1(color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)), --fill-color-2(color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)), --fill-color-3(color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)), --fill-color-4(color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)), --fill-color-5(color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)), --fill-color-6(color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)), --border-color-1(var(--wa-color-blue-60)), --border-color-2(var(--wa-color-pink-60)), --border-color-3(var(--wa-color-green-60)), --border-color-4(var(--wa-color-yellow-60)), --border-color-5(var(--wa-color-purple-60)), --border-color-6(var(--wa-color-orange-60)), --grid-color(var(--wa-color-neutral-border-quiet)), --border-width(var(--wa-border-width-s)), --border-radius(var(--wa-border-radius-s)), --grid-border-width(var(--wa-border-width-s)), --line-border-width(var(--wa-border-width-m)), --point-radius(var(--wa-border-width-m))

## Toast

Feedback | pro | Container that manages and stacks lightweight notification banners at a chosen screen edge
wa-toast -> <Toast> (selector: k-toast)

**Props:** placement(top-start|top-center|top-end|bottom-start|bottom-center|bottom-end=top-end)
**Slots:** default
**Methods:** create()
**Parts:** stack
**CSS:** --gap(var(--wa-space-s)), --width(28rem)
**Requires:** ToastItem

## ToastItem

Feedback | pro | A single notification banner that can be stacked inside a Toast container
wa-toast-item -> <ToastItem> (selector: k-toast-item)

**Props:** variant(brand|success|warning|danger|neutral=neutral), size(small|medium|large|xs|s|m|l|xl=medium), duration(number=5000)
**Outputs:** (afterShow), (hideEvent), (afterHide), (show)
**Slots:** default, icon
**Methods:** hide()
**Parts:** toast-item, accent, icon, content, close-button, progress-ring, progress-ring**base, progress-ring**label, progress-ring**track, progress-ring**indicator, close-icon, close-icon\_\_svg
**CSS:** --accent-width, --show-duration, --hide-duration
