import PositionStore from '../store/PositionStore';

export const getPositionStore = () => {
  return PositionStore;
};

export const getPositions = context => {
  return context.getStore('PositionStore').getLocationState();
};

export const getFavouriteLocations = context => {
  return context.getStore('FavouriteStore').getLocations();
};

export const getFavouriteRoutes = context => {
  return context.getStore('FavouriteStore').getRouteGtfsIds();
};

export const getFavouriteStops = context => {
  return context.getStore('FavouriteStore').getStopsAndStations();
};

export const getFavouriteBikeRentalStations = context => {
  return context.getStore('FavouriteStore').getBikeRentalStations();
};

/**
 * Drops saved searches lying outside the geocoder's bounding box
 * (config.searchParams 'boundary.rect.*'), gated on
 * config.filterOldSearchesToBoundary. Out-of-boundary results users picked
 * while the geocoder leaked them would otherwise resurface from localStorage
 * forever. Items without point coordinates (e.g. routes) are kept.
 */
const filterSearchesToBoundary = (items, config) => {
  if (!config?.filterOldSearchesToBoundary || !Array.isArray(items)) {
    return items;
  }
  const params = config.searchParams || {};
  const minLat = params['boundary.rect.min_lat'];
  const maxLat = params['boundary.rect.max_lat'];
  const minLon = params['boundary.rect.min_lon'];
  const maxLon = params['boundary.rect.max_lon'];
  if ([minLat, maxLat, minLon, maxLon].some(v => typeof v !== 'number')) {
    return items;
  }
  return items.filter(item => {
    const coords = item?.geometry?.coordinates;
    if (
      !Array.isArray(coords) ||
      typeof coords[0] !== 'number' ||
      typeof coords[1] !== 'number'
    ) {
      return true;
    }
    const [lon, lat] = coords;
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
  });
};

export const getOldSearches = (context, type) => {
  return filterSearchesToBoundary(
    context.getStore('OldSearchesStore').getOldSearches(type),
    context.config,
  );
};

export const clearOldSearches = context => {
  return context.getStore('OldSearchesStore').clearOldSearches();
};

export const getLanguage = context => {
  return context.getStore('PreferencesStore').getLanguage();
};

export const getFutureRoutes = context => {
  return context.getStore('FutureRouteStore').getFutureRoutes();
};

export const clearFutureRoutes = context => {
  return context.getStore('FutureRouteStore').clearFutureRoutes();
};

export const getOldSearchItems = context => {
  return context.getStore('OldSearchesStore').getOldSearchItems();
};
