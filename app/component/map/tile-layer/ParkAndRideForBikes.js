import ParkAndRide from './ParkAndRide';
import { ParkTypes } from '../../../constants';

export default class ParkAndRideForBikes extends ParkAndRide {
  constructor(tile, config, mapLayers, relayEnvironment) {
    super(tile, config, relayEnvironment);
    this.promise = this.getPromise();
  }

  static getName = () => 'parkAndRideForBikes';

  getPromise() {
    return this.fetchAndDrawParks(ParkTypes.Bicycle);
  }
}
