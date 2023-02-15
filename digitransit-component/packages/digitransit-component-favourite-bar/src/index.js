import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';
import i18next from 'i18next';
import Shimmer from '@hsl-fi/shimmer';
import Icon from '@digitransit-component/digitransit-component-icon';
import styles from './helpers/styles.scss';
import translations from './helpers/translations';

i18next.init({
  fallbackLng: 'fi',
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
});

const isKeyboardSelectionEvent = event => {
  const space = [13, ' ', 'Spacebar'];
  const enter = [32, 'Enter'];
  const key = (event && (event.key || event.which || event.keyCode)) || '';
  if (!key || !space.concat(enter).includes(key)) {
    return false;
  }
  event.preventDefault();
  return true;
};

const FavouriteLocation = ({
  className,
  clickItem,
  iconId,
  text,
  label,
  isLoading,
  color,
}) => {
  const ariaLabel =
    label === '' ? text : `${text} ${label} ${i18next.t('add-destination')}`;
  return (
    <button
      type="button"
      tabIndex="0"
      className={cx(styles['favourite-content'], styles[className])}
      onClick={clickItem}
      onKeyDown={e => isKeyboardSelectionEvent(e) && clickItem()}
      aria-label={ariaLabel}
    >
      <Shimmer active={isLoading} className={styles.shimmer}>
        {iconId ? (
          <span className={cx(styles.icon, styles[iconId])}>
            <Icon img={iconId} color={color} />
          </span>
        ) : null}
        <div className={styles['favourite-location']}>
          <div className={styles.name}>{text}</div>
          <div className={styles.address}>{label}</div>
        </div>
      </Shimmer>
    </button>
  );
};

FavouriteLocation.propTypes = {
  clickItem: PropTypes.func.isRequired,
  className: PropTypes.string,
  iconId: PropTypes.string,
  text: PropTypes.string,
  label: PropTypes.string,
  isLoading: PropTypes.bool,
  color: PropTypes.string.isRequired,
};

/**
 * FavouriteBar renders favourites. FavouriteBar displays the first two favourites, the rest are shown in a list.
 * @example
 * <FavouriteBar
 *   favourites={favourites}
 *   onClickFavourite={onClickFavourite}
 *   onAddPlace={this.addPlace}
 *   onAddHome={this.addHome}
 *   onAddWork={this.addWork}
 *   lang={this.props.lang}
 *   isLoading={this.props.isLoading}
 * />
 */
class FavouriteBar extends React.Component {
  static propTypes = {
    /** Required. Array of favourites, favourite object contains following properties.
     * @type {Array<object>}
     * @property {string} address
     * @property {string} gtfsId
     * @property {string} gid
     * @property {number} lat
     * @property {number} lon
     * @property {string} name
     * @property {string} selectedIconId
     * @property {string} favouriteId
     */
    favourites: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        gtfsId: PropTypes.string,
        gid: PropTypes.string,
        lat: PropTypes.number,
        name: PropTypes.string,
        lon: PropTypes.number,
        selectedIconId: PropTypes.string,
        favouriteId: PropTypes.string,
      }),
    ).isRequired,
    /** Optional. Function for clicking favourites. */
    onClickFavourite: PropTypes.func,
    /** Optional. Function for selecting "Add place" from suggestions. */
    onAddPlace: PropTypes.func,
    /** Optional. Function for selected "Edit" from suggestions. */
    onEdit: PropTypes.func,
    /** Optional. Function for "Add home" button. */
    // onAddHome: PropTypes.func,
    /** Optional. Function for "Add work" button. */
    // onAddWork: PropTypes.func,
    /** Optional. Language, fi, en or sv. */
    lang: PropTypes.string,
    /** Optional. Whether to show loading animation, true or false. */
    isLoading: PropTypes.bool,
    /** Optional. Default value is '#007ac9'. */
    color: PropTypes.string,
    /** Optional. */
    fontWeights: PropTypes.shape({
      /** Default value is 500. */
      medium: PropTypes.number,
      /** Default value is 700. */
      bolder: PropTypes.number,
    }),
  };

  static defaultProps = {
    onClickFavourite: () => ({}),
    onAddPlace: () => ({}),
    onEdit: () => ({}),
    // onAddHome: () => ({}),
    // onAddWork: () => ({}),
    lang: 'fi',
    isLoading: false,
    color: '#007ac9',
    fontWeights: {
      medium: 500,
      bolder: 700,
    },
  };

  static FavouriteIconIdToNameMap = {
    'icon-icon_place': 'place',
    'icon-icon_home': 'home',
    'icon-icon_work': 'work',
    'icon-icon_sport': 'sport',
    'icon-icon_school': 'school',
    'icon-icon_shopping': 'shopping',
  };

  constructor(props) {
    super(props);
    Object.keys(translations).forEach(lang => {
      i18next.addResourceBundle(lang, 'translation', translations[lang]);
    });
  }

  toggleList = () => {
    const eventDiff = new Date().getTime() - this.state.timestamp;
    if (i18next.language !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }
    if (eventDiff > 200) {
      this.setState(
        prevState => ({
          listOpen: !prevState.listOpen,
          timestamp: new Date().getTime(),
        }),
        () => {
          if (this.state.listOpen) {
            this.firstItemRef.current?.focus();
          } else {
            this.expandListRef.current?.focus();
          }
        },
      );
    }
  };

  handleClickOutside = event => {
    if (
      this.suggestionListRef.current &&
      this.expandListRef.current &&
      !this.suggestionListRef.current.contains(event.target) &&
      !this.expandListRef.current.contains(event.target)
    ) {
      this.setState({
        listOpen: false,
      });
    }
  };

  suggestionSelected = index => {
    const { favourites } = this.state;
    if (index < favourites.length) {
      this.props.onClickFavourite(favourites[index]);
    } else if (index === favourites.length) {
      this.props.onAddPlace();
    } else if (index === favourites.length + 1) {
      this.props.onEdit();
    }
    this.toggleList();
  };

  handleKeyDown = (event, index) => {
    const { listOpen, favourites } = this.state;
    const key = (event && (event.key || event.which || event.keyCode)) || '';
    if (isKeyboardSelectionEvent(event)) {
      if (!listOpen) {
        this.toggleList();
      } else {
        this.suggestionSelected(index);
      }
    } else if (key === 'Escape' || key === 27) {
      if (listOpen) {
        this.toggleList();
      }
    } else if (
      key === 'Tab' &&
      !event.shiftKey &&
      index === favourites.length + this.getCustomSuggestions().length - 1
    ) {
      this.setState({ listOpen: false });
    }
  };

  getCustomSuggestions = () => {
    const customSuggestions = [
      {
        name: i18next.t('add-place'),
        selectedIconId: 'favourite',
      },
    ];
    if (this.props.favourites.length === 0) {
      return customSuggestions;
    }
    return [
      ...customSuggestions,
      {
        name: i18next.t('edit'),
        selectedIconId: 'edit',
        iconColor: this.props.color,
      },
    ];
  };

  render() {
    const { isLoading, fontWeights, favourites, onClickFavourite } = this.props;

    if (i18next.language !== this.props.lang) {
      i18next.changeLanguage(this.props.lang);
    }

    return (
      <div
        style={{
          '--font-weight-medium': fontWeights.medium,
          '--font-weight-bolder': fontWeights.bolder,
        }}
      >
        <div className={styles['favourite-container']}>
          {favourites.map((item, index) => {
            const key = item.gid || `favourite-location-${index}`;
            return (
              <FavouriteLocation
                key={key}
                text={item.type === 'stop' ? item.code : item.name}
                clickItem={() => onClickFavourite(item)}
                isLoading={isLoading}
                color={this.props.color}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

export default FavouriteBar;
