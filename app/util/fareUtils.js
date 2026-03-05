import { uniqBy } from 'lodash';

// TODO: support for currency
export function formatFare(fare) {
  return `${fare.price.toFixed(2)} $`;
}

/**
 * Checks if availableTickets config has any actual ticket entries.
 * Returns true if the config has ticket data to filter against.
 */
const hasAvailableTickets = config => {
  if (!config.availableTickets) return false;
  const tickets = Object.values(config.availableTickets)
    .map(r => Object.keys(r))
    .flat();
  return tickets.length > 0;
};

export const getFaresFromLegs = (legs, config) => {
  if (
    !Array.isArray(legs) ||
    legs.length === 0
  ) {
    return null;
  }

  // If availableTickets has entries, filter fare products against them.
  // If empty (e.g. OKC), skip filtering and show all fare products from OTP.
  const shouldFilter = hasAvailableTickets(config);
  let availableTickets = [];
  if (shouldFilter) {
    availableTickets = Object.values(config.availableTickets)
      .map(r => Object.keys(r))
      .flat();
  }

  // Reduced/concession fare category IDs to exclude (adult fares only)
  const reducedCategoryPatterns = /reduced|concession|child|senior|student|youth|disabled/i;

  const filteredLegs = legs.map(leg => {
    if (!leg.fareProducts || leg.fareProducts.length === 0) {
      return { ...leg, fareProducts: [] };
    }

    let products = leg.fareProducts;

    // Filter by availableTickets if configured
    if (shouldFilter) {
      products = products.filter(fp =>
        availableTickets.includes(fp.product.id),
      );
    }

    // Filter out reduced/concession fares — show adult fares only.
    // Only filter if riderCategory data is present on any product.
    const hasRiderCategories = products.some(
      fp => fp.product.riderCategory,
    );
    if (hasRiderCategories) {
      products = products.filter(fp => {
        const cat = fp.product.riderCategory;
        if (!cat) return true;
        const catId = cat.id || '';
        const catName = cat.name || '';
        return (
          !reducedCategoryPatterns.test(catId) &&
          !reducedCategoryPatterns.test(catName)
        );
      });
    }

    return { ...leg, fareProducts: products };
  });

  // Deduplicate fare products across legs using FareProductUse.id.
  // In OTP2 Fares V2, a fare product covering multiple legs (e.g. day pass)
  // gets the same FareProductUse.id on each leg — we count it only once.
  const seenFareProductUseIds = new Set();

  const knownFareLegs = filteredLegs
    .filter(l => l.fareProducts.length > 0 && l.route)
    .map(leg => {
      // Pick the first fare product that hasn't been seen yet (dedup)
      const uniqueProducts = leg.fareProducts.filter(fp => {
        if (seenFareProductUseIds.has(fp.id)) return false;
        seenFareProductUseIds.add(fp.id);
        return true;
      });

      if (uniqueProducts.length === 0) return null;

      const primaryProduct = uniqueProducts[0];
      return {
        fareProducts: uniqueProducts,
        agency: leg.route.agency,
        price: primaryProduct.product.price.amount,
        ticketName:
          (config.NODE_ENV === 'test' &&
            primaryProduct.product.id.split(':')[1]) ||
          config.fareMapping(primaryProduct.product.id),
        routeGtfsId: leg.route.gtfsId,
        routeName: leg.route.shortName || leg.route.longName,
      };
    })
    .filter(Boolean);

  // Legs that have empty fares but still have a route, i.e. transit legs
  const unknownFareLegs = filteredLegs
    .filter(l => l.fareProducts.length === 0 && l.route)
    .map(leg => ({
      agency: {
        fareUrl: leg.route.agency.fareUrl,
        gtfsId: leg.route.agency.gtfsId,
        name: leg.route.agency.name,
      },
      isUnknown: true,
      routeGtfsId: leg.route.gtfsId,
      routeName: leg.route.shortName || leg.route.longName,
    }));
  return [...knownFareLegs, ...unknownFareLegs];
};

/**
 * Returns the number of transit legs (legs with a route) in an itinerary.
 */
export const getTransitLegCount = legs => {
  if (!Array.isArray(legs)) return 0;
  return legs.filter(l => l.route).length;
};

/**
 * Computes fare range from an array of fare objects.
 * Returns { min, max } or null if no valid prices.
 */
export const getFareRange = fares => {
  if (!fares || fares.length === 0) return null;
  const prices = fares.filter(f => !f.isUnknown && typeof f.price === 'number').map(f => f.price);
  if (prices.length === 0) return null;
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Returns alternative fares that cost as much as the one given by OpenTripPlanner
 *
 * @param {*} zones zones that are visited.
 * @param {*} currentFares fare given by OpenTripPlanner.
 * @param {*} allFares all fare options.
 */
export const getAlternativeFares = (zones, currentFares, allFares) => {
  const alternativeFares = [];
  if (zones.length === 1 && currentFares.length === 1 && allFares) {
    const { fareProducts } = currentFares[0];
    const fareId = fareProducts[0].product.id;
    const ticketFeed = fareId.split(':')[0];
    const faresForFeed = allFares[ticketFeed];
    if (faresForFeed && faresForFeed[fareId]) {
      const ticketPrice = faresForFeed[fareId].price;
      Object.keys(faresForFeed).forEach(key => {
        const fareInfo = faresForFeed[key];
        if (
          key !== fareId &&
          fareInfo.zones.includes(zones[0]) &&
          fareInfo.price === ticketPrice
        ) {
          alternativeFares.push(key.split(':')[1]);
        }
      });
    }
  }
  return alternativeFares;
};

/**
 * This function resolves if fare info should be shown.
 * Fare information is shown if showTicketInformation is true in config
 * and availableTickets includes tickets for some feedId from config.
 *
 * @param {*} config configuration.
 */
export const shouldShowFareInfo = config =>
  (!config.showTicketLinkOnlyWhenTesting ||
    window.localStorage
      .getItem('favouriteStore')
      ?.includes('Lippulinkkitestaus2025')) &&
  config.showTicketInformation &&
  config.availableTickets &&
  Array.isArray(config.feedIds) &&
  config.feedIds.some(feedId => config.availableTickets[feedId]);

export const shouldShowFarePurchaseInfo = (config, breakpoint, fares) => {
  const unknownFares = fares?.some(fare => fare.isUnknown);
  // Windows phones or Huawei should only show ticket information.
  const { userAgent } = navigator;
  const huaweiPattern = /(?:huaweibrowser|huawei|emui|hmscore|honor)/i;
  const windowsPattern = /windows phone/i;
  if (huaweiPattern.test(userAgent) || windowsPattern.test(userAgent)) {
    return false;
  }
  return (
    !unknownFares &&
    fares?.length === 1 &&
    config.ticketPurchaseLink &&
    config.ticketLinkOperatorCode &&
    config.availableTickets &&
    breakpoint !== 'large'
  );
};
