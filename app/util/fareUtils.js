// TODO: support for currency
export function formatFare(fare) {
  return `${fare.price.toFixed(2)} $`;
}

/**
 * Checks if availableTickets config has any actual ticket entries.
 * Returns true if the config has ticket data to filter against.
 */
const hasAvailableTickets = config => {
  if (!config.availableTickets) {
    return false;
  }
  const tickets = Object.values(config.availableTickets)
    .map(r => Object.keys(r))
    .flat();
  return tickets.length > 0;
};

export const getFaresFromLegs = (legs, config) => {
  if (!Array.isArray(legs) || legs.length === 0) {
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

    // Filter by availableTickets if configured.
    // Only apply if at least one product matches — V2 fare product IDs
    // (e.g. embark:single_ride_local) won't match V1 fare IDs (e.g. embark:fare-3)
    // populated by the server's ticketTypes query, so skip filtering in that case.
    if (shouldFilter) {
      const filtered = products.filter(fp =>
        availableTickets.includes(fp.product.id),
      );
      if (filtered.length > 0) {
        products = filtered;
      }
    }

    // Filter out reduced/concession fares — show adult fares only.
    // Only filter if riderCategory data is present on any product.
    const hasRiderCategories = products.some(fp => fp.product.riderCategory);
    if (hasRiderCategories) {
      products = products.filter(fp => {
        const cat = fp.product.riderCategory;
        if (!cat) {
          return true;
        }
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

  // Build per-leg fare entries. For per-leg display, prefer the cheapest
  // leg-specific product (unique useId per leg, e.g. single ride) over shared
  // products (same useId across legs, e.g. day pass).
  const knownFareLegs = filteredLegs
    .filter(l => l.fareProducts.length > 0 && l.route)
    .map(leg => {
      // Find the cheapest product to display on this leg
      const sorted = [...leg.fareProducts].sort(
        (a, b) => a.product.price.amount - b.product.price.amount,
      );
      const primaryProduct = sorted[0];

      return {
        fareProducts: leg.fareProducts,
        agency: leg.route.agency,
        price: primaryProduct.product.price.amount,
        ticketName:
          (config.NODE_ENV === 'test' &&
            primaryProduct.product.id.split(':')[1]) ||
          config.fareMapping(primaryProduct.product.id),
        routeGtfsId: leg.route.gtfsId,
        routeName: leg.route.shortName || leg.route.longName,
      };
    });

  // Legs that have empty fares but still have a route, i.e. transit legs
  const unknownFareLegs = filteredLegs
    .filter(l => l.fareProducts.length === 0 && l.route)
    .map(leg => ({
      agency: leg.route.agency
        ? {
            fareUrl: leg.route.agency.fareUrl,
            gtfsId: leg.route.agency.gtfsId,
            name: leg.route.agency.name,
          }
        : null,
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
  if (!Array.isArray(legs)) {
    return 0;
  }
  return legs.filter(l => l.route).length;
};

/**
 * Computes fare range from an array of fare objects.
 * Returns { min, max } or null if no valid prices.
 */
export const getFareRange = fares => {
  if (!fares || fares.length === 0) {
    return null;
  }
  const prices = fares
    .filter(f => !f.isUnknown && typeof f.price === 'number')
    .map(f => f.price);
  if (prices.length === 0) {
    return null;
  }
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

/**
 * Computes fare options for a multi-leg trip.
 * Groups fare products by product type, calculates total cost for each option
 * (deduplicating passes by FareProductUse.id), and returns sorted cheapest first.
 *
 * Each option: { name, productId, totalPrice, count, isPass }
 */
export const getFareOptions = (legs, config) => {
  if (!Array.isArray(legs) || legs.length === 0 || !config) {
    return [];
  }

  const reducedCategoryPatterns = /reduced|concession|child|senior|student|youth|disabled/i;

  // Get adult fare products from transit legs
  const transitLegs = legs.filter(
    l => l.route && l.fareProducts && l.fareProducts.length > 0,
  );
  if (transitLegs.length === 0) {
    return [];
  }

  // Collect fare products per productId per leg.
  // OTP may return duplicate useIds per product type per leg, so we track
  // which legs each product type appears on (not raw useId count).
  // A pass (same useId across legs) counts as 1 purchase; single rides
  // count as 1 per leg.
  const productMap = new Map();
  transitLegs.forEach((leg, legIndex) => {
    // Track which productIds we've already recorded for this leg
    const seenOnThisLeg = new Set();
    leg.fareProducts.forEach(fp => {
      const cat = fp.product.riderCategory;
      if (cat) {
        const catId = cat.id || '';
        const catName = cat.name || '';
        if (
          reducedCategoryPatterns.test(catId) ||
          reducedCategoryPatterns.test(catName)
        ) {
          return;
        }
      }

      const pid = fp.product.id;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid,
          name: fp.product.name,
          unitPrice: fp.product.price.amount,
          useIds: new Set(),
          legIndices: new Set(),
        });
      }
      const entry = productMap.get(pid);
      entry.useIds.add(fp.id);
      if (!seenOnThisLeg.has(pid)) {
        seenOnThisLeg.add(pid);
        entry.legIndices.add(legIndex);
      }
    });
  });

  // Build options: each product type becomes a fare option.
  // For passes (same useId on multiple legs), count = unique useIds (1 purchase).
  // For single rides (different useIds per leg), count = number of legs.
  const options = Array.from(productMap.values()).map(entry => {
    // A pass has fewer unique useIds than legs it appears on
    const isPass = entry.useIds.size < entry.legIndices.size;
    const count = isPass ? entry.useIds.size : entry.legIndices.size;
    return {
      name: entry.name,
      productId: entry.productId,
      unitPrice: entry.unitPrice,
      totalPrice: entry.unitPrice * count,
      count,
      isPass,
    };
  });

  options.sort((a, b) => a.totalPrice - b.totalPrice);
  return options;
};

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
