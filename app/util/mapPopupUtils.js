import { addressToItinerarySearch, locationToOTP } from './otpStrings';
import {
  getPathWithEndpointObjects,
  getSummaryPath,
  PREFIX_ITINERARY_SUMMARY,
} from './path';

// eslint-disable-next-line import/prefer-default-export
export const redirectToItinerarySearch = (
  currentLocation,
  router,
  itemRole,
  item,
) => {
  // eslint-disable-next-line no-param-reassign
  item = { ...item, address: item.name };

  let newLocationFields;
  if (itemRole === 'origin') {
    newLocationFields = {
      pathname: getPathWithEndpointObjects(item, {}, PREFIX_ITINERARY_SUMMARY),
    };
  } else if (itemRole === 'destination') {
    newLocationFields = {
      pathname: getPathWithEndpointObjects({}, item, PREFIX_ITINERARY_SUMMARY),
    };
  } else {
    newLocationFields = {
      pathname: getSummaryPath(
        addressToItinerarySearch({}),
        addressToItinerarySearch({}),
      ),
      query: {
        intermediatePlaces: locationToOTP(item),
      },
    };
  }

  router.push({
    ...currentLocation,

    // Strip any query parameters, there are not needed in the itinerary summary page.
    query: {},
    search: '',

    ...newLocationFields,
  });
};
