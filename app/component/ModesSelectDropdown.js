import React, { useState } from 'react';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import Icon from './Icon';

const DropdownIndicator = ({ innerProps }, { config }) => {
  return (
    <span className="dd__indicator dd__dropdown-indicator" {...innerProps}>
      <Icon
        // className="arrow-dropdown"
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

export default function ModesSelectDropdown(props, context) {
  const {
    id,
    labelId,
    placeholderLabelId,
    defaultModes,
    availableModes,
    onSelectedModesChange,
  } = props;
  const { intl, config } = context;

  const modeAsOption = mode => ({
    value: mode,
    label: intl.formatMessage({ id: mode.toLowerCase() }),
  });
  const options = availableModes.map(modeAsOption);
  const optionsByValue = Object.fromEntries(
    options.map(option => [option.value, option]),
  );
  const defaultOptions = defaultModes.map(modeAsOption);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModes, setSelectedModes] = useState(defaultModes);

  const handleChange = selectedOptions => {
    const newSelectedModes = selectedOptions.map(option => option.value);
    setSelectedModes(newSelectedModes);
    onSelectedModesChange(newSelectedModes);
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
          ClearIndicator: null,
          IndicatorSeparator: null,
        }}
        inputId={inputDomId}
        aria-label={intl.formatMessage(
          { id: 'modes-select-dropdown-aria-label' },
          {
            selectedModes: selectedModes
              .map(mode => optionsByValue[mode]?.label || mode)
              .join(', '),
          },
        )}
        aria-labelledby={labelDomId}
        ariaLiveMessages={{
          // Guidance message used to convey component state and specific keyboard interactivity
          guidance: () => {
            return intl.formatMessage({
              id: 'modes-select-dropdown-aria-message-guidance',
            });
          },
          // OnChange message used to convey changes to value but also called when user selects disabled option
          onChange: ({ value: option }) => {
            return intl.formatMessage(
              { id: 'modes-select-dropdown-aria-message-change' },
              { mode: option.label },
            );
          },
          // OnFocus message used to convey information about the currently focused option or value
          onFocus: ({ focused: option }) => {
            return intl.formatMessage(
              { id: 'modes-select-dropdown-aria-message-focused' },
              { mode: option.label },
            );
          },
          // todo: onFilter?
          // OnFilter message used to convey information about filtered results displayed in the menu
        }}
        isSearchable={false}
        isMulti
        menuIsOpen={isMenuOpen}
        onChange={handleChange}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        options={options}
        defaultValue={defaultOptions}
        // shown when no options are selected, among other situations
        placeholder={intl.formatMessage({ id: placeholderLabelId })}
        styles={{
          noOptionsMessage: () => ({
            color: config.colors.primary,
            padding: `8px 12px`,
            textAlign: 'center',
          }),
        }}
      />
    </div>
  );
}

ModesSelectDropdown.contextTypes = {
  intl: intlShape.isRequired,
  config: PropTypes.object.isRequired,
};

ModesSelectDropdown.propTypes = {
  id: PropTypes.string.isRequired,
  labelId: PropTypes.string,
  placeholderLabelId: PropTypes.string,
  defaultModes: PropTypes.arrayOf(PropTypes.string).isRequired,
  availableModes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectedModesChange: PropTypes.func.isRequired,
};

ModesSelectDropdown.defaultProps = {
  labelId: 'modes-select-dropdown-label',
  placeholderLabelId: 'modes-select-dropdown-placeholder',
};
