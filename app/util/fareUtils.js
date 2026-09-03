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
        availableTickets.includes(fp.product.productId),
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
            primaryProduct.product.productId.split(':')[1]) ||
          config.fareMapping(primaryProduct.product.productId),
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
    const fareId = fareProducts[0].product.productId;
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

      const pid = fp.product.productId;
      if (!productMap.has(pid)) {
        productMap.set(pid, {
          productId: pid,
          name: fp.product.name,
          unitPrice: fp.product.price.amount,
          legPrices: [],
          useIds: new Set(),
          legIndices: new Set(),
        });
      }
      const entry = productMap.get(pid);
      entry.useIds.add(fp.id);
      if (!seenOnThisLeg.has(pid)) {
        seenOnThisLeg.add(pid);
        entry.legIndices.add(legIndex);
        entry.legPrices.push(fp.product.price.amount);
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
    // Use actual per-leg prices sum for single rides (prices may differ across legs)
    const totalPrice = isPass
      ? entry.unitPrice * count
      : entry.legPrices.reduce((sum, p) => sum + p, 0);
    return {
      name: entry.name,
      productId: entry.productId,
      unitPrice: entry.unitPrice,
      totalPrice,
      count,
      isPass,
    };
  });

  options.sort((a, b) => a.totalPrice - b.totalPrice);
  return options;
};

/**
 * Computes fare options grouped by rider category for the V2 fare display.
 * Returns an array of categories, each containing single-ticket and pass options.
 *
 * Each category: {
 *   categoryName: string (e.g. "Adult universal"),
 *   singleTickets: { totalPrice, count, rides: [{ name, price }] },
 *   passes: [{ name, productId, price, isPass: true }],
 *   fareUrl: string|null
 * }
 */
export const getFareOptionsByCategory = (legs, config) => {
  if (!Array.isArray(legs) || legs.length === 0 || !config) {
    return [];
  }

  const transitLegs = legs.filter(
    l => l.route && l.fareProducts && l.fareProducts.length > 0,
  );
  if (transitLegs.length === 0) {
    return [];
  }

  // Collect all fare products grouped by riderCategory + productId
  // Key: "categoryName::productId"
  const categoryProductMap = new Map();
  // Track fareUrl from agency
  let fareUrl = null;

  transitLegs.forEach((leg, legIndex) => {
    if (!fareUrl && leg.route && leg.route.agency && leg.route.agency.fareUrl) {
      fareUrl = leg.route.agency.fareUrl;
    }

    const seenOnThisLeg = new Set();
    leg.fareProducts.forEach(fp => {
      const cat = fp.product.riderCategory;
      const catName = cat ? cat.name : 'General';
      const catIsDefault = cat ? cat.isDefault : false;
      const pid = fp.product.productId;
      const key = `${catName}::${pid}`;

      if (!categoryProductMap.has(key)) {
        categoryProductMap.set(key, {
          categoryName: catName,
          isDefault: catIsDefault,
          productId: pid,
          name: fp.product.name,
          unitPrice: fp.product.price.amount,
          legPrices: [],
          useIds: new Set(),
          legIndices: new Set(),
        });
      }
      const entry = categoryProductMap.get(key);
      entry.useIds.add(fp.id);
      if (!seenOnThisLeg.has(key)) {
        seenOnThisLeg.add(key);
        entry.legIndices.add(legIndex);
        entry.legPrices.push(fp.product.price.amount);
      }
    });
  });

  // Group by category
  const categoriesMap = new Map();
  const categoryDefaultFlags = new Map();
  categoryProductMap.forEach(entry => {
    if (!categoriesMap.has(entry.categoryName)) {
      categoriesMap.set(entry.categoryName, []);
      categoryDefaultFlags.set(entry.categoryName, false);
    }
    categoriesMap.get(entry.categoryName).push(entry);
    if (entry.isDefault) {
      categoryDefaultFlags.set(entry.categoryName, true);
    }
  });

  // Build structured result per category
  const result = [];
  categoriesMap.forEach((products, categoryName) => {
    const singleRides = [];
    const passes = [];

    products.forEach(entry => {
      const isPass = entry.useIds.size < entry.legIndices.size;

      if (isPass) {
        passes.push({
          name: entry.name,
          productId: entry.productId,
          price: entry.unitPrice * entry.useIds.size,
          isPass: true,
        });
      } else {
        // Single ride: use actual per-leg prices (may differ across legs)
        entry.legPrices.forEach(legPrice => {
          singleRides.push({
            name: entry.name,
            price: legPrice,
          });
        });
      }
    });

    const singleTicketTotal = singleRides.reduce((s, r) => s + r.price, 0);

    result.push({
      categoryName,
      isDefault: categoryDefaultFlags.get(categoryName) || false,
      singleTickets:
        singleRides.length > 0
          ? {
              totalPrice: singleTicketTotal,
              count: singleRides.length,
              rides: singleRides,
            }
          : null,
      passes,
      fareUrl,
    });
  });

  // Sort: isDefault categories first, then non-reduced, then reduced.
  // Falls back to non-reduced-first ordering when isDefault is not available.
  const reducedPattern = /reduced|concession|child|senior|student|youth|disabled/i;
  result.sort((a, b) => {
    // isDefault takes priority
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    const aReduced = reducedPattern.test(a.categoryName);
    const bReduced = reducedPattern.test(b.categoryName);
    if (aReduced !== bReduced) {
      return aReduced ? 1 : -1;
    }
    return 0;
  });

  return result;
};

/**
 * Simplified version of getFareOptionsByCategory for single-leg trips.
 * Returns the same structure but with per-category single fare + pass options.
 */
export const getSingleLegFareByCategory = leg => {
  if (
    !leg ||
    !leg.fareProducts ||
    leg.fareProducts.length === 0 ||
    !leg.route
  ) {
    return [];
  }

  let fareUrl = null;
  if (leg.route.agency && leg.route.agency.fareUrl) {
    fareUrl = leg.route.agency.fareUrl;
  }

  // Group products by category
  const categoriesMap = new Map();
  const categoryDefaultFlags = new Map();
  leg.fareProducts.forEach(fp => {
    const cat = fp.product.riderCategory;
    const catName = cat ? cat.name : 'General';
    if (!categoriesMap.has(catName)) {
      categoriesMap.set(catName, []);
      categoryDefaultFlags.set(catName, false);
    }
    categoriesMap.get(catName).push(fp);
    if (cat && cat.isDefault) {
      categoryDefaultFlags.set(catName, true);
    }
  });

  const result = [];
  categoriesMap.forEach((products, categoryName) => {
    // Separate single rides from passes by productId pattern
    const singleRides = [];
    const passes = [];
    const seenProductIds = new Set();

    products.forEach(fp => {
      const pid = fp.product.productId;
      if (seenProductIds.has(pid)) {
        return;
      }
      seenProductIds.add(pid);

      // Passes typically contain "pass" in name or productId
      const isLikelyPass = /pass/i.test(pid) || /pass/i.test(fp.product.name);
      if (isLikelyPass) {
        passes.push({
          name: fp.product.name,
          productId: pid,
          price: fp.product.price.amount,
          isPass: true,
        });
      } else {
        singleRides.push({
          name: fp.product.name,
          price: fp.product.price.amount,
        });
      }
    });

    const singleTicketTotal = singleRides.reduce((s, r) => s + r.price, 0);

    result.push({
      categoryName,
      isDefault: categoryDefaultFlags.get(categoryName) || false,
      singleTickets:
        singleRides.length > 0
          ? {
              totalPrice: singleTicketTotal,
              count: singleRides.length,
              rides: singleRides,
            }
          : null,
      passes,
      fareUrl,
    });
  });

  // Sort: isDefault first, then adult-like, then reduced
  const reducedPattern = /reduced|concession|child|senior|student|youth|disabled/i;
  result.sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    const aReduced = reducedPattern.test(a.categoryName);
    const bReduced = reducedPattern.test(b.categoryName);
    if (aReduced !== bReduced) {
      return aReduced ? 1 : -1;
    }
    return 0;
  });

  return result;
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
