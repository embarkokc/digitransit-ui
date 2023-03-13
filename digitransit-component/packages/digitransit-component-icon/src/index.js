import PropTypes from 'prop-types';
import React from 'react';
import Airplane from './assets/airplane.svg';
import Arrow from './assets/arrow.svg';
import Bus from './assets/bus.svg';
import Busstop from './assets/bus_stop.svg';
import City from './assets/city.svg';
import Edit from './assets/edit.svg';
import Ferry from './assets/ferry.svg';
import Home from './assets/home.svg';
import Locate from './assets/locate.svg';
import Place from './assets/place.svg';
import Rail from './assets/rail.svg';
import School from './assets/school.svg';
import Shopping from './assets/shopping.svg';
import Sport from './assets/sport.svg';
import Star from './assets/star.svg';
import Station from './assets/station.svg';
import Subway from './assets/subway.svg';
import Tram from './assets/tram.svg';
import Work from './assets/work.svg';
import Map from './assets/map.svg';
import Close from './assets/close.svg';
import Mapmarker from './assets/mapmarker.svg';
import MapmarkerVia from './assets/mapmarker-via.svg';
import Search from './assets/search.svg';
import Plus from './assets/plus.svg';
import Attention from './assets/attention.svg';
import Dropdown from './assets/dropdown.svg';
import CarPark from './assets/car-park.svg';
import BikePark from './assets/bike-park.svg';
import Time from './assets/time.svg';
import Ellipsis from './assets/ellipsis.svg';
import Opposite from './assets/opposite.svg';
import Viapoint from './assets/viapoint.svg';
import Calendar from './assets/calendar.svg';
import SelectFromMap from './assets/select-from-map.svg';
import CautionWhite from './assets/caution_white_exclamation.svg';
import Trash from './assets/trash.svg';
import ModeBus from './assets/mode_bus.svg';
import ModeBusExpress from './assets/bus-express.svg';
import ModeBusLocal from './assets/bus-local.svg';
import ModeRail from './assets/mode_rail.svg';
import ModeTram from './assets/mode_tram.svg';
import ModeFerry from './assets/mode_ferry.svg';
import ModeCitybike from './assets/mode_citybike.svg';
import ModeAirplane from './assets/mode_airplane.svg';
import ModeDigiTram from './assets/mode_digi_tram.svg';
import ModeDigiCitybike from './assets/mode_digi_citybike.svg';
import ModeDigiFunicular from './assets/mode_digi_funicular.svg';
import FutureRoute from './assets/icon-route.svg';
import Position from './assets/position.svg';
import SearchStreetName from './assets/search-streetname.svg';
import BusWaltti from './assets/bus-waltti.svg';
import FerryWaltti from './assets/ferry-waltti.svg';
import CitybikeWaltti from './assets/citybike-waltti.svg';
import RailWaltti from './assets/rail-waltti.svg';
import TramWaltti from './assets/tram-waltti.svg';
import Check from './assets/check.svg';
import SearchBusStopDefault from './assets/search-bus-stop-default.svg';
import SearchBusStopExpressDefault from './assets/search-bus-stop-express-default.svg';
import SearchRailStopDefault from './assets/search-rail-stop-default.svg';
import SearchFerryDefault from './assets/search-ferry-default.svg';
import SearchFerryStopDefault from './assets/search-ferry-stop-default.svg';
import CityBikeStopDefault from './assets/citybike-stop-default.svg';
import CityBikeStopDefaultSecondary from './assets/citybike-stop-default-secondary.svg';
import SearchTramStopDefault from './assets/search-tram-stop-default.svg';
import CityBikeStopDigitransit from './assets/citybike-stop-digitransit.svg';
import CityBikeStopDigitransitSecondary from './assets/citybike-stop-digitransit-secondary.svg';
import SearchAirplaneDigitransit from './assets/search-airplane-digitransit.svg';
import SearchBusStationDigitransit from './assets/search-bus-station-digitransit.svg';
import SearchBusStopDigitransit from './assets/search-bus-stop-digitransit.svg';
import SearchBusTramStopDigitransit from './assets/search-bustram-stop-digitransit.svg';
import SearchFerryDigitransit from './assets/search-ferry-digitransit.svg';
import SearchFerryStopDigitransit from './assets/search-ferry-stop-digitransit.svg';
import SearchRailStopDigitransit from './assets/search-rail-stop-digitransit.svg';
import SearchRailStationDigitransit from './assets/search-rail-station-digitransit.svg';
import SearchTramStopDigitransit from './assets/search-tram-stop-digitransit.svg';
import Funicular from './assets/funicular.svg';

const IconMap = (props = {}) => {
  return {
    airplane: <Airplane {...props} />,
    arrow: <Arrow {...props} />,
    bus: <Bus {...props} />,
    busstop: <Busstop {...props} />,
    caution: <CautionWhite {...props} />,
    city: <City {...props} />,
    citybike: <CityBikeStopDefault {...props} />,
    edit: <Edit {...props} />,
    ferry: <Ferry {...props} />,
    home: <Home {...props} />,
    locate: <Locate {...props} />,
    map: <Map {...props} />,
    place: <Place {...props} />,
    rail: <Rail {...props} />,
    school: <School {...props} />,
    shopping: <Shopping {...props} />,
    sport: <Sport {...props} />,
    star: <Star {...props} />,
    station: <Station {...props} />,
    subway: <Subway {...props} />,
    tram: <Tram {...props} />,
    work: <Work {...props} />,
    close: <Close {...props} />,
    'mapMarker-via': <MapmarkerVia {...props} />,
    'bike-park': <BikePark {...props} />,
    'car-park': <CarPark {...props} />,
    mapMarker: <Mapmarker {...props} />,
    search: <Search {...props} />,
    plus: <Plus {...props} />,
    attention: <Attention {...props} />,
    'arrow-dropdown': <Dropdown {...props} />,
    time: <Time {...props} />,
    ellipsis: <Ellipsis {...props} />,
    opposite: <Opposite {...props} />,
    viapoint: <Viapoint {...props} />,
    calendar: <Calendar {...props} />,
    'select-from-map': <SelectFromMap {...props} />,
    'caution-white': <CautionWhite {...props} />,
    trash: <Trash {...props} />,
    'mode-bus': <ModeBus {...props} />,
    'mode-bus-express': <ModeBusExpress {...props} />,
    'mode-bus-local': <ModeBusLocal {...props} />,
    'mode-rail': <ModeRail {...props} />,
    'mode-tram': <ModeTram {...props} />,
    'mode-subway': <Subway {...props} />,
    'mode-ferry': <ModeFerry {...props} />,
    'mode-citybike': <ModeCitybike {...props} />,
    'mode-digitransit-bus': <SearchBusStationDigitransit {...props} />,
    'mode-digitransit-rail': <SearchRailStationDigitransit {...props} />,
    'mode-digitransit-ferry': <SearchFerryDigitransit {...props} />,
    'mode-digitransit-tram': <ModeDigiTram {...props} />,
    'mode-digitransit-citybike': <ModeDigiCitybike {...props} />,
    'mode-digitransit-airplane': <ModeAirplane {...props} />,
    'mode-digitransit-subway': <Subway {...props} />,
    'mode-digitransit-funicular': <ModeDigiFunicular {...props} />,
    'mode-waltti-bus': <BusWaltti {...props} />,
    'mode-waltti-citybike': <CitybikeWaltti {...props} />,
    'mode-waltti-ferry': <FerryWaltti {...props} />,
    'mode-waltti-rail': <RailWaltti {...props} />,
    'mode-waltti-tram': <TramWaltti {...props} />,
    'future-route': <FutureRoute {...props} />,
    position: <Position {...props} />,
    'search-street-name': <SearchStreetName {...props} />,
    check: <Check {...props} />,
    'search-bus-stop-default': <SearchBusStopDefault {...props} />,
    'search-bus-stop-express-default': (
      <SearchBusStopExpressDefault {...props} />
    ),
    'search-rail-stop-default': <SearchRailStopDefault {...props} />,
    'search-ferry-default': <SearchFerryDefault {...props} />,
    'search-ferry-stop-default': <SearchFerryStopDefault {...props} />,
    'search-tram-stop-default': <SearchTramStopDefault {...props} />,
    'citybike-stop-digitransit': <CityBikeStopDigitransit {...props} />,
    'citybike-stop-digitransit-secondary': (
      <CityBikeStopDigitransitSecondary {...props} />
    ),
    'citybike-stop-default': <CityBikeStopDefault {...props} />,
    'citybike-stop-default-secondary': (
      <CityBikeStopDefaultSecondary {...props} />
    ),
    'search-airplane-digitransit': <SearchAirplaneDigitransit {...props} />,
    'search-bus-station-digitransit': (
      <SearchBusStationDigitransit {...props} />
    ),
    'search-bus-stop-digitransit': <SearchBusStopDigitransit {...props} />,
    'search-bustram-stop-digitransit': (
      <SearchBusTramStopDigitransit {...props} />
    ),
    'search-ferry-digitransit': <SearchFerryDigitransit {...props} />,
    'search-ferry-stop-digitransit': <SearchFerryStopDigitransit {...props} />,
    'search-funicular-stop-digitransit': <ModeDigiFunicular {...props} />,
    'search-rail-stop-digitransit': <SearchRailStopDigitransit {...props} />,
    'search-rail-station-digitransit': (
      <SearchRailStationDigitransit {...props} />
    ),
    'search-tram-stop-digitransit': <SearchTramStopDigitransit {...props} />,
    funicular: <Funicular {...props} />,
  };
};

/**
 * Icon renders predefined Svg icons as react component.
 * @example
 * <Icon
 *    img="bus"       // Key of svg, required
 *    height={1}      // Height as em, optional
 *    width={1}       // Width as em, optional
 *    color="#007ac9" // Color of image, optional
 *    rotate={90}     // How many degrees to rotate image, optional
 * />
 */
const Icon = ({ className = null, color, img, height, width, rotate }) => {
  const style = {
    fill: color || null,
    height: height ? `${height}em` : null,
    width: width ? `${width}em` : null,
    transform: rotate ? `rotate(${rotate}deg)` : null,
  };
  const icons = IconMap({
    className,
    style,
  });
  if (img === 'locate' && color && color.toUpperCase() !== '#007AC9') {
    return <React.Fragment>{icons.position}</React.Fragment>;
  }
  return <React.Fragment>{icons[img]}</React.Fragment>;
};

Icon.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  height: PropTypes.number,
  img: PropTypes.string.isRequired,
  width: PropTypes.number,
  rotate: PropTypes.string,
};

Icon.defaultProps = {
  className: null,
  color: undefined,
  height: undefined,
  width: undefined,
  rotate: undefined,
};

export default Icon;
