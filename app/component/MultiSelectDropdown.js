import React, { useState } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import Icon from './Icon';

const DropdownIndicator = ({ innerProps }, { config }) => {
  return (
    <span className="dd__indicator dd__dropdown-indicator" {...innerProps}>
      <Icon
        img="icon-icon_arrow-collapse"
        height={0.625}
        width={0.625}
        color={config.colors.primary}
      />
    </span>
  );
};

DropdownIndicator.propTypes = {
  innerProps: PropTypes.object.isRequired,
};
DropdownIndicator.contextTypes = {
  config: PropTypes.object.isRequired,
};

const ClearIndicator = ({ innerProps }) => {
  return (
    <span className="dd__indicator dd__dropdown-indicator" {...innerProps}>
      <Icon img="icon-icon_close" height={0.625} width={0.625} />
    </span>
  );
};

ClearIndicator.propTypes = {
  innerProps: PropTypes.object.isRequired,
};

// TODO rename to SingleSelectDropDown?
export default function MultiSelectDropdown(props, context) {
  const {
    id,
    labelId,
    placeholderLabelId,
    ariaLabelId,
    ariaMessageGuidanceId,
    ariaMessageChangeId,
    ariaMessageFocusedId,
    defaultOption,
    availableOptions,
    onSelectionChanged,
  } = props;
  const { intl } = context;

  const optionsByValue = Object.fromEntries(
    availableOptions.map(option => [option.value, option]),
  );
  const defaultValue = defaultOption && optionsByValue[defaultOption];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const handleChange = option => {
    const newSelectedOption = option?.value;
    setSelectedOption(newSelectedOption);
    onSelectionChanged(newSelectedOption);
  };

  const labelDomId = `aria-label-${id}`;
  const inputDomId = `aria-input-${id}`;

  return (
    <div className="dd-container withLabel" aria-live="polite">
      <label className="dd-header-title" id={labelDomId} htmlFor={inputDomId}>
        {intl.formatMessage({ id: labelId })}
      </label>
      <Select
        className="dd-select"
        classNamePrefix="dd"
        components={{
          DropdownIndicator,
          ClearIndicator,
        }}
        inputId={inputDomId}
        aria-label={intl.formatMessage(
          { id: ariaLabelId },
          {
            option: optionsByValue[selectedOption]?.label || selectedOption,
          },
        )}
        aria-labelledby={labelDomId}
        ariaLiveMessages={{
          // Guidance message used to convey component state and specific keyboard interactivity
          guidance: () => {
            return intl.formatMessage({
              id: ariaMessageGuidanceId,
            });
          },
          // OnChange message used to convey changes to value but also called when user selects disabled option
          onChange: ({ value: option }) => {
            return (
              option &&
              intl.formatMessage(
                { id: ariaMessageChangeId },
                { option: option.label },
              )
            );
          },
          // OnFocus message used to convey information about the currently focused option or value
          onFocus: ({ focused: option }) => {
            return intl.formatMessage(
              { id: ariaMessageFocusedId },
              { option: option.label },
            );
          },
          // todo: onFilter?
          // OnFilter message used to convey information about filtered results displayed in the menu
        }}
        isSearchable={false}
        isClearable
        menuIsOpen={isMenuOpen}
        onChange={handleChange}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        options={availableOptions}
        defaultValue={defaultValue}
        // shown when no options are selected, among other situations
        placeholder={intl.formatMessage({ id: placeholderLabelId })}
        styles={{
          noOptionsMessage: () => ({
            color: '#000000',
            padding: `8px 12px`,
            textAlign: 'center',
          }),
        }}
      />
    </div>
  );
}

MultiSelectDropdown.contextTypes = {
  intl: intlShape.isRequired,
  config: PropTypes.object.isRequired,
};

MultiSelectDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  labelId: PropTypes.string,
  placeholderLabelId: PropTypes.string,
  ariaLabelId: PropTypes.string,
  ariaMessageFocusedId: PropTypes.string,
  ariaMessageChangeId: PropTypes.string,
  ariaMessageGuidanceId: PropTypes.string,
  defaultOption: PropTypes.arrayOf(PropTypes.string),
  availableOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectionChanged: PropTypes.func.isRequired,
};

MultiSelectDropdown.defaultProps = {
  defaultOption: undefined,
  labelId: 'modes-select-dropdown-label',
  placeholderLabelId: 'modes-select-dropdown-placeholder',
  ariaLabelId: 'modes-select-dropdown-aria-label',
  ariaMessageFocusedId: 'select-dropdown-aria-message-focused',
  ariaMessageChangeId: 'select-dropdown-aria-message-change',
  ariaMessageGuidanceId: 'select-dropdown-aria-message-guidance',
};
