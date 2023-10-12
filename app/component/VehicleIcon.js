import PropTypes from 'prop-types';
import React from 'react';
import cx from 'classnames';

const getFontSize = length => {
  switch (length) {
    case 1:
      return '19px';
    case 2:
      return '19px';
    case 3:
      return '16px';
    case 4:
      return '12px';
    case 5:
      return '9px';
    default:
      return '12px';
  }
};
const getTextOffSet = length => {
  switch (length) {
    case 1:
      return 12;
    case 2:
      return 12;
    case 3:
      return 11;
    case 4:
      return 11;
    case 5:
      return 10;
    default:
      return 12;
  }
};

const getSvgContent = (rotate, useLargeIcon) => {
  const transform = useLargeIcon
    ? 'translate(24 24) scale(1.3)'
    : 'translate(10 10) scale(0.7)';

  return rotate ? (
    <g transform={`rotate(${(rotate || 0) + 180} 40 40)`}>
      <use
        xlinkHref={
          useLargeIcon
            ? '#icon-icon_vehicle-live-marker'
            : '#icon-icon_all-vehicles-small'
        }
        transform={transform}
      />
    </g>
  ) : (
    <use
      xlinkHref={
        useLargeIcon
          ? '#icon-icon_vehicle-live-marker-without-direction'
          : '#icon-icon_all-vehicles-small-without-direction'
      }
      transform={transform}
    />
  );
};

const VehicleIcon = ({
  className,
  id,
  rotate,
  mode = 'bus',
  scrollIntoView = false,
  vehicleNumber = '',
  useLargeIcon = false,
  color,
}) => {
  if (useLargeIcon && mode === 'tram') {
    // EMBARK OKC Row 117: colors depend on license_plate
    // Note: we set the darkest color, brighter ones need to
    // to be calculated from these
    let style;
    if (['801', '802', '807'].indexOf(vehicleNumber) > -1) {
      style = {
        '--color-bright': '#D21F7B',
        '--color-regular': '#C71666',
        '--color-dark': '#860C44',
      };
    } else if (['803', '804'].indexOf(vehicleNumber) > -1) {
      style = {
        '--color-bright': '#2686B4',
        '--color-regular': '#2C85B3',
        '--color-dark': '#094881',
      };
    } else if (['805', '806'].indexOf(vehicleNumber) > -1) {
      style = {
        '--color-bright': '#CDDA2A',
        '--color-regular': '#3DAF2A',
        '--color-dark': '#47A238',
      };
    }
    style.transform = 'scale(5)';
    const textRotate =
      90 + (rotate || 0) + (rotate > 0 && rotate < 180 ? 180 : 0);
    return (
      <span>
        <svg
          id={id}
          viewBox="0 0 80 80"
          style={style}
          className={cx('icon', className, mode)}
          ref={el => scrollIntoView && el && el.scrollIntoView()}
        >
          <g
            transform={`rotate(${(rotate || 0) + 180})`}
            transform-origin="center"
          >
            <use xlinkHref="#icon-icon_streetcar-live-marker" />
          </g>
          <g transform={`rotate(${textRotate})`} transform-origin="center">
            <text textAnchor="middle" fontSize="13px" color="black">
              <tspan x="40" y="45">
                {vehicleNumber}
              </tspan>
            </text>
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span>
      {useLargeIcon ? (
        <svg
          id={id}
          viewBox="0 0 80 80"
          style={{ color: color ? `#${color}` : null }}
          className={cx('icon', 'large-vehicle-icon', className, mode)}
          ref={el => scrollIntoView && el && el.scrollIntoView()}
        >
          {getSvgContent(rotate, useLargeIcon)}
          <text
            textAnchor="middle"
            fontSize={getFontSize(vehicleNumber.length)}
            fontStyle="condensed"
          >
            <tspan x="40" y={35 + getTextOffSet(vehicleNumber.length)}>
              {vehicleNumber}
            </tspan>
          </text>
        </svg>
      ) : (
        <svg
          id={id}
          viewBox="0 0 120 120"
          className={cx('icon', 'small-vehicle-icon', className)}
          ref={el => scrollIntoView && el && el.scrollIntoView()}
        >
          {getSvgContent(rotate, useLargeIcon)}
        </svg>
      )}
    </span>
  );
};

VehicleIcon.displayName = 'VehicleIcon';

VehicleIcon.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  rotate: PropTypes.number,
  mode: PropTypes.string,
  scrollIntoView: PropTypes.bool,
  vehicleNumber: PropTypes.string,
  useLargeIcon: PropTypes.bool,
  color: PropTypes.string,
};

export default VehicleIcon;
