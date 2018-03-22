(function ($) {

  /**
   * Overridable. Starts the plugin.
   */
  function init() {
    // Hide the select and label associated with this select
    this.select.hide();
    var id = this.select.attr('id');
    var labels = this.parent.find('label');
    labels.each(function(i, label) {
      if ($(label).attr('for') === id) {
        $(label).hide();
      }
    });

    domOverrides(this);

    // Basic structure checks
    var containerClass = this.parent.find(this.containerClass);
    var outputClass = this.parent.find(this.outputContainerClass);

    if (containerClass.length === 0) {
      throw 'containerClass \''+this.containerClass+'\' not found. Is your select in the same div?';
    }
    if (outputClass.length === 0) {
      throw 'outputClass \''+this.outputContainerClass+'\' not found. Is your select in the same div or does it define the outputClass on its data-output-class attribute?';
    }

    // Store the current empty html that is in the output container
    this.emptyOutput = $(this.outputContainerClass).html().trim();

    // Add the select all form to the html
    var initialSelectAllHTML = this.initialSelectAllHTML.replace('{{selectAllText}}', this.selectAllText);
    this.parent.find(this.containerClass).before(initialSelectAllHTML);

    setupEventListeners(this);

    this.update();
  }

  /**
   * Overrides our plugin values with data elements attached to the select in the DOM
   * @param self
   */
  function domOverrides(self) {
    // Change our defaults and give precedent to DOM values
    // If the user defined an attribute for where to send the selected pills
    var outputLocation = self.select.attr('data-output-class');
    if (outputLocation) {
      self.outputContainerClass = outputLocation;
    }
    var searchPlaceholder = self.select.attr('data-search-placeholder');
    if (searchPlaceholder) {
      self.placeholderText = searchPlaceholder;
    }
    var selectAllText = self.select.attr('data-select-all');
    if (selectAllText) {
      self.selectAllText = selectAllText;
    }
    var removeAllText = self.select.attr('data-remove-all');
    if (removeAllText) {
      self.removeAllText = removeAllText;
    }
  }

  /**
   * Set up our event listeners
   * @param self
   */
  function setupEventListeners(self) {
    // Set up the click listeners for our elements
    self.parent.on('click', self.btnSelectClass, function(e) {
      e.preventDefault();

      var value = $(this).attr('data-value');
      selectOption(value, self.selectOptions, true);
      self.update();
    });

    self.parent.on('click', self.btnRemoveClass, function(e) {
      e.preventDefault();

      var value = $(this).attr('data-value');
      selectOption(value, self.selectOptions, false);
      self.update();
    });

    self.parent.on('keyup', self.searchClass, function() {
      self.currentSearchText = $(this).val().trim().toLowerCase();
      self.filterSelectableItems();
    });

    // Add click listener for the select all checkbox
    self.parent.find(self.selectAllClass).change(function() {
      // If checked we select all, otherwise deselect all
      if ($(this).is(':checked')) {
        // Change just the text node for the label, not the input
        $(this).parent()[0].childNodes[1].nodeValue = ' ' + self.removeAllText;
        setAllOptions(self.selectOptions, true);
      } else {
        $(this).parent()[0].childNodes[1].nodeValue = ' ' + self.selectAllText;
        setAllOptions(self.selectOptions, false);
      }
      // In either case, update our display
      self.update();
    });
  }

  /**
   * Selects or deselects all options in the underlying multi select programmatically
   * @param options
   * @param selected
   */
  function setAllOptions(options, selected) {
    options.each(function(i, option) {
      $(option).attr('selected', selected);
    });
  }

  /**
   * Selects an option in the hidden underlying multi select programmatically
   */
  function selectOption(optionValue, options, selected) {
    options.each(function(i, option) {
      if ($(option).val() === optionValue) {
        $(option).attr('selected', selected);
      }
    });
  }

  /**
   * Overridable. Updates the searchable-select options and output
   */
  function update() {
    // Create the initial objects to add select options to
    var initialHTML = this.initialHTML;
    var selectOptions = this.buildSelectOptions();
    initialHTML = initialHTML.replace('{{initialOptions}}', selectOptions);
    initialHTML = initialHTML.replace('{{currentSearchText}}', this.currentSearchText);
    initialHTML = initialHTML.replace('{{placeholderText}}', this.placeholderText);
    // Inject the initial html to the container class
    this.parent.find(this.containerClass).html(initialHTML);

    // Pre-fill the selected options in our given output location
    this.parent.find(this.outputContainerClass).html(this.buildSelectedOutput());

    this.filterSelectableItems();
  }

  /**
   * Overridable. Filters the selectable item list by the current search text
   * NOTE: If you are using a different html structure, you may have to override
   * this function.
   */
  function filterSelectableItems() {
    var self = this;
    var selectableItems = this.select.parent().find(this.selectableItemClass);

    selectableItems.show();

    // Only filter if we have text
    if (this.currentSearchText !== '') {
      // Go through our multi select options and find what values match the search
      var optionsToShow = [];
      this.selectOptions.each(function(i, option) {
        if ($(option).text().trim().toLowerCase().includes(self.currentSearchText)) {
          optionsToShow.push($(option).val());
        }
      });

      // Go through our selectable items list and hide the ones that aren't in our show list
      selectableItems.each(function(i, item) {
        var selectableItemId = $(item).find('span').attr('data-value');
        if (!optionsToShow.includes(selectableItemId)) {
          $(item).hide();
        }
      });
    }
  }

  /**
   * Overridable. Creates and returns the searchable-select options to match the multi select
   */
  function buildSelectOptions() {
    var self = this;
    var options = '';
    this.selectOptions.each(function(i, option) {
      var isSelected = $(option).is(':selected');
      var btnSelectClass = isSelected ? '' : self.btnSelectClass.replace('.', '');
      var btnText = isSelected ? self.selectedBtnText : self.btnText;
      var injectText = $(option).attr('data-inject');
      var injectableContent = injectText ? injectText : '';

      var optionTemplate = self.initialOptionHTML;
      optionTemplate = optionTemplate.replace('{{optionValue}}', $(option).val());
      optionTemplate = optionTemplate.replace('{{optionTitle}}', $(option).text());
      optionTemplate = optionTemplate.replace('{{btnText}}', btnText);
      optionTemplate = optionTemplate.replace('{{selectedBtnClass}}', btnSelectClass);
      optionTemplate = optionTemplate.replace('{{injectableContent}}', injectableContent);
      options += optionTemplate;
    });

    return options;
  }

  /**
   * Overridable. Creates and returns the selected output
   */
  function buildSelectedOutput() {
    var self = this;
    var selectedOutput = '';
    this.selectOptions.each(function(i, option) {
      if ($(option).is(':selected')) {
        var selectedOptionTemplate = self.initialSelectedItemHTML;
        selectedOptionTemplate = selectedOptionTemplate.replace(/{{optionValue}}/g, $(option).val());
        selectedOptionTemplate = selectedOptionTemplate.replace('{{optionTitle}}', $(option).text());
        selectedOptionTemplate = selectedOptionTemplate.replace('{{btnRemoveClass}}', self.btnRemoveClass.replace('.', ''));
        selectedOutput += selectedOptionTemplate;
      }
    });

    if (selectedOutput === '') {
      selectedOutput = self.emptyOutput;
    }

    return selectedOutput;
  }

  /**
   * Defines initial html structure upon initialization
   * @returns {string}
   */
  function initialHTML() {
    return '<div class="search-w-results">\n' +
      '                            <div class="block-fixed">\n' +
      '                                <div class="form">\n' +
      '                                    <input type="text" class="teacher search-block" placeholder="{{placeholderText}}" value="{{currentSearchText}}">\n' +
      '                                </div>\n' +
      '                            </div>\n' +
      '                            <div class="block-scrollable">\n' +
      '                                <ul class="list-results role-assign" id="classrooms-results">{{initialOptions}}</ul>\n' +
      '                            </div>\n' +
      '                        </div>';
  }

  /**
   * Defines the initial HTML template for the form to select all the options in one click
   * @returns {string}
   */
  function initialSelectAllHTML() {
    return '<div class="form">\n' +
      '                        <p><label class="label-default label-center"><input type="checkbox" id="select-all-teachers" class="searchable-select-all"> {{selectAllText}}</label></p>\n' +
      '                    </div>';
  }

  /**
   * Defines the template for our searchable select options
   * @returns {string}
   */
  function initialOptionHTML() {
    return '<li class="classroom-row">{{optionTitle}} <span class="injectable">{{injectableContent}}</span><span class="{{selectedBtnClass}}" data-value="{{optionValue}}">{{btnText}}</span></li>';
  }

  /**
   * Defines the template that we use to create initial selected pill tags
   * @returns {string}
   */
  function initialSelectedItemHTML() {
    return '<li><span class="btn-tag"><span>{{optionValue}}: {{optionTitle}}</span> <a href="#" class="{{btnRemoveClass}}" data-value="{{optionValue}}">X</a></span></li>';
  }

  $.fn.searchableSelect = function(userOptions) {

    this.each(function(i, select) {
      // Create our options by merging in userOptions, so that all properties are overridable
      var options = $.extend(
        true,
        {},
        // Plugin defaults
        {
          containerClass: '.left-col',
          outputContainerClass: '#selected-classrooms-list',
          btnSelectClass: '.btn-select',
          btnRemoveClass: '.btn-close',
          btnText: 'Assign',
          selectedBtnText: 'Assigned',
          searchClass: '.search-block',
          selectAllClass: '.searchable-select-all',
          selectAllText: 'Select all teachers',
          removeAllText: 'Deselect all teachers',
          selectableItemClass: '.classroom-row',
          placeholderText: 'Search for teachers to assign user to',
          init: init,
          update: update,
          buildSelectOptions: buildSelectOptions,
          buildSelectedOutput: buildSelectedOutput,
          filterSelectableItems: filterSelectableItems,
          // These functions are just a simple way to initialize our HTML templates
          // they can be overridden by passing in string HTML templates in the userOptions
          initialHTML: initialHTML(),
          initialSelectAllHTML: initialSelectAllHTML(),
          initialOptionHTML: initialOptionHTML(),
          initialSelectedItemHTML: initialSelectedItemHTML()
        },
        userOptions
      );

      // Store the select and options available
      options.selectOptions = $(select).find('option');
      options.select = $(select);
      options.parent = $(select).parent();
      options.currentSearchText = '';
      options.emptyOutput = '';
      options.init();

      // Save the searchableSelect object onto the select to access later
      $(select).data('searchableSelect', options);
    });

    return this;
  };
}(jQuery));